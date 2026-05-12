// verify command — Phase 1 끝났을 때 검증 시나리오 출력
import pc from 'picocolors';

export async function runVerify(): Promise<number> {
  console.log(pc.bold('firebase-totp-mfa verify — manual verification scenarios'));
  console.log('');
  const scenarios = [
    {
      name: 'Enroll happy path',
      steps: [
        '1. Sign in with email/password',
        '2. Navigate to /<area>/mfa-enroll',
        '3. Scan QR with Authenticator app (or paste manual key)',
        '4. Enter 6-digit code',
        '5. Expect: enrollment success + redirect to dashboard',
      ],
    },
    {
      name: 'Sign-in MFA prompt',
      steps: [
        '1. Sign out',
        '2. Sign in again',
        '3. Expect: MFA stage prompt for 6-digit code',
        '4. Enter correct code',
        '5. Expect: redirect to dashboard',
      ],
    },
    {
      name: 'Wrong code rejection',
      steps: [
        '1. At MFA stage, enter 6 wrong digits',
        '2. Expect: visible error, no redirect, can retry',
      ],
    },
    {
      name: 'Recovery code use',
      steps: [
        '1. At MFA stage, click "Use recovery code"',
        '2. Enter one of the 10 backup codes',
        '3. Expect: success + redirect',
        '4. Re-using the same code: rejected',
      ],
    },
    {
      name: 'Unverified email',
      steps: [
        '1. Create user without email verify',
        '2. Try to enroll',
        '3. Expect: auth/unverified-email error + CTA to verify',
      ],
    },
  ];

  for (const s of scenarios) {
    console.log(pc.cyan(`▸ ${s.name}`));
    for (const step of s.steps) console.log(`  ${step}`);
    console.log('');
  }

  console.log(pc.dim('Detailed troubleshooting: docs/troubleshooting.md'));
  return 0;
}
