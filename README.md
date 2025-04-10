# MCPs Collection

A collection of Model Context Protocol (MCP) servers designed to integrate various services and APIs with AI assistants.
This project provides a comprehensive hub of MCP servers that can enhance AI assistants like Claude Desktop, Cursor, GitHub Copilot, and others through the Model Context Protocol.

## Overview

This project implements several MCP servers that provide integration with various services:

- **Brave Search**: Web search and local search functionality using the Brave Search API
- **Filesystem**: File system operations with security restrictions
- **Git**: Git repository management functionality
- **GitHub**: GitHub API integration for repositories, issues, pull requests, and more
- **Shell**: Shell command execution in a controlled environment
- **Figma**: Integration with Figma API for design files
- **Slack**: Slack API integration for messaging and channel information
- **Firecrawl**: Web scraping capabilities
- **Notion**: Notion API integration with markdown conversion for improved readability

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) as the JavaScript/TypeScript runtime
- An AI assistant that supports MCP (e.g., Claude Desktop, Cursor, GitHub Copilot)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mcps-collection.git
   cd mcps-collection
   ```

2. Install dependencies:
   ```
   bun install
   ```

## Configuration

To use these MCP servers with your AI assistant, you need to configure them according to your assistant:

- Claude Desktop:
  1. Open Claude Desktop
  2. Click on the menu bar and select "Settings"
  3. Navigate to the "MCP" section to configure your servers

- Cursor:
  - MCP servers can be configured through Cursor's Settings menu:
    1. Open Cursor Settings
    2. Navigate to "Features > MCP"
    3. Add your server configurations

Here's a complete example of the server configuration:

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\brave-search.ts"
      ],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY"
      }
    },
    "filesystem": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\filesystem.ts",
        "C:\\Users\\<YOUR_USERNAME>"
      ]
    },
    "git": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\git.ts"
      ]
    },
    "github": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\github.ts"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    },
    "shell": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\shell.ts"
      ]
    },
    "figma": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\figma.ts"
      ],
      "env": {
        "FIGMA_ACCESS_TOKEN": "YOUR_FIGMA_TOKEN"
      }
    },
    "slack": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\slack.ts"
      ],
      "env": {
        "SLACK_BOT_TOKEN": "YOUR_SLACK_BOT_TOKEN",
        "SLACK_TEAM_ID": "YOUR_SLACK_TEAM_ID"
      }
    },
    "firecrawl": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\firecrawl.ts"
      ],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_FIRECRAWL_API_KEY"
      }
    },
    "notion": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.bun\\bin\\bun.exe",
      "args": [
        "run",
        "C:\\Users\\<path>\\mcps-collection\\src\\notion.ts"
      ],
      "env": {
        "NOTION_API_KEY": "YOUR_NOTION_API_KEY"
      }
    }
  }
}
```

**Note**: The example above uses Windows path format with backslashes (`\\`).
For macOS or Linux, use forward slashes instead:
```
"command": "/Users/<YOUR_USERNAME>/.bun/bin/bun",
"args": [
  "run",
  "/Users/<path>/mcps-collection/src/brave-search.ts"
]
```

### API Keys and Tokens Setup

For each service integration, you'll need to obtain and configure the appropriate API keys:

1. **Brave Search API**: Sign up at [Brave Search API](https://brave.com/search/api/) to get your API key
2. **GitHub**: Create a [personal access token](https://github.com/settings/tokens) with appropriate permissions
3. **Figma**: Generate an [access token](https://www.figma.com/developers/api#access-tokens) in your Figma account
4. **Slack**: Create a [Slack app](https://api.slack.com/apps) and generate a bot token
5. **Firecrawl**: Sign up for a Firecrawl API key
6. **Notion**: Create an [integration](https://www.notion.so/my-integrations) and get the API key

Replace the placeholder values in the configuration file with your actual API keys and tokens.

## Usage

1. Start your AI assistant
2. Configure the MCP servers according to your assistant's requirements
3. The assistant will now have access to all the integrated services during your conversations

## Feature Details

### Notion Integration

The Notion integration provides:

- Creation, retrieval, updating, and deletion of pages, databases, and blocks
- Search functionality
- Markdown conversion for improved readability
- Database querying capabilities
- Comment functionality

### GitHub Integration

The GitHub integration enables:

- Repository creation, search, and management
- File retrieval, updating, and committing
- Issue and pull request management
- Multiple account support

### File System

Securely access the file system with:

- File reading and writing operations
- Directory operations
- File search capabilities
- File metadata retrieval

### Additional Integrations

- **Brave Search**: Web and local search capabilities
- **Git**: Repository management, commits, branch operations
- **Shell**: Controlled shell command execution
- **Figma**: Design file retrieval and operations
- **Slack**: Message sending and channel information retrieval

## Development

Each MCP server is implemented as a standalone TypeScript file or directory in the `src` folder:

- `src/brave-search.ts`: Brave Search API integration
- `src/filesystem.ts`: File system operations
- `src/git.ts`: Git operations
- `src/github.ts` & `src/github/`: GitHub API integration
- `src/shell.ts`: Shell command execution
- `src/figma.ts`: Figma API integration
- `src/slack.ts`: Slack API integration
- `src/firecrawl.ts`: Web scraping
- `src/notion.ts` & `src/notion/`: Notion API integration

To add new functionality:

1. Create a new TypeScript file in the `src` directory
2. Implement the MCP server using the `@modelcontextprotocol/sdk`
3. Add the new server to your AI assistant's configuration

## Security Considerations

- The filesystem and shell servers include security measures to prevent unauthorized access
- Always validate user input before executing commands
- Be cautious when configuring allowed directories for filesystem access
- Use the command allowlist for the shell server to restrict executable commands
- Store your API keys and tokens securely and follow the principle of least privilege

## References and Acknowledgements

This project is based on the following repositories:

- [ukkz/claude-ts-mcps](https://github.com/ukkz/claude-ts-mcps) - Original implementation of MCP servers collection
- [suekou/mcp-notion-server](https://github.com/suekou/mcp-notion-server) - Reference implementation for Notion MCP server

Additional references:

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Server Quickstart](https://modelcontextprotocol.io/quickstart/server)

## License

[MIT License](LICENSE)