# @cloudwarriors-ai/mcp-docs

MCP server that provides documentation and discovery for CloudWarriors packages. Enables Claude to query available packages, get usage examples, and discover tools at any time.

## What This Does

When you're working with Claude, it can use this MCP server to:

- **Discover packages** - "What packages do we have for handling large contexts?"
- **Get usage info** - "How do I use @cloudwarriors-ai/rlm?"
- **Find code patterns** - "Show me the circuit breaker pattern"

Claude gets instant access to your organization's internal tooling knowledge.

## Installation

Add to your Claude settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "cloudwarriors": {
      "command": "npx",
      "args": ["@cloudwarriors-ai/mcp-docs"]
    }
  }
}
```

Or install globally:

```bash
npm install -g @cloudwarriors-ai/mcp-docs
```

## Available Tools

### list_packages

Lists all available CloudWarriors packages.

```
Claude: [calls list_packages]
→ Returns list of packages with descriptions and capabilities
```

### get_package

Gets detailed info about a specific package.

```
Claude: [calls get_package { name: "rlm" }]
→ Returns install command, quick start, examples, config options
```

### search_packages

Searches packages by keyword or capability.

```
Claude: [calls search_packages { capability: "llm" }]
→ Returns packages that work with LLMs
```

### get_pattern

Gets a reusable code pattern.

```
Claude: [calls get_pattern { name: "circuit-breaker" }]
→ Returns pattern description and implementation code
```

## Adding New Packages

Edit `src/data/packages.ts` to add new package definitions:

```typescript
export const packages: Record<string, Package> = {
  '@cloudwarriors-ai/your-package': {
    name: '@cloudwarriors-ai/your-package',
    version: '1.0.0',
    description: 'What it does',
    install: 'npm install @cloudwarriors-ai/your-package',
    repository: 'https://github.com/cloudwarriors-ai/your-package',
    capabilities: ['capability1', 'capability2'],
    quickStart: {
      import: "import { thing } from '@cloudwarriors-ai/your-package';",
      setup: 'const instance = createThing();',
      usage: 'await instance.doSomething();',
    },
    // ... more fields
  },
};
```

## Adding New Patterns

Edit `src/data/patterns.ts`:

```typescript
export const patterns: Record<string, Pattern> = {
  'your-pattern': {
    name: 'your-pattern',
    description: 'What problem it solves',
    useCase: 'When to use it',
    code: `// Implementation here`,
  },
};
```

## Development

```bash
npm install
npm run build
npm start        # Run the MCP server
npm test         # Run tests
```

## License

MIT
