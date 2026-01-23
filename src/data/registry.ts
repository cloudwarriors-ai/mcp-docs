/**
 * Package registry loader
 *
 * Provides access to all packages and patterns.
 */

import type { Registry, Package, Pattern, SearchResult } from '../domain/types.js';
import { packages } from './packages.js';
import { patterns } from './patterns.js';

/**
 * The complete registry
 */
export const registry: Registry = {
  packages,
  patterns,
};

/**
 * Get all package names
 */
export function listPackageNames(): string[] {
  return Object.keys(registry.packages);
}

/**
 * Get all pattern names
 */
export function listPatternNames(): string[] {
  return Object.keys(registry.patterns);
}

/**
 * Get a package by name
 */
export function getPackage(name: string): Package | null {
  return registry.packages[name] ?? null;
}

/**
 * Get a pattern by name
 */
export function getPattern(name: string): Pattern | null {
  return registry.patterns[name] ?? null;
}

/**
 * Search packages and patterns by query
 */
export function search(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  // Search packages
  for (const pkg of Object.values(registry.packages)) {
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
  for (const pattern of Object.values(registry.patterns)) {
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
 * Search packages by capability
 */
export function searchByCapability(capability: string): Package[] {
  const capLower = capability.toLowerCase();
  return Object.values(registry.packages).filter(pkg =>
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
