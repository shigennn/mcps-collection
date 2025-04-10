#!/usr/bin/env node

/**
 * Slack MCP サーバー
 *
 * このファイルは、Slack APIを介してメッセージの送受信、チャンネル操作、
 * ユーザー情報取得、ファイル共有などの機能を可能にする
 * Model Context Protocol (MCP) サーバーを実装しています。
 * 
 * 主な機能:
 * - メッセージの送信と取得
 * - チャンネル一覧と情報の取得
 * - ユーザー情報の取得
 * - ファイルのアップロードと取得
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';

// バージョン情報
const VERSION = "1.0.0";

// Slack API のベースURL
const SLACK_API_BASE_URL = "https://slack.com/api";

// ツール名の定義
const SLACK_TOOLS = {
  SEND_MESSAGE: "slack_send_message",
  GET_MESSAGES: "slack_get_messages",
  LIST_CHANNELS: "slack_list_channels",
  GET_CHANNEL_INFO: "slack_get_channel_info",
  LIST_USERS: "slack_list_users",
  GET_USER_INFO: "slack_get_user_info",
  UPLOAD_FILE: "slack_upload_file",
  SEARCH_MESSAGES: "slack_search_messages"
};

// Slack エラーハンドリング
function isSlackError(response: any): boolean {
  return response && typeof response === 'object' && !response.ok;
}

function formatSlackError(error: any): string {
  if (error.error) {
    switch (error.error) {
      case 'not_authed':
        return 'Authentication Error: Token not provided or invalid.';
      case 'invalid_auth':
        return 'Authentication Error: Invalid authentication token.';
      case 'account_inactive':
        return 'Authentication Error: Authentication token is for a deleted user or workspace.';
      case 'channel_not_found':
        return 'Error: The specified channel was not found.';
      case 'not_in_channel':
        return 'Error: The user is not a member of the channel.';
      case 'rate_limited':
        return `Rate Limit Error: Too many requests. Retry after ${error.retry_after || 'some time'}.`;
      default:
        return `Slack API Error: ${error.error}${error.error_description ? ` - ${error.error_description}` : ''}`;
    }
  }
  return `Slack API Error: ${JSON.stringify(error)}`;
}

/**
 * 環境変数から Slack トークンを取得
 */
function getDefaultToken(): string {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN environment variable is not set");
  }
  return token;
}

/**
 * 環境変数から Slack チームIDを取得
 */
function getTeamId(): string | undefined {
  return process.env.SLACK_TEAM_ID;
}

/**
 * Slack API のヘッダーを生成
 */
function createSlackHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=utf-8'
  };
}

/**
 * APIリクエストを実行し、エラーをハンドリング
 */
async function makeApiRequest(endpoint: string, options: RequestInit = {}, token?: string) {
  const apiToken = token || getDefaultToken();
  const headers = createSlackHeaders(apiToken);
  const url = `${SLACK_API_BASE_URL}/${endpoint}`;
  
  console.error(`Making request to: ${url}`);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      headers: { ...headers, ...options.headers } 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Response not OK: ${response.status} ${response.statusText}, Body: ${errorText}`);
      try {
        // エラーレスポンスがJSONの場合
        const errorData = JSON.parse(errorText);
        if (!errorData.ok) {
          throw errorData;
        }
      } catch (jsonError) {
        // JSONではない場合は元のエラーを投げる
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error(`Slack API Error: ${JSON.stringify(data)}`);
      throw data;
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    throw error;
  }
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
const SendMessageSchema = z.object({
  channel: z.string(),
  text: z.string(),
  thread_ts: z.string().optional(),
  token: z.string().optional()
});

const GetMessagesSchema = z.object({
  channel: z.string(),
  limit: z.number().optional(),
  latest: z.string().optional(),
  oldest: z.string().optional(),
  inclusive: z.boolean().optional(),
  token: z.string().optional()
});

const ListChannelsSchema = z.object({
  exclude_archived: z.boolean().optional(),
  types: z.string().optional(), // e.g. "public_channel,private_channel"
  limit: z.number().optional(),
  token: z.string().optional()
});

const GetChannelInfoSchema = z.object({
  channel: z.string(),
  token: z.string().optional()
});

const ListUsersSchema = z.object({
  limit: z.number().optional(),
  cursor: z.string().optional(),
  token: z.string().optional()
});

const GetUserInfoSchema = z.object({
  user: z.string(),
  token: z.string().optional()
});

const UploadFileSchema = z.object({
  channels: z.string(), // Comma-separated list of channel IDs
  content: z.string().optional(),
  file_name: z.string().optional(),
  initial_comment: z.string().optional(),
  thread_ts: z.string().optional(),
  token: z.string().optional()
});

const SearchMessagesSchema = z.object({
  query: z.string(),
  count: z.number().optional(),
  page: z.number().optional(),
  sort: z.string().optional(),
  sort_dir: z.string().optional(),
  token: z.string().optional()
});

// サーバーの初期化
const server = new McpServer({
  name: "slack-mcp-server",
  version: VERSION
});

// メッセージ送信
server.tool(
  SLACK_TOOLS.SEND_MESSAGE,
  "Sends a message to a Slack channel",
  SendMessageSchema.shape,
  async (args) => {
    try {
      const { channel, text, thread_ts, token } = args;
      const payload: any = { channel, text };
      
      if (thread_ts) {
        payload.thread_ts = thread_ts;
      }
      
      // チームIDがある場合は追加
      const teamId = getTeamId();
      if (teamId) {
        console.error(`Team ID available: ${teamId}, but not required for chat.postMessage`);
        // 一部のAPIではteam_idが必要だが、chat.postMessageでは通常不要
        // payload.team_id = teamId;
      }
      
      console.error(`Sending message payload: ${JSON.stringify(payload)}`);
      const data = await makeApiRequest('chat.postMessage', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, token);
      
      return createResponse({
        message: "Message sent successfully",
        ts: data.ts,
        channel: data.channel
      });
    } catch (error) {
      console.error(`Send message error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}` 
        }],
        isError: true
      };
    }
  }
);

// メッセージ取得
server.tool(
  SLACK_TOOLS.GET_MESSAGES,
  "Retrieves messages from a Slack channel",
  GetMessagesSchema.shape,
  async (args) => {
    try {
      const { channel, limit, latest, oldest, inclusive, token } = args;
      
      let endpoint = `conversations.history?channel=${channel}`;
      
      if (limit) endpoint += `&limit=${limit}`;
      if (latest) endpoint += `&latest=${latest}`;
      if (oldest) endpoint += `&oldest=${oldest}`;
      if (inclusive) endpoint += `&inclusive=${inclusive}`;
      
      const data = await makeApiRequest(endpoint, {}, token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// チャンネル一覧
server.tool(
  SLACK_TOOLS.LIST_CHANNELS,
  "Lists all channels in a Slack workspace",
  ListChannelsSchema.shape,
  async (args) => {
    try {
      const { exclude_archived, types, limit, token } = args;
      
      let endpoint = 'conversations.list?';
      
      // チームIDがある場合は追加
      const teamId = getTeamId();
      if (teamId) {
        endpoint += `&team_id=${teamId}`;
        console.error(`Using team_id: ${teamId} for conversations.list`);
      }
      
      if (exclude_archived !== undefined) endpoint += `&exclude_archived=${exclude_archived}`;
      if (types) endpoint += `&types=${types}`;
      if (limit) endpoint += `&limit=${limit}`;
      
      const data = await makeApiRequest(endpoint, {}, token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}` 
        }],
        isError: true
      };
    }
  }
);

// チャンネル情報
server.tool(
  SLACK_TOOLS.GET_CHANNEL_INFO,
  "Gets information about a Slack channel",
  GetChannelInfoSchema.shape,
  async (args) => {
    try {
      const { channel, token } = args;
      
      const data = await makeApiRequest(`conversations.info?channel=${channel}`, {}, token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// ユーザー一覧
server.tool(
  SLACK_TOOLS.LIST_USERS,
  "Lists all users in a Slack workspace",
  ListUsersSchema.shape,
  async (args) => {
    try {
      const { limit, cursor, token } = args;
      
      let endpoint = 'users.list?';
      
      // チームIDがある場合は追加
      const teamId = getTeamId();
      if (teamId) {
        endpoint += `&team_id=${teamId}`;
        console.error(`Using team_id: ${teamId} for users.list`);
      }
      
      if (limit) endpoint += `&limit=${limit}`;
      if (cursor) endpoint += `&cursor=${cursor}`;
      
      const data = await makeApiRequest(endpoint, {}, token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}` 
        }],
        isError: true
      };
    }
  }
);

// ユーザー情報
server.tool(
  SLACK_TOOLS.GET_USER_INFO,
  "Gets information about a Slack user",
  GetUserInfoSchema.shape,
  async (args) => {
    try {
      const { user, token } = args;
      
      const data = await makeApiRequest(`users.info?user=${user}`, {}, token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error}` 
        }],
        isError: true
      };
    }
  }
);

// ファイルアップロード
server.tool(
  SLACK_TOOLS.UPLOAD_FILE,
  "Uploads a file to Slack",
  UploadFileSchema.shape,
  async (args) => {
    try {
      const { channels, content, file_name, initial_comment, thread_ts, token } = args;
      
      // URLSearchParamsを使用する方法（より互換性が高い）
      const formData = new URLSearchParams();
      formData.append('channels', channels);
      
      if (content) {
        formData.append('content', content);
        if (file_name) formData.append('filename', file_name);
      }
      
      if (initial_comment) formData.append('initial_comment', initial_comment);
      if (thread_ts) formData.append('thread_ts', thread_ts);
      
      // チームIDがある場合は追加
      const teamId = getTeamId();
      if (teamId) {
        formData.append('team_id', teamId);
        console.error(`Using team_id: ${teamId} for files.upload`);
      }
      
      const apiToken = token || getDefaultToken();
      const queryParams = new URLSearchParams(formData).toString();
      console.error(`Files upload params: ${queryParams.substring(0, 200)}${queryParams.length > 200 ? '...' : ''}`);
      
      const response = await fetch(`${SLACK_API_BASE_URL}/files.upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed: ${response.status} ${response.statusText}, Body: ${errorText}`);
        try {
          const errorData = JSON.parse(errorText);
          throw errorData;
        } catch (jsonError) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.ok) {
        throw data;
      }
      
      return createResponse({
        message: "File uploaded successfully",
        file: data.file
      });
    } catch (error) {
      console.error(`File upload error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}` 
        }],
        isError: true
      };
    }
  }
);

// メッセージ検索
server.tool(
  SLACK_TOOLS.SEARCH_MESSAGES,
  "Searches for messages in a Slack workspace",
  SearchMessagesSchema.shape,
  async (args) => {
    try {
      const { query, count, page, sort, sort_dir, token } = args;
      
      let endpoint = `search.messages?query=${encodeURIComponent(query)}`;
      
      // チームIDがある場合は追加
      const teamId = getTeamId();
      if (teamId) {
        endpoint += `&team=${teamId}`;
        console.error(`Using team: ${teamId} for search.messages`);
      }
      
      if (count) endpoint += `&count=${count}`;
      if (page) endpoint += `&page=${page}`;
      if (sort) endpoint += `&sort=${sort}`;
      if (sort_dir) endpoint += `&sort_dir=${sort_dir}`;
      
      const data = await makeApiRequest(endpoint, {}, token);
      
      return createResponse(data);
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: isSlackError(error) ? formatSlackError(error) : `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}` 
        }],
        isError: true
      };
    }
  }
);

// サーバー起動
async function main() {
  try {
    // 環境変数を確認してログに出力（デバッグ用）
    const token = process.env.SLACK_BOT_TOKEN;
    const teamId = process.env.SLACK_TEAM_ID;
    console.error(`SLACK_BOT_TOKEN: ${token ? 'Set (starts with ' + token.substring(0, 5) + '...)' : 'Not set'}`);
    console.error(`SLACK_TEAM_ID: ${teamId || 'Not set'}`);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Slack MCP Server running on stdio");
  } catch (error) {
    console.error("Server error:", error instanceof Error ? error.message : JSON.stringify(error));
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
