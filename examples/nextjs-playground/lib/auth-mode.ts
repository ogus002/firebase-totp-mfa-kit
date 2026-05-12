// Demo / Real mode detection — Firebase config 가 비어있으면 Demo.

export type AuthMode = 'demo' | 'real';

export function detectAuthMode(): AuthMode {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId || apiKey === '' || projectId === '') return 'demo';
  return 'real';
}

export const ISSUER = process.env.NEXT_PUBLIC_TOTP_ISSUER || 'PlaygroundApp';
