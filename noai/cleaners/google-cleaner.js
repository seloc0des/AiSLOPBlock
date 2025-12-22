/**
 * cleaners/google.js
 * Site-specific cleaner for Google Search Results (SERP)
 * Targets: AI answer boxes, AI overview panels, AI-generated summaries
 */

const GoogleCleaner = {
  // Google's AI-powered features we want to target
  selectors: [
    // Google's "AI Overviews" / "SGE" panels
    '[data-sokoban-container][data-answer-type="generative"]',
    '[data-sokoban-container] [data-component-type="generative_answer"]',
    
    // Fallback: look for Google's answer box containers with AI keywords
    '[data-sokoban-container] [role="region"]',
    
    // "Powered by AI" or "AI-generated" badges
    '[aria-label*="AI generated"]',
    '[aria-label*="artificial intelligence"]',
    
    // Generic AI widget classes (if Google adds them)
    '.ai-generated',
    '[data-ai-generated]',
  ],

  /**
   * Hide AI-generated answer boxes on Google SERP
   */
  clean(aiKeywords, hideFunc) {
    const toHide = [];

    // Strategy 1: Target known AI container selectors
    this.selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (hideFunc(el)) {
            toHide.push(el);
          }
        });
      } catch (e) {
        // Selector might be invalid in some Chrome versions
      }
    });

    // Strategy 2: Find answer containers and check for AI keywords in text
    document.querySelectorAll('[data-sokoban-container]').forEach(container => {
      const text = container.innerText || '';
      
      // Check for AI-related text patterns
      const hasAILabel = /ai.{0,20}(overview|generated|summary|answer)/i.test(text) ||
                        /powered by.*ai/i.test(text);
      
      if (hasAILabel) {
        // Check if it's actually an answer box, not a normal search result
        const isAnswerBox = container.getAttribute('data-answer-type') || 
                           container.querySelector('[role="region"]');
        
        if (isAnswerBox && hideFunc(container)) {
          toHide.push(container);
        }
      }
    });

    return toHide.length;
  },

  /**
   * Register mutation observer for dynamic content
   */
  observe(observer, scanFunc) {
    // Google SERP loads results incrementally
    const observerConfig = { childList: true, subtree: true };
    observer.observe(document.body, observerConfig);
  }
};

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleCleaner;
}
