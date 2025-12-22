/**
 * ui/options-enhanced.js
 * Enhanced options page with DNR domain list management
 */

function linesToList(s) {
  return s.split("\n").map(x => x.trim()).filter(Boolean);
}

function listToLines(arr) {
  return (arr || []).join("\n");
}

(async function () {
  const els = {
    aiKeywords: document.getElementById("aiKeywords"),
    disclosurePhrases: document.getElementById("disclosurePhrases"),
    adPhrases: document.getElementById("adPhrases"),
    dnrDomainList: document.getElementById("dnrDomainList"),
    saveBtn: document.getElementById("save"),
    status: document.getElementById("status")
  };

  // Load current settings
  const data = await chrome.storage.sync.get([
    "aiKeywords",
    "disclosurePhrases",
    "adPhrases",
    "dnrDomainList"
  ]);

  els.aiKeywords.value = listToLines(data.aiKeywords);
  els.disclosurePhrases.value = listToLines(data.disclosurePhrases);
  els.adPhrases.value = listToLines(data.adPhrases);
  els.dnrDomainList.value = data.dnrDomainList || "";

  // Save handler
  els.saveBtn.addEventListener("click", async () => {
    try {
      await chrome.storage.sync.set({
        aiKeywords: linesToList(els.aiKeywords.value),
        disclosurePhrases: linesToList(els.disclosurePhrases.value),
        adPhrases: linesToList(els.adPhrases.value),
        dnrDomainList: els.dnrDomainList.value
      });

      // Notify service worker to update DNR rules
      chrome.runtime.sendMessage({ type: "noai:dnr-update" });

      // Show success
      els.status.textContent = "✓ Saved successfully!";
      els.status.style.color = "green";
      setTimeout(() => {
        els.status.textContent = "";
      }, 3000);
    } catch (err) {
      els.status.textContent = "✗ Error saving: " + err.message;
      els.status.style.color = "red";
    }
  });
})();
