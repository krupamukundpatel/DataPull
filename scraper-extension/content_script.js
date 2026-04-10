// content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    autoScrollAndExtract()
      .then(content => sendResponse({ success: true, data: content }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function autoScrollAndExtract() {
  await autoScroll();
  await wait(1000);
  return extractPageContent();
}

async function autoScroll() {
  return new Promise((resolve) => {
    const distance = 200;
    const maxScrolls = 50;
    let scrollCount = 0;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      scrollCount++;
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 100;
      if (scrolledToBottom || scrollCount >= maxScrolls) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 400);
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCleanBody() {
  const clone = document.body.cloneNode(true);
  const junkSelectors = [
    "nav", "header", "footer",
    "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    ".nav", ".navbar", ".navigation", ".menu", ".sidebar",
    ".footer", ".header", ".cookie", ".cookie-banner", ".cookie-notice",
    ".ad", ".ads", ".advertisement", ".promo", ".popup", ".modal",
    ".breadcrumb", ".breadcrumbs",
    ".social", ".social-links", ".share", ".share-buttons",
    "#nav", "#header", "#footer", "#sidebar", "#menu", "#cookie",
    "script", "style", "noscript", "iframe", "svg"
  ];
  junkSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  return clone;
}

function extractSmartItems() {
  try {
    const results = [];
    const seen = new Set();
    const selectors = [
      '[data-component-type="s-search-result"]',
      '[data-asin]',
      '.s-result-item',
      'article',
      '[class*="product"]',
      '[class*="item"]',
      '[class*="card"]',
      '[class*="result"]',
      '[class*="listing"]',
      '[class*="tile"]',
      'li[class]',
    ];
    const elements = document.querySelectorAll(selectors.join(","));
    if (!elements) return [];
    elements.forEach(el => {
      try {
        const nameEl = el.querySelector("h2, h3, h4, a[title], [class*='title'], [class*='name']");
        const name = nameEl?.innerText?.trim() || "";
        const priceRegex = /[₹$£€]\s?[\d,]+(\.\d{2})?/;
        const allText = el.innerText || "";
        const priceMatch = allText.match(priceRegex);
        const price = priceMatch ? priceMatch[0].trim() : "N/A";
        const ratingEl = el.querySelector("[aria-label*='star'], [class*='rating'], [class*='star'], [class*='ratingGroup'], span[class*='ipc-rating']");
        const rating = ratingEl?.innerText?.trim() || ratingEl?.getAttribute("aria-label")?.match(/[\d.]+/)?.[0] || "N/A";
        if (name && name.length > 3 && !seen.has(name)) {
          seen.add(name);
          results.push({ name, price, rating });
        }
      } catch(e) {}
    });
    return results;
  } catch(e) {
    return [];
  }
}

function extractPageContent() {
  const title = document.title || "";
  const url = window.location.href;
  const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
  const cleanBody = getCleanBody();

  const headings = [];
  cleanBody.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
    const text = el.innerText?.trim();
    if (text && text.length > 1 && text.length < 200) {
      headings.push({ tag: el.tagName, text });
    }
  });

  const seenLinks = new Set();
  const links = [];
  cleanBody.querySelectorAll("a[href]").forEach(el => {
    const text = el.innerText?.trim();
    const href = el.href;
    if (text && text.length > 2 && href && !href.startsWith("javascript") && !seenLinks.has(text)) {
      seenLinks.add(text);
      links.push({ text, href });
    }
  });

  const tables = [];
  cleanBody.querySelectorAll("table").forEach(table => {
    const rows = [];
    table.querySelectorAll("tr").forEach(row => {
      const cells = [];
      row.querySelectorAll("th, td").forEach(cell => {
        const text = cell.innerText?.trim();
        if (text) cells.push(text);
      });
      if (cells.length) rows.push(cells);
    });
    if (rows.length) tables.push(rows);
  });

  const smartItems = extractSmartItems() || [];
  const smartText = smartItems.length > 0
    ? smartItems.map(i => `${i.name} | ${i.price} | Rating: ${i.rating}`).join("\n")
    : "";
  const bodyText = document.body?.innerText?.trim().slice(0, 3000) || "";

  return {
    title, url, metaDesc, headings,
    links: links.slice(0, 50),
    tables,
    smartItems,
    smartText,
    bodyText,
    timestamp: new Date().toISOString()
  };
}