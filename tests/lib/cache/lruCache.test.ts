import { describe, expect, it } from 'vitest'
import { LruCache } from '@/lib/cache/lruCache'

describe('LruCache', () => {
  it('throws when maxSize is less than 1', () => {
    expect(() => new LruCache(0)).toThrow(RangeError)
  })

  it('stores and retrieves values', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
  })

  it('evicts least recently used entry when over capacity', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a')
    cache.set('c', 3)
    expect(cache.has('b')).toBe(false)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
  })

  it('updates existing keys without growing past maxSize', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10)
    expect(cache.size).toBe(2)
    expect(cache.get('a')).toBe(10)
  })

  it('clears all entries', () => {
    const cache = new LruCache<string, number>(3)
    cache.set('a', 1)
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })
})
