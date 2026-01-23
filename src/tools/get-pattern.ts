/**
 * get_pattern tool
 *
 * Gets a reusable code pattern by name.
 */

import { z } from 'zod';
import { getPattern as getPatternFromRegistry, listPatternNames } from '../data/registry.js';
import type { Pattern } from '../domain/types.js';

export const getPatternSchema = z.object({
  name: z.string().describe('The pattern name (e.g., "circuit-breaker", "repository-pattern")'),
});

export type GetPatternInput = z.infer<typeof getPatternSchema>;

export interface GetPatternResult {
  found: boolean;
  pattern?: Pattern;
  availablePatterns?: string[];
  error?: string;
}

/**
 * Get a code pattern by name
 */
export function getPatternDetails(input: GetPatternInput): GetPatternResult {
  const { name } = input;

  const pattern = getPatternFromRegistry(name);

  if (!pattern) {
    const available = listPatternNames();
    return {
      found: false,
      availablePatterns: available,
      error: `Pattern "${name}" not found. Available patterns: ${available.join(', ')}`,
    };
  }

  return {
    found: true,
    pattern,
  };
}
