import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { getSecret } from "../shared/secrets.js";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const handler = createMcpHandler(
  (server) => {
    // --- Tool: Scrape Competitor Page v2.0 ---
    server.registerTool(
      "scrape_competitor_page",
      {
        title: "Scrape Competitor Page v2.0",
        description: "Deep structural, schema, and AEO analysis of a competitor page.",
        inputSchema: {
          url: z.string().url().describe("The URL to scrape"),
          brandConfig: z.object({
            locations: z.array(z.string()).optional(),
          }).optional().describe("Local context for scope detection."),
        },
      },
      async ({ url, brandConfig }) => {
        try {
          const startTime = Date.now();
          const response = await axios.get(url, { 
            headers: { "User-Agent": BROWSER_UA },
            timeout: 10000,
            validateStatus: () => true 
          });

          if (response.status !== 200) {
            return { content: [{ type: "text", text: `Scrape Error: Site returned ${response.status}` }], isError: true };
          }

          const $ = cheerio.load(response.data);
          const bodyText = $("body").text();
          const bodyLower = bodyText.toLowerCase();
          const headHtml = $("head").html().toLowerCase();

          // 1. Structural Analysis
          const headings = {
            h1: $("h1").map((i, el) => $(el).text().trim()).get(),
            h2: $("h2").map((i, el) => $(el).text().trim()).get(),
            h3: $("h3").map((i, el) => $(el).text().trim()).get(),
            counts: { h1: $("h1").length, h2: $("h2").length, h3: $("h3").length, h4: $("h4").length }
          };

          const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

          // 2. Schema & Meta
          const schemas = [];
          $('script[type="application/ld+json"]').each((i, el) => {
            try { schemas.push(JSON.parse($(el).html())); } catch (e) {}
          });

          const meta = {
            title: $("title").text().trim(),
            description: $('meta[name="description"]').attr("content") || "Missing",
            canonical: $('link[rel="canonical"]').attr("href"),
            noIndex: headHtml.includes('content="noindex"') || (response.headers['x-robots-tag'] || "").includes('noindex'),
            og: {
              title: $('meta[property="og:title"]').attr("content"),
              description: $('meta[property="og:description"]').attr("content"),
              image: $('meta[property="og:image"]').attr("content")
            }
          };

          // 3. Links & CTAs
          const internalLinks = [];
          $('a[href^="/"], a[href^="' + new URL(url).origin + '"]').slice(0, 10).each((i, el) => {
            internalLinks.push({ text: $(el).text().trim(), href: $(el).attr("href") });
          });

          const ctas = [];
          $("a, button").filter((i, el) => {
            const txt = $(el).text().toLowerCase();
            return ["book", "call", "start", "get", "contact", "hire", "quote", "buy"].some(k => txt.includes(k));
          }).slice(0, 5).each((i, el) => ctas.push($(el).text().trim()));

          // 4. Local Detection
          const hasLocalSchema = JSON.stringify(schemas).toLowerCase().includes("localbusiness");
          const hasAddress = $("address").length > 0;
          const locations = brandConfig?.locations || [];
          const matchedLocations = locations.filter(loc => bodyLower.includes(loc.toLowerCase()));

          const localScope = {
            isLocal: hasLocalSchema || hasAddress || matchedLocations.length > 0,
            signals: { hasLocalSchema, hasAddress, matchedLocations }
          };

          // 5. AEO & Topic Extraction
          const questionHeadings = [...headings.h2, ...headings.h3].filter(h => {
            const l = h.toLowerCase();
            return ["how", "what", "why", "when", "is", "can"].some(k => l.startsWith(k));
          });

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                url,
                meta,
                headings,
                contentStats: { wordCount, ctas, questionHeadings },
                structuredData: { count: schemas.length, types: schemas.map(s => s['@type']) },
                localScope,
                performance: { loadTimeMs: Date.now() - startTime }
              }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Scrape Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Top Pages Intelligence v2.0 ---
    server.registerTool(
      "get_top_pages_intelligence",
      {
        title: "Top Pages Intelligence v2.0",
        description: "Identifies a competitor's highest-traffic pages using SEMrush data.",
        inputSchema: {
          domain: z.string().describe("The competitor domain (e.g., example.com)"),
          limit: z.number().optional().default(10),
        },
      },
      async ({ domain, limit }) => {
        const apiKey = await getSecret("semrush");
        if (!apiKey) return { content: [{ type: "text", text: "Error: SEMrush API key missing." }], isError: true };

        try {
          const res = await axios.get(`https://api.semrush.com/?type=domain_organic&key=${apiKey}&display_limit=${limit}&export_columns=url,Ur,Tr,At,It&domain=${domain}&database=in`);
          const rows = res.data.split("\n").slice(1).filter(r => r.length > 0);
          const pages = rows.map(r => {
            const [url, rank, traffic, trafficPercent, intent] = r.split(";");
            return { url, rank, traffic, trafficPercent, intent: intent || "Unknown" };
          });
          return { content: [{ type: "text", text: JSON.stringify({ domain, topPages: pages }, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `API Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Backlink Opportunity Engine v2.0 ---
    server.registerTool(
      "get_backlink_opportunities",
      {
        title: "Backlink Opportunity Engine v2.0",
        description: "Identifies domains linking to competitors but not to you.",
        inputSchema: {
          competitorDomain: z.string(),
          myDomain: z.string(),
        },
      },
      async ({ competitorDomain, myDomain }) => {
        const apiKey = await getSecret("semrush");
        if (!apiKey) return { content: [{ type: "text", text: "Error: SEMrush API key missing." }], isError: true };

        try {
          const res = await axios.get(`https://api.semrush.com/analytics/v1/?key=${apiKey}&type=backlinks_overview&target=${competitorDomain}&target_type=domain`);
          return { content: [{ type: "text", text: JSON.stringify({ competitorDomain, myDomain, apiResponse: res.data }, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `API Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Keyword Insights v2.0 ---
    server.registerTool(
      "get_scoped_keyword_insights",
      {
        title: "Keyword Insights v2.0",
        description: "Fetch real keyword metrics (Volume/KD/CPC) from SEMrush.",
        inputSchema: {
          keyword: z.string().describe("The keyword to analyze"),
          location: z.string().optional().default("in").describe("Region (e.g., 'in', 'us')"),
        },
      },
      async ({ keyword, location }) => {
        const apiKey = await getSecret("semrush");
        if (!apiKey) return { content: [{ type: "text", text: "Error: SEMrush API key missing." }], isError: true };

        try {
          const res = await axios.get(`https://api.semrush.com/?type=phrase_this&key=${apiKey}&export_columns=Ph,Nq,Cp,Co,Kd&phrase=${encodeURIComponent(keyword)}&database=${location}`);
          const data = res.data.split("\n")[1];
          if (!data) return { content: [{ type: "text", text: "No data found." }] };
          const [phrase, volume, cpc, competition, kd] = data.split(";");
          return { content: [{ type: "text", text: JSON.stringify({ keyword: phrase, metrics: { volume, cpc, competition, difficulty: kd + "%" } }, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `API Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Content Gap Analyzer (NEW) ---
    server.registerTool(
      "get_content_gap",
      {
        title: "Content Gap Analyzer",
        description: "Compares topic coverage between two URLs.",
        inputSchema: {
          myUrl: z.string().url(),
          competitorUrl: z.string().url(),
        },
      },
      async ({ myUrl, competitorUrl }) => {
        try {
          const fetchTopics = async (u) => {
            const r = await axios.get(u, { headers: { "User-Agent": BROWSER_UA }, timeout: 8000 });
            const s = cheerio.load(r.data);
            return s("h1, h2, h3").map((i, el) => s(el).text().trim().toLowerCase()).get();
          };
          const [myTopics, compTopics] = await Promise.all([fetchTopics(myUrl), fetchTopics(competitorUrl)]);
          const missing = compTopics.filter(t => !myTopics.some(m => m.includes(t) || t.includes(m)));
          return { content: [{ type: "text", text: JSON.stringify({ myUrl, competitorUrl, missingTopics: [...new Set(missing)].slice(0, 15) }, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `Gap Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Keyword Opportunity & Seed Data v2.1 ---
    server.registerTool(
      "research_keyword_opportunity",
      {
        title: "Keyword Opportunity & Smart Filter",
        description: "Filters seed keywords against existing content and enriches with SEMrush data.",
        inputSchema: {
          seedKeywords: z.array(z.string()).optional().describe("List of keywords from your CSV/Excel/Seed sources."),
          existingContent: z.array(z.string()).optional().describe("List of topics/keywords you already have content for."),
          topic: z.string().optional().describe("A seed topic to discover new keywords if no seed list is provided."),
          location: z.string().optional().default("in")
        },
      },
      async ({ seedKeywords = [], existingContent = [], topic, location }) => {
        const apiKey = await getSecret("semrush");
        
        // 1. Filter out duplicates
        const normalizedExisting = existingContent.map(c => c.toLowerCase().trim());
        const newOpportunities = seedKeywords.filter(k => {
          const lowerK = k.toLowerCase().trim();
          return !normalizedExisting.some(e => e.includes(lowerK) || lowerK.includes(e));
        });

        const results = {
          summary: {
            provided: seedKeywords.length,
            duplicatesRemoved: seedKeywords.length - newOpportunities.length,
            readyToAnalyze: newOpportunities.length
          },
          opportunities: []
        };

        // 2. Enrich with SEMrush if possible
        if (apiKey && newOpportunities.length > 0) {
          try {
            const batch = newOpportunities.slice(0, 10).join(","); // Process top 10 for speed
            const res = await axios.get(`https://api.semrush.com/?type=phrase_this&key=${apiKey}&export_columns=Ph,Nq,Cp,Kd&phrase=${encodeURIComponent(batch)}&database=${location}`);
            const rows = res.data.split("\n").slice(1).filter(r => r.length > 0);
            results.opportunities = rows.map(r => {
              const [ph, vol, cpc, kd] = r.split(";");
              return { keyword: ph, volume: vol, difficulty: kd + "%", source: "Seed List (Enriched)" };
            });
          } catch (e) {
            results.error = "SEMrush enrichment failed: " + e.message;
          }
        } else if (newOpportunities.length > 0) {
          results.opportunities = newOpportunities.map(k => ({ keyword: k, status: "Ready (Metrics missing - No API Key)", source: "Seed List" }));
        }

        // 3. Fallback Discovery
        if (results.opportunities.length === 0 && topic && apiKey) {
          try {
            const res = await axios.get(`https://api.semrush.com/?type=phrase_related&key=${apiKey}&export_columns=Ph,Nq,Kd&phrase=${encodeURIComponent(topic)}&database=${location}&display_limit=5`);
            const rows = res.data.split("\n").slice(1).filter(r => r.length > 0);
            results.discovery = rows.map(r => {
              const [ph, vol, kd] = r.split(";");
              return { keyword: ph, volume: vol, difficulty: kd + "%", source: "Discovery" };
            });
          } catch (e) {}
        }

        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
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
  { name: "mktdm-research", version: "2.1.0" },
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
    console.error("MCP Adapter Error:", error);
    res.status(500).json({ error: error.message });
  }
}
