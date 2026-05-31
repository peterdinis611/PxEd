/**
 * Simple LRU cache backed by Map insertion order.
 */
export class LruCache<K, V> {
	private readonly map = new Map<K, V>();
	private readonly maxSize: number;

	constructor(maxSize: number) {
		if (maxSize < 1)
			throw new RangeError("LruCache maxSize must be at least 1");
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		const value = this.map.get(key);
		if (value === undefined) return undefined;
		this.map.delete(key);
		this.map.set(key, value);
		return value;
	}

	set(key: K, value: V): void {
		if (this.map.has(key)) this.map.delete(key);
		this.map.set(key, value);
		while (this.map.size > this.maxSize) {
			const oldest = this.map.keys().next().value as K;
			this.map.delete(oldest);
		}
	}

	has(key: K): boolean {
		return this.map.has(key);
	}

	delete(key: K): boolean {
		return this.map.delete(key);
	}

	clear(): void {
		this.map.clear();
	}

	get size(): number {
		return this.map.size;
	}
}
