# NoAI Slop Blocker Extension

> Chromium extension that hides AI-themed slop (ads, widgets, disclosures) and blocks low-quality AI domains at the network layer.

## Features

- **Two-layer protection**
  - **Layer A – DNR blocking:** Service worker converts a user-editable domain list into `declarativeNetRequest` rules so AI slop domains never load.
  - **Layer B – DOM cleaning:** Content script hides AI disclosures, ads containing AI keywords, and site-specific panels (Google AI Overviews, Facebook sponsored AI posts, YouTube AI shelves, news-site “Ask AI” widgets).
- **Modular cleaners:** Separate modules for Google, Facebook, generic news, and YouTube make it easy to add more platforms.
- **Per-site controls & hidden counter:** Popup toggles the extension globally or per site, displays hidden-item count, and now includes a “Show hidden items” button that soft-restores content.
- **Rich options UI:** Edit AI keywords, disclosure phrases, ad markers, and the DNR domain list in one place. Saving notifies the service worker to refresh blocking rules instantly.

## Project structure

```
noai/
├── manifest.json          # Manifest V3 config (v0.2.0)
├── sw.js                  # Service worker + DNR manager
├── content.js             # Generic scanner + cleaner router
├── cleaners/
│   ├── facebook-cleaner.js
│   ├── google-cleaner.js
│   ├── news-cleaner.js
│   └── youtube-cleaner.js
├── ui/
│   ├── popup.html / popup.js
│   └── options.html / options.js
└── dnr-domains.txt        # Sample domain list you can paste into options
```

## Getting started

1. **Load unpacked**
   - Chrome / Brave / Edge → `chrome://extensions`
   - Enable *Developer mode* → *Load unpacked* → select the `noai/` folder.
2. **Firefox (MV2 fallback)**
   - Go to `about:debugging#/runtime/this-firefox`.
   - Click **Load Temporary Add-on…** and pick `noai/manifest.firefox.json`.
   - Firefox still runs Manifest V2, so this alternate manifest swaps in `background.scripts` and a persistent worker—loading the MV3 `manifest.json` will trigger the “background.service_worker is currently disabled” warning.
2. **Grant permissions:** Chrome will warn about `storage`, `declarativeNetRequest`, `alarms`, and `webRequest`/`webRequestBlocking`. These are required for the network blocklist, periodic sync, and AI-header interception (explained below). Approve the prompt to finish loading.
3. **Verify install:** The toolbar icon should appear. Click it to see the popup controls.

## Customization

- Open the options page (right-click extension → *Options*, or `chrome://extensions` → Details → *Extension options*).
- Edit lists:
  - **AI keywords** – targets AI-themed ads/UI.
  - **Disclosure phrases** – hides “AI-generated” labels and similar.
  - **Ad marker phrases** – heuristics to find ad containers.
  - **Network blocking (DNR domains)** – paste domains (one per line, `#` comments allowed) to block entirely.
- Click **Save All Settings**. The service worker automatically re-generates DNR rules and you’ll see a ✓ confirmation.
- Use the popup to disable/enable globally, toggle the current site, or temporarily show hidden cards.

## Permissions Explained

When you load the unpacked build, Chrome shows a permission review dialog. Each permission maps to a specific feature:

| Permission | Why it’s needed |
|------------|-----------------|
| `storage` | Persist keywords, disclosure phrases, and the editable DNR domain list. |
| `declarativeNetRequest` | Convert the domain list into blocking rules so AI-slop domains never load. |
| `alarms` | Schedule the weekly remote blocklist sync without running a background page 24/7. |
| `webRequest` + `webRequestBlocking` | Inspect response headers (e.g., `X-Model`) and cancel AI API streams before they render. |

All network inspection is local-only—no telemetry leaves the device unless you point the service worker at your own reporting endpoint.

## Development notes

- Content script runs at `document_start` and injects CSS plus a MutationObserver to catch SPA / infinite-scroll content.
- Site-specific cleaners expose `clean()` functions and can be expanded with additional selectors or heuristics.
- `dnr-domains.txt` is a convenience reference; copy its contents into the options page if you want the defaults.

## Roadmap ideas

- Import/export for options and DNR lists.
- Additional cleaners (Bing, LinkedIn, Reddit, TikTok).
- “Show hidden items” overlay listing what was removed.
- Automatic domain list refresh from remote data (as static fetch with caching).
- Optional analytics (privacy-preserving counts) to gauge effectiveness.

## License

MIT (or fill in your preferred license).
