/**
 * content-enhanced.js
 * Enhanced content script integrating site-specific cleaners
 * Replaces content.js with support for modular site-specific logic
 */

const STOP_WORDS_MIN_LEN = 2;
const HIDDEN_CLASS = "noai-hidden-block";

function norm(s) {
  return (s || "").toLowerCase().trim();
}

function containsAny(haystack, needles) {
  const h = norm(haystack);
  for (const n of needles) {
    const nn = norm(n);
    if (nn.length >= STOP_WORDS_MIN_LEN && h.includes(nn)) return true;
  }
  return false;
}

function isProbablyAdContainer(el, adPhrases) {
  const aria = el.getAttribute?.("aria-label") || "";
  const role = el.getAttribute?.("role") || "";
  const idc = `${el.id || ""} ${el.className || ""}`;

  if (containsAny(aria, adPhrases)) return true;
  if (containsAny(role, ["banner", "complementary"])) return true;
  if (containsAny(idc, ["ad", "ads", "sponsor", "promoted", "promotion"])) return true;

  const text = el.innerText || "";
  if (containsAny(text, adPhrases)) return true;

  return false;
}

function hide(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.dataset?.noaiHidden === "1") return false;
  el.dataset.noaiHidden = "1";
  el.classList.add(HIDDEN_CLASS);
  el.style.setProperty("display", "none", "important");
  return true;
}

function showAllHidden() {
  const hiddenNodes = document.querySelectorAll('[data-noai-hidden="1"]');
  hiddenNodes.forEach((node) => {
    node.classList.remove(HIDDEN_CLASS);
    node.style.removeProperty("display");
    node.dataset.noaiHidden = "0";
  });
  chrome.runtime
    .sendMessage({ type: "noai:reset" })
    .catch(() => {});
}

/**
 * Load and integrate site-specific cleaner based on hostname
 */
async function loadSiteSpecificCleaner(host) {
  const googleTlds = [
    "com",
    "co.uk",
    "co.jp",
    "co.in",
    "com.au",
    "ca",
    "de",
    "fr",
    "es",
    "it",
    "in",
    "br",
    "mx"
  ];

  const newsHosts = [
    "bbc.com",
    "bbc.co.uk",
    "cnn.com",
    "nytimes.com",
    "theguardian.com",
    "washingtonpost.com",
    "reuters.com",
    "apnews.com",
    "wsj.com"
  ];

  if (googleTlds.some((tld) => host === `google.${tld}` || host.endsWith(`.google.${tld}`) || host.endsWith(`google.${tld}`))) {
    return "GoogleCleaner";
  }

  if (host.includes("google.") || host.endsWith(".google.com")) return "GoogleCleaner";
  if (host.includes("facebook.com") || host.includes("messenger.com")) return "FacebookCleaner";
  if (host.includes("youtube.com")) return "YouTubeCleaner";
  if (newsHosts.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return "NewsGenericCleaner";
  }

  return null;
}

/**
 * Generic DOM scanning (works across all sites)
 */
function scanNodeGeneric(node, aiKeywords, disclosurePhrases, adPhrases) {
  if (!node || node.nodeType !== 1) return 0;
  const el = /** @type {Element} */ (node);

  let hidden = 0;

  // 1) Hide disclosure blocks (AI-generated labels, etc.)
  const txt = el.innerText || "";
  if (containsAny(txt, disclosurePhrases)) {
    if (hide(el)) {
      hidden++;
      chrome.runtime.sendMessage({ type: "noai:hidden-inc" }).catch(() => {});
    }
    return hidden; // Don't process children
  }

  // 2) Hide AI-themed ads: (ad container) AND (AI keyword)
  const container = el.closest?.("article, section, div, li") || el;
  if (isProbablyAdContainer(container, adPhrases) && containsAny(container.innerText || "", aiKeywords)) {
    if (hide(container)) {
      hidden++;
      chrome.runtime.sendMessage({ type: "noai:hidden-inc" }).catch(() => {});
    }
    return hidden;
  }

  return hidden;
}

(async function main() {
  const host = location.hostname;

  const {
    enabled,
    aiKeywords,
    disclosurePhrases,
    adPhrases,
    disabledHosts,
    perSiteEnabled
  } = await chrome.storage.sync.get([
    "enabled",
    "aiKeywords",
    "disclosurePhrases",
    "adPhrases",
    "disabledHosts",
    "perSiteEnabled"
  ]);

  if (!enabled) return;
  if ((disabledHosts || []).includes(host)) return;
  if (perSiteEnabled && perSiteEnabled[host] === false) return;

  chrome.runtime.sendMessage({ type: "noai:reset" }).catch(() => {});

  // Inject generic CSS
  const style = document.createElement("style");
  style.textContent = `
    [data-ai], .ai-generated, .ai-content, .generated-by-ai { display:none !important; }
    .${HIDDEN_CLASS} { display:none !important; }
  `;
  document.documentElement.appendChild(style);

  // Try to load and execute site-specific cleaner
  const cleanerName = await loadSiteSpecificCleaner(host);
  let siteSpecificCleaner = null;

  if (cleanerName) {
    // Check if cleaner exists in global scope (loaded via separate script)
    if (typeof window[cleanerName] !== 'undefined') {
      siteSpecificCleaner = window[cleanerName];
    }
  }

  // Main scanning function
  function scanNode(node) {
    const hiddenCount = scanNodeGeneric(node, aiKeywords, disclosurePhrases, adPhrases);
    
    // If site-specific cleaner exists, also run it
    if (siteSpecificCleaner && siteSpecificCleaner.clean) {
      const siteCount = siteSpecificCleaner.clean(aiKeywords, containsAny, hide);
      if (siteCount > 0) {
        chrome.runtime.sendMessage({ type: "noai:hidden-inc", amount: siteCount }).catch(() => {});
      }
    }

    return hiddenCount;
  }

  // Initial scan
  document.querySelectorAll("article, section, div, li").forEach(scanNode);

  // Mutation observer for dynamic content
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        scanNode(n);
        if (n?.querySelectorAll) {
          n.querySelectorAll("article, section, div, li").forEach(scanNode);
        }
      }
    }
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "noai:show-hidden") {
      showAllHidden();
    }
  });
})();
