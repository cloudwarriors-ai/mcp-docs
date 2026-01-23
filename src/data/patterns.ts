/**
 * Reusable code patterns for CloudWarriors projects
 */

import type { Pattern } from '../domain/types.js';

export const patterns: Record<string, Pattern> = {
  'circuit-breaker': {
    name: 'circuit-breaker',
    description: 'Fault tolerance pattern that prevents cascading failures when external services are unavailable',
    useCase: 'Use when calling external APIs or services that may fail or timeout',
    code: `interface CircuitBreakerOptions {
  failureThreshold: number;  // Failures before opening
  resetTimeout: number;      // Ms before trying again
  requestTimeout: number;    // Ms before timing out request
}

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.options.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.options.requestTimeout)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  isOpen(): boolean {
    return this.state === 'open';
  }
}

// Usage:
const breaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 60000,
  requestTimeout: 5000,
});

const result = await breaker.execute(() => fetch(url));`,
    packages: [],
  },

  'event-emitter': {
    name: 'event-emitter',
    description: 'Type-safe event emitter pattern for decoupled communication',
    useCase: 'Use for pub/sub communication between components without tight coupling',
    code: `type EventMap = Record<string, unknown>;
type EventHandler<T> = (data: T) => void;

class TypedEventEmitter<Events extends EventMap> {
  private handlers = new Map<keyof Events, Set<EventHandler<unknown>>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler<unknown>);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}

// Usage:
interface MyEvents {
  'user:created': { id: string; name: string };
  'user:deleted': { id: string };
}

const emitter = new TypedEventEmitter<MyEvents>();

emitter.on('user:created', (data) => {
  console.log(\`User created: \${data.name}\`);
});

emitter.emit('user:created', { id: '123', name: 'Alice' });`,
    packages: [],
  },

  'result-type': {
    name: 'result-type',
    description: 'Type-safe error handling without exceptions',
    useCase: 'Use instead of try/catch for operations that can fail in expected ways',
    code: `type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage:
interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes('@')) {
    return err({ field: 'email', message: 'Invalid email format' });
  }
  return ok(email.toLowerCase());
}

const result = validateEmail(input);
if (result.success) {
  console.log(\`Valid email: \${result.data}\`);
} else {
  console.log(\`Error in \${result.error.field}: \${result.error.message}\`);
}`,
    packages: [],
  },

  'repository-pattern': {
    name: 'repository-pattern',
    description: 'Abstract data access behind a clean interface',
    useCase: 'Use to decouple business logic from database implementation',
    code: `interface Entity {
  id: string;
}

interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementation example with Drizzle:
class DrizzleUserRepository implements Repository<User> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findAll(filter?: Partial<User>): Promise<User[]> {
    let query = this.db.select().from(users);
    if (filter) {
      // Apply filters...
    }
    return query;
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const id = nanoid();
    await this.db.insert(users).values({ id, ...data });
    return { id, ...data } as User;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.db.update(users).set(data).where(eq(users.id, id));
    return this.findById(id) as Promise<User>;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}`,
    packages: [],
  },

  'service-factory': {
    name: 'service-factory',
    description: 'Factory pattern for creating configured service instances',
    useCase: 'Use when services need complex initialization or multiple configurations',
    code: `interface ServiceConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
}

interface Service {
  query(input: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}

function createService(config: ServiceConfig): Service {
  const { apiKey, timeout = 30000, retries = 3 } = config;

  // Validate config
  if (!apiKey) {
    throw new Error('API key is required');
  }

  // Create internal state
  const client = new ApiClient({ apiKey, timeout });

  // Return service interface
  return {
    async query(input: string): Promise<string> {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          return await client.request(input);
        } catch (error) {
          lastError = error as Error;
          await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
        }
      }

      throw lastError;
    },

    async healthCheck(): Promise<boolean> {
      try {
        await client.ping();
        return true;
      } catch {
        return false;
      }
    },
  };
}

// Usage:
const service = createService({
  apiKey: process.env.API_KEY!,
  timeout: 5000,
});

const result = await service.query('hello');`,
    packages: [],
  },
};
