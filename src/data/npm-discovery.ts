/**
 * Dynamic npm package discovery for @cloudwarriors-ai scope
 *
 * Queries the npm registry to find all packages under the @cloudwarriors-ai
 * organization, enabling automatic discovery of new packages without
 * requiring updates to the static registry.
 */

import type { Package } from '../domain/types.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search';
const SCOPE = '@cloudwarriors-ai';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Known packages to check directly (fallback for new packages not yet in search index)
 * Add new package names here when published - they'll be automatically picked up
 * once the search index updates, but this ensures immediate discovery.
 */
const KNOWN_PACKAGES = [
  '@cloudwarriors-ai/rlm',
  '@cloudwarriors-ai/mcp-docs',
  '@cloudwarriors-ai/openapi-mcp',
];

interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      keywords?: string[];
      links?: {
        npm?: string;
        homepage?: string;
        repository?: string;
      };
    };
  }>;
  total: number;
}

interface NpmPackageMetadata {
  name: string;
  'dist-tags': {
    latest: string;
  };
  versions: Record<string, {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    repository?: { url?: string } | string;
    homepage?: string;
  }>;
}

interface CacheEntry {
  packages: Record<string, Package>;
  timestamp: number;
}

let cache: CacheEntry | null = null;

/**
 * Search npm registry for all @cloudwarriors-ai packages
 */
async function searchNpmPackages(): Promise<NpmSearchResult> {
  // Use @cloudwarriors-ai as the search text to find scoped packages
  const searchUrl = `${NPM_SEARCH_URL}?text=%40cloudwarriors-ai&size=100`;

  const response = await fetch(searchUrl, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`npm search failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as NpmSearchResult;

  // Filter to only packages in the @cloudwarriors-ai scope
  result.objects = result.objects.filter(
    obj => obj.package.name.startsWith('@cloudwarriors-ai/')
  );
  result.total = result.objects.length;

  return result;
}

/**
 * Get detailed metadata for a specific package
 */
async function getPackageMetadata(packageName: string): Promise<NpmPackageMetadata> {
  const response = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${packageName}: ${response.status}`);
  }

  return response.json() as Promise<NpmPackageMetadata>;
}

/**
 * Convert npm package metadata to our Package type
 */
function npmToPackage(metadata: NpmPackageMetadata): Package {
  const latestVersion = metadata['dist-tags'].latest;
  const versionData = metadata.versions[latestVersion];

  // Extract repository URL
  let repository = '';
  if (versionData.repository) {
    if (typeof versionData.repository === 'string') {
      repository = versionData.repository;
    } else if (versionData.repository.url) {
      repository = versionData.repository.url
        .replace(/^git\+/, '')
        .replace(/\.git$/, '');
    }
  }

  // Convert keywords to capabilities
  const capabilities = versionData.keywords ?? [];

  return {
    name: metadata.name,
    version: latestVersion,
    description: versionData.description ?? 'No description available',
    install: `npm install ${metadata.name}`,
    repository,
    capabilities,
    requires: {},
    quickStart: {
      import: `import { /* ... */ } from '${metadata.name}';`,
      setup: '// See package documentation for setup instructions',
      usage: '// See package documentation for usage examples',
    },
    examples: [],
    relatedPackages: [],
  };
}

/**
 * Discover all @cloudwarriors-ai packages from npm
 *
 * Returns a record of package name -> Package for all discovered packages.
 * Results are cached for CACHE_TTL_MS to avoid excessive npm queries.
 *
 * Uses both npm search API and direct package lookups to ensure
 * newly published packages are discovered immediately.
 */
export async function discoverPackages(): Promise<Record<string, Package>> {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.packages;
  }

  try {
    const packages: Record<string, Package> = {};

    // Search for all packages in scope
    const searchResults = await searchNpmPackages();
    const foundNames = new Set(searchResults.objects.map(obj => obj.package.name));

    // Fetch detailed metadata for search results
    const searchMetadataPromises = searchResults.objects.map(async (obj) => {
      try {
        const metadata = await getPackageMetadata(obj.package.name);
        return npmToPackage(metadata);
      } catch (error) {
        // If we can't fetch detailed metadata, use search result data
        console.error(`Failed to fetch metadata for ${obj.package.name}:`, error);
        return {
          name: obj.package.name,
          version: obj.package.version,
          description: obj.package.description ?? 'No description available',
          install: `npm install ${obj.package.name}`,
          repository: obj.package.links?.repository ?? '',
          capabilities: obj.package.keywords ?? [],
          requires: {},
          quickStart: {
            import: `import { /* ... */ } from '${obj.package.name}';`,
            setup: '// See package documentation for setup instructions',
            usage: '// See package documentation for usage examples',
          },
          examples: [],
          relatedPackages: [],
        } as Package;
      }
    });

    // Also check known packages that might not be in search index yet
    const knownPackagePromises = KNOWN_PACKAGES
      .filter(name => !foundNames.has(name))
      .map(async (name) => {
        try {
          const metadata = await getPackageMetadata(name);
          return npmToPackage(metadata);
        } catch {
          // Package doesn't exist or can't be fetched - skip it
          return null;
        }
      });

    const [searchPackages, knownPackages] = await Promise.all([
      Promise.all(searchMetadataPromises),
      Promise.all(knownPackagePromises),
    ]);

    // Add all discovered packages
    for (const pkg of searchPackages) {
      packages[pkg.name] = pkg;
    }

    for (const pkg of knownPackages) {
      if (pkg) {
        packages[pkg.name] = pkg;
      }
    }

    // Update cache
    cache = {
      packages,
      timestamp: Date.now(),
    };

    return packages;
  } catch (error) {
    console.error('Failed to discover packages from npm:', error);

    // Return cached data if available, even if stale
    if (cache) {
      return cache.packages;
    }

    // Return empty if no cache
    return {};
  }
}

/**
 * Clear the discovery cache
 */
export function clearCache(): void {
  cache = null;
}

/**
 * Check if a package exists on npm
 */
export async function packageExists(name: string): Promise<boolean> {
  try {
    const response = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(name)}`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}
