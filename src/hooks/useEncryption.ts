import { useCallback } from 'react';

// Utility to convert ArrayBuffer to Base64 string for storage
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Utility to convert Base64 string back to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useEncryption = () => {
  // 1. Generate a brand new Master Key (Do this once on account creation)
  const generateMasterKey = useCallback(async (): Promise<CryptoKey> => {
    return await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }, []);

  // Derive a wrapping key from password + salt using PBKDF2
  const deriveWrappingKey = useCallback(
    async (password: string, salt: ArrayBuffer, iterations = 250_000) => {
      const pwUtf8 = new TextEncoder().encode(password);
      const baseKey = await window.crypto.subtle.importKey('raw', pwUtf8, 'PBKDF2', false, ['deriveKey']);

      return await window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    },
    []
  );

  // Wrap (encrypt) the master key with password-derived key
  const wrapMasterKey = useCallback(
    async (masterKey: CryptoKey, password: string) => {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const wrappingKey = await deriveWrappingKey(password, salt.buffer);

      const rawMaster = await window.crypto.subtle.exportKey('raw', masterKey);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const wrapped = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawMaster);

      return {
        cipher_text: arrayBufferToBase64(wrapped),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer),
        version: 'v1',
      };
    },
    [deriveWrappingKey]
  );

  // Unwrap (decrypt) the master key with password-derived key
  const unwrapMasterKey = useCallback(
    async (wrapped: { cipher_text: string; iv: string; salt: string }, password: string) => {
      const saltBuf = base64ToArrayBuffer(wrapped.salt);
      const wrappingKey = await deriveWrappingKey(password, saltBuf);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(base64ToArrayBuffer(wrapped.iv)) },
        wrappingKey,
        base64ToArrayBuffer(wrapped.cipher_text)
      );

      return await window.crypto.subtle.importKey('raw', decrypted, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    },
    [deriveWrappingKey]
  );

  // 2. Encrypt Data (Client -> Server)
  const encryptData = useCallback(async (plainText: string, key: CryptoKey) => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    // Generate a random IV (Initialization Vector) - vital for security
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encodedData);

    return {
      cipher_text: arrayBufferToBase64(encryptedContent),
      iv: arrayBufferToBase64(iv.buffer),
      version: 'v1',
    };
  }, []);

  // 3. Decrypt Data (Server -> Client)
  const decryptData = useCallback(async (blob: { cipher_text: string; iv: string }, key: CryptoKey) => {
    try {
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(base64ToArrayBuffer(blob.iv)) },
        key,
        base64ToArrayBuffer(blob.cipher_text)
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedContent);
    } catch (e) {
      // Keep minimal error surface in hook
      console.error('Decryption Failed:', e);
      return '[[Encrypted Data - Key Missing]]';
    }
  }, []);

  const exportMasterKeyBase64 = useCallback(async (masterKey: CryptoKey) => {
    const raw = await window.crypto.subtle.exportKey('raw', masterKey);
    return arrayBufferToBase64(raw);
  }, []);

  const importMasterKeyFromBase64 = useCallback(async (b64: string) => {
    const raw = base64ToArrayBuffer(b64);
    return await window.crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }, []);

  return { generateMasterKey, wrapMasterKey, unwrapMasterKey, encryptData, decryptData, exportMasterKeyBase64, importMasterKeyFromBase64 };
};
