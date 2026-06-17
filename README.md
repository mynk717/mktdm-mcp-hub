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

### 3. Quality Auditor (v2.1.0)
**Endpoint:** `https://mcp.mktgdime.com/auditor/mcp`
- `audit_page_comprehensive`: Audits a page against 200+ SEO points and **dynamic brand rules**.
  - **Parameters:** `url`, `brandConfig` (optional object).
- `audit_content_quality`: Word count, FAQ patterns, keyword density, and E-E-A-T signals.
- `audit_local_seo`: NAP consistency, LocalBusiness schema, and Maps integration.
- `audit_schema_structured_data`: Full JSON-LD extraction and validation.
- `audit_social_preview`: Open Graph and Twitter Card validation.

---

## 📂 Dynamic Brand Configurations (Privacy-First)

The Quality Auditor no longer uses hardcoded brand data. Instead, it accepts a `brandConfig` object at runtime. This allows you to keep client data (phones, keywords, private IDs) in **local files** on your machine.

### How to use with AI Agents (Gemini/Claude):
1.  **Create a local brand file** (e.g., `shree-shivam.md` or `brands.json`) on your computer.
2.  **Tell the AI:** "Read my local `shree-shivam.md` file and use those details to audit this URL."
3.  **AI Logic:** The AI will read your file and pass the details into the `brandConfig` parameter automatically.

**`brandConfig` Structure:**
```json
{
  "name": "Brand Name",
  "identifiers": ["DIPP ID", "Domain", "Unique Marker"],
  "locations": ["City", "State"],
  "phones": ["07225991909"],
  "locationLabel": "Raipur",
  "targetKeywords": ["seo", "marketing"],
  "serviceKeywords": ["audit", "strategy"]
}
```

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
