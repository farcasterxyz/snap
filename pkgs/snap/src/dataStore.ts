export type DataStoreValue =
  | string
  | number
  | boolean
  | null
  | DataStoreValue[]
  | { [key: string]: DataStoreValue };

export type SnapDataStoreOperations = {
  get(key: string): Promise<DataStoreValue | null>;
  set(key: string, value: DataStoreValue): Promise<void>;
};

export type SnapDataStore = SnapDataStoreOperations & {
  withLock<T>(fn: (store: SnapDataStoreOperations) => Promise<T>): Promise<T>;
};

export function createDefaultDataStore(): SnapDataStore {
  const err = new Error(
    "Data store is not configured. Use withUpstash() from @farcaster/snap-upstash or provide a data store implementation.",
  );
  return {
    get(_key: string): Promise<never> {
      return Promise.reject(err);
    },
    set(_key: string, _value: DataStoreValue): Promise<never> {
      return Promise.reject(err);
    },
    withLock<T>(
      _fn: (store: SnapDataStoreOperations) => Promise<T>,
    ): Promise<never> {
      return Promise.reject(err);
    },
  };
}

export function createInMemoryDataStore(): SnapDataStore {
  const data = new Map<string, DataStoreValue>();
  const ops: SnapDataStoreOperations = {
    get: async (key: string): Promise<DataStoreValue | null> => {
      return data.get(key) ?? null;
    },
    set: async (key: string, value: DataStoreValue): Promise<void> => {
      data.set(key, value);
    },
  };
  /** Serializes `withLock` callbacks so async work does not interleave across callers. */
  let lockChain: Promise<unknown> = Promise.resolve();
  return {
    ...ops,
    withLock<T>(
      fn: (store: SnapDataStoreOperations) => Promise<T>,
    ): Promise<T> {
      const run = lockChain.then(() => fn(ops));
      lockChain = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
}
