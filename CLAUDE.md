# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**@cloudwarriors-ai/mcp-docs** - MCP Documentation Server

An MCP (Model Context Protocol) server that provides Claude with documentation and discovery capabilities for all CloudWarriors packages. This allows Claude to know about internal tools at all times during development.

## Architecture

```
src/
├── index.ts                 # Entry point (runs MCP server)
├── server.ts                # MCP server setup and request handling
├── domain/
│   └── types.ts             # Core types (Package, Pattern, etc.)
├── data/
│   ├── registry.ts          # Registry loader and search functions
│   ├── packages.ts          # Package definitions (add new packages here)
│   └── patterns.ts          # Code pattern definitions
└── tools/
    ├── index.ts             # Tool exports
    ├── list-packages.ts     # list_packages tool
    ├── get-package.ts       # get_package tool
    ├── search-packages.ts   # search_packages tool
    └── get-pattern.ts       # get_pattern tool
```

## Commands

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
npm run dev        # Watch mode
npm start          # Run the MCP server
npm test           # Run tests
npm run lint       # Type check
```

## MCP Tools Provided

| Tool | Description |
|------|-------------|
| `list_packages` | List all available packages with summaries |
| `get_package` | Get detailed info about a specific package |
| `search_packages` | Search by keyword or capability |
| `get_pattern` | Get a reusable code pattern |

## Adding a New Package

1. Edit `src/data/packages.ts`
2. Add a new entry following the `Package` interface
3. Include: name, version, description, install command, capabilities, quickStart, examples
4. Rebuild and republish

## Adding a New Pattern

1. Edit `src/data/patterns.ts`
2. Add a new entry following the `Pattern` interface
3. Include: name, description, useCase, code
4. Rebuild and republish

## Key Interfaces

```typescript
interface Package {
  name: string;
  version: string;
  description: string;
  install: string;
  repository: string;
  capabilities: string[];
  requires?: { env?: EnvRequirement[]; peer?: string[] };
  quickStart: { import: string; setup: string; usage: string };
  configOptions?: ConfigOption[];
  examples?: CodeExample[];
}

interface Pattern {
  name: string;
  description: string;
  useCase: string;
  code: string;
}
```

## Testing the Server

Run locally:
```bash
npm run build
node dist/index.js
```

The server communicates via stdio using the MCP protocol.
