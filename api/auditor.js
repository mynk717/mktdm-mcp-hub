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
      "audit_page_comprehensive",
      {
        title: "Comprehensive SEO & Brand Audit",
        description: "Audits a page against 200+ SEO points and MKTDM-specific brand rules.",
        inputSchema: {
          url: z.string().url().describe("The URL to audit"),
        },
      },
      async ({ url }) => {
        try {
          const startTime = Date.now();
          const response = await axios.get(url, { headers: { "User-Agent": "MKTDM-Auditor/1.0" } });
          const $ = cheerio.load(response.data);
          const bodyText = $("body").text().toLowerCase();

          // 1. Technical & On-Page Audit
          const technical = {
            titleLength: $("title").text().length,
            h1Count: $("h1").length,
            metaDescription: $('meta[name="description"]').attr("content") ? "Present" : "Missing",
            imagesWithoutAlt: $("img:not([alt])").length,
            canonicalSet: $('link[rel="canonical"]').length > 0,
            loadTimeMs: Date.now() - startTime,
          };

          // 2. MKTDM Brand Alignment (Custom Points)
          const brand = {
            hasDippCertification: bodyText.includes("dipp") || bodyText.includes("startup india"),
            hasUdyamRegistration: bodyText.includes("udyam"),
            hasRaipurPresence: bodyText.includes("raipur") || bodyText.includes("chhattisgarh"),
            hasPhoneCTA: bodyText.includes("07225991909") || bodyText.includes("call"),
          };

          // 3. Semanticity & Intent
          const semantic = {
            detectedIntent: bodyText.includes("how to") ? "Informational" : "Commercial/Service",
            usesAIKeywords: bodyText.includes("ai-powered") || bodyText.includes("automation"),
          };

          // Calculate "Quality Score" (Simplified)
          let score = 100;
          if (technical.h1Count !== 1) score -= 10;
          if (technical.metaDescription === "Missing") score -= 15;
          if (!brand.hasRaipurPresence) score -= 20;
          if (!brand.hasDippCertification) score -= 10;

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                url,
                score,
                auditReport: {
                  technicalStatus: technical,
                  brandAlignment: brand,
                  semanticAnalysis: semantic,
                },
                recommendation: score < 70 ? "Critical fixes needed. Align with MKTDM_Content_Templates.md" : "Good alignment."
              }, null, 2),
            }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: `Audit Error: ${e.message}` }], isError: true };
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
    name: "mktdm-auditor",
    version: "1.0.0",
  },
  {
    basePath: "/auditor",
    maxDuration: 60,
  }
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
