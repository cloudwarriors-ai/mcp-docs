/**
 * Domain types for the CloudWarriors MCP documentation server
 */

/**
 * Environment variable requirement
 */
export interface EnvRequirement {
  readonly name: string;
  readonly description?: string;
  readonly required?: boolean;
}

/**
 * Configuration option for a package
 */
export interface ConfigOption {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean';
  readonly default?: string | number | boolean;
  readonly description: string;
  readonly env?: string;
}

/**
 * Code example for a package
 */
export interface CodeExample {
  readonly name: string;
  readonly description?: string;
  readonly code: string;
}

/**
 * Quick start guide for a package
 */
export interface QuickStart {
  readonly import: string;
  readonly setup: string;
  readonly usage: string;
}

/**
 * A CloudWarriors package
 */
export interface Package {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly install: string;
  readonly repository: string;
  readonly capabilities: readonly string[];
  readonly requires?: {
    readonly env?: readonly EnvRequirement[];
    readonly peer?: readonly string[];
  };
  readonly quickStart: QuickStart;
  readonly configOptions?: readonly ConfigOption[];
  readonly examples?: readonly CodeExample[];
  readonly relatedPackages?: readonly string[];
}

/**
 * A reusable code pattern
 */
export interface Pattern {
  readonly name: string;
  readonly description: string;
  readonly useCase: string;
  readonly code: string;
  readonly packages?: readonly string[];
}

/**
 * The complete package registry
 */
export interface Registry {
  readonly packages: Record<string, Package>;
  readonly patterns: Record<string, Pattern>;
}

/**
 * Search result item
 */
export interface SearchResult {
  readonly name: string;
  readonly type: 'package' | 'pattern';
  readonly description: string;
  readonly relevance: number;
}
