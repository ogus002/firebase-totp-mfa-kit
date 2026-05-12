// Cookie-based i18n dictionary for the playground.
// 8 languages: en (default) / ko / ja / zh-CN / es / pt-BR / de / fr.
// All UI strings live here — no hard-coded text in page files.

export const LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'es', 'pt-BR', 'de', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  'zh-CN': '简体中文',
  es: 'Español',
  'pt-BR': 'Português',
  de: 'Deutsch',
  fr: 'Français',
};

export const DEFAULT_LOCALE: Locale = 'en';

export interface Messages {
  home: {
    title: string;
    subtitle: string;
    tryFlowHeading: string;
    signInLink: string;
    demoCreds: string;
    whatThisShows: string;
    feat_enroll: string;
    feat_signin: string;
    feat_recovery: string;
    feat_dashboard: string;
  };
  demoBanner: {
    label: string;
    note: string;
    cta: string;
  };
  langSwitcher: {
    label: string;
  };
  login: {
    title: string;
    email: string;
    password: string;
    continue: string;
    signingIn: string;
    demoLockNote: string;
    mfaTitle: string;
    mfaPrompt: string;
    authenticatorCode: string;
    verify: string;
    verifying: string;
    realModeStub: string;
    wrongCode: string;
  };
  enroll: {
    title: string;
    scanInstr: string;
    manualKey: string;
    manualKeyHelp: string;
    authenticatorCode: string;
    verifyEnable: string;
    verifying: string;
    enabledTitle: string;
    redirecting: string;
    wrongCode: string;
    realModeStub: string;
  };
  dashboard: {
    title: string;
    signedIn: string;
    placeholder: string;
    manageRecovery: string;
    signOutDemo: string;
  };
  recovery: {
    title: string;
    intro: string;
    generate: string;
    shownOnce: string;
    download: string;
    print: string;
  };
}

const en: Messages = {
  home: {
    title: 'firebase-totp-mfa playground',
    subtitle: 'TOTP MFA enrollment + sign-in + recovery flows, in Demo (no Firebase) or Real mode.',
    tryFlowHeading: 'Try the flow',
    signInLink: '→ Sign in',
    demoCreds: 'Demo credentials are pre-filled. Real mode activates when .env.local is configured.',
    whatThisShows: 'What this shows',
    feat_enroll: 'Enrollment with QR code (real RFC 6238 — works with any authenticator app)',
    feat_signin: 'Sign-in MFA prompt',
    feat_recovery: 'Recovery codes (10 one-time codes)',
    feat_dashboard: 'Protected dashboard',
  },
  demoBanner: {
    label: 'Demo Mode',
    note: ' — UI/UX preview. No real authentication. ',
    cta: 'Connect Firebase in 5 min →',
  },
  langSwitcher: {
    label: 'Language',
  },
  login: {
    title: 'Sign in',
    email: 'Email',
    password: 'Password',
    continue: 'Continue',
    signingIn: 'Signing in…',
    demoLockNote: 'Demo credentials are pre-filled and locked. Real input disabled to prevent leaks.',
    mfaTitle: 'Two-factor authentication',
    mfaPrompt: 'Enter the 6-digit code from your authenticator app.',
    authenticatorCode: 'Authenticator code',
    verify: 'Verify',
    verifying: 'Verifying…',
    realModeStub: 'Real mode: fill .env.local with Firebase config to enable.',
    wrongCode: 'Wrong code. Check your authenticator app and try again.',
  },
  enroll: {
    title: 'Set up two-factor authentication',
    scanInstr: 'Scan the QR code with Google Authenticator, 1Password, Authy, or any TOTP app.',
    manualKey: 'Manual setup key',
    manualKeyHelp: "Use this if your authenticator app can't scan the QR code.",
    authenticatorCode: 'Authenticator code',
    verifyEnable: 'Verify & Enable',
    verifying: 'Verifying…',
    enabledTitle: '✓ Two-factor authentication enabled',
    redirecting: 'Redirecting…',
    wrongCode: 'Wrong code. Check your authenticator app and try again.',
    realModeStub: 'Real mode: implement TotpEnroll from registry (see Task 8 dogfood).',
  },
  dashboard: {
    title: 'Dashboard',
    signedIn: '✓ You are signed in with two-factor authentication.',
    placeholder: 'This is a placeholder. Replace with your real protected content.',
    manageRecovery: 'Manage recovery codes →',
    signOutDemo: 'Sign out (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: 'Each code can be used once if you lose access to your authenticator app. Store them somewhere safe.',
    generate: 'Generate 10 recovery codes',
    shownOnce: 'These codes will only be shown once.',
    download: 'Download .txt',
    print: 'Print',
  },
};

const ko: Messages = {
  home: {
    title: 'firebase-totp-mfa 플레이그라운드',
    subtitle: 'TOTP MFA 등록 + 로그인 + 복구 흐름. Demo (Firebase 없이) 또는 Real 모드.',
    tryFlowHeading: '흐름 체험',
    signInLink: '→ 로그인',
    demoCreds: 'Demo credentials 가 미리 채워져 있습니다. .env.local 설정 시 Real 모드 활성.',
    whatThisShows: '본 화면이 보여주는 것',
    feat_enroll: 'QR 코드로 enroll (실 RFC 6238 — 어떤 authenticator 앱과도 호환)',
    feat_signin: '로그인 MFA prompt',
    feat_recovery: 'Recovery codes (10개 일회용 코드)',
    feat_dashboard: 'Protected dashboard',
  },
  demoBanner: {
    label: 'Demo 모드',
    note: ' — UI/UX 미리보기. 실 인증 없음. ',
    cta: '5분 안에 Firebase 연결 →',
  },
  langSwitcher: { label: '언어' },
  login: {
    title: '로그인',
    email: '이메일',
    password: '비밀번호',
    continue: '계속',
    signingIn: '로그인 중…',
    demoLockNote: 'Demo credentials 가 미리 채워져 잠금됩니다. 실 입력 차단 (정보 유출 방지).',
    mfaTitle: '2단계 인증',
    mfaPrompt: 'Authenticator 앱의 6자리 코드를 입력하세요.',
    authenticatorCode: 'Authenticator 코드',
    verify: '확인',
    verifying: '확인 중…',
    realModeStub: 'Real 모드: .env.local 의 Firebase config 를 채워 활성화.',
    wrongCode: '잘못된 코드. Authenticator 앱을 확인하고 다시 시도하세요.',
  },
  enroll: {
    title: '2단계 인증 설정',
    scanInstr: 'Google Authenticator, 1Password, Authy 등 TOTP 앱으로 QR 코드 스캔.',
    manualKey: '수동 설정 키',
    manualKeyHelp: 'Authenticator 앱이 QR 코드를 스캔하지 못할 때 사용.',
    authenticatorCode: 'Authenticator 코드',
    verifyEnable: '확인 후 활성화',
    verifying: '확인 중…',
    enabledTitle: '✓ 2단계 인증 활성화 완료',
    redirecting: '이동 중…',
    wrongCode: '잘못된 코드. Authenticator 앱을 확인하고 다시 시도하세요.',
    realModeStub: 'Real 모드: registry 의 TotpEnroll 구현 (Task 8 dogfood 참조).',
  },
  dashboard: {
    title: '대시보드',
    signedIn: '✓ 2단계 인증으로 로그인 완료.',
    placeholder: '본 화면은 placeholder 입니다. 실 보호 콘텐츠로 교체하세요.',
    manageRecovery: 'Recovery codes 관리 →',
    signOutDemo: '로그아웃 (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: 'Authenticator 앱 접근 불가 시 각 코드는 1회 사용 가능. 안전한 곳에 보관.',
    generate: '10개 recovery 코드 생성',
    shownOnce: '본 코드는 단 1회만 표시됩니다.',
    download: '.txt 다운로드',
    print: '인쇄',
  },
};

const ja: Messages = {
  home: {
    title: 'firebase-totp-mfa playground',
    subtitle: 'TOTP MFA enrollment + sign-in + recovery フロー。Demo (Firebase 不要) または Real モード。',
    tryFlowHeading: 'フローを試す',
    signInLink: '→ サインイン',
    demoCreds: 'Demo credentials は事前入力済み。.env.local を設定すると Real モード起動。',
    whatThisShows: 'この画面で見られるもの',
    feat_enroll: 'QR コードで enrollment (実 RFC 6238 — 任意の authenticator アプリと互換)',
    feat_signin: 'サインイン MFA プロンプト',
    feat_recovery: 'Recovery codes (10 個の one-time コード)',
    feat_dashboard: 'Protected dashboard',
  },
  demoBanner: { label: 'Demo モード', note: ' — UI/UX プレビュー。実認証なし。 ', cta: '5 分で Firebase 接続 →' },
  langSwitcher: { label: '言語' },
  login: {
    title: 'サインイン',
    email: 'メール',
    password: 'パスワード',
    continue: '続行',
    signingIn: 'サインイン中…',
    demoLockNote: 'Demo credentials は事前入力済みでロック。情報漏洩防止のため実入力は無効。',
    mfaTitle: '二要素認証',
    mfaPrompt: 'authenticator アプリの 6 桁コードを入力してください。',
    authenticatorCode: 'Authenticator コード',
    verify: '確認',
    verifying: '確認中…',
    realModeStub: 'Real モード: .env.local に Firebase config を入力して有効化。',
    wrongCode: 'コードが違います。authenticator アプリを確認して再試行してください。',
  },
  enroll: {
    title: '二要素認証のセットアップ',
    scanInstr: 'Google Authenticator、1Password、Authy など TOTP アプリで QR コードをスキャン。',
    manualKey: '手動セットアップキー',
    manualKeyHelp: 'authenticator アプリが QR コードを読めない場合に使用。',
    authenticatorCode: 'Authenticator コード',
    verifyEnable: '確認して有効化',
    verifying: '確認中…',
    enabledTitle: '✓ 二要素認証が有効になりました',
    redirecting: '移動中…',
    wrongCode: 'コードが違います。authenticator アプリを確認してください。',
    realModeStub: 'Real モード: registry の TotpEnroll を実装 (Task 8 dogfood 参照)。',
  },
  dashboard: {
    title: 'ダッシュボード',
    signedIn: '✓ 二要素認証でサインイン完了。',
    placeholder: 'これは placeholder です。実際の保護コンテンツに置き換えてください。',
    manageRecovery: 'Recovery codes 管理 →',
    signOutDemo: 'サインアウト (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: 'authenticator アプリにアクセスできなくなった場合、各コードは 1 回使用可能。安全な場所に保管。',
    generate: '10 個の recovery コード生成',
    shownOnce: 'これらのコードは一度しか表示されません。',
    download: '.txt をダウンロード',
    print: '印刷',
  },
};

const zhCN: Messages = {
  home: {
    title: 'firebase-totp-mfa playground',
    subtitle: 'TOTP MFA enrollment + 登录 + recovery 流程。Demo (无需 Firebase) 或 Real 模式。',
    tryFlowHeading: '体验流程',
    signInLink: '→ 登录',
    demoCreds: 'Demo credentials 已预填。配置 .env.local 后激活 Real 模式。',
    whatThisShows: '本页展示',
    feat_enroll: 'QR 码 enrollment (真实 RFC 6238 — 兼容任意 authenticator app)',
    feat_signin: '登录 MFA prompt',
    feat_recovery: 'Recovery codes (10 个一次性码)',
    feat_dashboard: '受保护 dashboard',
  },
  demoBanner: { label: 'Demo 模式', note: ' — UI/UX 预览。无真实认证。 ', cta: '5 分钟接入 Firebase →' },
  langSwitcher: { label: '语言' },
  login: {
    title: '登录',
    email: '邮箱',
    password: '密码',
    continue: '继续',
    signingIn: '登录中…',
    demoLockNote: 'Demo credentials 已预填并锁定。为防泄漏禁用真实输入。',
    mfaTitle: '两步验证',
    mfaPrompt: '请输入 authenticator app 中的 6 位代码。',
    authenticatorCode: 'Authenticator 代码',
    verify: '验证',
    verifying: '验证中…',
    realModeStub: 'Real 模式: 在 .env.local 填入 Firebase config 以启用。',
    wrongCode: '代码错误。请检查 authenticator app 后重试。',
  },
  enroll: {
    title: '设置两步验证',
    scanInstr: '用 Google Authenticator、1Password、Authy 等 TOTP app 扫描 QR 码。',
    manualKey: '手动设置密钥',
    manualKeyHelp: 'authenticator app 无法扫描 QR 码时使用。',
    authenticatorCode: 'Authenticator 代码',
    verifyEnable: '验证并启用',
    verifying: '验证中…',
    enabledTitle: '✓ 两步验证已启用',
    redirecting: '跳转中…',
    wrongCode: '代码错误。请检查 authenticator app。',
    realModeStub: 'Real 模式: 从 registry 实现 TotpEnroll (见 Task 8 dogfood)。',
  },
  dashboard: {
    title: '仪表板',
    signedIn: '✓ 已通过两步验证登录。',
    placeholder: '此为 placeholder。请替换为真实受保护内容。',
    manageRecovery: '管理 Recovery codes →',
    signOutDemo: '登出 (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: '丢失 authenticator app 时,每个代码可使用 1 次。请妥善保管。',
    generate: '生成 10 个 recovery 代码',
    shownOnce: '这些代码只会显示一次。',
    download: '下载 .txt',
    print: '打印',
  },
};

const es: Messages = {
  home: {
    title: 'firebase-totp-mfa playground',
    subtitle: 'Flujos de enrollment + sign-in + recovery TOTP MFA. Modo Demo (sin Firebase) o Real.',
    tryFlowHeading: 'Prueba el flujo',
    signInLink: '→ Iniciar sesión',
    demoCreds: 'Credenciales Demo prerellenadas. El modo Real se activa al configurar .env.local.',
    whatThisShows: 'Lo que muestra',
    feat_enroll: 'Enrollment con QR (RFC 6238 real — funciona con cualquier app authenticator)',
    feat_signin: 'Prompt MFA de sign-in',
    feat_recovery: 'Recovery codes (10 códigos de un solo uso)',
    feat_dashboard: 'Dashboard protegido',
  },
  demoBanner: { label: 'Modo Demo', note: ' — vista previa UI/UX. Sin autenticación real. ', cta: 'Conectar Firebase en 5 min →' },
  langSwitcher: { label: 'Idioma' },
  login: {
    title: 'Iniciar sesión',
    email: 'Email',
    password: 'Contraseña',
    continue: 'Continuar',
    signingIn: 'Iniciando sesión…',
    demoLockNote: 'Credenciales Demo prerellenadas y bloqueadas. Entrada real deshabilitada para evitar filtraciones.',
    mfaTitle: 'Autenticación de dos factores',
    mfaPrompt: 'Introduce el código de 6 dígitos de tu app authenticator.',
    authenticatorCode: 'Código de Authenticator',
    verify: 'Verificar',
    verifying: 'Verificando…',
    realModeStub: 'Modo Real: rellenar .env.local con la config de Firebase para habilitar.',
    wrongCode: 'Código incorrecto. Revisa tu app authenticator e intenta de nuevo.',
  },
  enroll: {
    title: 'Configurar autenticación de dos factores',
    scanInstr: 'Escanea el QR con Google Authenticator, 1Password, Authy o cualquier app TOTP.',
    manualKey: 'Clave de configuración manual',
    manualKeyHelp: 'Úsala si tu app authenticator no puede escanear el QR.',
    authenticatorCode: 'Código de Authenticator',
    verifyEnable: 'Verificar y activar',
    verifying: 'Verificando…',
    enabledTitle: '✓ Autenticación de dos factores activada',
    redirecting: 'Redirigiendo…',
    wrongCode: 'Código incorrecto. Revisa tu app authenticator.',
    realModeStub: 'Modo Real: implementar TotpEnroll desde el registry (ver Task 8 dogfood).',
  },
  dashboard: {
    title: 'Dashboard',
    signedIn: '✓ Has iniciado sesión con autenticación de dos factores.',
    placeholder: 'Esto es un placeholder. Reemplaza con tu contenido real protegido.',
    manageRecovery: 'Gestionar recovery codes →',
    signOutDemo: 'Cerrar sesión (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: 'Cada código se puede usar una vez si pierdes acceso a tu app authenticator. Guárdalos en lugar seguro.',
    generate: 'Generar 10 recovery codes',
    shownOnce: 'Estos códigos sólo se mostrarán una vez.',
    download: 'Descargar .txt',
    print: 'Imprimir',
  },
};

const ptBR: Messages = {
  home: {
    title: 'firebase-totp-mfa playground',
    subtitle: 'Fluxos de enrollment + sign-in + recovery TOTP MFA. Modo Demo (sem Firebase) ou Real.',
    tryFlowHeading: 'Experimente o fluxo',
    signInLink: '→ Entrar',
    demoCreds: 'Credenciais Demo pré-preenchidas. Modo Real ativa quando .env.local é configurado.',
    whatThisShows: 'O que isto mostra',
    feat_enroll: 'Enrollment com QR (RFC 6238 real — funciona com qualquer app authenticator)',
    feat_signin: 'Prompt MFA de sign-in',
    feat_recovery: 'Recovery codes (10 códigos de uso único)',
    feat_dashboard: 'Dashboard protegido',
  },
  demoBanner: { label: 'Modo Demo', note: ' — preview de UI/UX. Sem autenticação real. ', cta: 'Conectar Firebase em 5 min →' },
  langSwitcher: { label: 'Idioma' },
  login: {
    title: 'Entrar',
    email: 'Email',
    password: 'Senha',
    continue: 'Continuar',
    signingIn: 'Entrando…',
    demoLockNote: 'Credenciais Demo pré-preenchidas e bloqueadas. Entrada real desativada para evitar vazamentos.',
    mfaTitle: 'Autenticação de dois fatores',
    mfaPrompt: 'Digite o código de 6 dígitos do seu app authenticator.',
    authenticatorCode: 'Código do Authenticator',
    verify: 'Verificar',
    verifying: 'Verificando…',
    realModeStub: 'Modo Real: preencha .env.local com a config do Firebase para habilitar.',
    wrongCode: 'Código errado. Verifique seu app authenticator e tente novamente.',
  },
  enroll: {
    title: 'Configurar autenticação de dois fatores',
    scanInstr: 'Escaneie o QR com Google Authenticator, 1Password, Authy ou qualquer app TOTP.',
    manualKey: 'Chave de setup manual',
    manualKeyHelp: 'Use se seu app authenticator não conseguir escanear o QR.',
    authenticatorCode: 'Código do Authenticator',
    verifyEnable: 'Verificar e ativar',
    verifying: 'Verificando…',
    enabledTitle: '✓ Autenticação de dois fatores ativada',
    redirecting: 'Redirecionando…',
    wrongCode: 'Código errado. Verifique seu app authenticator.',
    realModeStub: 'Modo Real: implementar TotpEnroll a partir do registry (ver Task 8 dogfood).',
  },
  dashboard: {
    title: 'Dashboard',
    signedIn: '✓ Você está autenticado com dois fatores.',
    placeholder: 'Isto é um placeholder. Substitua pelo seu conteúdo real protegido.',
    manageRecovery: 'Gerenciar recovery codes →',
    signOutDemo: 'Sair (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: 'Cada código pode ser usado uma vez se você perder acesso ao app authenticator. Guarde em local seguro.',
    generate: 'Gerar 10 recovery codes',
    shownOnce: 'Estes códigos só serão exibidos uma vez.',
    download: 'Baixar .txt',
    print: 'Imprimir',
  },
};

const de: Messages = {
  home: {
    title: 'firebase-totp-mfa Playground',
    subtitle: 'TOTP-MFA-Enrollment + Sign-in + Recovery-Flows. Demo (ohne Firebase) oder Real-Modus.',
    tryFlowHeading: 'Flow ausprobieren',
    signInLink: '→ Anmelden',
    demoCreds: 'Demo-Credentials sind vorausgefüllt. Real-Modus aktiviert sich, wenn .env.local konfiguriert ist.',
    whatThisShows: 'Was hier gezeigt wird',
    feat_enroll: 'Enrollment mit QR-Code (echtes RFC 6238 — funktioniert mit jeder Authenticator-App)',
    feat_signin: 'Sign-in-MFA-Prompt',
    feat_recovery: 'Recovery-Codes (10 Einmalcodes)',
    feat_dashboard: 'Geschütztes Dashboard',
  },
  demoBanner: { label: 'Demo-Modus', note: ' — UI/UX-Vorschau. Keine echte Authentifizierung. ', cta: 'Firebase in 5 Min verbinden →' },
  langSwitcher: { label: 'Sprache' },
  login: {
    title: 'Anmelden',
    email: 'E-Mail',
    password: 'Passwort',
    continue: 'Weiter',
    signingIn: 'Anmeldung läuft…',
    demoLockNote: 'Demo-Credentials sind vorausgefüllt und gesperrt. Echte Eingabe deaktiviert (Leak-Schutz).',
    mfaTitle: 'Zwei-Faktor-Authentifizierung',
    mfaPrompt: 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.',
    authenticatorCode: 'Authenticator-Code',
    verify: 'Bestätigen',
    verifying: 'Bestätigung läuft…',
    realModeStub: 'Real-Modus: .env.local mit Firebase-Config befüllen, um zu aktivieren.',
    wrongCode: 'Falscher Code. Bitte Authenticator-App prüfen und erneut versuchen.',
  },
  enroll: {
    title: 'Zwei-Faktor-Authentifizierung einrichten',
    scanInstr: 'QR-Code mit Google Authenticator, 1Password, Authy oder einer beliebigen TOTP-App scannen.',
    manualKey: 'Manueller Setup-Key',
    manualKeyHelp: 'Verwenden, falls Ihre Authenticator-App den QR-Code nicht lesen kann.',
    authenticatorCode: 'Authenticator-Code',
    verifyEnable: 'Bestätigen und aktivieren',
    verifying: 'Bestätigung läuft…',
    enabledTitle: '✓ Zwei-Faktor-Authentifizierung aktiviert',
    redirecting: 'Weiterleiten…',
    wrongCode: 'Falscher Code. Bitte Authenticator-App prüfen.',
    realModeStub: 'Real-Modus: TotpEnroll aus dem Registry implementieren (siehe Task 8 dogfood).',
  },
  dashboard: {
    title: 'Dashboard',
    signedIn: '✓ Sie sind mit Zwei-Faktor-Authentifizierung angemeldet.',
    placeholder: 'Dies ist ein Platzhalter. Bitte mit echtem geschütztem Inhalt ersetzen.',
    manageRecovery: 'Recovery-Codes verwalten →',
    signOutDemo: 'Abmelden (Demo)',
  },
  recovery: {
    title: 'Recovery-Codes',
    intro: 'Wenn Sie den Zugriff auf die Authenticator-App verlieren, ist jeder Code einmal nutzbar. Sicher aufbewahren.',
    generate: '10 Recovery-Codes generieren',
    shownOnce: 'Diese Codes werden nur einmal angezeigt.',
    download: '.txt herunterladen',
    print: 'Drucken',
  },
};

const fr: Messages = {
  home: {
    title: 'playground firebase-totp-mfa',
    subtitle: 'Flux d\'enrollment + sign-in + recovery TOTP MFA. Mode Demo (sans Firebase) ou Real.',
    tryFlowHeading: 'Essayer le flux',
    signInLink: '→ Se connecter',
    demoCreds: 'Identifiants Demo pré-remplis. Le mode Real s\'active quand .env.local est configuré.',
    whatThisShows: 'Ce que montre cette page',
    feat_enroll: 'Enrollment avec QR (vrai RFC 6238 — fonctionne avec n\'importe quelle app authenticator)',
    feat_signin: 'Prompt MFA de sign-in',
    feat_recovery: 'Recovery codes (10 codes à usage unique)',
    feat_dashboard: 'Dashboard protégé',
  },
  demoBanner: { label: 'Mode Demo', note: ' — aperçu UI/UX. Pas d\'authentification réelle. ', cta: 'Connecter Firebase en 5 min →' },
  langSwitcher: { label: 'Langue' },
  login: {
    title: 'Se connecter',
    email: 'Email',
    password: 'Mot de passe',
    continue: 'Continuer',
    signingIn: 'Connexion en cours…',
    demoLockNote: 'Identifiants Demo pré-remplis et verrouillés. Saisie réelle désactivée (anti-fuite).',
    mfaTitle: 'Authentification à deux facteurs',
    mfaPrompt: 'Entrez le code à 6 chiffres de votre app authenticator.',
    authenticatorCode: 'Code Authenticator',
    verify: 'Vérifier',
    verifying: 'Vérification…',
    realModeStub: 'Mode Real : remplir .env.local avec la config Firebase pour activer.',
    wrongCode: 'Code incorrect. Vérifiez votre app authenticator et réessayez.',
  },
  enroll: {
    title: 'Configurer l\'authentification à deux facteurs',
    scanInstr: 'Scannez le QR avec Google Authenticator, 1Password, Authy ou toute app TOTP.',
    manualKey: 'Clé de configuration manuelle',
    manualKeyHelp: 'Utilisez-la si votre app authenticator ne peut pas scanner le QR.',
    authenticatorCode: 'Code Authenticator',
    verifyEnable: 'Vérifier et activer',
    verifying: 'Vérification…',
    enabledTitle: '✓ Authentification à deux facteurs activée',
    redirecting: 'Redirection…',
    wrongCode: 'Code incorrect. Vérifiez votre app authenticator.',
    realModeStub: 'Mode Real : implémenter TotpEnroll depuis le registry (voir Task 8 dogfood).',
  },
  dashboard: {
    title: 'Tableau de bord',
    signedIn: '✓ Vous êtes connecté avec l\'authentification à deux facteurs.',
    placeholder: 'Ceci est un placeholder. À remplacer par votre contenu protégé réel.',
    manageRecovery: 'Gérer les recovery codes →',
    signOutDemo: 'Se déconnecter (Demo)',
  },
  recovery: {
    title: 'Recovery codes',
    intro: 'Chaque code est utilisable une fois en cas de perte d\'accès à votre app authenticator. À conserver en sécurité.',
    generate: 'Générer 10 recovery codes',
    shownOnce: 'Ces codes ne seront affichés qu\'une seule fois.',
    download: 'Télécharger .txt',
    print: 'Imprimer',
  },
};

export const MESSAGES: Record<Locale, Messages> = {
  en,
  ko,
  ja,
  'zh-CN': zhCN,
  es,
  'pt-BR': ptBR,
  de,
  fr,
};
