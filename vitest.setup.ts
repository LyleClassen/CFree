// When using structuredClone in tests (storage uses it via the store), provide
// a polyfill for environments that don't have it.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj))
}
