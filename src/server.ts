/**
 * MCP Server implementation
 *
 * Exposes CloudWarriors package documentation via MCP protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import {
  listPackages,
  listPackagesSchema,
  getPackageDetails,
  getPackageSchema,
  searchPackages,
  searchPackagesSchema,
  getPatternDetails,
  getPatternSchema,
} from './tools/index.js';

/**
 * Tool definitions for MCP
 */
const TOOLS: Tool[] = [
  {
    name: 'list_packages',
    description: 'List all available CloudWarriors packages with their descriptions and capabilities',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_package',
    description: 'Get detailed information about a specific CloudWarriors package including install command, usage examples, and configuration options',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The package name (e.g., "@cloudwarriors-ai/rlm" or just "rlm")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_packages',
    description: 'Search CloudWarriors packages by keyword or capability',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (keywords to find in name, description, capabilities)',
        },
        capability: {
          type: 'string',
          description: 'Filter by specific capability (e.g., "llm", "auth", "codebase-analysis")',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_pattern',
    description: 'Get a reusable code pattern with implementation example',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The pattern name (e.g., "circuit-breaker", "repository-pattern")',
        },
      },
      required: ['name'],
    },
  },
];

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'cloudwarriors-docs',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_packages': {
          const result = listPackages();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'get_package': {
          const parsed = getPackageSchema.safeParse(args);
          if (!parsed.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Invalid arguments: ${parsed.error.message}`,
                },
              ],
              isError: true,
            };
          }
          const result = getPackageDetails(parsed.data);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'search_packages': {
          const parsed = searchPackagesSchema.safeParse(args);
          if (!parsed.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Invalid arguments: ${parsed.error.message}`,
                },
              ],
              isError: true,
            };
          }
          const result = searchPackages(parsed.data);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'get_pattern': {
          const parsed = getPatternSchema.safeParse(args);
          if (!parsed.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Invalid arguments: ${parsed.error.message}`,
                },
              ],
              isError: true,
            };
          }
          const result = getPatternDetails(parsed.data);
          return {
            content: [
              {
                type: 'text',
                  text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Run the server with stdio transport
 */
export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
