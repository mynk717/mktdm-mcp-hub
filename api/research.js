#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const app = express();
app.use(cors());
app.use(express.json());

// Store transports by session ID
const transports = {};

// Helper function to create and configure a new server instance
const createServer = () => {
  const server = new Server(
    { name: "research-discovery-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  // --- Handlers ---
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [{
      uri: "mktg-dime://templates",
      name: "MKTDM Content Templates",
      description: "Official content strategy templates.",
      mimeType: "text/markdown",
    }],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "mktg-dime://templates") {
      const content = await fs.readFile(TEMPLATE_PATH, "utf-8");
      return { contents: [{ uri: request.params.uri, mimeType: "text/markdown", text: content }] };
    }
    throw new Error("Resource not found");
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "scrape_competitor_page",
        description: "Scrapes a URL for SEO analysis.",
        inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
      },
      {
        name: "get_scoped_keyword_insights",
        description: "Fetch keyword metrics (local vs broad).",
        inputSchema: {
          type: "object",
          properties: {
            keyword: { type: "string" },
            scope: { type: "string", enum: ["local", "broad"] },
            location: { type: "string" },
          },
          required: ["keyword", "scope"],
        },
      }
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "scrape_competitor_page") {
      const { url } = args;
      const resp = await axios.get(url, { headers: { "User-Agent": "MKTDM-Bot/1.0" } });
      const $ = cheerio.load(resp.data);
      const h1 = $("h1").first().text().trim();
      const body = $("body").text().replace(/\s+/g, ' ').trim().slice(0, 3000);
      return {
        content: [{ type: "text", text: JSON.stringify({ url, h1, text: body }, null, 2) }]
      };
    }
    if (name === "get_scoped_keyword_insights") {
      const { keyword, scope } = args;
      return {
        content: [{ type: "text", text: `Metrics for ${keyword} (${scope})` }]
      };
    }
    throw new Error("Tool not found");
  });

  return server;
};

// POST endpoint for MCP requests
app.post("/research", async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  try {
    let transport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId || req.body?.method === "initialize") {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          console.log(`Session initialized: ${newSessionId}`);
          transports[newSessionId] = transport;
        }
      });

      // Clean up on close
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Session closed: ${sid}`);
          delete transports[sid];
        }
      };

      // Connect server to transport
      const server = createServer();
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: Invalid session" },
        id: null
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

// GET endpoint for SSE streams
app.get("/research", async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// DELETE endpoint for session termination
app.delete("/research", async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.error(`Running on http://localhost:${PORT}/research`));
}

export default app;
