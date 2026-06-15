# MKTDM MCP Hub

The central hub for Model Context Protocol (MCP) servers powering **MktgDime.com**. This monorepo contains modular SEO, Research, and Execution tools that can be consumed by any AI client (Claude Code, Gemini CLI, Cursor, etc.).

## 🚀 Active MCP Servers

### 1. Research & Discovery
**Endpoint:** `https://mcp.mktgdime.com/research/mcp`

**Tools:**
- `scrape_competitor_page`: Analyzes on-page SEO and detects local vs. broad intent.
- `get_scoped_keyword_insights`: Fetches keyword metrics (Volume/KD) with city-specific scoping.

---

## 🛠 Connection Instructions

### Claude Code (CLI)
Run the following command to add the research tools to your Claude session:
```bash
claude mcp add --transport http mktdm-research https://mcp.mktgdime.com/research/mcp
```

### Gemini CLI
Add the server to your global configuration in `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "mktdm-research": {
      "url": "https://mcp.mktgdime.com/research/mcp"
    }
  }
}
```

### Cursor / Windsurf
1. Open **Settings** > **MCP**.
2. Click **Add New MCP Server**.
3. **Name:** `mktdm-research`
4. **Type:** `HTTP`
5. **URL:** `https://mcp.mktgdime.com/research/mcp`

---

## 📦 Monorepo Structure

- `/api`: Vercel Serverless Function entry points.
- `/packages`: Source code for individual MCP servers.
- `/shared`: Shared resources (Templates, Logic, Configs).

---

## 🔒 Security & Deployment
This hub is hosted on **Vercel** using the `mcp-handler` adapter for high-performance Streamable HTTP communication. All logic is stateless and optimized for serverless environments.

Developed by **Marketing Dime**.
