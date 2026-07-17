# Security Policy

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report them privately via [GitHub Security Advisories](https://github.com/CoreyMoen/mast-sanity/security/advisories/new). You should receive a response within a few days.

## Scope Notes

- This project's API routes (`/api/claude/*`, `/api/figma/*`) proxy requests to Anthropic, Sanity, and Figma using server-side credentials. If you find a way to extract those credentials or bypass the CORS/secret checks, that's in scope.
- The `/api/claude/remote` endpoint is gated by the `CLAUDE_REMOTE_API_SECRET` shared secret and rate limiting — leave it unset to keep the endpoint disabled.
- Secrets are read exclusively from environment variables. Never commit `.env` files; the provided `.env.example` files document the required variables with placeholders.

## Supported Versions

Only the latest `main` branch is supported with security updates.
