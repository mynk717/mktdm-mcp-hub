# MKTDM MCP Hub

The central hub for Model Context Protocol (MCP) servers powering **MktgDime.com**. This monorepo contains modular SEO, Research, and Execution tools that can be consumed by any AI client (Claude Code, Gemini CLI, Cursor, etc.).

## 🚀 Active MCP Servers

### 1. Research & Discovery (v2.1.0)
**Endpoint:** `https://mcp.mktgdime.com/research/mcp`
- `scrape_competitor_page`: Deep structural analysis (H1-H4), meta data, word count, CTA detection, and local signals.
- `get_top_pages_intelligence`: Real-time organic traffic and top page analysis via **SEMrush API**.
- `get_scoped_keyword_insights`: Fetches Volume, KD, and CPC data from **SEMrush**.
- `get_backlink_opportunities`: Identifies link gaps between you and your competitors.
- `get_content_gap`: Compares topic coverage (headings) between two URLs to find content opportunities.
- `research_keyword_opportunity`: **Smart Filter** that cross-checks your seed lists (CSV/Excel) against existing content to avoid duplication.

### 2. Content Execution & Publishing (v1.1.0)
**Endpoint:** `https://mcp.mktgdime.com/content/mcp`
- `format_content_for_cms`: Formats raw text into structured HTML/Markdown for Webflow/WordPress.
- `generate_local_schema`: Creates JSON-LD for local business optimization.

### 3. Quality Auditor (v2.1.0)
**Endpoint:** `https://mcp.mktgdime.com/auditor/mcp`
- `audit_page_comprehensive`: Audits a page against 200+ SEO points and **dynamic brand rules**.
  - **Parameters:** `url`, `brandConfig` (optional object).
- `audit_content_quality`: Word count, FAQ patterns, keyword density, and E-E-A-T signals.
- `audit_local_seo`: NAP consistency, LocalBusiness schema, and Maps integration.
- `audit_schema_structured_data`: Full JSON-LD extraction and validation.
- `audit_social_preview`: Open Graph and Twitter Card validation.

---

## 📂 Dynamic Brand & Local Data (Privacy-First)

The MCP Hub is designed to work with your private local data. You can feed your own keyword lists or content inventories into the tools without uploading them to the server.

### 1. Brand Configurations
Keep a local file (e.g., `brands.md`) with your client details (DIPP ID, phones, keywords). Tell the AI: "Read my local `brands.md` and use it for the audit."

### 2. Keyword Seed Data (Excel/CSV/JSON)
Keep your keyword research or content inventory local (e.g., `keywords.csv`). Tell the AI: "Read my `keywords.csv` and use `research_keyword_opportunity` to find new topics I haven't covered in my blog yet."

**How it works:** The AI agent reads your local file and passes the data into the tool parameters on-the-fly. Your data never stays on the server.

---

## 🛠 Connection Instructions

### Claude Code (CLI)
```bash
claude mcp add --transport http mktdm-research https://mcp.mktgdime.com/research/mcp
claude mcp add --transport http mktdm-content https://mcp.mktgdime.com/content/mcp
claude mcp add --transport http mktdm-auditor https://mcp.mktgdime.com/auditor/mcp
```

### Gemini CLI
Add the servers to your global configuration in `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "mktdm-research": { "url": "https://mcp.mktgdime.com/research/mcp" },
    "mktdm-content": { "url": "https://mcp.mktgdime.com/content/mcp" },
    "mktdm-auditor": { "url": "https://mcp.mktgdime.com/auditor/mcp" }
  }
}
```

---

## 📦 Monorepo Structure

- `/api`: Vercel Serverless Function entry points.
- `/packages`: Source code for individual MCP servers.
- `/shared`: Shared resources (Templates, Logic, Configs).

Developed by **Marketing Dime**.
