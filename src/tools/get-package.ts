/**
 * get_package tool
 *
 * Gets detailed information about a specific package.
 */

import { z } from 'zod';
import { getPackage as getPackageFromRegistry } from '../data/registry.js';
import type { Package } from '../domain/types.js';

export const getPackageSchema = z.object({
  name: z.string().describe('The package name (e.g., "@cloudwarriors-ai/rlm" or just "rlm")'),
});

export type GetPackageInput = z.infer<typeof getPackageSchema>;

export interface GetPackageResult {
  found: boolean;
  package?: Package;
  error?: string;
}

/**
 * Get detailed information about a package
 */
export function getPackageDetails(input: GetPackageInput): GetPackageResult {
  let { name } = input;

  // Handle shorthand names (e.g., "rlm" -> "@cloudwarriors-ai/rlm")
  if (!name.startsWith('@')) {
    name = `@cloudwarriors-ai/${name}`;
  }

  const pkg = getPackageFromRegistry(name);

  if (!pkg) {
    return {
      found: false,
      error: `Package "${name}" not found. Use list_packages to see available packages.`,
    };
  }

  return {
    found: true,
    package: pkg,
  };
}
