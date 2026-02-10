export async function encryptData(data) {
  const passphrase = process.env.NEXT_PUBLIC_PASSPHRASE;
  const encoder = new TextEncoder();

  // 1. Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 2. Generate a random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Import the passphrase as a raw key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // 4. Derive the AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 5. Encrypt the data
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(data)
  );

  // 6. Convert buffers to base64 strings for storage
  const toBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  return {
    alg: "AES-GCM+PBKDF2-SHA256",
    iv: toBase64(iv),
    salt: toBase64(salt),
    ciphertext: toBase64(encryptedContent),
  };
}
