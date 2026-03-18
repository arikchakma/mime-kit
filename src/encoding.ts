export function toBytes(input: Uint8Array | ArrayBuffer | string): Uint8Array {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

export function encodeBase64(input: Uint8Array | ArrayBuffer | string): string {
  const bytes = toBytes(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
