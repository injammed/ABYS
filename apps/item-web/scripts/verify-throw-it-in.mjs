import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dropPath = path.join(root, "components", "SlopDrop.tsx");
const accountPath = path.join(root, "components", "AccountGate.tsx");
const intentsPath = path.join(root, "lib", "public-intents.ts");
const supabasePath = path.join(root, "lib", "supabase-browser.ts");
const navPath = path.join(root, "components", "PrimaryNavigation.tsx");
const profileBootstrapPath = path.resolve(root, "..", "..", "supabase", "migrations", "018_total_profile_bootstrap.sql");

const [drop, account, intents, supabaseBrowser, nav, profileBootstrap] = await Promise.all([
  readFile(dropPath, "utf8"),
  readFile(accountPath, "utf8"),
  readFile(intentsPath, "utf8"),
  readFile(supabasePath, "utf8"),
  readFile(navPath, "utf8"),
  readFile(profileBootstrapPath, "utf8"),
]);

const failures = [];
const requirePattern = (label, pattern, source) => {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
};
const forbidPattern = (label, pattern, source) => {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
};

requirePattern("ALL SLOP WELCOME", /ALL SLOP WELCOME\./, drop);
requirePattern("simple submit language", /"THROW IT IN"/, drop);
requirePattern("material-first picker", /Add material/, drop);
requirePattern("optional title", /Name it · optional/, drop);
requirePattern("one combined attestation", /AI-made\. I can submit it\. It does not contain prohibited material\./, drop);
requirePattern("collapsed optional detail fold", /<details>[\s\S]*Text, link, provenance & details · optional/, drop);
requirePattern("origin-safe default", /defaultValue="ai_origin_unverified"/, drop);
requirePattern("server RPC remains canonical", /client\.rpc\("create_quarantined_artifact"/, drop);
requirePattern("per-file size guard", /MAX_FILE_BYTES = 50 \* 1024 \* 1024/, drop);
requirePattern("total-size guard", /MAX_TOTAL_BYTES = 100 \* 1024 \* 1024/, drop);
requirePattern("part-count guard", /MAX_PARTS = 12/, drop);
requirePattern("URL protocol fence", /\["http:", "https:"\]/, drop);
requirePattern("rollback on binding failure", /storage\.from\("artifact-media"\)\.remove\(uploadedPaths\)/, drop);
requirePattern("one-click feed landing event", /aetimm:submission-created/, drop);
requirePattern("simple intake mounted", /<SlopDrop \/>/, nav);

// Public intent law: Submit remains one action even when authentication is
// required. Browser storage is an optimization for automatic resume, never a
// prerequisite for opening the actual authentication path.
requirePattern("named Submit intent key", /SUBMIT_INTENT_STORAGE_KEY = "aetimm:intent:submit:v1"/, intents);
requirePattern("named auth-required event", /AUTH_REQUIRED_EVENT = "aetimm:auth-required"/, intents);
requirePattern("safe storage setter catches restriction", /function storageSet[\s\S]*try[\s\S]*storage\.setItem[\s\S]*catch[\s\S]*return false/, intents);
requirePattern("safe Submit intent helper", /function rememberSubmitIntent\(\): boolean[\s\S]*storageSet\(window\.sessionStorage, SUBMIT_INTENT_STORAGE_KEY, "1"\)/, intents);
requirePattern("safe Submit consume helper", /function consumeSubmitIntent\(\): boolean[\s\S]*storageGet\(window\.sessionStorage, SUBMIT_INTENT_STORAGE_KEY\)[\s\S]*storageRemove/, intents);
requirePattern("signed-out Submit uses safe helper", /function requestSubmitAuth\(\)[\s\S]*rememberSubmitIntent\(\)[\s\S]*dispatchEvent\(new Event\(AUTH_REQUIRED_EVENT\)\)/, drop);
requirePattern("Submit auth event fires independent of storage result", /rememberSubmitIntent\(\);[\s\S]*window\.dispatchEvent\(new Event\(AUTH_REQUIRED_EVENT\)\)/, drop);
requirePattern("Submit trigger owns auth bridge", /onClick=\{handleTrigger\}/, drop);
requirePattern("signed-in Submit safely consumes intent", /nextSession && consumeSubmitIntent\(\)[\s\S]*setOpen\(true\)/, drop);
forbidPattern("direct sessionStorage access in Submit surface", /window\.sessionStorage\.(?:getItem|setItem|removeItem)/, drop);
requirePattern("Account listens for required auth", /addEventListener\(AUTH_REQUIRED_EVENT, openForRequiredAuth\)/, account);
requirePattern("required auth mirrors tiny intent cross-tab", /openForRequiredAuth[\s\S]*mirrorPublicAuthIntentsAcrossTabs\(\)/, account);
requirePattern("required auth selects sign-in", /openForRequiredAuth[\s\S]*setMode\("signin"\)/, account);
requirePattern("required auth opens existing account surface", /openForRequiredAuth[\s\S]*setOpen\(true\)/, account);
requirePattern("Account removes auth event listener", /removeEventListener\(AUTH_REQUIRED_EVENT, openForRequiredAuth\)/, account);
requirePattern("OAuth returns to same public root", /redirectTo: `\$\{window\.location\.origin\}\/`/, account);
requirePattern("email confirmation returns to public root", /emailRedirectTo: `\$\{window\.location\.origin\}\/`/, account);

// First-account continuity: confirmation/OAuth may return in another tab. Only
// bounded action intent may cross that tab boundary, and it expires quickly.
requirePattern("cross-tab Submit bridge key", /CROSS_TAB_SUBMIT_INTENT_KEY = "aetimm:auth-bridge:submit:v1"/, intents);
requirePattern("cross-tab Vote bridge key", /CROSS_TAB_VOTE_INTENT_KEY = "aetimm:auth-bridge:vote:v1"/, intents);
requirePattern("cross-tab intent thirty-minute TTL", /PUBLIC_AUTH_INTENT_TTL_MS = 30 \* 60 \* 1000/, intents);
requirePattern("cross-tab envelope hard size cap", /MAX_BRIDGED_INTENT_BYTES = 512/, intents);
requirePattern("bridge reads only existing action intent", /storageGet\(window\.sessionStorage, sessionKey\)/, intents);
requirePattern("bridge writes only envelope value", /IntentEnvelope = \{ createdAt: now, value \}/, intents);
requirePattern("bridge restores before component effects", /if \(typeof window !== "undefined"\) restorePublicAuthIntentsForThisTab\(\)/, intents);
requirePattern("bridge never overwrites newer tab intent", /storageGet\(window\.sessionStorage, sessionKey\) == null/, intents);
requirePattern("stale bridge expires", /now - parsed\.createdAt > PUBLIC_AUTH_INTENT_TTL_MS/, intents);
requirePattern("future-dated bridge rejected", /parsed\.createdAt > now \+ 60_000/, intents);
requirePattern("restricted browser storage fails open", /Restricted browser storage must never block authentication itself/, intents);
requirePattern("successful existing session clears bridge", /if \(data\.session\) clearCrossTabPublicAuthIntents\(\)/, account);
requirePattern("SIGNED_IN clears bridge", /event === "SIGNED_IN"\) clearCrossTabPublicAuthIntents\(\)/, account);
forbidPattern("Artifact payload fields in cross-tab bridge", /selectedFiles|textPart|referenceUrl/, intents);
forbidPattern("Artifact payload persisted in localStorage", /localStorage\.(?:setItem|getItem)\([^)]*(?:artifact|file|textPart|referenceUrl)/i, drop + account);
forbidPattern("Artifact payload persisted in sessionStorage", /sessionStorage\.setItem\([^,]+,\s*(?:selectedFiles|textPart|referenceUrl|JSON\.stringify)/, drop + account);

// First-account simplicity: signup is email + password. Profile identity is
// bootstrapped server-side into the existing 2..40 character contract and can
// be edited later after sign-in.
forbidPattern("signup display-name field", /id="account-display-name"|name="displayName"/, account);
forbidPattern("signup display-name metadata requirement", /data:\s*\{\s*display_name:/, account);
requirePattern("email signup remains explicit", /client\.auth\.signUp\(\{[\s\S]*email,[\s\S]*password,[\s\S]*emailRedirectTo/, account);
requirePattern("signed-in profile remains editable", /name="profileDisplayName"[\s\S]*minLength=\{2\}[\s\S]*maxLength=\{40\}/, account);
requirePattern("total profile bootstrap function", /create or replace function public\.handle_new_user\(\)/, profileBootstrap);
requirePattern("profile bootstrap prefers supplied display name", /raw_user_meta_data ->> 'display_name'/, profileBootstrap);
requirePattern("profile bootstrap accepts OAuth full name", /raw_user_meta_data ->> 'full_name'/, profileBootstrap);
requirePattern("profile bootstrap accepts OAuth name", /raw_user_meta_data ->> 'name'/, profileBootstrap);
requirePattern("profile bootstrap falls back to email local part", /split_part\(coalesce\(new\.email, ''\), '@', 1\)/, profileBootstrap);
requirePattern("profile bootstrap final Creator fallback", /'Creator'/, profileBootstrap);
requirePattern("profile bootstrap clamps maximum", /initial_name := left\(initial_name, 40\)/, profileBootstrap);
requirePattern("profile bootstrap repairs one-character names", /char_length\(initial_name\) < 2[\s\S]*initial_name \|\| '_'/, profileBootstrap);
requirePattern("profile bootstrap search path pinned", /set search_path = public, pg_temp/, profileBootstrap);
requirePattern("profile bootstrap client execution revoked", /revoke all on function public\.handle_new_user\(\)[\s\S]*from public, anon, authenticated/, profileBootstrap);

// Existing-account recovery law: recovery stays inside AccountGate. The user
// supplies the same email field, receives a neutral reset response, returns to
// the root, and the PASSWORD_RECOVERY auth event exposes one new-password form.
requirePattern("controlled recovery email", /const \[authEmail, setAuthEmail\] = useState\(""\)/, account);
requirePattern("forgot password action only on sign-in", /mode === "signin"[\s\S]*aria-label="Forgot password"/, account);
requirePattern("reset request uses Supabase recovery API", /auth\.resetPasswordForEmail\(email,[\s\S]*redirectTo: `\$\{window\.location\.origin\}\/`/, account);
requirePattern("recovery response is account-neutral", /If that email can receive a reset, check it\./, account);
requirePattern("reset catch remains account-neutral", /catch \{[\s\S]*If that email can receive a reset, check it\./, account);
requirePattern("PASSWORD_RECOVERY opens recovery surface", /event === "PASSWORD_RECOVERY"[\s\S]*setRecoveryMode\(true\)[\s\S]*setOpen\(true\)/, account);
requirePattern("recovery surface precedes normal session branch", /if \(recoveryMode\)[\s\S]*if \(session\)/, account);
requirePattern("new password minimum unchanged", /name="newPassword"[\s\S]*minLength=\{8\}[\s\S]*autoComplete="new-password"/, account);
requirePattern("recovered password uses authenticated updateUser", /auth\.updateUser\(\{ password \}\)/, account);
requirePattern("successful recovery returns to account", /setRecoveryMode\(false\)[\s\S]*setOpen\(true\)[\s\S]*Password updated\./, account);
forbidPattern("separate password recovery route", /href="\/.*(?:recover|reset|password)/i, account);

// Auth availability law: never advertise an OAuth provider merely because the
// frontend knows its name. The public Auth service is the source of truth, and
// temporary failure to read that truth gets a bounded recovery window.
requirePattern("live Auth settings endpoint", /\/auth\/v1\/settings/, supabaseBrowser);
requirePattern("browser-safe API key on settings probe", /headers: \{ apikey: browserKey \}/, supabaseBrowser);
requirePattern("provider enablement comes from Auth settings", /settings\.external\?\.\[provider\] === true/, supabaseBrowser);
requirePattern("bounded Auth settings retry schedule", /AUTH_SETTINGS_RETRY_DELAYS_MS = \[0, 350, 1000, 2500\]/, supabaseBrowser);
requirePattern("Auth settings retry loop", /for \(const waitMs of AUTH_SETTINGS_RETRY_DELAYS_MS\)/, supabaseBrowser);
requirePattern("Auth settings transient failures continue", /catch \(error\)[\s\S]*lastError = error;[\s\S]*throw lastError/, supabaseBrowser);
requirePattern("failed capability probe is not cached forever", /socialProviderPromise === request\) socialProviderPromise = null/, supabaseBrowser);
requirePattern("failed capability probe still resolves safely empty", /return new Set<SocialProvider>\(\)/, supabaseBrowser);
requirePattern("Account loads enabled providers", /loadEnabledSocialProviders\(\)/, account);
requirePattern("OAuth call refuses disabled provider", /!enabledSocialProviders\.has\(provider\)/, account);
requirePattern("GitHub button requires live enablement", /\{githubEnabled && \([\s\S]*socialSignIn\("github"\)/, account);
requirePattern("Google button requires live enablement", /\{googleEnabled && \([\s\S]*socialSignIn\("google"\)/, account);
requirePattern("email auth remains available without OAuth", /id="account-email"[\s\S]*id="account-password"[\s\S]*type="submit"/, account);

forbidPattern("required title", /name="title"[^>]*required/, drop);
forbidPattern("required summary", /name="summary"[^>]*required/, drop);
forbidPattern("required provenance", /name="provenance"[^>]*required/, drop);
forbidPattern("required generator", /name="generator"[^>]*required/, drop);
forbidPattern("raw HTML injection", /dangerouslySetInnerHTML/, drop);
forbidPattern("dynamic code execution", /\beval\s*\(|new Function\s*\(/, drop);
forbidPattern("service role browser secret", /service[_-]?role/i, drop + account + supabaseBrowser + nav);
forbidPattern("modality tabs", /image tab|video tab|audio tab|3D tab/i, drop);

if (failures.length > 0) {
  console.error("Throw-it-in simplicity contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Throw-it-in PASS: first-time and returning users have one AccountGate path; password recovery stays on the public root with a neutral request response and one new-password action; Submit/Vote continuity, live OAuth discovery, and Artifact payload isolation remain intact.");
