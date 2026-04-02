import { Redis } from "@upstash/redis";
import { Lock } from "@upstash/lock";
import {
  type DataStoreValue,
  type SnapDataStore,
  type SnapDataStoreOperations,
  type SnapFunction,
} from "@farcaster/snap";

export type WithUpstashOptions = {
  /** Lock acquisition timeout in milliseconds. */
  lockTimeout?: number;
};

const DEFAULT_LOCK_TIMEOUT = 10_000;
const LOCK_KEY = "snap:lock";

/**
 * Wraps a SnapFunction and injects an Upstash Redis-backed data store into
 * the context.
 */
export function withUpstash(
  snapFn: SnapFunction,
  options?: WithUpstashOptions,
): SnapFunction {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "Upstash env vars are not set. Skipping Upstash data store setup.",
    );
    return snapFn;
  }

  const redis = new Redis({ url, token });
  const lockTimeout = options?.lockTimeout ?? DEFAULT_LOCK_TIMEOUT;

  const ops: SnapDataStoreOperations = {
    async get(key: string): Promise<DataStoreValue | null> {
      return redis.get<DataStoreValue>(key);
    },
    async set(key: string, value: DataStoreValue): Promise<DataStoreValue> {
      return redis.set(key, value);
    },
  };

  const store: SnapDataStore = {
    ...ops,
    async withLock<T>(
      fn: (store: SnapDataStoreOperations) => Promise<T>,
    ): Promise<T> {
      const lock = new Lock({
        id: LOCK_KEY,
        redis,
        lease: lockTimeout,
        retry: {
          attempts: Math.ceil(lockTimeout / 50),
          delay: 50,
        },
      });

      if (!(await lock.acquire())) {
        throw new Error(
          `snap-upstash: failed to acquire lock within ${lockTimeout}ms`,
        );
      }

      let fnError: unknown;
      try {
        return await fn(ops);
      } catch (err) {
        fnError = err;
        throw err;
      } finally {
        try {
          await lock.release();
        } catch (releaseError) {
          if (!fnError) {
            // If the critical section succeeded but releasing the lock failed,
            // propagate the release error.
            throw releaseError;
          }
          // If both the critical section and lock release failed, log the
          // release error and preserve the original error from fn(ops).
          // eslint-disable-next-line no-console
          console.error(
            "snap-upstash: failed to release lock",
            releaseError,
          );
        }
      }
    },
  };

  return (ctx) => snapFn({ ...ctx, data: store });
}
