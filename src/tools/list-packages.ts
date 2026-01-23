/**
 * list_packages tool
 *
 * Lists all available CloudWarriors packages.
 */

import { z } from 'zod';
import { listPackageNames, getPackage } from '../data/registry.js';

export const listPackagesSchema = z.object({});

export type ListPackagesInput = z.infer<typeof listPackagesSchema>;

export interface PackageSummary {
  name: string;
  version: string;
  description: string;
  capabilities: readonly string[];
}

export interface ListPackagesResult {
  count: number;
  packages: PackageSummary[];
}

/**
 * List all available packages with summary info
 */
export function listPackages(): ListPackagesResult {
  const names = listPackageNames();
  const packages: PackageSummary[] = [];

  for (const name of names) {
    const pkg = getPackage(name);
    if (pkg) {
      packages.push({
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        capabilities: pkg.capabilities,
      });
    }
  }

  return {
    count: packages.length,
    packages,
  };
}
