/**
 * Tests for MCP tools
 */

import { describe, it, expect } from 'vitest';
import {
  listPackages,
  getPackageDetails,
  searchPackages,
  getPatternDetails,
} from '../src/tools/index.js';

describe('list_packages', () => {
  it('should return all packages', () => {
    const result = listPackages();

    expect(result.count).toBeGreaterThan(0);
    expect(result.packages).toBeInstanceOf(Array);
    expect(result.packages[0]).toHaveProperty('name');
    expect(result.packages[0]).toHaveProperty('version');
    expect(result.packages[0]).toHaveProperty('description');
    expect(result.packages[0]).toHaveProperty('capabilities');
  });

  it('should include rlm package', () => {
    const result = listPackages();
    const rlm = result.packages.find(p => p.name === '@cloudwarriors-ai/rlm');

    expect(rlm).toBeDefined();
    expect(rlm?.capabilities).toContain('large-context');
  });
});

describe('get_package', () => {
  it('should return package details for full name', () => {
    const result = getPackageDetails({ name: '@cloudwarriors-ai/rlm' });

    expect(result.found).toBe(true);
    expect(result.package).toBeDefined();
    expect(result.package?.name).toBe('@cloudwarriors-ai/rlm');
    expect(result.package?.quickStart).toBeDefined();
    expect(result.package?.examples).toBeDefined();
  });

  it('should return package details for shorthand name', () => {
    const result = getPackageDetails({ name: 'rlm' });

    expect(result.found).toBe(true);
    expect(result.package?.name).toBe('@cloudwarriors-ai/rlm');
  });

  it('should return error for unknown package', () => {
    const result = getPackageDetails({ name: 'unknown-package' });

    expect(result.found).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should include quick start info', () => {
    const result = getPackageDetails({ name: 'rlm' });

    expect(result.package?.quickStart.import).toContain('createRLM');
    expect(result.package?.quickStart.setup).toContain('apiKey');
    expect(result.package?.quickStart.usage).toContain('query');
  });

  it('should include config options', () => {
    const result = getPackageDetails({ name: 'rlm' });

    expect(result.package?.configOptions).toBeDefined();
    expect(result.package?.configOptions?.length).toBeGreaterThan(0);

    const maxDepth = result.package?.configOptions?.find(
      c => c.name === 'maxRecursionDepth'
    );
    expect(maxDepth).toBeDefined();
    expect(maxDepth?.default).toBe(5);
  });
});

describe('search_packages', () => {
  it('should search by query', () => {
    const result = searchPackages({ query: 'large context' });

    expect(result.count).toBeGreaterThan(0);
    expect(result.results.some(r => r.name.includes('rlm'))).toBe(true);
  });

  it('should search by capability', () => {
    const result = searchPackages({ capability: 'llm' });

    expect(result.count).toBeGreaterThan(0);
    expect(result.matchedPackages).toBeDefined();
  });

  it('should return empty for no matches', () => {
    const result = searchPackages({ query: 'nonexistent-feature-xyz' });

    expect(result.count).toBe(0);
  });

  it('should return empty for no filters', () => {
    const result = searchPackages({});

    expect(result.count).toBe(0);
  });
});

describe('get_pattern', () => {
  it('should return pattern details', () => {
    const result = getPatternDetails({ name: 'circuit-breaker' });

    expect(result.found).toBe(true);
    expect(result.pattern).toBeDefined();
    expect(result.pattern?.name).toBe('circuit-breaker');
    expect(result.pattern?.code).toContain('class CircuitBreaker');
  });

  it('should return error for unknown pattern', () => {
    const result = getPatternDetails({ name: 'unknown-pattern' });

    expect(result.found).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.availablePatterns).toBeDefined();
    expect(result.availablePatterns?.length).toBeGreaterThan(0);
  });

  it('should include all pattern fields', () => {
    const result = getPatternDetails({ name: 'repository-pattern' });

    expect(result.pattern?.description).toBeDefined();
    expect(result.pattern?.useCase).toBeDefined();
    expect(result.pattern?.code).toBeDefined();
  });
});
