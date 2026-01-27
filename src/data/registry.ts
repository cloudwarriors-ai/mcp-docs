/**
 * Package registry loader
 *
 * Provides access to all packages and patterns.
 * Merges statically-defined packages with dynamically discovered packages from npm.
 *
 * Static packages take precedence (richer documentation), but any new packages
 * discovered from npm are automatically included.
 */

import type { Registry, Package, Pattern, SearchResult } from '../domain/types.js';
import { packages as staticPackages } from './packages.js';
import { patterns } from './patterns.js';
import { discoverPackages, clearCache as clearNpmCache } from './npm-discovery.js';

/**
 * The static registry (patterns only - packages merged dynamically)
 */
const staticRegistry: Pick<Registry, 'patterns'> = {
  patterns,
};

/**
 * In-memory merged package cache
 */
let mergedPackagesCache: Record<string, Package> | null = null;
let lastMergeTime = 0;
const MERGE_CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Get all packages (static + dynamically discovered)
 *
 * Static packages take precedence for richer documentation,
 * but any new packages from npm are automatically included.
 */
export async function getAllPackages(): Promise<Record<string, Package>> {
  const now = Date.now();

  // Use cache if fresh
  if (mergedPackagesCache && now - lastMergeTime < MERGE_CACHE_TTL_MS) {
    return mergedPackagesCache;
  }

  // Discover packages from npm
  const discoveredPackages = await discoverPackages();

  // Merge: static packages override discovered ones (richer docs)
  mergedPackagesCache = {
    ...discoveredPackages,
    ...staticPackages,
  };

  lastMergeTime = now;

  return mergedPackagesCache;
}

/**
 * Get all packages synchronously (uses cache or static only)
 * Use getAllPackages() for dynamic discovery.
 */
export function getAllPackagesSync(): Record<string, Package> {
  if (mergedPackagesCache) {
    return mergedPackagesCache;
  }
  return staticPackages;
}

/**
 * Get the complete registry (async - includes npm discovery)
 */
export async function getRegistry(): Promise<Registry> {
  const packages = await getAllPackages();
  return {
    packages,
    patterns: staticRegistry.patterns,
  };
}

/**
 * Get all package names (async - includes npm discovery)
 */
export async function listPackageNames(): Promise<string[]> {
  const packages = await getAllPackages();
  return Object.keys(packages);
}

/**
 * Get all package names synchronously (cache or static only)
 */
export function listPackageNamesSync(): string[] {
  return Object.keys(getAllPackagesSync());
}

/**
 * Get all pattern names
 */
export function listPatternNames(): string[] {
  return Object.keys(staticRegistry.patterns);
}

/**
 * Get a package by name (async - includes npm discovery)
 */
export async function getPackage(name: string): Promise<Package | null> {
  const packages = await getAllPackages();

  // Try exact match first
  if (packages[name]) {
    return packages[name];
  }

  // Try with @cloudwarriors-ai/ prefix
  const fullName = name.startsWith('@') ? name : `@cloudwarriors-ai/${name}`;
  return packages[fullName] ?? null;
}

/**
 * Get a package synchronously (cache or static only)
 */
export function getPackageSync(name: string): Package | null {
  const packages = getAllPackagesSync();
  if (packages[name]) {
    return packages[name];
  }
  const fullName = name.startsWith('@') ? name : `@cloudwarriors-ai/${name}`;
  return packages[fullName] ?? null;
}

/**
 * Get a pattern by name
 */
export function getPattern(name: string): Pattern | null {
  return staticRegistry.patterns[name] ?? null;
}

/**
 * Search packages and patterns by query (async)
 */
export async function search(query: string): Promise<SearchResult[]> {
  const packages = await getAllPackages();
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  // Search packages
  for (const pkg of Object.values(packages)) {
    const relevance = calculateRelevance(pkg, queryTerms);
    if (relevance > 0) {
      results.push({
        name: pkg.name,
        type: 'package',
        description: pkg.description,
        relevance,
      });
    }
  }

  // Search patterns
  for (const pattern of Object.values(staticRegistry.patterns)) {
    const relevance = calculatePatternRelevance(pattern, queryTerms);
    if (relevance > 0) {
      results.push({
        name: pattern.name,
        type: 'pattern',
        description: pattern.description,
        relevance,
      });
    }
  }

  // Sort by relevance (descending)
  return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Search packages by capability (async)
 */
export async function searchByCapability(capability: string): Promise<Package[]> {
  const packages = await getAllPackages();
  const capLower = capability.toLowerCase();
  return Object.values(packages).filter(pkg =>
    pkg.capabilities.some(cap => cap.toLowerCase().includes(capLower))
  );
}

/**
 * Calculate relevance score for a package
 */
function calculateRelevance(pkg: Package, terms: string[]): number {
  let score = 0;

  for (const term of terms) {
    // Name match (highest weight)
    if (pkg.name.toLowerCase().includes(term)) {
      score += 10;
    }

    // Capability match (high weight)
    for (const cap of pkg.capabilities) {
      if (cap.toLowerCase().includes(term)) {
        score += 5;
      }
    }

    // Description match (medium weight)
    if (pkg.description.toLowerCase().includes(term)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Calculate relevance score for a pattern
 */
function calculatePatternRelevance(pattern: Pattern, terms: string[]): number {
  let score = 0;

  for (const term of terms) {
    // Name match
    if (pattern.name.toLowerCase().includes(term)) {
      score += 10;
    }

    // Description match
    if (pattern.description.toLowerCase().includes(term)) {
      score += 3;
    }

    // Use case match
    if (pattern.useCase.toLowerCase().includes(term)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Clear all caches (useful for testing or forcing refresh)
 */
export function clearAllCaches(): void {
  mergedPackagesCache = null;
  lastMergeTime = 0;
  clearNpmCache();
}

/**
 * Force a refresh of packages from npm
 */
export async function refreshPackages(): Promise<Record<string, Package>> {
  clearAllCaches();
  return getAllPackages();
}

// Legacy exports for backwards compatibility
export const registry = {
  get packages() {
    return getAllPackagesSync();
  },
  patterns: staticRegistry.patterns,
};
