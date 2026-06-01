import type { FaqItem } from './types';

export const FAQ: FaqItem[] = [
  {
    id: 'setup',
    q: 'How do I add Firebase TOTP MFA to my Next.js app?',
    a: 'Run one command — it copies the source into your project and wires the route:\n\nnpx firebase-totp-mfa add next --area /admin --issuer "MyApp"\n\nThen enable Identity Platform: npx firebase-totp-mfa enable --project YOUR-PROJECT-ID. Full guide: /firebase-totp-mfa-setup',
  },
  {
    id: 'sms-vs-totp',
    q: 'TOTP vs SMS — which should I use?',
    a: 'TOTP (authenticator app codes) has no per-message cost and no SIM-swap risk. Firebase Identity Platform supports TOTP MFA on the free Spark plan up to 3,000 DAU. SMS MFA costs per message and is weaker. This kit wires TOTP.',
  },
  {
    id: 'recovery',
    q: 'What about recovery codes if a user loses their phone?',
    a: 'The kit ships recovery codes in Phase 1 (not an afterthought). Users get one-time backup codes at enrollment and can sign in with one if they lose their authenticator. Try the live flow at /demo.',
  },
  {
    id: 'cost',
    q: 'How much does this cost to run?',
    a: 'Firebase Identity Platform TOTP MFA is free on the Spark plan up to 3,000 daily active users. The kit itself is open source (MIT). You only pay Firebase if you exceed the free tier.',
  },
  {
    id: 'own-code',
    q: 'Do I own the code, or is it a runtime dependency?',
    a: 'You own it. shadcn-style — the CLI copies source files into your repo. No magical runtime package; you can read, debug, audit, and customize everything.',
  },
  {
    id: 'help',
    q: 'I need help integrating this into my app',
    a: 'Use "Request help / quote" below — describe your setup and we will follow up. Note: this assistant explains concepts and points to CLI commands; it never writes auth code for you (that is the whole point of the kit).',
  },
];
