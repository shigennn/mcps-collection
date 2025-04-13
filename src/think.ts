/**
 * Think Tool MCPサーバーの実装
 * このサーバーは、Claudeの推論能力を向上させるための構造化された思考スペースを提供します
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

/**
 * MCPサーバーの初期化
 * サーバー名、バージョン、機能を定義します
 */
const server = new McpServer({
  name: "think",
  version: "0.1.0",
})

/**
 * Think ツールの実装
 * 構造化された思考のためのスペースを提供します
 */
server.tool(
  "think",
  "Use the tool to think about something. It will not obtain new information or change anything, but just provide a space for structured reasoning. Use it when complex reasoning is needed.",
  {
    thought: z.string().describe("A thought to think about.")
  },
  async (args) => {
    try {
      const { thought } = args
      
      // ログに思考プロセスを記録（サーバーのログには表示されるが、ユーザーには見えない）
      console.error("Thinking process:", thought)
      
      // 思考自体を返す
      return {
        content: [{ type: "text", text: thought }],
        isError: false,
      }
    } catch (error) {
      console.error("Error executing tool:", error)
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  }
)

// Start server
async function runServer() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Think Tool MCP Server running on stdio")
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error)
  process.exit(1)
})