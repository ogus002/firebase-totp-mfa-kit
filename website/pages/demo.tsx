import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Stepper from '../components/demo/Stepper';
import EnrollStep from '../components/demo/EnrollStep';
import ChallengeStep from '../components/demo/ChallengeStep';
import DoneStep from '../components/demo/DoneStep';
import { createSecret } from '../lib/demo-totp';

type Step = 'enroll' | 'challenge' | 'done';

export default function DemoPage() {
  const [step, setStep] = useState<Step>('enroll');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [usedRecovery, setUsedRecovery] = useState<string[]>([]);

  useEffect(() => {
    setSecret(createSecret());
  }, []);

  const restart = () => {
    setSecret(createSecret());
    setRecoveryCodes([]);
    setUsedRecovery([]);
    setStep('enroll');
  };

  return (
    <Layout
      title="Live Firebase TOTP MFA demo — try it in your browser"
      description="Experience the full TOTP 2FA flow — scan a real QR code, verify, and use recovery codes. 100% client-side, no account needed."
    >
      <div className="mb-6 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded px-4 py-2">
        Demo — no real account or Firebase. This is the exact UX the CLI installs into your app.
      </div>
      <h1 className="text-3xl font-bold mb-2">Live TOTP MFA demo</h1>
      <p className="text-slate-600 mb-6">
        Real RFC-6238 TOTP. Scan the QR with your authenticator app and the codes genuinely verify.
      </p>
      {!secret ? (
        <p className="text-slate-500">Loading demo…</p>
      ) : (
        <>
          <Stepper current={step} />
          {step === 'enroll' && (
            <EnrollStep
              secret={secret}
              onContinue={(codes) => {
                setRecoveryCodes(codes);
                setStep('challenge');
              }}
            />
          )}
          {step === 'challenge' && (
            <ChallengeStep
              secret={secret}
              recoveryCodes={recoveryCodes}
              usedRecovery={usedRecovery}
              onPassed={(usedCode) => {
                if (usedCode) setUsedRecovery((u) => [...u, usedCode]);
                setStep('done');
              }}
            />
          )}
          {step === 'done' && <DoneStep onRestart={restart} />}
        </>
      )}
    </Layout>
  );
}
