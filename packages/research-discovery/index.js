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

// Initialize server
const server = new Server(
  {
    name: "research-discovery-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// --- Resources Implementation ---
const TEMPLATE_PATH = path.resolve("../../shared/MKTDM_Content_Templates.md");

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "mktg-dime://templates",
        name: "MKTDM Content Templates",
        description: "Official content strategy and intent mapping templates for local and broad SEO.",
        mimeType: "text/markdown",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "mktg-dime://templates") {
    const content = await fs.readFile(TEMPLATE_PATH, "utf-8");
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  }
  throw new Error(`Resource not found: ${request.params.uri}`);
});

// --- Tools Implementation ---
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scrape_competitor_page",
        description: "Scrapes a URL to extract SEO data and detect if it targets a local or broad audience.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to scrape" },
          },
          required: ["url"],
        },
      },
      {
        name: "get_scoped_keyword_insights",
        description: "Fetch keyword metrics with a specific scope (local vs broad).",
        inputSchema: {
          type: "object",
          properties: {
            keyword: { type: "string" },
            scope: { type: "string", enum: ["local", "broad"], description: "Whether to analyze for a specific city or a global audience." },
            location: { type: "string", description: "Required if scope is local (e.g., 'Raipur', 'Indore')." },
          },
          required: ["keyword", "scope"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "scrape_competitor_page") {
    try {
      const { url } = args as any;
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MKTDM-Bot/1.0)" }
      });
      const $ = cheerio.load(response.data);
      
      const h1 = $("h1").first().text().trim();
      const title = $("title").text().trim();
      const bodyText = $("body").text().replace(/\s+/g, ' ').trim().slice(0, 3000);

      // Simple Smart Logic: Detect if page is local
      const localKeywords = ["near me", "in ", "address", "phone", "contact", "location"];
      const isLocal = localKeywords.some(k => bodyText.toLowerCase().includes(k.toLowerCase()));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            url,
            title,
            h1,
            detectedScope: isLocal ? "local" : "broad",
            contentSnippet: bodyText,
          }, null, 2),
        }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }] };
    }
  }

  if (name === "get_scoped_keyword_insights") {
    const { keyword, scope, location } = args as any;
    
    // Logic for placeholder metrics
    const volumeBase = scope === "local" ? 500 : 15000;
    const kd = scope === "local" ? "Low/Medium" : "High";
    
    return {
      content: [{
        type: "text",
        text: `Analysis for '${keyword}' [Scope: ${scope}${location ? ` @ ${location}` : ''}]:
- Monthly Volume: ~${volumeBase}
- Competition (KD): ${kd}
- Strategy Recommendation: Refer to mktg-dime://templates under '${scope === 'local' ? 'Local Business Specificity' : 'Specific Service Intent'}'`,
      }],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

// --- HTTP / SSE Server for Public Hosting ---
const app = express();
app.use(cors());

let transport;

app.get("/sse", async (req, res) => {
  console.log("New SSE connection");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE transport");
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.error(`MCP Server running at http://localhost:${PORT}/sse`);
  });
}

export default app;
