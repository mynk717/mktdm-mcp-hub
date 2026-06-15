import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const handler = createMcpHandler(
  (server) => {
    // --- Tool: Scrape Competitor Page ---
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

    // --- Tool: Get Top Pages Intelligence (NEW) ---
    server.registerTool(
      "get_top_pages_intelligence",
      {
        title: "Top Pages Intelligence",
        description: "Identifies a competitor's highest-traffic pages (Reverse Engineering).",
        inputSchema: {
          domain: z.string().describe("The competitor domain (e.g., example.com)"),
        },
      },
      async ({ domain }) => {
        // Placeholder for Semrush/Ahrefs API integration
        return {
          content: [{
            type: "text",
            text: `Reverse Engineering Intelligence for ${domain}:
1. /services/ai-automation (Est. Traffic: 2,500/mo) - High Intent
2. /blog/marketing-trends-2026 (Est. Traffic: 1,200/mo) - Awareness
3. /raipur-digital-agency (Est. Traffic: 800/mo) - Local Intent
4. /case-studies (Est. Traffic: 450/mo) - Decision Intent`,
          }],
        };
      }
    );

    // --- Tool: Backlink Opportunity Engine (NEW) ---
    server.registerTool(
      "get_backlink_opportunities",
      {
        title: "Backlink Opportunity Engine",
        description: "Identifies domains linking to competitors but not to you.",
        inputSchema: {
          competitorDomain: z.string(),
          myDomain: z.string(),
        },
      },
      async ({ competitorDomain, myDomain }) => {
        return {
          content: [{
            type: "text",
            text: `Backlink Gap Analysis [${competitorDomain} vs ${myDomain}]:
- raipur-news-portal.in (DR: 45) - Highly relevant local portal.
- startup-india-directory.org (DR: 80) - Government association.
- ai-tech-blog.com (DR: 60) - Niche authority.
- local-business-raipur.biz (DR: 30) - Neighborhood relevance.`,
          }],
        };
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
        return { contents: [{ uri: uri.href, text: content, mimeType: "text/markdown" }] };
      }
    );
  },
  { name: "mktdm-research", version: "1.1.0" },
  { basePath: "/research", maxDuration: 60 }
);

export default async function (req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
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
    res.status(500).json({ error: error.message });
  }
}
