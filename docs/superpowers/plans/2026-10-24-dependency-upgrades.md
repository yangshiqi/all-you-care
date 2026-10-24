# October 2026 Dependency Upgrade Plan

**Goal:** Upgrade compatible dependencies and address npm audit findings in the frontend and pipeline.

**Architecture:** Keep the two independent npm manifests and lockfiles. Update within existing major versions except React minor releases and security-driven Nodemailer/Zod migrations. Preserve existing business behavior and validate against existing checks.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Node.js 22 in pipeline CI, Vitest 4.

## Constraints

- Leave existing untracked user files untouched.
- Do not deploy, send emails, or run live pipeline jobs.
- Preserve TypeScript 5 and current runtime major versions.
- Record deferred major upgrades and residual audit findings in the GitHub issue.

## Task 1: Frontend dependencies

Files: `package.json`, `package-lock.json`.

- [x] Update each outdated dependency to the registry `wanted` version; explicitly update React and React DOM to 19.3.1.
- [x] Remove unused deprecated `@google/generative-ai`, after repository-wide import search.
- [x] Refresh transitive dependencies with `npm update`.
- [x] Verify `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Compare lint to baseline (3 errors / 11 warnings).

## Task 2: Pipeline dependencies

Files: `pipeline/package.json`, `pipeline/package-lock.json`, and `pipeline/src/channels/types.ts` if Zod migration requires it.

- [x] Update outdated dependencies to `wanted`; explicitly upgrade Nodemailer to 10.2.1 and Zod to 4.6.7 to address remaining advisories.
- [x] Run existing channel configuration tests before adjusting Zod APIs; preserve partial enum-key records using `z.partialRecord` if necessary.
- [x] Refresh transitive dependencies with `npm update`.
- [x] Verify `npm ci`, `npm run lint`, and `npm test` (baseline: 22 files / 166 tests pass).

## Override rationale

`@tailwindcss/typography@0.5.20` pins `postcss-selector-parser@6.0.10`. Use a scoped override to `^7.1.7` to address GHSA-rj75-hqrm-r3gf without downgrading Typography. Upstream version 7 changes insertion-during-iteration behavior; Typography uses AST parsing and pseudo-node manipulation, validated by the frontend build. Remove the override when Typography ships a patched dependency.

## Task 3: Audit and report

- [x] Re-run both npm audits, inspect remaining dependency paths, and document any required overrides with their compatibility limits.
- [x] Review manifest/lockfile diffs, confirm no unrelated edits, and update the tracking issue with exact validation results and deferred migrations.

## Results

Tracking issue: https://github.com/yangshiqi/all-you-care/issues/117

- Both clean installs passed; final npm audits: 0 findings in each project.
- Node 22.23.4: pipeline typecheck and all 169 tests passed (22 files).
- All three channel YAML files loaded; Nodemailer generated MIME locally without delivery.
- Frontend production build and standalone typecheck passed.
- Frontend lint remains at baseline: 3 errors / 11 warnings. Before and after logs are identical; errors are in the pre-existing untracked `pipeline/.fpcheck.mts`.
- Deferred major migrations remain tracked in the issue. No deployment performed.

## Phase 2: Major version upgrades

- [x] Upgrade frontend i18next 26, react-i18next 17, Lucide 1, and Motion 14; verify production build and browser language switching, icons, mobile menu.
- [x] Upgrade pipeline ImapFlow 2, js-yaml 5 (built-in types; namespace/named imports), Juice 12, Vitest 5; declare the required Node engine floor and verify channel loading, YAML equivalence, email CSS inlining and existing tests.
- [x] Upgrade Anthropic to the last pre-1.0 release (0.137.0), keeping API version 2023-06-01. SDK 1 changes the default API version to 2026-10-21; defer until configured proxy compatibility is established. Validate SDK requests through a local fake transport.
- [x] Keep TypeScript 5: installed typescript-eslint supports >=4.8.4 <6.1.0; TypeScript 7 lacks the legacy compiler API needed by this toolchain. Node typings track supported runtime versions.
- [x] Re-run clean installs, audits, frontend lint baseline comparison, production build, pipeline typecheck/tests, and document remaining upgrades in issue 117.

### Phase 2 results

- Frontend: i18next 26.5.7, react-i18next 17.1.5, Lucide 1.61.0, Motion 14.6.0.
- Pipeline: Anthropic 0.137.0, ImapFlow 2.9.1, js-yaml 5.5.0, Juice 12.2.0, Vitest 5.0.5; Node engine requirement declared and documented. Removed obsolete js-yaml type package.
- js-yaml 5 removed its default export; three real-channel tests first failed, then passed after switching to the named `load` export. YAML 4/5 parsed values are identical for all channels.
- Browser verification caught React error 185 on direct English entry: react-i18next 17 changes the identity of its i18n snapshot after language transitions, repeatedly triggering LangSync's hydration effect. Using the stable i18n singleton fixes this. The production browser regression script `tests/i18n-smoke.py` passes English entry/reload, locale switching/storage, icons and mobile menu without page errors.
- Both clean installs passed. Pipeline typecheck and all 174 tests passed (23 files), including real-SDK proxy request/response compatibility and newsletter CSS inlining. Both npm audits remain at 0.
- Production build passed after the language synchronization fix. Excluding the pre-existing untracked `pipeline/.fpcheck.mts`, frontend ESLint has 0 errors / 11 baseline warnings.
- Keep SDK 1 and TypeScript 7 pending for the protocol/toolchain reasons above. Node types remain aligned with existing runtime lines.
