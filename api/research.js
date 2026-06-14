import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const handler = createMcpHandler(
  (server) => {
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
          keyword: z.string(),
          scope: z.enum(["local", "broad"]),
          location: z.string().optional(),
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
  },
  {},
  {
    basePath: "/research",
  }
);

export default async function (req, res) {
  // Manual logging for debug
  console.log(`Method: ${req.method}, URL: ${req.url}`);
  
  // Vercel rewrites often mess with req.url. 
  // Let's ensure the URL passed to mcp-handler has the /research prefix and the transport
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  
  // Extract original path from headers if available, or use the URL
  // req.url on Vercel is often just the part AFTER /api/
  const originalUrl = new URL(req.url, `${protocol}://${host}`);
  
  // If we are at /api/research, and it was rewrote from /research/mcp, 
  // we might need to reconstruct the path for mcp-handler
  if (!originalUrl.pathname.startsWith("/research")) {
      // Find the transport from the path or query
      const pathParts = req.url.split('/').filter(Boolean);
      // If req.url is /research/mcp, parts are [research, mcp]
      // If req.url is /api/research, and it's a rewrite from /research/mcp
      // Vercel might pass the original path in some header?
      // Let's check req.headers['x-matched-path'] or similar
      const matchedPath = req.headers['x-matched-path'] || "";
      console.log(`Matched Path: ${matchedPath}`);
  }

  // Construct a Web Standard Request
  // We'll trust mcp-handler to handle it if we provide the right URL
  const webReq = new Request(`${protocol}://${host}${req.url}`, {
    method: req.method,
    headers: new Headers(req.headers),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : null,
  });

  const webRes = await handler(webReq);
  
  res.status(webRes.status);
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await webRes.text());
}
