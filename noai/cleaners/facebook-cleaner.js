/**
 * cleaners/facebook.js
 * Site-specific cleaner for Facebook / Meta
 * Targets: "Sponsored" ads containing AI keywords, "Suggested for You" AI content
 */

const FacebookCleaner = {
  // Facebook's sponsored/suggested containers
  selectors: [
    // Sponsored post container
    '[data-testid="feed_story_wrapper"]',
    '[role="article"]',
    
    // "Suggested for You" sections
    '[aria-label*="Suggested"]',
    '[data-testid="suggested_stories"]',
    
    // Sponsored badge
    '[data-testid="context_menu_button"]', // Often near sponsored badge
  ],

  /**
   * Check if element is likely a sponsored/promoted container
   */
  isSponsored(el) {
    const text = (el.innerText || '').toLowerCase();
    return /sponsored|promoted|suggested for you|ad|paid partnership/i.test(text);
  },

  /**
   * Hide AI-themed sponsored content
   */
  clean(aiKeywords, containsAnyFunc, hideFunc) {
    const toHide = [];

    // Target: (Sponsored/Promoted) AND (AI keywords)
    document.querySelectorAll('[role="article"], [data-testid="feed_story_wrapper"]').forEach(article => {
      if (this.isSponsored(article) && containsAnyFunc(article.innerText || '', aiKeywords)) {
        if (hideFunc(article)) {
          toHide.push(article);
        }
      }
    });

    // Also target "Suggested for You" items with AI keywords
    document.querySelectorAll('[aria-label*="Suggested"]').forEach(suggested => {
      if (containsAnyFunc(suggested.innerText || '', aiKeywords)) {
        if (hideFunc(suggested)) {
          toHide.push(suggested);
        }
      }
    });

    return toHide.length;
  },

  /**
   * Register observer for infinite scroll
   */
  observe(observer, scanFunc) {
    // Facebook is highly dynamic - use aggressive mutation observation
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false  // Don't need to watch attribute changes
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FacebookCleaner;
}
