// Random ids made on the device (e.g. so a queued upload keeps the same id across retries).
// React Native has no crypto.randomUUID, so this builds a version-4 UUID itself.
export function newId(): string {
  const c = (globalThis as unknown as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
