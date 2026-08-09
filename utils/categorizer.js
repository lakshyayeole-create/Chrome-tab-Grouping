// Basic category mappings by domain or keyword
const categoryRules = {
  "Dev & Code": {
    domains: ["github.com", "gitlab.com", "stackoverflow.com", "developer.mozilla.org", "npmjs.com", "codepen.io"],
    keywords: ["code", "developer", "api", "programming", "react", "javascript", "python", "css", "html"],
    color: "purple"
  },
  "Work & Docs": {
    domains: ["docs.google.com", "notion.so", "trello.com", "slack.com", "figma.com", "miro.com", "zoom.us", "meet.google.com"],
    keywords: ["document", "spreadsheet", "presentation", "meeting", "dashboard", "workspace"],
    color: "blue"
  },
  "Media & Entertainment": {
    domains: ["youtube.com", "netflix.com", "spotify.com", "twitch.tv", "hulu.com", "disneyplus.com", "vimeo.com"],
    keywords: ["video", "music", "stream", "movie", "watch"],
    color: "red"
  },
  "Social": {
    domains: ["twitter.com", "x.com", "reddit.com", "linkedin.com", "facebook.com", "instagram.com", "tiktok.com", "discord.com"],
    keywords: ["social", "feed", "profile", "post", "tweet"],
    color: "pink"
  },
  "Shopping": {
    domains: ["amazon.com", "ebay.com", "aliexpress.com", "etsy.com", "walmart.com", "target.com"],
    keywords: ["buy", "shop", "cart", "store", "product", "price"],
    color: "yellow"
  },
  "Research & Search": {
    domains: ["google.com", "bing.com", "duckduckgo.com", "wikipedia.org", "scholar.google.com", "arxiv.org"],
    keywords: ["search", "wiki", "research", "paper", "journal", "definition"],
    color: "cyan"
  },
  "Finance": {
    domains: ["paypal.com", "chase.com", "bankofamerica.com", "wellsfargo.com", "robinhood.com", "coinbase.com"],
    keywords: ["bank", "pay", "finance", "crypto", "stock", "portfolio"],
    color: "green"
  }
};

/**
 * Given a URL and title, categorizes the tab and returns { title, color } for the Chrome Tab Group.
 */
export function categorizeTab(urlStr, title) {
  try {
    const url = new URL(urlStr);
    const domain = url.hostname.replace(/^www\./, '').toLowerCase();
    const textToSearch = (title + " " + url.pathname).toLowerCase();

    // 1. Check direct domain matches
    for (const [catName, rule] of Object.entries(categoryRules)) {
      if (rule.domains.some(d => domain.includes(d))) {
        return { title: catName, color: rule.color };
      }
    }

    // 2. Check keyword matches in title or path
    for (const [catName, rule] of Object.entries(categoryRules)) {
      if (rule.keywords.some(kw => textToSearch.includes(kw))) {
        return { title: catName, color: rule.color };
      }
    }
  } catch (e) {
    console.error("Invalid URL:", urlStr);
  }

  // 3. Fallback: return generic group
  return { title: "Other", color: "grey" };
}

export function getAvailableCategories() {
  return Object.keys(categoryRules);
}
