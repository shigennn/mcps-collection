/**
 * Type definitions for Notion API
 */

// Notion Object Types
export type NotionObjectType =
  | "page"
  | "database"
  | "block"
  | "list"
  | "user"
  | "comment";

// Rich Text Item
export type RichTextItemResponse = {
  type: "text" | "mention" | "equation";
  text?: {
    content: string;
    link?: {
      url: string;
    } | null;
  };
  mention?: {
    type:
      | "database"
      | "date"
      | "link_preview"
      | "page"
      | "template_mention"
      | "user";
    [key: string]: any;
  };
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text?: string;
  href?: string | null;
  equation?: {
    expression: string;
  };
};

// Block Types
export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "to_do"
  | "toggle"
  | "child_page"
  | "child_database"
  | "embed"
  | "callout"
  | "quote"
  | "equation"
  | "divider"
  | "table_of_contents"
  | "column"
  | "column_list"
  | "link_preview"
  | "synced_block"
  | "template"
  | "link_to_page"
  | "audio"
  | "bookmark"
  | "breadcrumb"
  | "code"
  | "file"
  | "image"
  | "pdf"
  | "video"
  | "unsupported"
  | string;

// Block Response
export type BlockResponse = {
  object: "block";
  id: string;
  type: BlockType;
  created_time: string;
  last_edited_time: string;
  has_children?: boolean;
  archived?: boolean;
  [key: string]: any;
};

// Page Response
export type PageResponse = {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by?: {
    object: "user";
    id: string;
  };
  last_edited_by?: {
    object: "user";
    id: string;
  };
  cover?: {
    type: string;
    [key: string]: any;
  } | null;
  icon?: {
    type: string;
    [key: string]: any;
  } | null;
  archived?: boolean;
  in_trash?: boolean;
  url?: string;
  public_url?: string;
  parent: {
    type: "database_id" | "page_id" | "workspace";
    database_id?: string;
    page_id?: string;
  };
  properties: Record<string, PageProperty>;
};

// Page Property
export type PageProperty = {
  id: string;
  type: string;
  [key: string]: any;
};

// Database Response
export type DatabaseResponse = {
  object: "database";
  id: string;
  created_time: string;
  last_edited_time: string;
  title: RichTextItemResponse[];
  description?: RichTextItemResponse[];
  url?: string;
  icon?: {
    type: string;
    emoji?: string;
    [key: string]: any;
  } | null;
  cover?: {
    type: string;
    [key: string]: any;
  } | null;
  properties: Record<string, DatabasePropertyConfig>;
  parent?: {
    type: string;
    page_id?: string;
    workspace?: boolean;
  };
  archived?: boolean;
  is_inline?: boolean;
};

// Database Property Config
export type DatabasePropertyConfig = {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
};

// List Response
export type ListResponse = {
  object: "list";
  results: Array<
    | PageResponse
    | DatabaseResponse
    | BlockResponse
    | UserResponse
    | CommentResponse
  >;
  next_cursor: string | null;
  has_more: boolean;
  type?: string;
  page_or_database?: Record<string, any>;
};

// User Response
export type UserResponse = {
  object: "user";
  id: string;
  name?: string;
  avatar_url?: string | null;
  type?: "person" | "bot";
  person?: {
    email: string;
  };
  bot?: Record<string, any>;
};

// Comment Response
export type CommentResponse = {
  object: "comment";
  id: string;
  parent: {
    type: "page_id" | "block_id";
    page_id?: string;
    block_id?: string;
  };
  discussion_id: string;
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: "user";
    id: string;
  };
  rich_text: RichTextItemResponse[];
};

// General Notion Response type
export type NotionResponse =
  | PageResponse
  | DatabaseResponse
  | BlockResponse
  | ListResponse
  | UserResponse
  | CommentResponse;

// Common ID description
export const commonIdDescription =
  "It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-)."

// Format parameter schema
export const formatParameter = {
  type: "string",
  enum: ["json", "markdown"],
  description:
    "Specify the response format. 'json' returns the original data structure, 'markdown' returns a more readable format. Use 'markdown' when the user only needs to read the page and isn't planning to write or modify it. Use 'json' when the user needs to read the page with the intention of writing to or modifying it.",
  default: "markdown",
};

// Rich text object schema
export const richTextObjectSchema = {
  type: "object",
  description: "A rich text object.",
  properties: {
    type: {
      type: "string",
      description:
        "The type of this rich text object. Possible values: text, mention, equation.",
      enum: ["text", "mention", "equation"],
    },
    text: {
      type: "object",
      description:
        "Object containing text content and optional link info. Required if type is 'text'.",
      properties: {
        content: {
          type: "string",
          description: "The actual text content.",
        },
        link: {
          type: "object",
          description: "Optional link object with a 'url' field.",
          properties: {
            url: {
              type: "string",
              description: "The URL the text links to.",
            },
          },
        },
      },
    },
    /* Other properties removed for brevity */
  },
  required: ["type"],
};

// Block object schema
export const blockObjectSchema = {
  type: "object",
  description: "A Notion block object.",
  properties: {
    object: {
      type: "string",
      description: "Should be 'block'.",
      enum: ["block"],
    },
    type: {
      type: "string",
      description:
        "Type of the block. Possible values include 'paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle', 'child_page', 'child_database', 'embed', 'callout', 'quote', 'equation', 'divider', 'table_of_contents', 'column', 'column_list', 'link_preview', 'synced_block', 'template', 'link_to_page', 'audio', 'bookmark', 'breadcrumb', 'code', 'file', 'image', 'pdf', 'video'. Not all types are supported for creation via API.",
    },
    /* Content omitted for brevity */
  },
  required: ["object", "type"],
};