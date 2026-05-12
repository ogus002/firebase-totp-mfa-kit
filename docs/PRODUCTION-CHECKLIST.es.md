# Lista de Verificación de Producción

<p align="center">
  <a href="PRODUCTION-CHECKLIST.md">English</a> ·
  <a href="PRODUCTION-CHECKLIST.ko.md">한국어</a> ·
  <a href="PRODUCTION-CHECKLIST.ja.md">日本語</a> ·
  <a href="PRODUCTION-CHECKLIST.zh-CN.md">简体中文</a> ·
  <strong>Español</strong> ·
  <a href="PRODUCTION-CHECKLIST.pt-BR.md">Português</a> ·
  <a href="PRODUCTION-CHECKLIST.de.md">Deutsch</a> ·
  <a href="PRODUCTION-CHECKLIST.fr.md">Français</a>
</p>

> Lectura obligatoria antes de desplegar firebase-totp-mfa en producción.

Este kit está en fase alpha (momento de Phase 2 launch). Esta checklist es obligatoria antes de ship.

## 1. Verificación de configuración previa

- [ ] Proyecto gcloud correcto: `gcloud config get-value project` coincide con el proyecto deseado
- [ ] `npx firebase-totp-mfa doctor` todos los puntos en green
- [ ] Los 6 valores de Firebase Web App config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) en `.env.local` — NO se commitea a git
- [ ] Al menos 1 test user con `emailVerified=true` (la CLI lo establece vía admin REST `accounts:update`)
- [ ] `npx firebase-totp-mfa verify` los 5/5 escenarios pasan verificación manual
- [ ] `npx firebase-totp-mfa update` (dry-run) confirma que el source local coincide con el kit más reciente

## 2. Gate de Server Enforcement (REQUERIDO)

⚠️ La guardia del lado cliente (`<MfaGuard>`) **no es una frontera de seguridad**. Forzar el siguiente código en server-side — obligatorio:

```ts
import { admin } from './firebase-admin';

const decoded = await admin.auth().verifyIdToken(idToken);
if (!decoded.firebase?.sign_in_attributes?.mfa_factor_uid) {
  throw new AppError(403, 'MFA required');
}
```

Aplicar el snippet de [`docs/SERVER-MFA-VERIFY.md`](SERVER-MFA-VERIFY.md) (Express / Cloud Functions / Cloud Run / Next Route Handler) que coincida con tu stack.

## 3. Recuperación / Bloqueo

- 10 backup codes (guardados como hash) → el usuario descarga o imprime
- SOP de reset por admin — acuerdo de 2 personas (patrón multisig) o simplemente `admin.deleteUser` + reinvitación
- Detalles en [`docs/RECOVERY-CODES.md`](RECOVERY-CODES.md)

⚠️ Pérdida de recovery codes + pérdida del Authenticator = cuenta bloqueada permanentemente. UX obligatorio de forzar la descarga al usuario.

## 4. Frontera de Responsabilidad (Liability)

Este kit es **licencia MIT** + **NO WARRANTY**. Reconocer:

- **shadcn-style source copy** → propiedad del código pasa al usuario. La responsabilidad del audit de seguridad es del usuario
- **Cuando Firebase API tenga breaking change**, la update del kit puede retrasarse. El usuario controla con `firebase-totp-mfa update`
- **Cuando un LLM (Claude / Codex) invoca este kit**, sólo la CLI determinista hace mutación — los cambios al entorno del usuario son responsabilidad del usuario. Las 5 "absolute hard rules" de `CLAUDE.md` / `AGENTS.md` son obligatorias
- **Responsabilidad ante breach** — el operador del kit (1 persona) NO tiene responsabilidad legal sobre breaches en producción del usuario. Responsabilidad del usuario

## 5. Política de Soporte + Matriz de Versiones

| Versión del Kit | Firebase JS SDK | Firebase Admin SDK | Identity Platform | Estado |
|---|---|---|---|---|
| 0.x (alpha) | >=10.6 <12 | >=11.6 <13 | TOTP enabled (REST) | actual |
| 1.x (planeado) | >=11 <13 | >=12 <14 | TOTP + Passkey adapter | Phase 5 |

- **GitHub issues**: respuesta best-effort 7-14 días (1 operador)
- **Issue de seguridad**: GitHub Security advisory + compromiso de respuesta en 5 días
- **Soporte comercial prioritario**: servicio `$299 fixed-fee Firebase MFA integration review` (página separada — link en Phase 2 launch)

## 6. Disclaimer "Use Only If"

Usuarios adecuados para este kit:

- ✅ Usando Firebase Auth con email/password (u OAuth)
- ✅ Identity Platform ya activado o decisión de activar
- ✅ Proyecto React en Next.js / Vite / CRA / Expo (Phase 3, condicional)
- ✅ TOTP MFA es suficiente (no esperan Passkey hasta Phase 5)

Usuarios NO adecuados:

- ❌ **Auth.js / NextAuth / Clerk / Supabase / Stack Auth / Better Auth** → usen su MFA nativo
- ❌ Auth custom (no Firebase) → este kit no aplica
- ❌ Política de Passkey-only → esperar Phase 5 o usar Hanko / Stack Auth etc.

## 7. Declaración de Sostenibilidad

Este kit es mantenido por **1 operador**. Riesgo de abandono tipo **Lucia** (deprecated 2025-03, burn-out tras 4 años de operación) reconocido:

- **Phase 4 Pro tier launch** = construido sólo tras **petición explícita de mínimo 3 paying users**. No construir antes
- **Fork recomendado** — licencia MIT. Si la operación se interrumpe, los usuarios pueden auto-mantenerlo
- **El comando `update`** permite control del usuario aunque su copia diverga del upstream. `.firebase-totp-mfa.json` metadata = punto de control bilateral

Compromisos SLA del operador:

- Release regular: trimestral o ante issue de seguridad crítica
- Respuesta: 7-14 días best-effort
- Aviso anticipado de 30 días si la operación se detiene (GitHub README + deprecate del npm package)

## Sign-off

El revisor de este production deploy firma tras confirmar las 7 secciones:

| Checked | Reviewer | Date | Notes |
|---|---|---|---|
| □ |  |  |  |
| □ |  |  |  |

— END —
