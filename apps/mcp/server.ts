import { mcp } from "./actions.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
mcp.connect(transport).catch((err) => {
  console.error("MCP connection error:", err);
});
