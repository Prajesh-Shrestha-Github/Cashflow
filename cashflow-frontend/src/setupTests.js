import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Without Vitest globals, Testing Library does not unmount between tests on its own.
afterEach(cleanup);

// Node 26 defines a global localStorage that is unusable without --localstorage-file and hides jsdom's.
// Tests get a small in-memory Storage instead (real browsers are unaffected).
class MemoryStorage {
  #data = new Map();
  get length() { return this.#data.size; }
  key(i) { return [...this.#data.keys()][i] ?? null; }
  getItem(k) { return this.#data.has(String(k)) ? this.#data.get(String(k)) : null; }
  setItem(k, v) { this.#data.set(String(k), String(v)); }
  removeItem(k) { this.#data.delete(String(k)); }
  clear() { this.#data.clear(); }
}
const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true, writable: true });
}
