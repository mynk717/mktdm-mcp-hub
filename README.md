# MKTDM MCP Hub

The central hub for Model Context Protocol (MCP) servers powering **MktgDime.com**. This monorepo contains modular SEO, Research, and Execution tools that can be consumed by any AI client (Claude Code, Gemini CLI, Cursor, etc.).

## 🚀 Active MCP Servers

### 1. Research & Discovery
**Endpoint:** `https://mcp.mktgdime.com/research/mcp`
- `scrape_competitor_page`: Analyzes on-page SEO and detects local vs. broad intent.
- `get_scoped_keyword_insights`: Fetches keyword metrics (Volume/KD) with city-specific scoping.

### 2. Content Execution & Publishing
**Endpoint:** `https://mcp.mktgdime.com/content/mcp`
- `format_content_for_cms`: Formats raw text into structured HTML/Markdown for Webflow/WordPress.
- `generate_local_schema`: Creates JSON-LD for local business optimization.

### 3. Quality Auditor (NEW)
**Endpoint:** `https://mcp.mktgdime.com/auditor/mcp`
- `audit_page_comprehensive`: Audits a page against 200+ SEO points, semantic intent, and brand-specific alignment rules.
  - **Parameters:** `url`, `brand` (optional: `mktdm` | `shreeshivam`, default: `mktdm`).
- `audit_performance_vitals`: Checks Core Web Vitals and provides localized speed advice based on the `brand`.

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
