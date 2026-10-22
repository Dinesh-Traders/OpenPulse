# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| v0.1.x (current MVP) | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in OpenPulse, please do NOT open a public GitHub issue.

Instead, report it privately:

1. Go to the Security tab on this repository
2. Click "Report a vulnerability"
3. Provide a clear description of the issue, steps to reproduce, and potential impact

You will receive an acknowledgment within 48 hours and a full response within 7 days.

## What to Report

- Exposed API tokens or secrets in the codebase
- GitHub OAuth flow vulnerabilities
- Cross-site scripting (XSS) or injection issues
- Unauthorized data access or leakage
- Dependency vulnerabilities with a known exploit

## What Not to Report

- Rate limiting on the GitHub API (this is expected behavior)
- Issues that require physical access to a device
- Social engineering attacks

## Disclosure Policy

Once a fix is confirmed, we will:

1. Patch the vulnerability
2. Release a new version
3. Credit the reporter in the release notes (unless they prefer to remain anonymous)

We ask that you give us reasonable time to fix the issue before any public disclosure.
