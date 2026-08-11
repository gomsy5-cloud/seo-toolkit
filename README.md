# SEO Rig — Diagnostic Suite

A real, working SEO toolkit (React + Vite + Tailwind v4). No fake data — every number on screen comes from actual analysis.

## All 7 tools are live

| Tool | How it works | API key needed? |
|---|---|---|
| **On-Page Analyzer** | Serverless function fetches a URL server-side, parses with `cheerio`, audits title/meta/headings/alt text/links | No |
| **Broken Link Checker** | Serverless function crawls a page's links and checks each one's HTTP status | No |
| **Keyword Density & Readability** | Flesch readability score, keyword frequency, repeated phrases — all client-side | No |
| **Sitemap & Robots.txt Generator** | Builds and downloads real `sitemap.xml` / `robots.txt` files — client-side | No |
| **Report Generator** | Runs the On-Page Analyzer, compiles results into a branded PDF via `jsPDF` (lazy-loaded) | No |
| **AI Content & Meta Generator** | Serverless function calls the Gemini API server-side (free tier) for meta titles/descriptions or a blog outline | **Yes — free** |
| **Link Building** | Finds real guest-post/resource-page opportunities via Google Programmable Search, plus an AI outreach email drafter | **Yes — free** |

## Setup (local frontend dev)

```bash
npm install
npm run dev
```

This only serves the frontend. See "Local testing" below for running the backend functions locally too.

## Deploying to Cloudflare Pages (same flow as kaagazpdf.in)

1. **Push to GitHub** — same as before: create/use a repo, push this whole folder to it.

2. **Create the Pages project**
   - Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
   - Pick your repo

3. **Build settings**
   - Framework preset: `Vite` (or None — settings below work either way)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave blank (repo root)

4. **Enable Node.js compatibility** — required because `cheerio` (used by the Analyzer and Broken Link Checker) needs it:
   - This repo already includes `wrangler.toml` with `compatibility_flags = ["nodejs_compat"]`, so Cloudflare picks it up automatically.
   - If it doesn't for any reason: Pages project → Settings → Functions → Compatibility flags → add `nodejs_compat` for both Production and Preview.

5. **Environment variables** — Pages project → Settings → Environment variables → add for **Production** (and Preview if you want previews to work too):
   - `GEMINI_API_KEY` — free key from https://aistudio.google.com/apikey (powers Content Generator + Outreach Drafter)
   - `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_CX` — free, powers Link Building → Find Opportunities (setup: https://programmablesearchengine.google.com, then https://console.cloud.google.com/apis/credentials)
   - Analyzer, Keyword Density, Sitemap Generator, Broken Link Checker, and Report Generator need **no keys at all**.

6. **Deploy** — click Save and Deploy. Cloudflare builds and gives you a `*.pages.dev` URL immediately; add your custom domain after under Custom Domains, same as kaagazpdf.

### About the backend functions
`/functions/api/*.js` are Cloudflare Pages Functions — Web-standard `Request`/`Response`, env vars read via `env.X`. This is what Cloudflare deploys and runs automatically since the folder is named `functions` at the repo root.

### Local testing
`npm run dev` (plain Vite) won't run the `/functions` — Cloudflare Pages Functions only work via the Cloudflare dev server. To test locally: `npx wrangler pages dev dist --compatibility-flag nodejs_compat` after running `npm run build`, or just push and test on the deployed `*.pages.dev` URL, same as you've done with the kaagazpdf webhook.

## Notes on the crawler-based tools

- The On-Page Analyzer and Broken Link Checker fetch pages server-side with a 8–10s timeout and a size cap, so they won't hang on huge or slow pages.
- Broken Link Checker checks up to 40 links per run to keep serverless execution time reasonable — for bigger sites, run it section by section.
- Only crawl sites you own or have permission to audit.
