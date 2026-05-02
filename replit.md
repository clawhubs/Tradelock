# TradeLock — Replit Development Notes

## World Map Component

Dashboard gunakan `WorldDealMap` + `WorldMapSVG` — peta dunia asli berbasis **d3-geo + topojson-client**:
- File TopoJSON: `public/countries-110m.json` (Natural Earth 110m) + `artifacts/tradelock/public/countries-110m.json`
- Packages: `d3-geo`, `topojson-client`, `@types/d3-geo`, `@types/topojson-client` (di kedua app)
- Projection: Mercator 800×380, fetch `/countries-110m.json` on mount
- Animated planes (polygon + animateMotion) terbang di antara kota-kota deal nyata

## App Structure

TradeLock adalah B2B escrow platform berbasis Arbitrum Sepolia. Ada DUA app yang jalan:

### 1. Next.js App (REAL APP) — port 3000 / external 3001
- **Workflow**: `TradeLock`
- **Command**: `cd /home/runner/workspace && node_modules/.bin/next dev --port 3000`
- **Data**: Real data dari Supabase + Upstash Redis
- **Canvas**: Label "Artifact" di canvas kiri (preview `__default_preview__`)

### 2. Vite Artifact (PREVIEW LAMA) — port 25454 / external 80
- **Workflow**: `artifacts/tradelock: web`
- **Command**: `pnpm --filter @workspace/tradelock run dev`
- **Data**: Mock data (hardcoded di `artifacts/tradelock/src/App.tsx`)
- **Canvas**: Di sebelah kanan canvas (sudah digeser)

## Environment Variables (semua sudah di-set)

Tersimpan di `.replit` `[userenv.shared]` DAN Replit Secrets:
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`
- `TRADELOCK_POOL_PRIVATE_KEY`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID=421614` (Arbitrum Sepolia)

## Key Files

- `lib/env.ts` — env var reader dengan fallbacks
- `lib/tradelock-backend.ts` — backend service logic (Supabase + Redis)
- `lib/services/redis.ts` — Upstash Redis client
- `lib/services/tradelock-supabase-store.ts` — Supabase state store
- `app/page.tsx` — Next.js root page
- `next.config.js` — Next.js config dengan allowedDevOrigins untuk Replit domains
- `artifacts/tradelock/` — Vite preview artifact (mock data, bisa diabaikan)

## Cara Lihat App Real

Di canvas Replit, ada dua preview:
- **Kiri (Artifact)** → Next.js app dengan data real → klik "Open" untuk buka
- **Kanan (TradeLock)** → Vite mock preview (lama)

Atau klik workflow **TradeLock** di panel workflow untuk preview Next.js langsung.

## Blockchain Config

- Network: Arbitrum Sepolia (chainId 421614)
- USDC: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- RPC: `https://sepolia-rollup.arbitrum.io/rpc`

## External Services

- **Supabase**: `https://psacuxysgmefsfncjeky.supabase.co`
- **Upstash Redis**: `https://stirring-stud-98000.upstash.io`
- **QStash**: `https://qstash-eu-central-1.upstash.io`
- **Pinata IPFS**: configured via `PINATA_JWT`
- **Vercel Deploy**: `tradelock-pi.vercel.app`
- **GitHub**: `https://github.com/clawhubs/Tradelock`
