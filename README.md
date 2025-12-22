# NoAI Slop Cleaner

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
2. **Grant permissions:** Browser will prompt for storage + DNR access; accept to enable blocking.
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
