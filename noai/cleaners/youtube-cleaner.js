/**
 * cleaners/youtube-cleaner.js
 * Targets YouTube homepage and watch page AI widgets/promoted panels.
 */

const YouTubeCleaner = {
  selectors: [
    "ytd-rich-shelf-renderer[is-slim-vitrina]",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-video-renderer[is-ai-generated]",
    "#shelf-title-ai",
    "yt-chip-cloud-chip-renderer[chip-style*='AI']"
  ],

  aiBadgeRegex: /ai\s+(overview|insight|answer|generated|summary)/i,

  clean(aiKeywords, containsAnyFunc, hideFunc) {
    let hidden = 0;

    this.selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (hideFunc(el)) hidden++;
      });
    });

    const promoCards = document.querySelectorAll("ytd-rich-item-renderer, ytd-compact-video-renderer");
    promoCards.forEach((card) => {
      const text = card.innerText || "";
      if (this.aiBadgeRegex.test(text) || containsAnyFunc(text, aiKeywords)) {
        if (hideFunc(card)) hidden++;
      }
    });

    return hidden;
  },

  observe(observer) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = YouTubeCleaner;
}
