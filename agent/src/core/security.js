import crypto from 'crypto';
import * as storage from '../database/storage.js';

export function generateToken() {
  // Gera uma senha/PIN numérico de 6 dígitos para facilitar a digitação
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function verifyToken(token) {
  const savedToken = await storage.get('auth_token');
  return token === savedToken;
}
