# OpenPulse — Roadmap

Organization: Dinesh-Traders | Status: MVP live | October 2026

---

## Strategic Summary

The MVP calls the GitHub API directly from the browser. Unauthenticated requests are limited to 60/hour per IP. A backend with an authenticated token (5,000/hour), caching, and a periodic sync job is the single most important next step.

Differentiation: most good-first-issue aggregators only list issues. OpenPulse wins by adding quality signals (maintainer responsiveness, issue freshness, claimed/unclaimed status), contribution tracking, and a maintainer-side view.

Sequencing: contributors first (supply of users), tracking second (retention), maintainers third (supply of quality issues and a possible revenue path).

Rule: do not start the React migration until the backend OpenAPI schema exists.

---

## Version Overview

| Version | Theme | Timeline | Duration |
|---------|-------|----------|----------|
| v0.1 | MVP: discovery on static site | Done | — |
| v0.2 | Foundation: repo hygiene, backend API, caching | Weeks 1–6 | ~6 weeks |
| v0.3 | Accounts and contribution tracking | Weeks 7–16 | ~10 weeks |
| v0.4 | Maintainer tools beta | Weeks 17–22 | ~6 weeks |
| v1.0 | Production-grade, stable API, React + TS, docs | Weeks 23–32 | ~10 weeks |

Realistic total: 7–8 months to v1.0 with one part-time maintainer plus a few contributors.

---

## v0.1 — MVP (Shipped)

| Area | Status |
|------|--------|
| Fetch good first issue via GitHub API | Done |
| Language filter, search, sort | Done |
| Skeleton loading | Done |
| FUNDING.yml (GitHub Sponsors) | Done |
| Hosted on GitHub Pages | Done |

Known gaps to carry into v0.2: no caching, rate-limit exposure, no tests, no issue templates.

---

## v0.2 — Foundation (Weeks 1–6)

| Category | Feature | Priority |
|----------|---------|----------|
| Repo health | LICENSE, README overhaul, CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue/PR templates, SECURITY.md | P0 |
| Backend | FastAPI service: /issues, /repos, /languages, /health | P0 |
| Data | Server-side GitHub fetch using a token; in-memory cache (TTL 15 min) | P0 |
| Frontend | Switch vanilla JS to call own API; handle rate-limit/error states | P0 |
| Quality | Unit tests (pytest), lint (ruff), format (ruff format), pre-commit | P0 |
| CI | GitHub Actions: lint + test on every PR | P0 |
| Discovery | Additional labels: help wanted, beginner, easy, documentation | P1 |
| Discovery | Issue freshness badge, comment count, has linked PR flag | P1 |
| UX | Pagination or infinite scroll, URL-persisted filters | P1 |
| Docs | OpenAPI docs auto-generated, architecture.md | P1 |

Not in v0.2: user accounts, database, React.

---

## v0.3 — Accounts and Contribution Tracking (Weeks 7–16)

| Category | Feature | Priority |
|----------|---------|----------|
| Auth | GitHub OAuth login (read-only scopes) | P0 |
| Database | PostgreSQL + SQLAlchemy + Alembic migrations | P0 |
| Tracking | Personal dashboard: issues bookmarked, started, PRs opened, PRs merged | P0 |
| Tracking | Auto-sync merged PRs from user GitHub activity | P0 |
| Discovery | Saved searches and bookmarks | P1 |
| Discovery | Recommended issues based on languages and past contributions | P1 |
| Gamification | Contribution streaks, badges (First PR, 5 merged PRs, 3 languages) | P1 |
| Data | Background sync worker (APScheduler or cron container) | P0 |
| Frontend | Start React + TypeScript migration (Vite), route by route | P0 |
| Privacy | Account deletion and data export endpoints | P0 |

---

## v0.4 — Maintainer Tools Beta (Weeks 17–22)

| Feature | Notes |
|---------|-------|
| Maintainer claim of a repo | Verify via GitHub App install or repo admin check |
| Repo health score: response time, PR merge rate, docs present | Computed server-side |
| Contributor-friendly checklist and embeddable badge | Badge drives organic backlinks |
| Issue-quality linter for good first issue labels | High value to maintainers |
| Featured repo slot (free during beta) | Test demand before charging |

---

## v1.0 — Production (Weeks 23–32)

| Category | Feature |
|----------|---------|
| Frontend | React + TS complete, WCAG AA, responsive, dark mode |
| API | Versioned (/api/v1), rate-limited, documented, public read API |
| Reliability | Monitoring, error tracking, uptime checks, backups tested |
| Security | Dependency scanning, secret scanning, OAuth hardening, CSP headers |
| Performance | p95 API latency under 300 ms on cached endpoints; Lighthouse 90+ |
| Community | Public roadmap, docs site, contributor guide, release notes |
| Growth | Embeddable badge, GitHub Action for maintainers, weekly digest email |

---

## Key Risks

| Risk | Mitigation |
|------|-----------|
| GitHub API rate limits | Server-side token, ETag caching, DB-backed sync |
| No contributors show up | Better issue quality, mentors, targeted outreach, events |
| Maintainer burnout | Cap scope, add triagers by month 3, automate triage |
| Free-tier cold starts hurt UX | Move to paid tier ($7 + DB) before v0.3 launch |
| Crowded space | Compete on quality signals, tracking, maintainer tooling |
| OAuth security incident | Minimal scopes, encrypted tokens, 2-approval rule on auth code |

---

## First 30 Days Checklist

| Week | Actions |
|------|---------|
| 1 | Add LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, templates, labels; enable branch protection; add minimal ci.yml; enable Discussions; create develop branch |
| 2 | Publish 15+ starter issues; scaffold backend/ with /health and /issues; add Docker Compose; write architecture doc |
| 3 | Deploy backend to Render; point frontend to API; add caching and ETag support; add community Action |
| 4 | Launch: README GIF, Show HN, Dev.to post, Reddit, college communities; add sponsor goal; start tracking metrics weekly |
