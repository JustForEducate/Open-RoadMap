# Code audit / Аудит кода

Date / Дата: **2026-09-11**.

## Scope and assurance / Область проверки

Reviewed the maintained application sources, tests, startup scripts, environment templates, package manifests/lockfiles, CI/deployment configuration, styles and documentation in this checkout. JavaScript/JSX received static checks; dependencies were checked with npm's advisory database; SQLite/API and Chromium scenarios were executed. The inventory below makes the file scope explicit.

This is a source review and regression-testing pass, **not** a mathematical proof, a penetration-test certification, or a promise that every possible execution is bug-free. Vendor source in `node_modules` was not audited character by character; lockfiles were checked through dependency resolution and advisory scans. Git internals, secrets, local databases, user uploads, browser binaries and generated build/cache artifacts are outside the source-review inventory.

Проверены поддерживаемые исходники, тесты, скрипты, конфигурация и документация. Это обзор кода и регрессионные проверки, а не гарантия отсутствия любых ошибок «в каждом символе». Исходники сторонних библиотек не проходили посимвольную ручную экспертизу. Секреты и пользовательские данные не включены в отчёт.

## Findings addressed / Исправления

| Area | Finding | Change |
|---|---|---|
| Authorization | Browser-only password check; unauthenticated mutation API | Server-side scrypt verification, random session cookies, protected write/upload routes, session revocation and expiry; no default password |
| Login abuse | No throttling or server-controlled identity | Per-IP login limit; bounded in-memory sessions; HttpOnly cookie, Secure in production |
| CSRF / CORS | Open cross-origin API | Exact-origin policy, explicit custom mutation header and credential-aware CORS |
| Uploads | Regex extension/MIME trust; untrusted bytes published as files | Multer 2 limits, actual image decode, 25 MP limit, metadata removal, bounded resizing and WebP re-encoding |
| Data integrity | Partial multi-query deletion; direct SQLite overwrite | Transactional task/photo metadata deletion, atomic temporary-file rename for SQLite, statement cleanup in finally |
| Photo URLs | Protocol and host reconstructed from untrusted/proxied request data | Relative upload URLs resolved by the frontend against the configured API origin |
| Validation | Weak stage checks and unbounded strings | Integer stages, field/type/length validation, no-op and unknown-field rejection, JSON size limit |
| Error disclosure | Raw database errors returned to clients | Centralized generic server errors; internal details remain in server logs |
| False success | Invalid JSON converted to `{}`; malformed translation silently ignored | Explicit invalid-response errors, API schema validation and non-empty translation validation |
| Timeout / races | Timeout stopped at response headers; stale request updates | Body-inclusive timeout, listener cleanup, abort handling, cancellation of obsolete public-board/detail/translation requests |
| Public details | Entire task list fetched for one task; errors confused with 404 | Dedicated GET item endpoint; explicit not-found versus failed-load states |
| Translation | Coerced arbitrary inputs, unbounded work, empty upstream fallback | RU→EN only, bounded input/count/concurrency, total deadline and explicit 502/504 responses |
| UI | Missing route rendered nothing; nested overlay click propagation; missing focus containment | 404 page, viewer click isolation, topmost-dialog focus trap/restore, mobile viewer controls |
| Content rendering | Long text overflow; emoji-dependent logo rendering | Word wrapping, vector map/globe icons, title/description input limits |
| Windows shutdown | STOP.bat killed every Node.js process | Scoped dev runner; Ctrl+C shutdown instructions rather than system-wide process termination |
| Dependencies | Known advisories in direct/transitive packages | Updated lockfiles, Vite 7 / React Router 7 / Multer 2; patched qs override for Express 4's transitive dependency |
| Documentation | Outdated auth, deployment and style instructions | Rewritten RU/EN README, real screenshots and explicit operating limits |

## Fallback policy / Политика fallback

Removed silent successful fallbacks for malformed JSON, invalid task/photo schemas, absent translation fields and invalid backend ports. Removed unused duplicate locale strings and the inconsistent footer-version substitution. Storage/image decoding failures are not all reported as successful empty results; filesystem failures reach server error handling.

Retained deliberately:

- `[]` for an actual empty task list or a task with no photos. Missing tasks themselves return 404, including the photo-list endpoint.
- `description ?? ''` on task creation: description is an optional model field, not a failed query.
- `null` for no selection, no translation requested or no timestamp yet.
- English for unsupported browser languages, and a visible translation key for a missing dictionary key. Tests enforce non-empty RU/EN values, matching dictionary keys and literal UI key existence.
- In-memory language preference if localStorage is unavailable. Failure to save a preference must not prevent reading a public board.
- System fonts if Google Fonts is unavailable; no fake data is inserted to mask network errors.
- Documented local development settings (SQLite, ports, localhost origins). Missing admin configuration fails closed and emits a startup warning.

Сохранены только осмысленные значения: отсутствие фото, необязательное описание, ещё не выбранный объект, язык по умолчанию и системный шрифт. Ошибки API не подменяются пустой доской или пустым переводом.

## Executed checks / Выполненные проверки

- `npm run lint`: ESLint across maintained JS/JSX/MJS files — passed.
- `npm test`: **19 tests passed** (11 backend/API, 8 frontend utilities/localization).
- `npm run build`: Vite production build — passed.
- `npm run test:e2e`: **3 Chromium scenarios passed**: public board/detail/mobile/404; real admin login/edit/stage change/photo upload/logout; malformed API response.
- `npm audit`, `npm audit --prefix backend`, `npm audit --prefix frontend`: **0 reported vulnerabilities** at the time of the scan. This is advisory-database coverage, not proof of safety.
- Local Markdown links/images and `git diff --check` verified.
- README screenshots captured from the running app with isolated demo data, not generated illustrations. The usual Playwright browser CDN was unavailable in this sandbox; a packaged Chromium executable was used through `BROWSER_EXECUTABLE`. CI uses Playwright's standard Chromium installation.

## Remaining limits / Границы проверки

- PostgreSQL code was source-reviewed, but no live PostgreSQL integration run was performed. SQLite tests do not prove PostgreSQL behavior.
- Production Render/Vercel, real HTTPS cookie/proxy topology, Safari/Firefox, Windows process behavior and external MyMemory availability were not exercised here.
- No load/soak test, independent penetration test or full accessibility certification was performed.
- Session/rate-limit storage is process-local; restarting logs admins out. Scaling to multiple replicas needs shared stores and storage architecture.
- SQLite remains a single-process, in-memory sql.js database persisted to disk; large datasets and multi-process writes are not supported. Atomic rename reduces interrupted-write risk but is not a complete backup/disaster-recovery strategy.
- The database and filesystem cannot form one atomic transaction. Deletion cleanup failures are logged and may leave unreferenced files for operator cleanup; storage monitoring/backups remain necessary.
- Public translation consumes a third-party quota despite throttling. It can fail due to provider/network conditions; original content is preserved.
- Image re-encoding intentionally drops metadata and animation. Upload size/pixel limits and process-local concurrency are not a substitute for reverse-proxy resource limits.
- This is a single-admin system without MFA, recovery accounts, role hierarchy or a durable security-event archive.

## File inventory / Перечень файлов

The following maintained files were included. “Source” means reviewed with static/regression checks as applicable; it does not imply individual runtime coverage of every branch. “Dependencies” means manifest/lock consistency and advisory scanning, not manual vendor-code auditing.

| File | Review category |
|---|---|
| `.editorconfig` | Configuration / startup / deployment review |
| `.env.example` | Configuration / startup / deployment review |
| `.github/workflows/ci.yml` | Configuration / startup / deployment review |
| `.gitignore` | Configuration / startup / deployment review |
| `README.md` | Documentation / consistency and local links |
| `README.ru.md` | Documentation / consistency and local links |
| `SECURITY.md` | Documentation / consistency and local links |
| `START.bat` | Configuration / startup / deployment review |
| `STOP.bat` | Configuration / startup / deployment review |
| `backend/.env.example` | Configuration / startup / deployment review |
| `backend/package-lock.json` | Dependencies / scripts |
| `backend/package.json` | Dependencies / scripts |
| `backend/render.yaml` | Configuration / startup / deployment review |
| `backend/server.js` | Source / static checks; tests where applicable |
| `backend/src/app.js` | Source / static checks; tests where applicable |
| `backend/src/config/index.js` | Source / static checks; tests where applicable |
| `backend/src/db/index.js` | Source / static checks; tests where applicable |
| `backend/src/middleware/upload.js` | Source / static checks; tests where applicable |
| `backend/src/repositories/items.js` | Source / static checks; tests where applicable |
| `backend/src/routes/items.js` | Source / static checks; tests where applicable |
| `backend/src/routes/translate.js` | Source / static checks; tests where applicable |
| `backend/src/security/auth.js` | Source / static checks; tests where applicable |
| `backend/src/security/password.js` | Source / static checks; tests where applicable |
| `backend/src/server.js` | Source / static checks; tests where applicable |
| `backend/src/services/photoStorage.js` | Source / static checks; tests where applicable |
| `backend/src/services/translation.js` | Source / static checks; tests where applicable |
| `backend/src/validation/items.js` | Source / static checks; tests where applicable |
| `backend/test/api.test.js` | Source / static checks; tests where applicable |
| `backend/test/auth-disabled.test.js` | Source / static checks; tests where applicable |
| `backend/test/units.test.js` | Source / static checks; tests where applicable |
| `backend/uploads/.gitkeep` | Configuration / startup / deployment review |
| `docs/images/admin-roadmap.png` | Real screenshot / visual inspection |
| `docs/images/public-roadmap.png` | Real screenshot / visual inspection |
| `eslint.config.mjs` | Source / static checks; tests where applicable |
| `frontend/.env.example` | Configuration / startup / deployment review |
| `frontend/index.html` | Configuration / startup / deployment review |
| `frontend/package-lock.json` | Dependencies / scripts |
| `frontend/package.json` | Dependencies / scripts |
| `frontend/src/app/App.jsx` | Source / static checks; tests where applicable |
| `frontend/src/app/main.jsx` | Source / static checks; tests where applicable |
| `frontend/src/app/styles/index.css` | Styles / responsive browser inspection |
| `frontend/src/features/admin/components/AdminAuth.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/admin/pages/AdminLayout.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/ItemDetailSkeleton.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/ItemModal.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/PhotoModal.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/PublicItemDetailModal.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/RoadmapCard.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/RoadmapGridSkeleton.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/components/StageColumn.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/hooks/usePublicItemTranslation.js` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/hooks/useStages.js` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/pages/PublicItemView.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/pages/PublicRoadmap.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/pages/Roadmap.jsx` | Source / static checks; tests where applicable |
| `frontend/src/features/roadmap/stageDefinitions.js` | Source / static checks; tests where applicable |
| `frontend/src/shared/api/client.js` | Source / static checks; tests where applicable |
| `frontend/src/shared/config/app.js` | Source / static checks; tests where applicable |
| `frontend/src/shared/context/ErrorContext.jsx` | Source / static checks; tests where applicable |
| `frontend/src/shared/context/I18nContext.jsx` | Source / static checks; tests where applicable |
| `frontend/src/shared/hooks/useDialog.js` | Source / static checks; tests where applicable |
| `frontend/src/shared/i18n/translations.js` | Source / static checks; tests where applicable |
| `frontend/src/shared/lib/formatTime.js` | Source / static checks; tests where applicable |
| `frontend/src/shared/ui/AppFooter.jsx` | Source / static checks; tests where applicable |
| `frontend/src/shared/ui/GlobalErrorBanner.jsx` | Source / static checks; tests where applicable |
| `frontend/src/shared/ui/LanguageSwitcher.jsx` | Source / static checks; tests where applicable |
| `frontend/test/client.test.js` | Source / static checks; tests where applicable |
| `frontend/test/localization.test.js` | Source / static checks; tests where applicable |
| `frontend/vercel.json` | Configuration / startup / deployment review |
| `frontend/vite.config.js` | Source / static checks; tests where applicable |
| `package-lock.json` | Dependencies / scripts |
| `package.json` | Dependencies / scripts |
| `playwright.config.mjs` | Source / static checks; tests where applicable |
| `scripts/dev.mjs` | Source / static checks; tests where applicable |
| `scripts/e2e-server.mjs` | Source / static checks; tests where applicable |
| `scripts/setup-admin.mjs` | Source / static checks; tests where applicable |
| `tests/e2e/roadmap.spec.js` | Source / static checks; tests where applicable |
| `vercel.json` | Configuration / startup / deployment review |

The audit report itself is maintained documentation. Inventory excludes deleted legacy paths.
