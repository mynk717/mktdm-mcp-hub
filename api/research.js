import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const handler = createMcpHandler(
  (server) => {
    // --- Tools ---
    server.registerTool(
      "scrape_competitor_page",
      {
        title: "Scrape Competitor Page",
        description: "Scrapes a URL for SEO analysis.",
        inputSchema: {
          url: z.string().url().describe("The URL to scrape"),
        },
      },
      async ({ url }) => {
        try {
          const response = await axios.get(url, { headers: { "User-Agent": "MKTDM-Bot/1.0" } });
          const $ = cheerio.load(response.data);
          const h1 = $("h1").first().text().trim();
          const title = $("title").text().trim();
          const bodyText = $("body").text().replace(/\s+/g, ' ').trim().slice(0, 3000);
          const isLocal = ["near me", "in ", "address", "phone", "contact", "location"].some(k => bodyText.toLowerCase().includes(k.toLowerCase()));
          return { content: [{ type: "text", text: JSON.stringify({ url, title, h1, detectedScope: isLocal ? "local" : "broad", contentSnippet: bodyText }, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "get_scoped_keyword_insights",
      {
        title: "Get Scoped Keyword Insights",
        description: "Fetch keyword metrics (local vs broad).",
        inputSchema: {
          keyword: z.string().describe("The keyword to analyze"),
          scope: z.enum(["local", "broad"]).describe("Target scope"),
          location: z.string().optional().describe("Location for local scope"),
        },
      },
      async ({ keyword, scope, location }) => {
        const volumeBase = scope === "local" ? 500 : 15000;
        const kd = scope === "local" ? "Low/Medium" : "High";
        return {
          content: [{ type: "text", text: `Analysis for '${keyword}' [Scope: ${scope}${location ? ` @ ${location}` : ''}]:\n- Monthly Volume: ~${volumeBase}\n- Competition (KD): ${kd}` }],
        };
      }
    );

    // --- Resources ---
    server.registerResource(
      "mktdm-templates",
      "mktg-dime://templates",
      {
        title: "MKTDM Content Templates",
        description: "Official content strategy and intent mapping templates.",
        mimeType: "text/markdown",
      },
      async (uri) => {
        const content = await fs.readFile(TEMPLATE_PATH, "utf-8");
        return {
          contents: [{
            uri: uri.href,
            text: content,
            mimeType: "text/markdown",
          }],
        };
      }
    );
  },
  {
    name: "mktdm-research",
    version: "1.0.0",
  },
  {
    basePath: "/research",
    maxDuration: 60,
  }
);

// Vercel Request/Response Adapter
export default async function (req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    
    // Construct the full URL for mcp-handler's transport detection
    // Claude/Clients will hit /research/mcp
    const webReq = new Request(`${protocol}://${host}${req.url}`, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : null,
    });

    const webRes = await handler(webReq);
    
    res.status(webRes.status);
    webRes.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(await webRes.text());
  } catch (error) {
    console.error("MCP Adapter Error:", error);
    res.status(500).json({ error: error.message });
  }
}
