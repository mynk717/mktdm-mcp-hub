#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
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

// For Serverless environments, we must maintain the transport mapping
// but ensure the server instance is fresh per connection.
const activeSessions = new Map();

app.get("/research", async (req, res) => {
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

  const transport = new SSEServerTransport("/research/messages", res);
  
  // Connect and store the transport by its internal sessionId
  await server.connect(transport);
  
  if (transport.sessionId) {
    activeSessions.set(transport.sessionId, transport);
  }

  req.on("close", () => {
    if (transport.sessionId) activeSessions.delete(transport.sessionId);
    server.close();
  });
});

app.post("/research/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = activeSessions.get(sessionId);
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("Session not found");
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.error(`Running on http://localhost:${PORT}/research`));
}

export default app;
