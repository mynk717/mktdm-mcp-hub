import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.join(process.cwd(), "shared", "MKTDM_Content_Templates.md");

const handler = createMcpHandler(
  (server) => {
    // --- Tools ---

    server.registerTool(
      "format_content_for_cms",
      {
        title: "Format for CMS",
        description: "Formats raw text into structured HTML/Markdown based on MKTDM templates.",
        inputSchema: {
          title: z.string().describe("Main title for the page"),
          body: z.string().describe("The primary content text"),
          platform: z.enum(["webflow", "wordpress", "custom"]).describe("Target platform"),
          includeCTA: z.boolean().default(true),
        },
      },
      async ({ title, body, platform, includeCTA }) => {
        // Logic to wrap content in specific platform tags
        const cta = includeCTA ? "\n\n---\n**CTA:** Contact Marketing Dime at 07225991909 for a free AI audit." : "";
        const html = `<h1>${title}</h1>\n<div>${body}</div>${cta}`;
        
        return {
          content: [{
            type: "text",
            text: `Formatted for ${platform}:\n\n${html}`,
          }],
        };
      }
    );

    server.registerTool(
      "generate_local_schema",
      {
        title: "Generate Local Schema",
        description: "Creates JSON-LD for local business optimization.",
        inputSchema: {
          businessName: z.string().default("Marketing Dime"),
          neighborhood: z.string().describe("e.g. Keduwan Nagar"),
          city: z.string().default("Raipur"),
        },
      },
      async ({ businessName, neighborhood, city }) => {
        const schema = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": businessName,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": `${neighborhood}, ${city}`,
            "addressRegion": "Chhattisgarh",
            "addressCountry": "IN"
          }
        };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(schema, null, 2),
          }],
        };
      }
    );

    // --- Resources ---
    server.registerResource(
      "mktdm-templates",
      "mktg-dime://templates",
      {
        title: "MKTDM Content Templates",
        description: "Official publishing guidelines.",
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
    name: "mktdm-content",
    version: "1.0.0",
  },
  {
    basePath: "/content",
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
