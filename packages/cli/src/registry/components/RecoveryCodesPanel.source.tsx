// RecoveryCodesPanel — 10개 recovery code 생성 / 표시 / 다운로드 / 인쇄
// 보안: freshCodes 는 generate 직후 한 번만 표시. clear() 시 즉시 메모리 폐기.

'use client';

import { en, type MfaTexts } from '../lib/i18n';
import type { useRecoveryCodes } from '../hooks/useRecoveryCodes';
import './totp.css';

export type RecoveryCodesController = ReturnType<typeof useRecoveryCodes>;

export interface RecoveryCodesPanelProps {
  controller: RecoveryCodesController;
  texts?: Partial<MfaTexts['recovery']>;
  filenameStem?: string; // default 'recovery-codes'
  className?: string;
}

export function RecoveryCodesPanel(props: RecoveryCodesPanelProps): JSX.Element {
  const t = { ...en.recovery, ...(props.texts ?? {}) };
  const { freshCodes, remaining, loading, error, generate, clear } = props.controller;

  const downloadAsTxt = (): void => {
    if (!freshCodes) return;
    const filename = `${props.filenameStem ?? 'recovery-codes'}.txt`;
    const body = [
      `Recovery codes — generated ${new Date().toISOString()}`,
      '',
      ...freshCodes,
      '',
      'Each code can be used once. Keep them somewhere safe.',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const printCodes = (): void => {
    if (!freshCodes) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Recovery codes</title></head><body>
      <h1>Recovery codes</h1>
      <pre style="font-family:monospace;font-size:14pt;line-height:2">${freshCodes.join('\n')}</pre>
      <p>Each code can be used once. Keep them somewhere safe.</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className={`totp-card ${props.className ?? ''}`} role="region" aria-label={t.title}>
      <h2 className="totp-title">{t.title}</h2>
      <p className="totp-description">{t.description}</p>

      {remaining !== null && remaining > 0 && !freshCodes && (
        <p className="totp-info">{remaining} code(s) remaining.</p>
      )}

      {!freshCodes && (
        <button
          type="button"
          onClick={() => generate(10)}
          disabled={loading}
          className="totp-button-primary"
        >
          {remaining && remaining > 0 ? t.regenerate : t.generate}
        </button>
      )}

      {freshCodes && (
        <>
          <p className="totp-warning" role="alert">
            {t.warning}
          </p>
          <ul className="totp-recovery-list" aria-label={t.title}>
            {freshCodes.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
          <div className="totp-button-row">
            <button type="button" onClick={downloadAsTxt} className="totp-button-secondary">
              {t.download}
            </button>
            <button type="button" onClick={printCodes} className="totp-button-secondary">
              {t.print}
            </button>
            <button type="button" onClick={clear} className="totp-button-link">
              I've saved them
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="totp-error" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  );
}
