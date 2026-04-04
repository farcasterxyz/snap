export type DataStoreValue =
  | string
  | number
  | boolean
  | null
  | DataStoreValue[]
  | { [key: string]: DataStoreValue };

export type SnapDataStore = {
  get(key: string): Promise<DataStoreValue | null>;
  set(key: string, value: DataStoreValue): Promise<void>;
};

export function createDefaultDataStore(): SnapDataStore {
  const err = new Error(
    "Data store is not configured. Use withTursoServerless() from @farcaster/snap-turso or provide a data store implementation.",
  );
  return {
    get(_key: string): Promise<never> {
      return Promise.reject(err);
    },
    set(_key: string, _value: DataStoreValue): Promise<never> {
      return Promise.reject(err);
    },
  };
}

export function createInMemoryDataStore(): SnapDataStore {
  const data = new Map<string, DataStoreValue>();
  return {
    async get(key: string): Promise<DataStoreValue | null> {
      return data.get(key) ?? null;
    },
    async set(key: string, value: DataStoreValue): Promise<void> {
      data.set(key, value);
    },
  };
}
