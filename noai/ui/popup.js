(async function () {
  const enabledCheckbox = document.getElementById("enabled");
  const siteCheckbox = document.getElementById("siteEnabled");
  const showHiddenBtn = document.getElementById("showHidden");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  const url = new URL(tab.url);
  const host = url.hostname;

  const { enabled = true, perSiteEnabled = {}, disabledHosts = [] } =
    await chrome.storage.sync.get(["enabled", "perSiteEnabled", "disabledHosts"]);

  enabledCheckbox.checked = enabled;
  const siteEnabled =
    perSiteEnabled?.[host] !== false && !disabledHosts.includes(host);
  siteCheckbox.checked = siteEnabled;

  enabledCheckbox.addEventListener("change", async () => {
    await chrome.storage.sync.set({ enabled: enabledCheckbox.checked });
    chrome.tabs.reload(tab.id);
  });

  siteCheckbox.addEventListener("change", async () => {
    const nextPerSite = { ...(perSiteEnabled || {}) };
    const nextDisabled = (disabledHosts || []).filter((h) => h !== host);

    if (siteCheckbox.checked) {
      delete nextPerSite[host];
    } else {
      nextPerSite[host] = false;
    }

    await chrome.storage.sync.set({
      perSiteEnabled: nextPerSite,
      disabledHosts: nextDisabled
    });
    chrome.tabs.reload(tab.id);
  });

  showHiddenBtn.addEventListener("click", async () => {
    chrome.tabs.sendMessage(tab.id, { type: "noai:show-hidden" }, () => {
      if (chrome.runtime.lastError) {
        console.debug("NoAI show-hidden:", chrome.runtime.lastError.message);
      }
    });
    window.close();
  });
})();
