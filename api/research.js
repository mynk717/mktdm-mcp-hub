import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

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

// Vercel serverless function handler
export default async function handler(req) {
  // Create a fresh transport and server per request (stateless mode)
  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = createServer();

  await server.connect(transport);

  // Use the Web Standard Request API directly
  return transport.handleRequest(req);
}

// For local development
export const config = {
  runtime: 'nodejs',
};
