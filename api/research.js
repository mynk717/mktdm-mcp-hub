import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const handler = createMcpHandler(
  (server) => {
    // --- Resources ---
    // Note: mcp-handler's high-level API might have a different way for resources, 
    // but we can use the low-level server instance if needed.
    // Actually, createMcpHandler gives us a 'server' object that we can use to register tools.
    
    server.registerTool(
      "scrape_competitor_page",
      {
        title: "Scrape Competitor Page",
        description: "Scrapes a URL to extract SEO data and detect if it targets a local or broad audience.",
        inputSchema: {
          url: z.string().url().describe("The URL to scrape"),
        },
      },
      async ({ url }) => {
        try {
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
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "get_scoped_keyword_insights",
      {
        title: "Get Scoped Keyword Insights",
        description: "Fetch keyword metrics with a specific scope (local vs broad).",
        inputSchema: {
          keyword: z.string().describe("The keyword to analyze"),
          scope: z.enum(["local", "broad"]).describe("Whether to analyze for a specific city or a global audience."),
          location: z.string().optional().describe("Required if scope is local (e.g., 'Raipur', 'Indore')."),
        },
      },
      async ({ keyword, scope, location }) => {
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
    );
    
    // For resources, we might need to access the underlying server.
    // mcp-handler's 'server' is often a wrapper or a specific instance.
    // If mcp-handler doesn't expose a clean resource API yet, we can add it to the underlying server.
    if (server.server) {
        const mcpServer = server.server;
        
        mcpServer.setRequestHandler(async (request) => {
            // Check if it's a list resources request
            if (request.method === "resources/list") {
                return {
                    resources: [{
                        uri: "mktg-dime://templates",
                        name: "MKTDM Content Templates",
                        description: "Official content strategy templates.",
                        mimeType: "text/markdown",
                    }]
                };
            }
            // Check if it's a read resource request
            if (request.method === "resources/read") {
                if (request.params.uri === "mktg-dime://templates") {
                    const content = await fs.readFile(TEMPLATE_PATH, "utf-8");
                    return { contents: [{ uri: request.params.uri, mimeType: "text/markdown", text: content }] };
                }
            }
        });
    }
  },
  {}, // Server options
  {
    basePath: "/research",
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST };
