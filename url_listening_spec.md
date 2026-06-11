# Technical Specification: SPA URL Hash-Routing & State Persistence

This document explains the architecture, routing schemas, and event listeners used on the Lumina Atelier demo website to enable dedicated product page routing while maintaining persistent Salesforce chat integrations.

---

## 1. Architectural Challenge & Solution
Standard web applications reload the entire page when navigating to a new URL (e.g., `index.html` to `product.html`). 

### The Problem
If a customer is engaged in a live chat conversation with a Salesforce Agentforce specialist, a full page reload wipes the in-memory JavaScript state, tears down the iframe containing the Salesforce Embedded Messaging bootstrap, and terminates the active socket connection. The user's active session is lost.

### The Solution: SPA Hash-Routing
Instead of loading a new file, we use **Single Page Application (SPA) routing based on the URL hash** (`window.location.hash`). 
- Navigation changes the URL hash (e.g., from `#` to `#/product/prod-1`).
- The browser triggers a `hashchange` event without reloading the page.
- Our JavaScript intercepts the change, updates the visible sections of the DOM, and dynamically renders the product details.
- **Result**: The Salesforce chat widget remains completely uninterrupted in the DOM, preserving the user's active conversation.

---

## 2. URL Routing Schema

The router listens to the following URL hash patterns:

| Hash pattern | Target View | DOM State |
| :--- | :--- | :--- |
| `#` or `""` (Empty) | Homepage / Catalog | Home sections visible, detail section hidden and emptied. |
| `#/product/:id` | Dedicated Product Page | Detail section populated and visible; Home sections hidden. |
| `#carousel-section` | Homepage Catalog anchor | Home sections visible; browser scrolls to catalog. |
| `#highlight-section` | Homepage Highlights anchor | Home sections visible; browser scrolls to highlights. |

---

## 3. Implementation Code Flow

### A. Registering the Listeners
On page load, we initialize the router and bind the `hashchange` window listener inside the `DOMContentLoaded` block in [app.js](file:///c:/Users/abcth/OneDrive/Documents/Antigravity/Jewelry%20Website/app.js):

```javascript
document.addEventListener("DOMContentLoaded", () => {
  initProducts();
  initCart();
  renderAll();
  setupEventListeners();
  setupSalesforceListeners();
  
  // Initialize SPA router
  handleRouting();
  window.addEventListener("hashchange", handleRouting);
});
```

### B. Routing Handler (`handleRouting`)
The `handleRouting` function acts as the traffic controller. It hides or displays DOM containers dynamically:

```javascript
function handleRouting() {
  const hash = window.location.hash;
  const productDetailSection = document.getElementById("productDetailSection");
  const heroBanner = document.getElementById("heroBanner");
  const carouselSection = document.getElementById("carousel-section");
  const highlightSection = document.getElementById("highlight-section");

  if (!productDetailSection) return;

  // Pattern Match for Product Page
  if (hash.startsWith("#/product/")) {
    const productId = hash.replace("#/product/", "");
    const product = products.find(p => p.id === productId);

    if (product) {
      // 1. Hide homepage containers
      if (heroBanner) heroBanner.style.display = "none";
      if (carouselSection) carouselSection.style.display = "none";
      if (highlightSection) highlightSection.style.display = "none";

      // 2. Show details container
      productDetailSection.style.display = "block";

      // 3. Render the templates
      renderProductDetail(product);

      // 4. Force scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Fallback if ID is invalid
      window.location.hash = "#";
    }
  } else {
    // Restore homepage containers
    if (heroBanner) heroBanner.style.display = "block";
    if (carouselSection) carouselSection.style.display = "block";
    if (highlightSection) highlightSection.style.display = "block";

    // Hide detail template
    productDetailSection.style.display = "none";
    productDetailSection.innerHTML = "";

    // Smooth scroll helper for standard anchor targets
    if (hash && hash !== "#" && hash.startsWith("#")) {
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }
}
```

---

## 4. Agentforce Interaction Mapping

Because routing is driven entirely by URL hashes, the background **Agentforce Event Parser** (`handleAgentMessage` in `app.js`) can easily navigate users to product pages. 

If the agent recommends a product or detects a product mention, it triggers:

```javascript
function highlightProductInUI(productId, productName) {
  // Directly updates the hash, causing the routing function to fire automatically
  window.location.hash = `#/product/${productId}`;
  
  // Highlight the product detail page once it has loaded
  setTimeout(() => {
    const detailContainer = document.querySelector(".product-detail-grid");
    if (detailContainer) {
      detailContainer.classList.add("agent-highlighted");
      showToast(`Agent suggested: ${productName}`, "success");
      
      setTimeout(() => {
        detailContainer.classList.remove("agent-highlighted");
      }, 5000);
    }
  }, 300);
}
```

---

## 5. Benefits for the Development Team

1. **Static Hosting Compatibility**: Because the routing is managed strictly client-side via hashes, this codebase can be hosted on simple, low-cost static hosts (like Google Cloud Storage buckets, AWS S3, or GitHub Pages) without needing a server to configure reverse proxies or redirection fallback rules (e.g., SPA rewrites to `index.html`).
2. **SEO & Indexing friendly**: Search engines index pages with hashbangs or query states, and breadcrumbs are fully structured in HTML.
3. **Decoupled Components**: Homepage blocks and detail blocks exist as independent DOM sections. They can be styled and refactored separately without risking layout collision.
