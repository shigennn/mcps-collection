/**
 * Firecrawl APIを利用したModel Context Protocol(MCP)サーバーの実装
 * このサーバーは、Webスクレイピングとコンテンツ抽出の機能を提供します
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

/**
 * MCPサーバーの初期化
 */
const server = new McpServer({
  name: "firecrawl",
  version: "0.1.0",
})

/**
 * APIキーの確認
 */
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!
if (!FIRECRAWL_API_KEY) {
  console.error("Error: FIRECRAWL_API_KEY environment variable is required")
  process.exit(1)
}

/**
 * シングルページスクレイピングを実行する関数
 * 
 * @param url スクレイピングするURL
 * @param options 追加オプション
 * @returns スクレイピング結果
 */
async function scrapePage(url: string, options: any = {}) {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url,
      ...options
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}\n${await response.text()}`)
  }

  const data = await response.json();
  return data;
}

/**
 * ウェブサイトのクローリングを実行する関数
 * 
 * @param url クローリングするベースURL
 * @param options 追加オプション
 * @returns クローリング結果
 */
async function crawlWebsite(url: string, options: any = {}) {
  const response = await fetch('https://api.firecrawl.dev/v0/crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url,
      ...options
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}\n${await response.text()}`)
  }

  const data = await response.json();
  return data;
}

/**
 * スクレイピング結果を整形する関数
 * 
 * @param results APIから返されたスクレイピング結果
 * @returns 整形されたテキスト
 */
function formatScrapeResults(results: any): string {
  if (!results || typeof results !== 'object') {
    return 'No results or invalid response format';
  }

  // コンテンツが取得できている場合
  if (results.content) {
    return results.content;
  }

  // 構造化データの場合
  if (results.data && Array.isArray(results.data)) {
    return JSON.stringify(results.data, null, 2);
  }

  // その他の場合は結果全体を文字列化
  return JSON.stringify(results, null, 2);
}

/**
 * クローリング結果を整形する関数
 * 
 * @param results APIから返されたクローリング結果
 * @returns 整形されたテキスト
 */
function formatCrawlResults(results: any): string {
  if (!results || typeof results !== 'object') {
    return 'No results or invalid response format';
  }

  // pagesプロパティがある場合（一般的な形式）
  if (results.pages && Array.isArray(results.pages)) {
    const summary = `Found ${results.pages.length} pages.\n\n`;
    
    // 各ページの内容をまとめる
    const pagesContent = results.pages.map((page: any, index: number) => {
      return `Page ${index + 1}: ${page.url}\n${page.content || 'No content available'}\n`;
    }).join('\n---\n\n');
    
    return summary + pagesContent;
  }

  // その他の場合は結果全体を文字列化
  return JSON.stringify(results, null, 2);
}

/**
 * スクレイピングツールの実装
 */
server.tool(
  "firecrawl_scrape",
  "Extracts content from a single web page and returns it in a format that can be easily used by AI models. Use this tool to get detailed information from specific web pages, articles, documentation, or any online content. Perfect for deep analysis of individual pages.",
  {
    url: z.string().describe("The URL of the web page to scrape"),
    markdownOutput: z.boolean().optional().describe("Whether to return the content in markdown format (default: true)"),
    cssSelector: z.string().optional().describe("CSS selector to extract specific content"),
    minContentLength: z.number().optional().describe("Minimum content length to extract")
  },
  async (args) => {
    try {
      const { url, markdownOutput = true, cssSelector, minContentLength } = args as { 
        url: string, 
        markdownOutput?: boolean, 
        cssSelector?: string,
        minContentLength?: number 
      };
      
      const options: Record<string, any> = { 
        markdownOutput, 
      };
      
      if (cssSelector) options.cssSelector = cssSelector;
      if (minContentLength) options.minContentLength = minContentLength;
      
      const results = await scrapePage(url, options);
      const formattedResults = formatScrapeResults(results);
      
      return {
        content: [{ type: "text", text: formattedResults }],
        isError: false,
      }
    } catch (error) {
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

/**
 * クローリングツールの実装
 */
server.tool(
  "firecrawl_crawl",
  "Crawls an entire website and extracts content from multiple pages. Use this tool when you need to gather information from an entire website or multiple related pages. Great for comprehensive research, documentation analysis, or understanding the structure of a site.",
  {
    url: z.string().describe("The base URL of the website to crawl"),
    maxPages: z.number().optional().describe("Maximum number of pages to crawl (default: 10)"),
    markdownOutput: z.boolean().optional().describe("Whether to return the content in markdown format (default: true)"),
    depth: z.number().optional().describe("Maximum depth to crawl (default: 2)"),
    includePatterns: z.array(z.string()).optional().describe("Patterns of URLs to include"),
    excludePatterns: z.array(z.string()).optional().describe("Patterns of URLs to exclude")
  },
  async (args) => {
    try {
      const { 
        url, 
        maxPages = 10, 
        markdownOutput = true,
        depth = 2,
        includePatterns,
        excludePatterns
      } = args as { 
        url: string, 
        maxPages?: number, 
        markdownOutput?: boolean,
        depth?: number,
        includePatterns?: string[],
        excludePatterns?: string[]
      };
      
      const options: Record<string, any> = { 
        maxPages, 
        markdownOutput,
        depth
      };
      
      if (includePatterns) options.includePatterns = includePatterns;
      if (excludePatterns) options.excludePatterns = excludePatterns;
      
      const results = await crawlWebsite(url, options);
      const formattedResults = formatCrawlResults(results);
      
      return {
        content: [{ type: "text", text: formattedResults }],
        isError: false,
      }
    } catch (error) {
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

/**
 * HTMLからテキストを抽出するツールの実装
 */
server.tool(
  "firecrawl_extract",
  "Extracts specific data from a webpage using CSS selectors or XPath. Use this tool when you need to target and extract specific elements or structured data from a webpage rather than the entire content.",
  {
    url: z.string().describe("The URL of the web page to extract data from"),
    selectors: z.array(z.string()).describe("CSS selectors or XPath expressions to extract data"),
    outputFormat: z.enum(["json", "text", "markdown"]).optional().describe("Output format (default: json)")
  },
  async (args) => {
    try {
      const { url, selectors, outputFormat = "json" } = args as { 
        url: string, 
        selectors: string[],
        outputFormat?: "json" | "text" | "markdown"
      };
      
      const response = await fetch('https://api.firecrawl.dev/v0/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          selectors,
          outputFormat
        })
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}\n${await response.text()}`)
      }

      const data = await response.json();
      const formattedResults = outputFormat === 'json' 
        ? JSON.stringify(data, null, 2) 
        : (data.content || JSON.stringify(data, null, 2));
      
      return {
        content: [{ type: "text", text: formattedResults }],
        isError: false,
      }
    } catch (error) {
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
  console.error("Secure MCP Firecrawl Server running on stdio")
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error)
  process.exit(1)
})
