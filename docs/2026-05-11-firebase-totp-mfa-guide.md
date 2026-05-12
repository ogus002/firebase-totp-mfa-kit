# Firebase Identity Platform TOTP MFA — 재사용 가이드

> 모든 GCP/Firebase 프로젝트에 동일하게 적용 가능.
> 작성: 2026-05-11 (iUPPITER admin 도입 케이스 기반).

## 1. 적용 가능 환경

- GCP Project 가 있는 모든 환경 (Firebase Project = GCP Project)
- Firebase Auth (email/password 또는 sign-in provider) 활성
- Firebase Identity Platform 활성 (free tier 가능 — 월 50K MAU 무료)
- Firebase JS SDK **v10.6+** (TOTP MFA 지원 시작 버전). v11+ 권장
- 비용: TOTP 자체 무료 (SMS MFA 와 달리 통신비 0). MAU 기준 일정 limit 까지 무료

---

## 2. 사전 조건 — Identity Platform 활성화

### 2-1. 확인
Firebase Console 의 Authentication 페이지 상단:
```
Authentication with Identity Platform   ← 이미 활성
```
보이면 skip. 없으면:

### 2-2. 활성화 절차
1. Firebase Console → Authentication → 상단 알림 "Upgrade to Identity Platform" 클릭
   - 또는 https://console.cloud.google.com/customer-identity?project={PROJECT_ID}
2. **결제 계정 연결 필요** (이미 연결돼 있으면 skip)
3. Upgrade 클릭 — 기존 사용자/세션 영향 없음

활성화 후에도 Spark plan 그대로 사용 가능. 단 일부 enterprise feature 는 pay-as-you-go.

---

## 3. TOTP enable (REST API)

**중요**: Firebase Console + GCP Identity Platform Console 의 GUI 에 **TOTP 토글이 미노출** (2026-05 기준). SMS MFA 만 GUI 표시. TOTP 는 REST API 로 활성화.

### 3-1. PowerShell 명령
```powershell
$PROJECT = 'YOUR-PROJECT-ID'
$TOKEN = gcloud auth print-access-token

# 3-A. 현재 mfa config 조회
$resp = Invoke-RestMethod -Method GET `
  -Uri "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT/config" `
  -Headers @{
    Authorization = "Bearer $TOKEN";
    "X-Goog-User-Project" = $PROJECT
  }
$resp.mfa | ConvertTo-Json -Depth 10

# 3-B. TOTP 활성화
$body = @{
  mfa = @{
    state = "ENABLED"
    providerConfigs = @(
      @{
        state = "ENABLED"
        totpProviderConfig = @{ adjacentIntervals = 5 }
      }
    )
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method PATCH `
  -Uri "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT/config?updateMask=mfa" `
  -Headers @{
    Authorization = "Bearer $TOKEN";
    "X-Goog-User-Project" = $PROJECT;
    "Content-Type" = "application/json"
  } `
  -Body $body
```

`adjacentIntervals=5` 의미: TOTP 6자리 코드가 30초마다 갱신. `5` 는 현재±5 intervals (즉 ±150초) 허용 — 사용자 디바이스 시계 어긋남 대응.

### 3-2. Bash (curl) 동등 명령
```bash
PROJECT='YOUR-PROJECT-ID'
TOKEN=$(gcloud auth print-access-token)

curl -X PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT/config?updateMask=mfa" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Goog-User-Project: $PROJECT" \
  -H "Content-Type: application/json" \
  -d '{
    "mfa": {
      "state": "ENABLED",
      "providerConfigs": [{
        "state": "ENABLED",
        "totpProviderConfig": { "adjacentIntervals": 5 }
      }]
    }
  }'
```

### 3-3. 403 Forbidden 에러 시
- `Authorization` 헤더 외 `X-Goog-User-Project` 헤더 필수
- 토큰 발급한 사용자가 project owner 또는 `roles/identityplatform.admin` 권한 필요

---

## 4. FE 구현 — Firebase JS SDK

### 4-1. 의존성 추가
```bash
npm install qrcode @types/qrcode --save
```

### 4-2. Enrollment 페이지 (`/admin/mfa-enroll/page.tsx` 또는 동등)

```tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
} from 'firebase/auth';
import QRCode from 'qrcode';
import { auth } from '@/lib/firebase';

export default function MfaEnrollPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'loading' | 'qr' | 'verify' | 'done'>('loading');
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) { router.replace('/admin/login'); return; }

        const mfa = multiFactor(user);
        if (mfa.enrolledFactors.some((f) => f.factorId === 'totp')) {
          router.replace('/admin/dashboard');
          return;
        }

        const session = await mfa.getSession();
        const newSecret = await TotpMultiFactorGenerator.generateSecret(session);
        if (cancelled) return;

        setSecret(newSecret);
        setManualKey(newSecret.secretKey);

        const qrUrl = newSecret.generateQrCodeUrl(
          user.email || 'admin',
          'YOUR_APP_NAME Admin'  // 이슈어 이름 — Authenticator 앱에 표시됨
        );
        const dataUrl = await QRCode.toDataURL(qrUrl, { width: 240, margin: 1 });
        if (cancelled) return;

        setQrDataUrl(dataUrl);
        setStage('qr');
      } catch (e: any) {
        if (cancelled) return;
        // ⚠️ enrollment 는 recent login 필요 — stale session 시 처리 (4-6 참조)
        if (e?.code === 'auth/requires-recent-login') {
          try { await auth.signOut(); } catch {}
          router.replace('/admin/login');
          return;
        }
        setError(e?.code || e?.message || 'Failed to start enrollment');
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || !/^\d{6}$/.test(code)) return;
    const user = auth.currentUser;
    if (!user) { router.replace('/admin/login'); return; }
    setBusy(true);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
      await multiFactor(user).enroll(assertion, 'TOTP');
      setStage('done');
      setTimeout(() => router.replace('/admin/dashboard'), 1500);
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') {
        try { await auth.signOut(); } catch {}
        router.replace('/admin/login');
        return;
      }
      setError(e?.code || e?.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {stage === 'loading' && <div>Generating secret…</div>}
      {stage === 'qr' && qrDataUrl && (
        <>
          <img src={qrDataUrl} alt="TOTP QR" />
          <div>Manual key: <code>{manualKey}</code></div>
          <form onSubmit={handleVerify}>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={6} />
            <button type="submit" disabled={busy || code.length !== 6}>Verify & Enable</button>
          </form>
        </>
      )}
      {stage === 'done' && <div>✓ Two-factor authentication enabled.</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
    </div>
  );
}
```

### 4-3. Sign-in MFA 처리 (`/admin/login/page.tsx` 또는 동등)

```tsx
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  MultiFactorError,
  MultiFactorResolver,
} from 'firebase/auth';

const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
const [mfaCode, setMfaCode] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // 1FA OK — MFA 미등록 사용자
    router.replace('/admin/dashboard');
  } catch (e: any) {
    if (e?.code === 'auth/multi-factor-auth-required') {
      // MFA 등록된 사용자 — 6자리 코드 prompt 단계
      const resolver = getMultiFactorResolver(auth, e as MultiFactorError);
      setMfaResolver(resolver);
      // UI 를 mfa-code stage 로 전환
    } else {
      setError(e?.code || 'Login failed');
    }
  }
};

const handleMfaVerify = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!mfaResolver || !/^\d{6}$/.test(mfaCode)) return;
  try {
    const hint = mfaResolver.hints[0]; // 첫 번째 등록된 factor
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, mfaCode);
    await mfaResolver.resolveSignIn(assertion);
    router.replace('/admin/dashboard');
  } catch (e: any) {
    setError('Invalid code — try again');
  }
};
```

### 4-4. Layout 강제 redirect

```tsx
import { multiFactor } from 'firebase/auth';

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.replace('/admin/login');
      return;
    }
    // ... role check ...
    const factors = multiFactor(user).enrolledFactors;
    const hasTotp = factors.some((f) => f.factorId === 'totp');
    if (!hasTotp && pathname !== '/admin/mfa-enroll' && pathname !== '/admin/login') {
      router.replace('/admin/mfa-enroll');
      return;
    }
    // ... authed state ...
  });
  return () => unsub();
}, [router, pathname]);
```

### 4-5. 사용자 안내 (UI 텍스트)

- "**Use Google Authenticator, 1Password, Authy, or any TOTP app**" 명시
- **카메라로 직접 QR 찍지 말고 Authenticator 앱 안의 QR 스캔 기능 사용** 안내
  - 핸드폰 기본 카메라가 `otpauth://` scheme 못 다루면 텍스트로만 표시됨
  - 또는 manual key 수동 입력 옵션 제공

### 4-6. `auth/requires-recent-login` 처리 ⚠️ 중요

Firebase 는 enrollment 같은 sensitive operation 에 **최근 로그인** 요구. 기존 세션 (refresh token 으로 idToken 갱신만 된 stale state) 으로 진입 시 거부.

해결: enrollment 페이지의 try/catch 양쪽에서 `auth/requires-recent-login` 감지 시:
```ts
if (e?.code === 'auth/requires-recent-login') {
  await auth.signOut().catch(() => {});
  router.replace('/admin/login');
  return;
}
```
사용자가 재로그인하면 layout 가 다시 enrollment 페이지로 redirect → 재시도 성공.

---

## 5. BE 측 — 추가 작업 없음 (보통)

Firebase Auth idToken 이 MFA 통과 후 발급된 token 인지 검증은 `admin.auth().verifyIdToken(token)` 의 `decodedToken.firebase.sign_in_attributes.mfa_factor_uid` 등으로 확인 가능. 단 대부분 케이스 — Firebase Auth 자체가 자동 enforce 하므로 BE 추가 코드 불필요.

추가 보안: superadmin endpoint 만 MFA token 강제 요구하려면 middleware 에 다음 추가:
```ts
const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

---

## 6. 카메라로 QR 인식 안 됨 — 정상

`otpauth://` URI 는 표준 스키마지만 일반 핸드폰 카메라 앱은 handler 가 없어 텍스트로만 표시. **Authenticator 앱 안 QR 스캔 기능** 사용 필수.

iOS 18+/Android 의 Google Lens 가 일부 deeplink 지원하나 OS/앱 버전마다 다름 — FE 코드로 control 불가.

---

## 7. 분실 / 복구

현재 가이드는 backup codes 미포함. 추가 구현 권장:

- **Recovery codes**: enrollment 시 10개 일회용 코드 생성 + 사용자에게 다운로드/인쇄
- BE 에 hash 저장 + sign-in 시 코드 입력 fallback
- 또는 **emergency admin reset 절차**: superadmin 2명 합의 시 MFA reset (multisig 패턴)

또는 단순 — admin SDK 로 `auth.deleteUser` + 재초대 흐름.

---

## 8. 검증 체크리스트

- [ ] Identity Platform 활성 (`mfa.state=ENABLED`)
- [ ] REST API config GET 응답에 `providerConfigs[].totpProviderConfig` 있음
- [ ] FE qrcode + @types/qrcode 설치
- [ ] enrollment 페이지 진입 시 QR 표시
- [ ] Authenticator 앱에서 QR 스캔 + 6자리 코드 등록 성공
- [ ] sign out 후 재로그인 → 6자리 코드 prompt
- [ ] 잘못된 코드 입력 → "Invalid code" 표시
- [ ] `auth/requires-recent-login` 발생 시 sign out + 재로그인 자동 흐름
- [ ] BE adminAuthMiddleware 가 MFA 토큰 통과 (보통 자동)

---

## 9. 한계 + 알려진 제약

| 한계 | 비고 |
|---|---|
| Firebase Console GUI 에 TOTP 토글 미노출 | REST API 로만 활성 가능 (2026-05 기준) |
| `auth/requires-recent-login` 잦은 재로그인 | UX 보완 — 자동 sign out + redirect 패턴 적용 |
| 분실 복구 없음 | backup codes 구현 별도 |
| 사용자 카메라 직접 인식 안 됨 | OS handler 부재 — Authenticator 앱 안 스캔 필수 |
| Authenticator 앱 의존 | 사용자가 Google Authenticator / 1Password / Authy / Microsoft Authenticator 등 설치 필요 |
| SMS MFA 와 동시 사용 시 hint 다중 | `resolver.hints` 배열 — 어느 factor 사용할지 사용자 선택 UI 필요 |

---

## 10. 다른 프로젝트 적용 체크리스트

1. [ ] GCP Project ID 확인
2. [ ] Firebase Auth 활성 (email/password 또는 sign-in provider)
3. [ ] Identity Platform 활성 (없으면 Console upgrade)
4. [ ] REST API PATCH 로 TOTP enable (§3)
5. [ ] FE 의존성: `firebase@10.6+`, `qrcode`, `@types/qrcode`
6. [ ] `/admin/mfa-enroll/page.tsx` 생성 (§4-2)
7. [ ] login flow 에 MFA stage 추가 (§4-3)
8. [ ] layout 에 enrollment redirect (§4-4)
9. [ ] UI 안내 (§4-5) — Authenticator 앱 사용 + manual key 옵션
10. [ ] `auth/requires-recent-login` 처리 (§4-6)
11. [ ] (선택) BE middleware MFA 토큰 검증 (§5)
12. [ ] (선택) backup codes / recovery 흐름 (§7)
13. [ ] 검증 체크리스트 (§8)

---

## 11. 참고 자료

- Firebase TOTP MFA: https://firebase.google.com/docs/auth/web/totp-mfa
- Identity Platform: https://cloud.google.com/identity-platform/docs
- Identity Toolkit REST API: https://cloud.google.com/identity-platform/docs/reference/rest
- `TotpMultiFactorGenerator` API: https://firebase.google.com/docs/reference/js/auth.totpmultifactorgenerator
