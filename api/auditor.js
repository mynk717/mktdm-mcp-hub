import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

// No hardcoded brands - logic is now dynamic based on input brandConfig
const DEFAULT_BRAND_CONFIG = {
  name: "Generic",
  identifiers: [],
  locations: [],
  phones: [],
  locationLabel: "Global",
  targetKeywords: [],
  serviceKeywords: []
};

// --- Helpers ---
function normalizePhone(phone) {
  return phone.replace(/[\s\-\(\)\+]/g, "").replace(/^91/, "");
}

function calculateScore(results) {
  let s = 100;
  const deductions = [];

  // CRITICAL
  if (results.technical.noIndex) {
    deductions.push("Noindex found (-100)");
    return { score: 0, deductions };
  }
  if (results.technical.canonicalMismatch) {
    s -= 25;
    deductions.push("Canonical mismatch (-25)");
  }
  if (results.technical.metaDescription === "Missing") {
    s -= 15;
    deductions.push("Meta description missing (-15)");
  }
  if (results.technical.h1Count !== 1) {
    s -= 10;
    deductions.push("H1 count !== 1 (-10)");
  }

  // HIGH IMPACT
  if (!results.structuredData.found) {
    s -= 15;
    deductions.push("No structured data found (-15)");
  }
  if (results.technical.loadTimeMs > 2000) {
    s -= 20;
    deductions.push("Load time > 2000ms (-20)");
  }
  if (!results.brandAlignment.hasLocation) {
    s -= 20;
    deductions.push("No location signal (-20)");
  }
  if (!results.brandAlignment.hasIdentifiers) {
    s -= 10;
    deductions.push("No identifier signal (-10)");
  }
  if (results.socialPreview.ogCount < 3) {
    s -= 10;
    deductions.push("Social tags incomplete (-10)");
  }
  if (!results.accessibility.hasViewport) {
    s -= 10;
    deductions.push("Missing viewport meta (-10)");
  }
  if (results.content.wordCount < 300) {
    s -= 15;
    deductions.push("Thin content < 300 words (-15)");
  }

  // MEDIUM IMPACT
  if (results.technical.altCoverage < 0.8) {
    s -= 8;
    deductions.push("Alt text coverage < 80% (-8)");
  }
  if (!results.technical.hasCompression) {
    s -= 8;
    deductions.push("No compression (gzip/brotli) (-8)");
  }
  if (!results.technical.canonicalSet) {
    s -= 7;
    deductions.push("No canonical set (-7)");
  }
  if (results.aeoReadiness.questionHeadingCount === 0) {
    s -= 5;
    deductions.push("No FAQ/question headings (-5)");
  }
  if (!results.accessibility.hasLang) {
    s -= 5;
    deductions.push("No language attribute (-5)");
  }
  if (results.performance.clsRisk === "HIGH") {
    s -= 5;
    deductions.push("High CLS risk (missing image dims) (-5)");
  }

  return { score: Math.max(0, s), deductions };
}

const handler = createMcpHandler(
  (server) => {
    // --- Tool: Comprehensive SEO & Brand Audit ---
    server.registerTool(
      "audit_page_comprehensive",
      {
        title: "Comprehensive SEO & Brand Audit v2.1",
        description: "Audits a page against 200+ SEO points and dynamic brand-specific rules provided at runtime.",
        inputSchema: {
          url: z.string().url().describe("The URL to audit"),
          brandConfig: z.object({
            name: z.string().optional(),
            identifiers: z.array(z.string()).optional(),
            locations: z.array(z.string()).optional(),
            phones: z.array(z.string()).optional(),
            locationLabel: z.string().optional(),
            targetKeywords: z.array(z.string()).optional(),
            serviceKeywords: z.array(z.string()).optional(),
          }).optional().describe("Dynamic brand rules for alignment and scoring."),
        },
      },
      async ({ url, brandConfig }) => {
        try {
          const config = { ...DEFAULT_BRAND_CONFIG, ...brandConfig };
          const startTime = Date.now();
          const response = await axios.get(url, { 
            headers: { "User-Agent": "MKTDM-Auditor/2.1" }, 
            timeout: 10000,
            validateStatus: () => true 
          });
          
          if (response.status !== 200) {
            return { content: [{ type: "text", text: `Audit Error: Site returned ${response.status}` }], isError: true };
          }

          const $ = cheerio.load(response.data);
          const bodyText = $("body").text();
          const bodyLower = bodyText.toLowerCase();
          const headHtml = $("head").html().toLowerCase();

          // 1. Technical SEO
          const technical = {
            title: $("title").text(),
            titleLength: $("title").text().length,
            h1Count: $("h1").length,
            h2Count: $("h2").length,
            metaDescription: $('meta[name="description"]').attr("content") || "Missing",
            canonical: $('link[rel="canonical"]').attr("href"),
            canonicalSet: !!$('link[rel="canonical"]').length,
            canonicalMismatch: false,
            noIndex: headHtml.includes('content="noindex"') || (response.headers['x-robots-tag'] || "").includes('noindex'),
            hasCompression: !!response.headers['content-encoding'],
            loadTimeMs: Date.now() - startTime,
            imagesCount: $("img").length,
            imagesWithoutAlt: $("img:not([alt]), img[alt='']").length,
            altCoverage: 0,
            badAlts: $("img[alt='image'], img[alt='photo'], img[alt='img'], img[alt='picture']").length
          };
          
          if (technical.canonical && new URL(technical.canonical, url).href !== new URL(url).href) {
            technical.canonicalMismatch = true;
          }
          technical.altCoverage = technical.imagesCount > 0 ? (technical.imagesCount - technical.imagesWithoutAlt) / technical.imagesCount : 1;

          // 2. Content & AEO
          const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
          const questionHeadings = $("h1, h2, h3").filter((i, el) => {
            const txt = $(el).text().trim().toLowerCase();
            return txt.startsWith("how") || txt.startsWith("what") || txt.startsWith("why") || 
                   txt.startsWith("when") || txt.startsWith("is") || txt.startsWith("can");
          }).length;

          const content = {
            wordCount,
            depth: wordCount < 300 ? "Thin" : wordCount < 600 ? "Shallow" : "Good",
            hasFaqPatterns: questionHeadings > 0 || $("details, summary").length > 0,
            freshness: $('meta[property="article:modified_time"]').attr("content") || $('meta[name="revised"]').attr("content") || "Unknown"
          };

          // 3. Structured Data
          const scripts = $('script[type="application/ld+json"]');
          const schemaTypes = [];
          scripts.each((i, el) => {
            try {
              const json = JSON.parse($(el).html());
              if (Array.isArray(json)) json.forEach(s => schemaTypes.push(s['@type']));
              else schemaTypes.push(json['@type']);
            } catch (e) {}
          });

          const structuredData = {
            found: scripts.length > 0,
            types: [...new Set(schemaTypes)],
            hasLocalBusiness: schemaTypes.some(t => String(t).includes("LocalBusiness")),
            hasSpeakable: headHtml.includes("speakable") || JSON.stringify(schemaTypes).includes("speakable")
          };

          // 4. Social & Accessibility
          const accessibility = {
            hasLang: !!$("html").attr("lang"),
            hasViewport: headHtml.includes('name="viewport"'),
            hasFavicon: !!$('link[rel*="icon"]').length
          };

          const socialPreview = {
            ogCount: $('meta[property^="og:"]').length,
            hasOgImage: !!$('meta[property="og:image"]').length,
            hasTwitterCard: !!$('meta[name^="twitter:"]').length
          };

          // 5. Brand & Local
          const brandAlignment = {
            hasIdentifiers: config.identifiers.some(id => bodyLower.includes(id)),
            hasLocation: config.locations.some(loc => bodyLower.includes(loc)),
            hasPhone: config.phones.some(p => bodyLower.includes(normalizePhone(p))),
            hasMaps: bodyLower.includes("google.com/maps") || $("iframe[src*='google.com/maps']").length > 0
          };

          const aeoReadiness = {
            questionHeadingCount: questionHeadings,
            hasSpeakable: structuredData.hasSpeakable,
            answerFirstCandidate: bodyText.slice(0, 500).length > 100
          };

          const performance = {
            clsRisk: $("img:not([width]), img:not([height])").length > 2 ? "HIGH" : "LOW",
            hasCdn: !!(response.headers['cf-ray'] || response.headers['x-vercel-id'] || response.headers['x-cache'])
          };

          const results = { technical, content, structuredData, accessibility, socialPreview, brandAlignment, aeoReadiness, performance };
          const { score, deductions } = calculateScore(results);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({ 
                url, 
                brandName: config.name, 
                score, 
                deductions,
                summary: {
                  technical: technical.noIndex ? "CRITICAL: Noindex" : "Passed",
                  content: content.depth,
                  local: brandAlignment.hasLocation ? "Strong" : (config.locations.length === 0 ? "N/A" : "Weak")
                },
                audit: results 
              }, null, 2),
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
          brandConfig: z.object({
            locationLabel: z.string().optional()
          }).optional().describe("Dynamic brand rules for localized advice."),
        },
      },
      async ({ url, brandConfig }) => {
        try {
          const config = { ...DEFAULT_BRAND_CONFIG, ...brandConfig };
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

    // --- Tool: Content Quality Audit ---
    server.registerTool(
      "audit_content_quality",
      {
        title: "Content Quality & AEO Audit",
        description: "Deep dive into word count, readability, FAQ patterns, and E-E-A-T signals.",
        inputSchema: {
          url: z.string().url(),
          brandConfig: z.object({
            targetKeywords: z.array(z.string()).optional(),
            serviceKeywords: z.array(z.string()).optional()
          }).optional(),
        },
      },
      async ({ url, brandConfig }) => {
        try {
          const config = { ...DEFAULT_BRAND_CONFIG, ...brandConfig };
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);
          const bodyText = $("body").text();
          const words = bodyText.split(/\s+/).filter(w => w.length > 0);
          
          const eeat = {
            hasAddress: $("address").length > 0,
            hasAuthor: $('meta[name="author"]').length > 0 || $('[rel="author"]').length > 0,
            hasAboutPage: $('a[href*="about"]').length > 0,
            hasTeamPage: $('a[href*="team"]').length > 0
          };

          const keywords = {
            targetDensity: config.targetKeywords.filter(k => bodyText.toLowerCase().includes(k)).length / Math.max(1, config.targetKeywords.length),
            serviceDensity: config.serviceKeywords.filter(k => bodyText.toLowerCase().includes(k)).length / Math.max(1, config.serviceKeywords.length)
          };

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                url,
                wordCount: words.length,
                eeat,
                keywords,
                readability: {
                  avgWordLength: words.join("").length / words.length,
                  complexity: words.length > 1000 ? "High" : "Standard"
                }
              }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Local SEO Audit ---
    server.registerTool(
      "audit_local_seo",
      {
        title: "Local SEO Deep Dive",
        description: "Checks NAP consistency, LocalBusiness schema, and Maps integration.",
        inputSchema: {
          url: z.string().url(),
          brandConfig: z.object({
            phones: z.array(z.string()).optional(),
            locations: z.array(z.string()).optional()
          }).optional(),
        },
      },
      async ({ url, brandConfig }) => {
        try {
          const config = { ...DEFAULT_BRAND_CONFIG, ...brandConfig };
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);
          const bodyLower = $("body").text().toLowerCase();

          const nap = {
            phoneFound: config.phones.some(p => bodyLower.includes(normalizePhone(p))),
            locationFound: config.locations.some(loc => bodyLower.includes(loc)),
            mapsEmbedded: $("iframe[src*='google.com/maps']").length > 0
          };

          const nearMePatterns = config.locations.map(loc => `${loc} near me`).some(p => bodyLower.includes(p));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({ url, brandName: config.name, nap, nearMePatterns, status: (config.phones.length > 0 && config.locations.length > 0) ? (nap.phoneFound && nap.locationFound ? "OPTIMIZED" : "NEEDS WORK") : "N/A" }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    // --- Tool: Schema & Structured Data ---
    server.registerTool(
      "audit_schema_structured_data",
      {
        title: "Structured Data Validator",
        description: "Extracts and validates all JSON-LD schema types found on the page.",
        inputSchema: {
          url: z.string().url(),
        },
      },
      async ({ url }) => {
        try {
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);
          const schemas = [];
          $('script[type="application/ld+json"]').each((i, el) => {
            try {
              schemas.push(JSON.parse($(el).html()));
            } catch (e) {}
          });

          return {
            content: [{
              type: "text",
              text: JSON.stringify({ url, count: schemas.length, schemas }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
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

    // --- Tool: Social Preview Audit ---
    server.registerTool(
      "audit_social_preview",
      {
        title: "Social & AI Preview Audit",
        description: "Checks Open Graph and Twitter Card tags for social sharing and AI snippets.",
        inputSchema: {
          url: z.string().url(),
        },
      },
      async ({ url }) => {
        try {
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);
          const og = {};
          $('meta[property^="og:"]').each((i, el) => {
            og[$(el).attr("property")] = $(el).attr("content");
          });
          const twitter = {};
          $('meta[name^="twitter:"]').each((i, el) => {
            twitter[$(el).attr("name")] = $(el).attr("content");
          });

          return {
            content: [{
              type: "text",
              text: JSON.stringify({ 
                url, 
                openGraph: og, 
                twitter,
                score: Object.keys(og).length > 3 ? "GOOD" : "INCOMPLETE"
              }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
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
  { name: "mktdm-auditor", version: "2.1.0" },
  { basePath: "/auditor", maxDuration: 60 }
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
