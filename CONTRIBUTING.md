# Contributing to TradeLock

Thanks for helping improve TradeLock.

## Ground Rules

- keep changes aligned with the live escrow demo experience
- prefer real data and operational behavior over static mockups
- do not commit secrets, private keys, or local `.env` values
- preserve the existing Arbitrum Sepolia workflow unless a change is explicitly planned

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The local app runs on `http://localhost:3050`.

## Before Opening a PR

Run:

```bash
npm run build
npm run test:e2e
```

## Coding Notes

- UI changes should stay consistent with the existing dark operations dashboard
- backend changes should prefer the established `lib/` services and API routes
- if you touch custody or automation logic, explain the operational impact in your PR
- if you add or rename env variables, update `.env.example`

## Commit Style

Use clear messages, for example:

- `fix: sync dashboard detail panel with live activity`
- `feat: add audit export controls`
- `perf: tighten workspace refresh cadence`

## Pull Request Checklist

- describe what changed
- describe why it changed
- mention any visible UI differences
- list any new env variables or setup steps
- include screenshots or recordings for meaningful UI changes when possible
