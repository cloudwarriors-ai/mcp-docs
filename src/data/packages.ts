/**
 * Package definitions for CloudWarriors packages
 *
 * Add new packages here as they are created.
 */

import type { Package } from '../domain/types.js';

export const packages: Record<string, Package> = {
  '@cloudwarriors-ai/rlm': {
    name: '@cloudwarriors-ai/rlm',
    version: '0.1.7',
    description: 'Process massive contexts (10M+ tokens) with recursive LLM decomposition. Enables LLMs to analyze entire codebases, large document collections, and datasets that exceed normal context limits.',
    install: 'npm install @cloudwarriors-ai/rlm',
    repository: 'https://github.com/cloudwarriors-ai/rlm',
    capabilities: [
      'large-context',
      'llm',
      'codebase-analysis',
      'document-analysis',
      'recursive-processing',
      'python-sandbox',
    ],
    requires: {
      env: [
        {
          name: 'OPENROUTER_API_KEY',
          description: 'OpenRouter API key for LLM access',
          required: true,
        },
      ],
    },
    quickStart: {
      import: "import { createRLM } from '@cloudwarriors-ai/rlm';",
      setup: `const rlm = createRLM({
  apiKey: process.env.OPENROUTER_API_KEY,
});`,
      usage: `const result = await rlm.query(
  largeContext,
  'Analyze this codebase for security vulnerabilities'
);

if (result.success) {
  console.log(result.answer);
  console.log(\`Cost: $\${result.usage.costUsd.toFixed(4)}\`);
}`,
    },
    configOptions: [
      {
        name: 'model',
        type: 'string',
        default: 'anthropic/claude-sonnet-4',
        description: 'OpenRouter model to use',
        env: 'RLM_MODEL',
      },
      {
        name: 'maxRecursionDepth',
        type: 'number',
        default: 5,
        description: 'Maximum depth for recursive processing',
        env: 'RLM_MAX_DEPTH',
      },
      {
        name: 'maxCostUsd',
        type: 'number',
        default: 10,
        description: 'Maximum cost in USD before stopping',
        env: 'RLM_MAX_COST_USD',
      },
      {
        name: 'timeoutMs',
        type: 'number',
        default: 300000,
        description: 'Query timeout in milliseconds',
        env: 'RLM_TIMEOUT_SECONDS',
      },
    ],
    examples: [
      {
        name: 'Analyze entire codebase',
        description: 'Read all source files and analyze for issues',
        code: `import { createRLM } from '@cloudwarriors-ai/rlm';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function analyzeCodebase(dir: string) {
  // Gather all source files
  const files = await readdir(dir, { recursive: true });
  const sourceFiles = files.filter(f =>
    f.endsWith('.ts') || f.endsWith('.js')
  );

  // Build context
  let context = '';
  for (const file of sourceFiles) {
    const content = await readFile(join(dir, file), 'utf-8');
    context += \`\\n### \${file}\\n\\\`\\\`\\\`\\n\${content}\\n\\\`\\\`\\\`\\n\`;
  }

  // Analyze
  const rlm = createRLM({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  return rlm.query(context, 'Find security vulnerabilities and code smells');
}`,
      },
      {
        name: 'Custom session storage',
        description: 'Persist RLM sessions to your own database',
        code: `import { createRLM, type ISessionStore, type RLMSession } from '@cloudwarriors-ai/rlm';

class MySessionStore implements ISessionStore {
  async save(session: RLMSession): Promise<void> {
    await db.insert('rlm_sessions', session);
  }

  async load(id: string): Promise<RLMSession | null> {
    return db.findOne('rlm_sessions', { id });
  }

  async update(id: string, patch: Partial<RLMSession>): Promise<void> {
    await db.update('rlm_sessions', { id }, patch);
  }

  async delete(id: string): Promise<void> {
    await db.delete('rlm_sessions', { id });
  }

  async list(filter?: SessionFilter): Promise<readonly RLMSession[]> {
    return db.find('rlm_sessions', filter);
  }
}

const rlm = createRLM({
  apiKey: process.env.OPENROUTER_API_KEY,
  sessionStore: new MySessionStore(),
});`,
      },
    ],
    relatedPackages: [],
  },

  '@cloudwarriors-ai/mcp-docs': {
    name: '@cloudwarriors-ai/mcp-docs',
    version: '0.1.0',
    description: 'MCP server providing documentation and discovery for CloudWarriors packages. Enables Claude to query available packages, get usage examples, and discover tools.',
    install: 'npm install -g @cloudwarriors-ai/mcp-docs',
    repository: 'https://github.com/cloudwarriors-ai/mcp-docs',
    capabilities: [
      'mcp',
      'documentation',
      'package-discovery',
      'code-examples',
    ],
    requires: {},
    quickStart: {
      import: '// No import needed - runs as MCP server',
      setup: `// Add to ~/.claude/settings.json:
{
  "mcpServers": {
    "cloudwarriors": {
      "command": "npx",
      "args": ["@cloudwarriors-ai/mcp-docs"]
    }
  }
}`,
      usage: `// Claude can now use these tools:
// - list_packages: List all available packages
// - get_package: Get details about a specific package
// - search_packages: Search by capability or keyword
// - get_pattern: Get reusable code patterns`,
    },
    examples: [],
    relatedPackages: [],
  },
};
