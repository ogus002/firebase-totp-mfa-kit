# Checklist de Produção

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <a href="PRODUCTION-CHECKLIST.ko.md">한국어</a> ·
  <a href="PRODUCTION-CHECKLIST.ja.md">日本語</a> ·
  <a href="PRODUCTION-CHECKLIST.zh-CN.md">简体中文</a> ·
  <a href="PRODUCTION-CHECKLIST.es.md">Español</a> ·
  <strong>Português</strong> ·
  <a href="PRODUCTION-CHECKLIST.de.md">Deutsch</a> ·
  <a href="PRODUCTION-CHECKLIST.fr.md">Français</a>
</p>

> Leitura obrigatória antes de implantar firebase-totp-mfa em produção.

Este kit está em estágio alpha (momento do Phase 2 launch). Este checklist é obrigatório antes de ship.

## 1. Verificação de configuração inicial

- [ ] Projeto gcloud correto: `gcloud config get-value project` corresponde ao projeto pretendido
- [ ] `npx firebase-totp-mfa doctor` todos os itens em green
- [ ] Os 6 valores do Firebase Web App config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) em `.env.local` — NÃO commitar no git
- [ ] Pelo menos 1 test user com `emailVerified=true` (a CLI define via admin REST `accounts:update`)
- [ ] `npx firebase-totp-mfa verify` os 5/5 cenários passam na verificação manual
- [ ] `npx firebase-totp-mfa update` (dry-run) confirma que o source local corresponde à versão mais recente do kit

## 2. Gate de Server Enforcement (OBRIGATÓRIO)

⚠️ A guarda do lado client (`<MfaGuard>`) **não é uma fronteira de segurança**. Forçar o seguinte código em server-side — obrigatório:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

Aplicar o snippet de [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) (Express / Cloud Functions / Cloud Run / Next Route Handler) que corresponde ao seu stack.

## 3. Recuperação / Bloqueio

- 10 backup codes (armazenados como hash) → o usuário faz download ou print
- SOP de reset pelo admin — acordo de 2 pessoas (padrão multisig) ou simples `admin.deleteUser` + reconvite
- Detalhes em [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Perda de recovery codes + perda do Authenticator = conta bloqueada permanentemente. UX obrigatório de forçar o download pelo usuário.

## 4. Fronteira de Responsabilidade (Liability)

Este kit é **licença MIT** + **NO WARRANTY**. Reconhecer:

- **shadcn-style source copy** → o código passa ao usuário. A responsabilidade do audit de segurança é do usuário
- **Quando o Firebase API tiver breaking change**, a update do kit pode atrasar. O usuário controla com `firebase-totp-mfa update`
- **Quando um LLM (Claude / Codex) chama este kit**, apenas a CLI determinística faz mutação — as mudanças no ambiente do usuário são responsabilidade do usuário. As 5 "absolute hard rules" de `CLAUDE.md` / `AGENTS.md` são obrigatórias
- **Responsabilidade em breach** — o operador do kit (1 pessoa) NÃO tem responsabilidade legal sobre breaches em produção do usuário. Responsabilidade do usuário

## 5. Política de Suporte + Matriz de Versões

| Versão do Kit | Firebase JS SDK | Firebase Admin SDK | Identity Platform | Estado |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | atual |
| 1.x (planejado) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: resposta best-effort 7-14 dias (1 operador)
- **Issue de segurança**: GitHub Security advisory + compromisso de resposta em 5 dias
- **Suporte comercial prioritário**: serviço `$299 fixed-fee Firebase MFA integration review` (página separada — link no Phase 2 launch)

## 6. Disclaimer "Use Only If"

Usuários adequados para este kit:

- ✅ Usando Firebase Auth com email/password (ou OAuth)
- ✅ Identity Platform já ativado ou decisão de ativar
- ✅ Projeto React em Next.js / Vite / CRA / Expo (Phase 3, condicional)
- ✅ TOTP MFA é suficiente (não esperam Passkey até Phase 5)

Usuários NÃO adequados:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → use o MFA nativo deles
- ❌ Auth customizado (não Firebase) → este kit não se aplica
- ❌ Política de Passkey-only → aguardar Phase 5 ou usar Hanko / Stack Auth etc.

## 7. Declaração de Sustentabilidade

Este kit é mantido por **1 operador**. Risco de abandono tipo **Lucia** (deprecated 2025-03, burn-out após 4 anos de operação) reconhecido:

- **Phase 4 Pro tier launch** = construído apenas após **pedido explícito de no mínimo 3 paying users**. Não construir antes
- **Fork recomendado** — licença MIT. Se a operação parar, os usuários podem se auto-manter
- **Comando `update`** permite controle do usuário mesmo quando sua cópia diverge do upstream. `.firebase-totp-mfa.json` metadata = ponto de controle bilateral

Compromissos SLA do operador:

- Release regular: trimestral ou quando houver issue de segurança crítica
- Resposta: 7-14 dias best-effort
- Aviso prévio de 30 dias se a operação parar (GitHub README + deprecate do npm package)

## Sign-off

O revisor deste production deploy assina após confirmar as 7 seções:

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
