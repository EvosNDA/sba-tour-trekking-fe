type QueryKey = string | readonly unknown[];

interface QueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;
}

class SimpleQueryClient {
  private cache = new Map<string, { data: any; timestamp: number }>();

  private serializeKey(key: QueryKey): string {
    return Array.isArray(key) ? JSON.stringify(key) : String(key);
  }

  async fetchQuery<T>({ queryKey, queryFn, staleTime = 60000 }: QueryOptions<T>): Promise<T> {
    const key = this.serializeKey(queryKey);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data as T;
    }

    const data = await queryFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidateQueries(queryKey?: QueryKey): void {
    if (!queryKey) {
      this.cache.clear();
      return;
    }
    const key = this.serializeKey(queryKey);
    this.cache.delete(key);
  }
}

export const queryClient = new SimpleQueryClient();
