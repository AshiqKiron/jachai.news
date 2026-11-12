/** ASCII-only weak ETag from arbitrary Unicode (HTTP headers must be ByteString). */
export function weakEtagFromString(raw: string): string {
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `W/"${(hash >>> 0).toString(16)}"`;
}
