/**
 * search_packages tool
 *
 * Searches packages and patterns by keyword or capability.
 */

import { z } from 'zod';
import { search, searchByCapability } from '../data/registry.js';
import type { SearchResult, Package } from '../domain/types.js';

export const searchPackagesSchema = z.object({
  query: z.string().optional().describe('Search query (keywords to find in name, description, capabilities)'),
  capability: z.string().optional().describe('Filter by specific capability (e.g., "llm", "auth", "codebase-analysis")'),
});

export type SearchPackagesInput = z.infer<typeof searchPackagesSchema>;

export interface SearchPackagesResult {
  count: number;
  results: SearchResult[];
  matchedPackages?: Array<{
    name: string;
    description: string;
    install: string;
  }>;
}

/**
 * Search packages and patterns
 */
export function searchPackages(input: SearchPackagesInput): SearchPackagesResult {
  const { query, capability } = input;

  // If capability is specified, search by capability
  if (capability) {
    const packages = searchByCapability(capability);
    return {
      count: packages.length,
      results: packages.map(pkg => ({
        name: pkg.name,
        type: 'package' as const,
        description: pkg.description,
        relevance: 1,
      })),
      matchedPackages: packages.map(pkg => ({
        name: pkg.name,
        description: pkg.description,
        install: pkg.install,
      })),
    };
  }

  // If query is specified, do full-text search
  if (query) {
    const results = search(query);
    return {
      count: results.length,
      results,
    };
  }

  // No filters - return empty
  return {
    count: 0,
    results: [],
  };
}
