# Security policy / Безопасность

## Reporting a vulnerability

Please do not publish passwords, session cookies, database files or exploit details in a public issue. Use GitHub's **Report a vulnerability** option if private vulnerability reporting is enabled for this repository. Otherwise ask the maintainer to establish a private reporting channel before sharing sensitive details. No dedicated security email or response-time guarantee is declared here.

Не публикуйте пароли, cookie сессий, базы или детали эксплуатации в открытом issue. Используйте **Report a vulnerability**, если приватные сообщения об уязвимостях включены в репозитории. Иначе сначала попросите владельца предоставить приватный канал связи. Отдельный security-email и гарантированный срок ответа здесь не заявлены.

## Operator checklist

- Use Node.js 22.12+ and current dependency lockfiles; run all three `npm audit` commands periodically.
- Set a unique `ADMIN_PASSWORD_HASH` using `npm run admin:setup`. Never publish `backend/.env` or its generated password. Do not use test credentials in production.
- Serve production over HTTPS with `NODE_ENV=production`. Keep `ALLOWED_ORIGINS` narrow. Set `TRUST_PROXY` only for the exact proxy topology you control.
- Prefer a same-origin frontend/API. Cross-site session cookies depend on browser privacy settings.
- Run one API process. Session and rate-limit stores are not shared across replicas. Use a least-privilege OS account and a dedicated database account.
- Persist and back up both the database and `UPLOADS_DIR`. Protect backups as sensitive information.
- Treat public tasks and photos as public data. MyMemory receives task text when a visitor requests translation. Google Fonts receives font requests.
- Monitor authentication failures, translation failures, storage usage and cleanup errors. Apply reverse-proxy body, connection and request limits in addition to application limits.
- For credential rotation: remove the `ADMIN_PASSWORD_HASH` line from your local `backend/.env`, run `npm run admin:setup`, update the deployed environment and restart the backend. Restart invalidates every in-memory session.

## Known boundaries

This is a single-administrator roadmap, not a multi-tenant identity system. There is no MFA, account recovery, role hierarchy or security event archive. Rate limiting is per process and does not replace DDoS protection. Backups, deployment TLS, database TLS and secret management remain operator responsibilities.

A clean dependency scan and passing tests are not proof of an absence of vulnerabilities. See [the audit report](docs/AUDIT.md) for the tested scope and exclusions.
