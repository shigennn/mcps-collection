#!/usr/bin/env node

/**
 * Figma MCP サーバー
 *
 * このファイルは、Figma APIを介してファイル操作、コンポーネント取得、
 * イメージエクスポート、コメント管理などの操作を可能にする
 * Model Context Protocol (MCP) サーバーを実装しています。
 * 
 * 主な機能:
 * - ファイル情報の取得
 * - コンポーネントとスタイルの一覧
 * - イメージのエクスポート
 * - コメントの管理
 * - FigJam ボードの操作
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';

// バージョン情報
const VERSION = "1.0.0";

// Figma API のベースURL
const FIGMA_API_BASE_URL = "https://api.figma.com/v1";

// ツール名の定義
const FIGMA_TOOLS = {
  GET_FILE: "get_figma_file",
  GET_FILE_NODES: "get_figma_file_nodes",
  GET_COMMENTS: "get_figma_comments",
  POST_COMMENT: "post_figma_comment",
  GET_COMPONENTS: "get_figma_components",
  GET_FILE_IMAGES: "get_figma_file_images",
  GET_FIGJAM_BOARD: "get_figjam_board"
};

// Figma エラーハンドリング
function isFigmaError(error: any): boolean {
  return error && 
    typeof error === 'object' && 
    'status' in error && 
    'message' in error;
}

function formatFigmaError(error: any): string {
  const { status, message } = error;
  
  switch (status) {
    case 400:
      return `Bad Request: ${message}`;
    case 401:
      return `Authentication Error: ${message}. Please check your Figma access token.`;
    case 403:
      return `Permission Denied: ${message}. You don't have access to this resource.`;
    case 404:
      return `Not Found: ${message}. The requested resource doesn't exist.`;
    case 429:
      return `Rate Limit Exceeded: ${message}. Please try again later.`;
    case 500:
    case 503:
      return `Figma API Error: ${message}. This is a server-side issue.`;
    default:
      return `Figma API Error (${status}): ${message}`;
  }
}

/**
 * 環境変数から Figma アクセストークンを取得
 */
function getDefaultAccessToken(): string {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error("FIGMA_ACCESS_TOKEN environment variable is not set");
  }
  return token;
}

/**
 * Figma API のヘッダーを生成
 */
function createFigmaHeaders(accessToken: string) {
  return {
    "X-Figma-Token": accessToken,
    "Content-Type": "application/json"
  };
}

/**
 * APIリクエストを実行し、エラーをハンドリング
 */
async function makeApiRequest(url: string, options: RequestInit, accessToken?: string) {
  const token = accessToken || getDefaultAccessToken();
  const headers = createFigmaHeaders(token);
  
  const response = await fetch(url, { 
    ...options, 
    headers: { ...headers, ...options.headers } 
  });
  
  if (!response.ok) {
    let errorJson: any;
    try {
      errorJson = await response.json();
    } catch (e) {
      errorJson = {
        status: response.status,
        message: response.statusText
      };
    }
    
    throw errorJson;
  }
  
  return await response.json();
}

/**
 * 標準化されたレスポンスを生成
 */
function createResponse(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    isError: false
  };
}

// スキーマ定義
const GetFileSchema = z.object({
  file_key: z.string(),
  access_token: z.string().optional()
});

const GetFileNodesSchema = z.object({
  file_key: z.string(),
  ids: z.array(z.string()),
  depth: z.number().optional(),
  access_token: z.string().optional()
});

const GetCommentsSchema = z.object({
  file_key: z.string(),
  access_token: z.string().optional()
});

const ClientMetaSchema = z.object({
  x: z.number(),
  y: z.number(),
  node_id: z.string().optional()
});

const PostCommentSchema = z.object({
  file_key: z.string(),
  message: z.string(),
  client_meta: ClientMetaSchema.optional(),
  comment_id: z.string().optional(),
  access_token: z.string().optional()
});

const GetComponentsSchema = z.object({
  access_token: z.string().optional(),
  team_id: z.string().optional()
});

const GetFileImagesSchema = z.object({
  file_key: z.string(),
  ids: z.array(z.string()),
  scale: z.number().optional(),
  format: z.enum(['jpg', 'png', 'svg', 'pdf']).optional(),
  access_token: z.string().optional()
});

const GetFigJamBoardSchema = z.object({
  file_key: z.string(),
  access_token: z.string().optional()
});

// サーバーの初期化
const server = new McpServer({
  name: "figma-mcp-server",
  version: VERSION
});

// ファイル情報取得
server.tool(
  FIGMA_TOOLS.GET_FILE,
  "Retrieves a Figma file by its key",
  GetFileSchema.shape,
  async (args) => {
    try {
      const url = `${FIGMA_API_BASE_URL}/files/${args.file_key}`;
      const data = await makeApiRequest(url, {}, args.access_token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// ファイルの特定ノード取得
server.tool(
  FIGMA_TOOLS.GET_FILE_NODES,
  "Retrieves specific nodes from a Figma file",
  GetFileNodesSchema.shape,
  async (args) => {
    try {
      let url = `${FIGMA_API_BASE_URL}/files/${args.file_key}/nodes?ids=${args.ids.join(',')}`;
      if (args.depth !== undefined) {
        url += `&depth=${args.depth}`;
      }
      
      const data = await makeApiRequest(url, {}, args.access_token);
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// コメント取得
server.tool(
  FIGMA_TOOLS.GET_COMMENTS,
  "Retrieves all comments for a Figma file",
  GetCommentsSchema.shape,
  async (args) => {
    try {
      const url = `${FIGMA_API_BASE_URL}/files/${args.file_key}/comments`;
      const data = await makeApiRequest(url, {}, args.access_token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// コメント投稿
server.tool(
  FIGMA_TOOLS.POST_COMMENT,
  "Posts a new comment on a Figma file",
  PostCommentSchema.shape,
  async (args) => {
    try {
      const url = `${FIGMA_API_BASE_URL}/files/${args.file_key}/comments`;
      
      const body: any = { message: args.message };
      if (args.client_meta) body.client_meta = args.client_meta;
      if (args.comment_id) body.comment_id = args.comment_id;
      
      const data = await makeApiRequest(url, {
        method: 'POST',
        body: JSON.stringify(body)
      }, args.access_token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// コンポーネント取得
server.tool(
  FIGMA_TOOLS.GET_COMPONENTS,
  "Retrieves published components for a team or personal account",
  GetComponentsSchema.shape,
  async (args) => {
    try {
      let url: string;
      if (args.team_id) {
        url = `${FIGMA_API_BASE_URL}/teams/${args.team_id}/components`;
      } else {
        url = `${FIGMA_API_BASE_URL}/me/components`;
      }
      
      const data = await makeApiRequest(url, {}, args.access_token);
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// ファイル画像取得
server.tool(
  FIGMA_TOOLS.GET_FILE_IMAGES,
  "Retrieves rendered images for nodes in a Figma file",
  GetFileImagesSchema.shape,
  async (args) => {
    try {
      let url = `${FIGMA_API_BASE_URL}/images/${args.file_key}?ids=${args.ids.join(',')}`;
      
      if (args.scale !== undefined) {
        url += `&scale=${args.scale}`;
      }
      
      if (args.format) {
        url += `&format=${args.format}`;
      }
      
      const data = await makeApiRequest(url, {}, args.access_token);
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// FigJamボード取得
server.tool(
  FIGMA_TOOLS.GET_FIGJAM_BOARD,
  "Retrieves a FigJam board by its key",
  GetFigJamBoardSchema.shape,
  async (args) => {
    try {
      const url = `${FIGMA_API_BASE_URL}/files/${args.file_key}`;
      const data = await makeApiRequest(url, {}, args.access_token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isFigmaError(error) ? formatFigmaError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// サーバー起動
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Figma MCP Server running on stdio");
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
