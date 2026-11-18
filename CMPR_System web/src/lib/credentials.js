const ITERATIONS = 120000;
const encoder = new TextEncoder();

const toHex = bytes => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
const fromHex = value => new Uint8Array(value.match(/.{2}/g).map(byte => parseInt(byte, 16)));

export async function hashPassword(password) {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Password hashing is unavailable in this browser.');
  }
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const key = await cryptoApi.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await cryptoApi.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return { passwordSalt: toHex(salt), passwordHash: toHex(result) };
}

export async function verifyPassword(password, account) {
  if (account.passwordHash && account.passwordSalt) {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.subtle) return false;
    const salt = fromHex(account.passwordSalt);
    const key = await cryptoApi.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const result = await cryptoApi.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      key,
      256,
    );
    return toHex(result) === account.passwordHash;
  }
  return typeof account.password === 'string' && account.password === password;
}
