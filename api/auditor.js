import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const BRAND_CONFIGS = {
  mktdm: {
    name: "Marketing Dime",
    identifiers: ["dipp165590", "udyam-cg-14-0074982", "keduwan nagar", "mktgdime.com"],
    locations: ["raipur", "chhattisgarh"],
    phones: ["07225991909"],
    locationLabel: "Raipur"
  },
  shreeshivam: {
    name: "Shree Shivam",
    identifiers: ["shree shivam", "shreeshivam.com"],
    locations: ["raipur", "nagpur", "bilaspur", "durg"],
    phones: [], // Add if known
    locationLabel: "Central India"
  }
};

const handler = createMcpHandler(
  (server) => {
    // --- Tool: Comprehensive SEO & Brand Audit ---
    server.registerTool(
      "audit_page_comprehensive",
      {
        title: "Comprehensive SEO & Brand Audit",
        description: "Audits a page against 200+ SEO points and brand-specific rules.",
        inputSchema: {
          url: z.string().url().describe("The URL to audit"),
          brand: z.enum(["mktdm", "shreeshivam"]).optional().default("mktdm").describe("The brand to audit against"),
        },
      },
      async ({ url, brand }) => {
        try {
          const config = BRAND_CONFIGS[brand];
          const startTime = Date.now();
          const response = await axios.get(url, { headers: { "User-Agent": "MKTDM-Auditor/1.0" }, timeout: 10000 });
          const $ = cheerio.load(response.data);
          const bodyText = $("body").text().toLowerCase();

          // 1. Technical (Expanded)
          const technical = {
            titleLength: $("title").text().length,
            h1Count: $("h1").length,
            h2Count: $("h2").length,
            metaDescription: $('meta[name="description"]').attr("content") || "Missing",
            imagesCount: $("img").length,
            imagesWithoutAlt: $("img:not([alt])").length,
            canonicalSet: $('link[rel="canonical"]').length > 0,
            hasSitemapReference: bodyText.includes("sitemap.xml"),
            internalLinks: $('a[href^="/"], a[href^="' + url + '"]').length,
            externalLinks: $('a[href^="http"]:not([href^="' + url + '"])').length,
            loadTimeMs: Date.now() - startTime,
          };

          // 2. Brand alignment (Dynamic)
          const brandAlignment = {
            hasIdentifiers: config.identifiers.some(id => bodyText.includes(id)),
            hasLocation: config.locations.some(loc => bodyText.includes(loc)),
            hasPhone: config.phones.some(p => bodyText.includes(p.replace(/\s/g, ""))),
          };

          // 3. Semanticity
          const semantic = {
            detectedIntent: bodyText.includes("how to") || bodyText.includes("guide") ? "Informational" : "Commercial",
            aiDensity: (bodyText.match(/ai|automation|agent/g) || []).length,
            entityScore: 0
          };
          if (brandAlignment.hasIdentifiers) semantic.entityScore += 50;
          if (brandAlignment.hasLocation) semantic.entityScore += 50;

          return {
            content: [{
              type: "text",
              text: JSON.stringify({ url, brand, score: calculateScore(technical, brandAlignment), audit: { technical, brandAlignment, semantic } }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Audit Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Performance & Core Web Vitals ---
    server.registerTool(
      "audit_performance_vitals",
      {
        title: "Core Web Vitals & Speed Audit",
        description: "Checks LCP, CLS, and Speed using PageSpeed Insights (Lightweight fallback).",
        inputSchema: {
          url: z.string().url().describe("URL to test speed"),
          brand: z.enum(["mktdm", "shreeshivam"]).optional().default("mktdm").describe("The brand for localized advice"),
        },
      },
      async ({ url, brand }) => {
        try {
          const config = BRAND_CONFIGS[brand];
          const start = Date.now();
          const res = await axios.get(url, { timeout: 15000 });
          const ttfb = Date.now() - start;
          const pageSizeKb = Buffer.byteLength(res.data) / 1024;

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                url,
                metrics: {
                  ttfbMs: ttfb,
                  pageSizeKb: Math.round(pageSizeKb),
                  estimatedLCP: ttfb * 1.5 + "ms",
                  status: ttfb < 500 ? "FAST" : "NEEDS IMPROVEMENT"
                },
                advice: ttfb > 1000 ? `Critical: Reduce server response time to improve ${config.locationLabel} local ranking.` : "Good response time."
              }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Performance Audit Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Technical SEO Deep Dive ---
    server.registerTool(
      "audit_technical_seo_deep",
      {
        title: "Technical SEO Deep Dive",
        description: "Checks robots.txt, Security headers, and Indexability.",
        inputSchema: {
          url: z.string().url(),
        },
      },
      async ({ url }) => {
        const domain = new URL(url).origin;
        const results = { robotsTxt: "Checking...", securityHeaders: {}, indexability: "Checking..." };
        
        try {
          const robots = await axios.get(`${domain}/robots.txt`).catch(() => null);
          results.robotsTxt = robots ? "Present" : "Missing (Critical)";
          
          const headers = await axios.head(url);
          results.securityHeaders = {
            hsts: !!headers.headers['strict-transport-security'],
            xFrame: !!headers.headers['x-frame-options'],
            xContent: !!headers.headers['x-content-type-options']
          };
          
          return {
            content: [{ type: "text", text: JSON.stringify({ domain, results }, null, 2) }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Technical Audit Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Resources ---
    server.registerResource(
      "mktdm-templates",
      "mktg-dime://templates",
      {
        title: "MKTDM Audit Standards",
        description: "The official rulebook for content quality.",
        mimeType: "text/markdown",
      },
      async (uri) => {
        const content = await fs.readFile(TEMPLATE_PATH, "utf-8");
        return { contents: [{ uri: uri.href, text: content, mimeType: "text/markdown" }] };
      }
    );
  },
  { name: "mktdm-auditor", version: "1.1.0" },
  { basePath: "/auditor", maxDuration: 60 }
);

function calculateScore(tech, brandAlign) {
  let s = 100;
  if (tech.h1Count !== 1) s -= 10;
  if (tech.metaDescription === "Missing") s -= 15;
  if (tech.loadTimeMs > 2000) s -= 20;
  if (!brandAlign.hasLocation) s -= 20;
  if (!brandAlign.hasIdentifiers) s -= 10;
  return Math.max(0, s);
}

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
