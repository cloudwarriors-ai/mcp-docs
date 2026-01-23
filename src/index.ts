#!/usr/bin/env node
/**
 * @cloudwarriors-ai/mcp-docs
 *
 * MCP server providing documentation and discovery for CloudWarriors packages.
 *
 * Usage:
 *   npx @cloudwarriors-ai/mcp-docs
 *
 * Or add to Claude settings:
 *   {
 *     "mcpServers": {
 *       "cloudwarriors": {
 *         "command": "npx",
 *         "args": ["@cloudwarriors-ai/mcp-docs"]
 *       }
 *     }
 *   }
 */

import { runServer } from './server.js';

// Export for programmatic use
export { createServer, runServer } from './server.js';
export * from './domain/types.js';
export * from './data/registry.js';
export * from './tools/index.js';

// Run server if executed directly
runServer().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
