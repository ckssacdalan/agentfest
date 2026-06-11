// --- Default Catalog Database using User's Uploaded Images ---
const DEFAULT_PRODUCTS = [
  {
    id: "prod-1",
    name: "Gold Solitaire Diamond Ring",
    price: 4500,
    category: "Rings",
    description: "A brilliant round solitaire diamond set in an elegant 18k yellow gold band. A timeless symbol of love.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug.png",
    keywords: "ring, solitaire, diamond, engagement, gold ring",
    highlighted: true
  },
  {
    id: "prod-2",
    name: "Platinum Diamond Halo Ring",
    price: 5800,
    category: "Rings",
    description: "A stunning round-cut diamond framed by a delicate halo of sparkling micro-pavé diamonds on a polished platinum band.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (1).png",
    keywords: "halo, halo ring, platinum ring, diamond ring",
    highlighted: true
  },
  {
    id: "prod-3",
    name: "Gold Three-Stone Ring",
    price: 6400,
    category: "Rings",
    description: "An exquisite round-cut diamond flanked by two matching side diamonds on an 18k yellow gold band, representing past, present, and future.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (2).png",
    keywords: "three-stone, side stones, gold band, three stone ring",
    highlighted: false
  },
  {
    id: "prod-4",
    name: "Platinum Pavé Diamond Band",
    price: 3200,
    category: "Rings",
    description: "A half-eternity wedding band encrusted with three rows of brilliant pavé-set diamonds in polished platinum.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (3).png",
    keywords: "pavé, wedding band, diamond band, platinum band",
    highlighted: true
  },
  {
    id: "prod-5",
    name: "Gold Eternity Diamond Ring",
    price: 4200,
    category: "Rings",
    description: "A solid 18k yellow gold eternity band set with a continuous circle of brilliant-cut diamonds, symbolizing eternal devotion.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (4).png",
    keywords: "eternity, eternity band, gold ring, full eternity",
    highlighted: false
  },
  {
    id: "prod-6",//id
    name: "Marquise Cut Solitaire Ring",
    price: 5500,
    category: "Rings",
    description: "A striking marquise-cut diamond set in a classic four-prong platinum band to elongate the finger and capture light.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (5).png",
    keywords: "marquise, marquise ring, solitaire, marquise cut",
    highlighted: false
  },
  {
    id: "prod-7",
    name: "Princess Cut Solitaire Ring",
    price: 4900,
    category: "Rings",
    description: "A classic princess-cut square diamond mounted on a sleek 18k yellow gold band for a modern, architectural look.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (6).png",
    keywords: "princess, princess cut, square diamond, solitaire",
    highlighted: false
  },
  {
    id: "prod-8",
    name: "Cushion Cut Halo Ring",
    price: 6100,
    category: "Rings",
    description: "A soft cushion-cut diamond bordered by a sparkling halo of diamonds, set on a thin platinum band.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (7).png",
    keywords: "cushion, cushion cut, halo ring, cushion halo",
    highlighted: false
  },
  {
    id: "prod-9",
    name: "Vintage Filigree Bezel Ring",
    price: 3800,
    category: "Rings",
    description: "An intricate, antique-inspired gold ring featuring filigree details and an octagonal bezel-set diamond.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (8).png",
    keywords: "vintage, filigree, bezel, octagonal, bezel ring",
    highlighted: false
  },
  {
    id: "prod-10",
    name: "Bezel Solitaire Platinum Ring",
    price: 4700,
    category: "Rings",
    description: "A contemporary round solitaire diamond encased in a protective, modern bezel setting on a polished platinum band.",
    image: "images/Gemini_Generated_Image_qiugelqiugelqiug (9).png",
    keywords: "bezel, solitaire, round bezel, platinum, bezel set",
    highlighted: false
  },
  {
    id: "ENGRAVE-05",
    name: "Engraving services 05",
    price: 250,
    category: "Services",
    description: "Create a lasting memory with personalized ring engraving up to 5 characters.",
    image: "engraving.png",
    keywords: "engraving, service, extra",
    highlighted: false
  }
];

// --- Application State ---
let products = [];
let agentforceProducts = [];
let cart = [];
let activeDiscount = 0; // percentage, e.g. 15 for 15%
let activeDiscountCode = "";
let editingProductId = null;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
  initProducts();
  initAgentforceProducts();
  initCart();
  renderAll();
  setupEventListeners();
  
  // Initialize SPA router
  handleRouting();
  window.addEventListener("hashchange", handleRouting);
});

// --- Catalog Database Operations (CRUD) ---
function initProducts() {
  const stored = localStorage.getItem("lumina_products");
  let needsReset = false;
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Force reset if catalog doesn't contain exactly 10 products, doesn't use Gemini images, or has non-ring categories
      const hasNonRing = Array.isArray(parsed) && parsed.some(p => p.category !== "Rings");
      if (!Array.isArray(parsed) || parsed.length !== 10 || !parsed[0].image.includes("Gemini_Generated") || hasNonRing) {
        needsReset = true;
      } else {
        products = parsed;
      }
    } catch (e) {
      console.error("Error parsing stored products, resetting to defaults", e);
      needsReset = true;
    }
  } else {
    needsReset = true;
  }

  if (needsReset) {
    products = [...DEFAULT_PRODUCTS];
    localStorage.setItem("lumina_products", JSON.stringify(products));
  }
}

window.resetCatalogToDefaults = function() {
  if (confirm("This will clear any changes you made and restore the 10 default products with your images. Proceed?")) {
    products = [...DEFAULT_PRODUCTS];
    saveProducts();
    showToast("Catalog reset to 10 default products!", "success");
    clearAdminForm();
  }
};

function saveProducts() {
  localStorage.setItem("lumina_products", JSON.stringify(products));
  renderAll();
}

function initAgentforceProducts() {
  const stored = localStorage.getItem("lumina_agentforce_products");
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    agentforceProducts = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    agentforceProducts = [];
  }
}

function saveAgentforceProducts() {
  localStorage.setItem("lumina_agentforce_products", JSON.stringify(agentforceProducts));
}

function findProductByCode(productCode) {
  const normalized = String(productCode || "").trim().toLowerCase();
  if (!normalized) return null;

  return [...products, ...agentforceProducts].find(product =>
    String(product.id || "").toLowerCase() === normalized ||
    String(product.productCode || "").toLowerCase() === normalized
  ) || null;
}

function isServiceProduct(product) {
  return String(product?.category || product?.family || "").toLowerCase() === "services";
}

function formatAgentforceServiceName(productCode) {
  return String(productCode || "engraving-service")
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function upsertAgentforceServiceProduct(productCode, details = {}) {
  const normalizedCode = String(productCode || "").trim();
  if (!normalizedCode) return null;

  const existing = findProductByCode(normalizedCode);
  if (existing) return existing;

  const serviceProduct = {
    id: normalizedCode,
    productCode: normalizedCode,
    name: details.name || "Engraving Service",
    price: Number.isFinite(Number(details.price)) ? Number(details.price) : 0,
    category: "Services",
    family: "Services",
    description: details.description || `${formatAgentforceServiceName(normalizedCode)} added by Agentforce.`,
    image: "",
    keywords: "engraving, personalization, services",
    highlighted: false,
    source: "agentforce"
  };

  agentforceProducts.push(serviceProduct);
  saveAgentforceProducts();
  return serviceProduct;
}

function addProduct(productData) {
  const newProduct = {
    id: "prod-" + Date.now(),
    name: productData.name,
    price: parseFloat(productData.price) || 0,
    category: productData.category,
    description: productData.description || "",
    image: productData.image || "",
    keywords: productData.keywords || "",
    highlighted: !!productData.highlighted
  };
  products.push(newProduct);
  saveProducts();
  showToast(`Added Product: ${newProduct.name}`, "success");
}

function updateProduct(id, productData) {
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = {
      ...products[idx],
      name: productData.name,
      price: parseFloat(productData.price) || 0,
      category: productData.category,
      description: productData.description || "",
      image: productData.image || "",
      keywords: productData.keywords || "",
      highlighted: !!productData.highlighted
    };
    saveProducts();
    showToast(`Updated Product: ${productData.name}`, "success");
  }
}

function deleteProduct(id) {
  const p = products.find(p => p.id === id);
  if (p) {
    products = products.filter(prod => prod.id !== id);
    // Also remove from cart if present
    removeFromCart(id);
    saveProducts();
    showToast(`Deleted Product: ${p.name}`);
  }
}

// --- Cart Operations ---
function initCart() {
  const stored = localStorage.getItem("lumina_cart");
  if (stored) {
    try {
      cart = JSON.parse(stored);
      updateCartCount();
    } catch (e) {
      cart = [];
    }
  }

  const storedDiscount = localStorage.getItem("lumina_active_discount");
  if (storedDiscount) {
    try {
      const parsed = JSON.parse(storedDiscount);
      activeDiscount = Number(parsed?.percent) || 0;
      activeDiscountCode = parsed?.code || "";
    } catch (e) {
      activeDiscount = 0;
      activeDiscountCode = "";
    }
  }
}

function saveCart() {
  localStorage.setItem("lumina_cart", JSON.stringify(cart));
  localStorage.setItem("lumina_active_discount", JSON.stringify({
    percent: activeDiscount,
    code: activeDiscountCode
  }));
  updateCartCount();
  renderCartDrawer();
}

function addToCart(productId, quantity = 1, silent = false, metal = null, size = null, source = null) {
  const product = findProductByCode(productId);
  if (!product) return;

  const productKey = product.id || product.productCode || productId;
  const itemSource = source || product.source || "storefront";
  const itemMetal = isServiceProduct(product) ? "Service" : (metal || (product.name.toLowerCase().includes("platinum") ? "Platinum" : "18K Yellow Gold"));
  const itemSize = isServiceProduct(product) ? "N/A" : (size || "7");

  const cartItem = cart.find(item => 
    item.productId === productKey && 
    item.metal === itemMetal && 
    item.size === itemSize
  );

  if (cartItem) {
    cartItem.quantity += quantity;
    if (itemSource === "agentforce") {
      cartItem.source = itemSource;
    }
  } else {
    cart.push({
      productId: productKey,
      quantity: quantity,
      metal: itemMetal,
      size: itemSize,
      source: itemSource
    });
  }
  saveCart();
  
  if (!silent) {
    const optionLabel = isServiceProduct(product) ? "" : ` (${itemMetal}, Size ${itemSize})`;
    showToast(`Added ${product.name}${optionLabel} to Cart`, "success");
    openCart();
    // Animate cart badge
    const badge = document.querySelector(".cart-count");
    if (badge) {
      badge.classList.remove("cart-bounce");
      void badge.offsetWidth; // trigger reflow
      badge.classList.add("cart-bounce");
    }
  }
}

function changeQty(productId, metal, size, change) {
  const item = cart.find(i => 
    i.productId === productId && 
    i.metal === metal && 
    i.size === size
  );
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    removeFromCart(productId, metal, size);
  } else {
    saveCart();
  }
}

function removeFromCart(productId, metal = null, size = null) {
  if (metal && size) {
    cart = cart.filter(item => 
      !(item.productId === productId && item.metal === metal && item.size === size)
    );
  } else {
    cart = cart.filter(item => item.productId !== productId);
  }
  saveCart();
}

function updateCartCount() {
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.querySelector(".cart-count");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

function applyPromoCode(code) {
  const normalized = code.trim().toUpperCase();
  if (normalized === "WELCOME15" || normalized === "AGENT15") {
    activeDiscount = 15;
    activeDiscountCode = normalized;
    saveCart();
    showToast(`15% Discount Applied! (${normalized})`, "success");
    return true;
  } else {
    showToast("Invalid Promo Code", "error");
    return false;
  }
}

function removePromoCode() {
  activeDiscount = 0;
  activeDiscountCode = "";
  saveCart();
  showToast("Promo Code Removed");
}

// --- Detail Option Variables & Helpers ---
let detailSelectedMetal = "18K Yellow Gold";
let detailSelectedSize = "7";

function getAdjustedPrice(product, metal) {
  if (isServiceProduct(product)) {
    return Number(product.price) || 0;
  }

  const isBasePlatinum = product.name.toLowerCase().includes("platinum");
  if (metal === "Platinum" && !isBasePlatinum) {
    return product.price + 1200;
  }
  if (metal === "18K Yellow Gold" && isBasePlatinum) {
    return product.price - 1200;
  }
  return product.price;
}

// --- SPA Hash Router ---
function handleRouting() {
  const hash = window.location.hash;
  const productRouteMatch = hash.match(/^#\/?product\/([^/?#]+)/);
  const recommendedRouteMatch = hash.match(/^#\/?recommended\/(.+)/);
  const legacyRecommendationRouteMatch = hash.match(/^#\/?recommendation\/(.+)/);
  const productDetailSection = document.getElementById("productDetailSection");
  const heroBanner = document.getElementById("heroBanner");
  const carouselSection = document.getElementById("carousel-section");
  const highlightSection = document.getElementById("highlight-section");

  if (!productDetailSection) return;

  if (productRouteMatch) {
    const productId = decodeURIComponent(productRouteMatch[1]);
    const product = findProductByCode(productId);

    if (product && !isServiceProduct(product)) {
      // Hide home sections
      if (heroBanner) heroBanner.style.display = "none";
      if (carouselSection) carouselSection.style.display = "none";
      if (highlightSection) highlightSection.style.display = "none";

      // Show detail section
      productDetailSection.style.display = "block";

      // Render detail view
      renderProductDetail(product);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = "#";
    }
  } else if (recommendedRouteMatch || legacyRecommendationRouteMatch) {
    const routeMatch = recommendedRouteMatch || legacyRecommendationRouteMatch;
    const recommendedProductCodes = routeMatch[1]
      .split("/")
      .map(productCode => decodeURIComponent(productCode).trim())
      .filter(Boolean);
    const recommendedProducts = recommendedProductCodes
      .map(productCode => findProductByCode(productCode))
      .filter(product => product && !isServiceProduct(product));

    if (recommendedProducts.length > 0) {
      if (heroBanner) heroBanner.style.display = "none";
      if (carouselSection) carouselSection.style.display = "none";
      if (highlightSection) highlightSection.style.display = "none";

      productDetailSection.style.display = "block";
      renderRecommendedProducts(recommendedProducts);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = "#";
    }
  } else {
    // Show home sections
    if (heroBanner) heroBanner.style.display = "block";
    if (carouselSection) carouselSection.style.display = "block";
    if (highlightSection) highlightSection.style.display = "block";

    // Hide detail section
    productDetailSection.style.display = "none";
    productDetailSection.innerHTML = "";

    // If there was an anchor hash, scroll to it
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

function renderRecommendedProducts(recommendedProducts) {
  const container = document.getElementById("productDetailSection");
  if (!container) return;

  const primaryProduct = recommendedProducts[0];
  const initials = getInitials(primaryProduct.name);
  const totalPrice = recommendedProducts.reduce((sum, product) => sum + getAdjustedPrice(product, product.name.toLowerCase().includes("platinum") ? "Platinum" : "18K Yellow Gold"), 0);

  container.innerHTML = `
    <div class="breadcrumbs container">
      <a href="#">Home</a> &gt; <a href="#carousel-section">Fine Jewelry</a> &gt; <span>Recommended Rings</span>
    </div>

    <div class="container recommended-detail-grid agent-highlighted">
      <div class="recommended-gallery">
        <div class="recommended-thumb-rail" id="recommendedThumbRail">
          ${recommendedProducts.map((product, index) => `
            <button class="recommended-thumb-btn ${index === 0 ? "active" : ""}" data-product-id="${product.id}" aria-label="View ${product.name}">
              <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <span class="recommended-thumb-fallback" style="display:none;">${getInitials(product.name)}</span>
            </button>
          `).join("")}
        </div>
        <div class="recommended-main-image-wrapper">
          <img src="${primaryProduct.image}" alt="${primaryProduct.name}" id="recommendedMainImg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="card-img-fallback" style="display:none; font-size: 2rem;">
            <div class="fallback-icon">âœ¦</div>
            <div class="fallback-initials" id="recommendedFallbackInitials">${initials}</div>
            <div style="font-size: 1rem; text-transform: uppercase; opacity: 0.7;">Lumina Fine</div>
          </div>
        </div>
      </div>

      <div class="recommended-info">
        <span class="detail-brand-header">AGENTFORCE SELECTION</span>
        <h1 class="detail-product-title">Recommended Rings</h1>
        <div class="detail-product-price">From $${Math.min(...recommendedProducts.map(product => product.price)).toLocaleString()}</div>
        <p class="recommended-copy">A curated set of rings selected for your request. Review each option, then open the ring you want to configure size and metal.</p>

        <hr class="detail-divider">

        <div class="recommended-product-list" id="recommendedProductList">
          ${recommendedProducts.map((product, index) => `
            <button class="recommended-product-row ${index === 0 ? "active" : ""}" data-product-id="${product.id}">
              <span>
                <strong>${product.name}</strong>
                <small>${product.description}</small>
              </span>
              <em>$${product.price.toLocaleString()}</em>
            </button>
          `).join("")}
        </div>

        <div class="recommended-actions">
          <a class="btn-primary recommended-primary-link" id="recommendedPrimaryLink" href="#product/${primaryProduct.id}">View Selected Ring</a>
          <button class="btn-form cancel" id="btnAddAllRecommended">Add All Recommendations</button>
        </div>

        <div class="detail-services-notice">
          <p>Total recommendation value: $${totalPrice.toLocaleString()}</p>
          <p>Agentforce discount is applied only after an Agentforce add-to-cart action.</p>
        </div>
      </div>
    </div>
  `;

  const setActiveRecommendedProduct = productId => {
    const product = findProductByCode(productId);
    if (!product) return;

    const mainImg = document.getElementById("recommendedMainImg");
    const fallbackInitials = document.getElementById("recommendedFallbackInitials");
    const primaryLink = document.getElementById("recommendedPrimaryLink");

    if (mainImg) {
      mainImg.style.display = "";
      mainImg.src = product.image;
      mainImg.alt = product.name;
    }
    if (fallbackInitials) fallbackInitials.textContent = getInitials(product.name);
    if (primaryLink) primaryLink.href = `#product/${product.id}`;

    document.querySelectorAll(".recommended-thumb-btn, .recommended-product-row").forEach(element => {
      element.classList.toggle("active", element.getAttribute("data-product-id") === product.id);
    });
  };

  container.querySelectorAll(".recommended-thumb-btn, .recommended-product-row").forEach(element => {
    element.addEventListener("click", () => setActiveRecommendedProduct(element.getAttribute("data-product-id")));
  });

  document.getElementById("btnAddAllRecommended")?.addEventListener("click", () => {
    recommendedProducts.forEach(product => addToCart(product.id, 1, true));
    showToast("Added recommended rings to Cart", "success");
    openCart();
  });
}

// --- Render Product Detail Page (David Yurman Inspired) ---
function renderProductDetail(product) {
  const container = document.getElementById("productDetailSection");
  if (!container) return;

  if (product.name.toLowerCase().includes("platinum")) {
    detailSelectedMetal = "Platinum";
  } else {
    detailSelectedMetal = "18K Yellow Gold";
  }
  detailSelectedSize = "7";

  const renderContent = () => {
    const adjustedPrice = getAdjustedPrice(product, detailSelectedMetal);
    const initials = getInitials(product.name);
    
    // Breadcrumbs
    const breadcrumbs = `
      <div class="breadcrumbs container">
        <a href="#">Home</a> &gt; <a href="#carousel-section">Fine Jewelry</a> &gt; <a href="#carousel-section">Rings</a> &gt; <span>${product.name}</span>
      </div>
    `;

    // Premium Split Page Layout
    container.innerHTML = `
      ${breadcrumbs}
      <div class="container product-detail-grid">
        <!-- Left Column: Gallery -->
        <div class="detail-gallery">
          <div class="detail-main-image-wrapper">
            <img src="${product.image}" alt="${product.name}" id="detailMainImg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="card-img-fallback" style="display:none; font-size: 2rem;">
              <div class="fallback-icon">✦</div>
              <div class="fallback-initials">${initials}</div>
              <div style="font-size: 1rem; text-transform: uppercase; opacity: 0.7;">Lumina Fine</div>
            </div>
          </div>
          <div class="detail-thumbnails">
            <button class="thumb-btn active" data-zoom="1" aria-label="View main ring">
              <img src="${product.image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Main View">
              <span style="display:none; font-size:12px; font-weight:bold;">✦</span>
            </button>
            <button class="thumb-btn" data-zoom="1.4" aria-label="View close up detail">
              <img src="${product.image}" style="transform: scale(1.4);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Closeup Detail">
              <span style="display:none; font-size:12px; font-weight:bold;">🔎</span>
            </button>
            <button class="thumb-btn" data-zoom="Atelier" aria-label="View atelier render">
              <img src="${product.image}" style="filter: sepia(0.6) brightness(0.9);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Atelier Style">
              <span style="display:none; font-size:12px; font-weight:bold;">🎨</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Sticky Product Info -->
        <div class="detail-info">
          <span class="detail-brand-header">LUMINA ATELIER</span>
          <h1 class="detail-product-title">${product.name}</h1>
          <div class="detail-product-price" id="detailProductPrice">$${adjustedPrice.toLocaleString()}</div>
          
          <hr class="detail-divider">

          <!-- Option 1: Metal Choice -->
          <div class="detail-option-group">
            <span class="detail-option-label">Metal: <strong id="detailMetalLabel">${detailSelectedMetal}</strong></span>
            <div class="detail-metal-swatches">
              <button class="metal-swatch gold ${detailSelectedMetal === '18K Yellow Gold' ? 'active' : ''}" data-metal="18K Yellow Gold" title="18K Yellow Gold" aria-label="Select 18K Yellow Gold Finish"></button>
              <button class="metal-swatch platinum ${detailSelectedMetal === 'Platinum' ? 'active' : ''}" data-metal="Platinum" title="Platinum" aria-label="Select Platinum Finish"></button>
            </div>
          </div>

          <!-- Option 2: Size Choice -->
          <div class="detail-option-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span class="detail-option-label" style="margin-bottom:0;">Size: <strong id="detailSizeLabel">${detailSelectedSize}</strong></span>
              <button class="size-guide-link" id="btnSizeGuide">Size Guide</button>
            </div>
            <div class="detail-size-pills">
              ${[5, 6, 7, 8, 9, 10, 11].map(sz => `
                <button class="size-pill ${sz == detailSelectedSize ? 'active' : ''}" data-size="${sz}">${sz}</button>
              `).join("")}
            </div>
          </div>

          <!-- Add to Bag CTA -->
          <button class="btn-primary btn-add-to-bag-pdp" id="btnAddToBagPDP">
            ADD TO BAG
          </button>
          
          <div class="detail-services-notice">
            <p>✦ Complimentary Overnight Shipping & Signature-Required Delivery</p>
            <p>✦ Complimentary Gift Packaging & Personal Greeting Card</p>
          </div>

          <hr class="detail-divider">

          <!-- Accordions -->
          <div class="detail-accordions">
            <div class="detail-accordion">
              <button class="accordion-header" aria-expanded="false" aria-controls="acc-desc">
                <span>Description & Details</span>
                <span class="accordion-icon">+</span>
              </button>
              <div id="acc-desc" class="accordion-content">
                <div class="accordion-inner">
                  <p>${product.description || 'A stunning custom creation from the Lumina Atelier catalog, designed to maximize sparkle and brilliance.'}</p>
                  <ul class="accordion-bullets">
                    <li>Conflict-free certified diamonds</li>
                    <li>Band width: 2.2mm</li>
                    <li>Hand-engraved Lumina hallmark</li>
                    <li>Customizable metals and sizing</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="detail-accordion">
              <button class="accordion-header" aria-expanded="false" aria-controls="acc-craft">
                <span>The Atelier Craftsmanship</span>
                <span class="accordion-icon">+</span>
              </button>
              <div id="acc-craft" class="accordion-content">
                <div class="accordion-inner">
                  <p>Each Lumina Atelier ring is carefully designed and hand-finished by master jewelers. Our diamonds are selected for their fire and clarity, set under microscopes to guarantee structural integrity and maximum light return.</p>
                </div>
              </div>
            </div>

            <div class="detail-accordion">
              <button class="accordion-header" aria-expanded="false" aria-controls="acc-ship">
                <span>Shipping & Returns</span>
                <span class="accordion-icon">+</span>
              </button>
              <div id="acc-ship" class="accordion-content">
                <div class="accordion-inner">
                  <p>We provide free secure shipping on all orders. Returns and size exchanges are accepted within 30 days of delivery. All returns must be unworn and in original packaging.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendation Carousel -->
      <section class="recommendations-section">
        <div class="container">
          <h3 class="recommendations-title">You May Also Like</h3>
          <div class="recommendations-grid" id="recommendationsGrid"></div>
        </div>
      </section>
    `;

    // Render recommendation rings
    const recsGrid = document.getElementById("recommendationsGrid");
    if (recsGrid) {
      const remainingProducts = products.filter(p => p.id !== product.id).slice(0, 4);
      if (remainingProducts.length === 0) {
        recsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-secondary);">Explore more premium designs in the catalog.</p>`;
      } else {
        recsGrid.innerHTML = remainingProducts.map(p => {
          const initials = getInitials(p.name);
          const imgHTML = getProductImageHTML(p.image, initials);
          return `
            <div class="recommendation-card">
              <a href="#product/${p.id}">
                <div class="rec-img-wrapper">
                  ${imgHTML}
                </div>
                <h4 class="rec-title">${p.name}</h4>
                <p class="rec-price">$${p.price.toLocaleString()}</p>
              </a>
            </div>
          `;
        }).join("");
      }
    }

    // Set up gallery zoom / thumbnail swap
    const detailMainImg = document.getElementById("detailMainImg");
    const thumbBtns = container.querySelectorAll(".thumb-btn");
    thumbBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        thumbBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const zoom = btn.getAttribute("data-zoom");
        if (zoom === "1") {
          detailMainImg.style.transform = "scale(1)";
          detailMainImg.style.filter = "none";
        } else if (zoom === "1.4") {
          detailMainImg.style.transform = "scale(1.4)";
          detailMainImg.style.filter = "none";
        } else if (zoom === "Atelier") {
          detailMainImg.style.transform = "scale(1)";
          detailMainImg.style.filter = "sepia(0.6) brightness(0.9)";
        }
      });
    });

    // Set up Swatches selection
    const swatches = container.querySelectorAll(".metal-swatch");
    swatches.forEach(swatch => {
      swatch.addEventListener("click", () => {
        swatches.forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        
        detailSelectedMetal = swatch.getAttribute("data-metal");
        document.getElementById("detailMetalLabel").textContent = detailSelectedMetal;
        
        // Update Price UI dynamically
        const newPrice = getAdjustedPrice(product, detailSelectedMetal);
        document.getElementById("detailProductPrice").textContent = `$${newPrice.toLocaleString()}`;
      });
    });

    // Set up Size selection
    const sizePills = container.querySelectorAll(".size-pill");
    sizePills.forEach(pill => {
      pill.addEventListener("click", () => {
        sizePills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        
        detailSelectedSize = pill.getAttribute("data-size");
        document.getElementById("detailSizeLabel").textContent = detailSelectedSize;
      });
    });

    // Size Guide link
    const btnSizeGuide = document.getElementById("btnSizeGuide");
    if (btnSizeGuide) {
      btnSizeGuide.addEventListener("click", () => {
        alert("Ring Size Guide:\n\nTo find your perfect ring size, wrap a strip of paper around your finger and measure the length in millimeters.\n\nSize 5: 49.3mm\nSize 6: 51.9mm\nSize 7: 54.4mm\nSize 8: 57.0mm\nSize 9: 59.5mm\nSize 10: 62.1mm\nSize 11: 64.6mm");
      });
    }

    // Add to Bag CTA
    const btnAddToBag = document.getElementById("btnAddToBagPDP");
    if (btnAddToBag) {
      btnAddToBag.addEventListener("click", () => {
        addToCart(product.id, 1, false, detailSelectedMetal, detailSelectedSize);
      });
    }

    // Collapsible Accordions
    const accordions = container.querySelectorAll(".detail-accordion");
    accordions.forEach(accordion => {
      const header = accordion.querySelector(".accordion-header");
      const content = accordion.querySelector(".accordion-content");
      const icon = accordion.querySelector(".accordion-icon");
      
      header.addEventListener("click", () => {
        const isOpen = header.getAttribute("aria-expanded") === "true";
        
        // Toggle active class and aria
        header.setAttribute("aria-expanded", !isOpen);
        
        if (!isOpen) {
          content.style.maxHeight = content.scrollHeight + "px";
          icon.textContent = "−";
        } else {
          content.style.maxHeight = "0px";
          icon.textContent = "+";
        }
      });
    });
  };

  renderContent();
}

// --- UI Render Engines ---
function renderAll() {
  renderCarousel();
  renderHighlights();
  renderAdminList();
  renderCartDrawer();
  
  // Rerender active detail view if open
  const hash = window.location.hash;
  if (/^#\/?(product|recommended|recommendation)\//.test(hash)) {
    handleRouting();
  }
}

function getProductImageHTML(imagePath, nameInitials) {
  // If the path exists and is not empty, use the image.
  // We'll also handle fallbacks if the image fails to load.
  if (imagePath && imagePath.trim() !== "") {
    return `<img src="${imagePath}" alt="Jewelry Item" class="card-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="card-img-fallback" style="display:none;">
              <div class="fallback-icon">✦</div>
              <div class="fallback-initials">${nameInitials}</div>
              <div style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.7;">Lumina Fine</div>
            </div>`;
  } else {
    // If no path is provided, show premium CSS fallback directly
    return `<div class="card-img-fallback">
              <div class="fallback-icon">✦</div>
              <div class="fallback-initials">${nameInitials}</div>
              <div style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.7;">Lumina Fine</div>
            </div>`;
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .map(word => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderCarousel() {
  const container = document.getElementById("carouselContainer");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<div class="cart-empty-message" style="width: 100%;">No products in catalog. Open the Admin Panel to add some!</div>`;
    return;
  }

  container.innerHTML = products.map(product => {
    const initials = getInitials(product.name);
    const imgHTML = getProductImageHTML(product.image, initials);
    
    return `
      <div class="product-card" id="card-${product.id}" data-id="${product.id}">
        <a href="#product/${product.id}" class="card-link-wrapper">
          <div class="card-img-wrapper">
            ${product.highlighted ? '<span class="card-badge">Highlight</span>' : ''}
            ${imgHTML}
          </div>
        </a>
        <div class="card-content">
          <div class="card-category">${product.category}</div>
          <h3 class="card-title"><a href="#product/${product.id}">${product.name}</a></h3>
          <p class="card-desc">${product.description}</p>
          <div class="card-footer">
            <span class="card-price">$${product.price.toLocaleString()}</span>
            <button class="btn-add-cart" onclick="addToCart('${product.id}')" title="Add to Cart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderHighlights() {
  const grid = document.getElementById("highlightGrid");
  if (!grid) return;

  const highlightedProducts = products.filter(p => p.highlighted);
  
  if (highlightedProducts.length === 0) {
    grid.innerHTML = `<div class="cart-empty-message" style="grid-column: 1/-1;">No highlighted products selected. Edit products in the Admin Panel to highlight them here!</div>`;
    return;
  }

  grid.innerHTML = highlightedProducts.map(product => {
    const initials = getInitials(product.name);
    const imgHTML = getProductImageHTML(product.image, initials);
    
    return `
      <div class="highlight-item" id="highlight-${product.id}">
        <a href="#product/${product.id}" class="highlight-link-wrapper">
          <div class="highlight-img-wrapper">
            ${imgHTML}
          </div>
        </a>
        <div class="highlight-info">
          <div class="card-category">${product.category}</div>
          <h3 class="highlight-title"><a href="#product/${product.id}">${product.name}</a></h3>
          <p class="highlight-desc">${product.description}</p>
          <div class="card-footer">
            <span class="card-price" style="font-size:1.2rem;">$${product.price.toLocaleString()}</span>
            <button class="btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCartDrawer() {
  const container = document.getElementById("cartItems");
  const subtotalVal = document.getElementById("cartSubtotal");
  const discountVal = document.getElementById("cartDiscount");
  const discountRow = document.getElementById("cartDiscountRow");
  const totalVal = document.getElementById("cartTotal");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<div class="cart-empty-message">Your shopping bag is empty.</div>`;
    subtotalVal.textContent = "$0";
    discountRow.style.display = "none";
    totalVal.textContent = "$0";
    return;
  }

  let subtotal = 0;

  container.innerHTML = cart.map(item => {
    const product = findProductByCode(item.productId);
    if (!product) return "";

    const isService = isServiceProduct(product);
    const itemMetal = isService ? "Service" : (item.metal || (product.name.toLowerCase().includes("platinum") ? "Platinum" : "18K Yellow Gold"));
    const itemSize = isService ? "N/A" : (item.size || "7");
    const adjustedPrice = getAdjustedPrice(product, itemMetal);
    subtotal += adjustedPrice * item.quantity;
    const initials = getInitials(product.name);
    const itemMeta = isService ? "Services" : `${itemMetal} | Size ${itemSize}`;

    return `
      <div class="cart-item">
        <div style="position:relative; width:70px; height:70px;">
          <img src="${product.image}" alt="${product.name}" class="cart-item-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="card-img-fallback" style="display:none; font-size:0.6rem; padding:0.2rem; border-radius:4px;">
            <div class="fallback-initials" style="font-size:1.2rem; margin-bottom:0;">${initials}</div>
          </div>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${product.name}</div>
          <div class="cart-item-meta" style="font-size:0.75rem; color:var(--color-text-secondary); margin-top:2px;">${itemMeta}</div>
          <div class="cart-item-price" style="font-size:0.85rem; font-weight:500;">$${adjustedPrice.toLocaleString()}</div>
          <div class="cart-item-qty" style="margin-top:4px;">
            <button class="qty-btn" onclick="changeQty('${product.id}', '${itemMetal}', '${itemSize}', -1)">-</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="changeQty('${product.id}', '${itemMetal}', '${itemSize}', 1)">+</button>
          </div>
        </div>
        <div>
          <button class="cart-item-remove" onclick="removeFromCart('${product.id}', '${itemMetal}', '${itemSize}')">Remove</button>
        </div>
      </div>
    `;
  }).join("");

  // Totals calculations
  let discount = 0;
  if (activeDiscount > 0) {
    discount = subtotal * (activeDiscount / 100);
    discountRow.style.display = "flex";
    discountVal.textContent = `-$${discount.toLocaleString()} (${activeDiscountCode})`;
  } else {
    discountRow.style.display = "none";
  }

  const total = subtotal - discount;

  subtotalVal.textContent = `$${subtotal.toLocaleString()}`;
  totalVal.textContent = `$${total.toLocaleString()}`;
}

function renderAdminList() {
  const container = document.getElementById("adminProdList");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<div class="cart-empty-message">No products catalogued. Use the form to build a catalog.</div>`;
    return;
  }

  container.innerHTML = products.map(p => {
    return `
      <div class="admin-prod-item">
        <div style="position:relative; width:45px; height:45px;">
          <img src="${p.image}" class="admin-prod-thumb" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="card-img-fallback" style="display:none; font-size:0.4rem; padding:0; border-radius:4px;">
            <div class="fallback-initials" style="font-size:0.8rem; margin-bottom:0;">${getInitials(p.name)}</div>
          </div>
        </div>
        <div class="admin-prod-info">
          <div class="admin-prod-title">${p.name}</div>
          <div class="admin-prod-price">$${p.price.toLocaleString()} | ${p.category}</div>
        </div>
        <div class="admin-prod-actions">
          <button class="btn-action-small edit" onclick="startEditProduct('${p.id}')">Edit</button>
          <button class="btn-action-small delete" onclick="handleDeleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

// --- Admin Panel Actions ---
window.startEditProduct = function(id) {
  const p = products.find(prod => prod.id === id);
  if (!p) return;

  editingProductId = id;
  document.getElementById("adminModalTitle").textContent = "Edit Product Details";
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodCategory").value = p.category;
  document.getElementById("prodDescription").value = p.description;
  document.getElementById("prodImage").value = p.image;
  document.getElementById("prodKeywords").value = p.keywords;
  document.getElementById("prodHighlight").checked = p.highlighted;
  
  document.getElementById("btnAdminSubmit").textContent = "Save Changes";
};

function clearAdminForm() {
  editingProductId = null;
  document.getElementById("adminModalTitle").textContent = "Add New Jewelry Product";
  document.getElementById("adminProductForm").reset();
  document.getElementById("btnAdminSubmit").textContent = "Add to Catalog";
}

window.handleDeleteProduct = function(id) {
  if (confirm("Are you sure you want to remove this item from the catalog?")) {
    deleteProduct(id);
    if (editingProductId === id) {
      clearAdminForm();
    }
  }
};

// --- Salesforce Chat Client Listeners (Agentforce) ---
function setupSalesforceListeners() {
  // Listen for the modern "Messaging for In-App and Web" event
  window.addEventListener("onEmbeddedMessageSent", (event) => {
    console.log("Salesforce Message Event: ", event.detail);
    const entry = event.detail?.conversationEntry;
    
    // Check if the sender is the Agent/Bot
    if (entry && entry.sender && entry.sender.role === 'Agent') {
      let messageText = "";
      if (entry.entryPayload) {
        try {
          const payload = typeof entry.entryPayload === 'string' ? JSON.parse(entry.entryPayload) : entry.entryPayload;
          if (payload.abstractMessage && payload.abstractMessage.staticContent) {
            messageText = payload.abstractMessage.staticContent.text;
          }
        } catch (e) {
          console.error("Failed to parse Agentforce payload text:", e);
        }
      }
      
      if (messageText) {
        console.log("Agentforce sent message text: ", messageText);
        handleAgentMessage(messageText, "Salesforce Agentforce");
      }
    }
  });

  // Setup legacy Live Agent handler check
  // We check window.embedded_svc because developers add handlers before init.
  // We'll hook into embedded_svc.addEventHandler once embedded_svc is loaded.
  const checkLegacyInterval = setInterval(() => {
    if (window.embedded_svc && typeof window.embedded_svc.addEventHandler === 'function') {
      clearInterval(checkLegacyInterval);
      console.log("Salesforce Legacy Chat SDK detected. Registering event handlers...");
      
      window.embedded_svc.addEventHandler("onAgentMessage", function(data) {
        console.log("Legacy Chat Agent Message Event: ", data);
        const text = data.messageText || data.text || "";
        if (text) {
          handleAgentMessage(text, "Legacy Salesforce Chat");
        }
      });
    }
  }, 1000);
  
  // Timeout interval check after 10s to avoid leaking resources
  setTimeout(() => clearInterval(checkLegacyInterval), 10000);
}

// --- Natural Language Message Action Parser (NLP Engine) ---
function handleAgentMessage(messageText, sourceName = "Simulated Agent") {
  const text = messageText.toLowerCase();
  console.log(`[Parser] Running NLP on message: "${messageText}" from ${sourceName}`);



  // Action variables
  let actionTaken = false;
  let actionDetails = [];

  // 1. Check for product keyword highlights
  products.forEach(p => {
    if (p.keywords) {
      // Split keywords by comma, trim, and check if any keyword is present in the agent message text
      const keywordsList = p.keywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
      let matchedKeyword = null;

      for (let k of keywordsList) {
        // Matches exact words or phrases to avoid false positives (like 'ring' in 'spring')
        const regex = new RegExp(`\\b${k}\\b`);
        if (regex.test(text)) {
          matchedKeyword = k;
          break;
        }
      }

      if (matchedKeyword) {
        // Trigger product highlight!
        highlightProductInUI(p.id, p.name);
        actionTaken = true;
        actionDetails.push(`Highlighted: ${p.name}`);
      }
    }
  });

  // 2. Check for "Add to Cart" instructions
  // e.g. "I've added the Lumina Solitaire Ring to your cart" or "I'm adding the Pearl Drop Earrings to your bag"
  const isAddToCartIntent = text.includes("add") || text.includes("added") || text.includes("cart") || text.includes("bag");
  if (isAddToCartIntent) {
    products.forEach(p => {
      // Check if product name or specific identifier is mentioned in the message text
      const productNameLower = p.name.toLowerCase();
      // Also check short name identifiers
      const keywords = p.keywords.split(",").map(k => k.trim().toLowerCase());
      const isNameInText = text.includes(productNameLower) || keywords.some(k => k.length > 2 && text.includes(k));
      
      if (isNameInText) {
        addToCart(p.id, 1);
        actionTaken = true;
        actionDetails.push(`Added to Cart: ${p.name}`);
      }
    });
  }

  // 3. Check for promotional discounts
  // e.g. "Use code AGENT15 for a discount" or "I applied a coupon code for you"
  const isDiscountIntent = text.includes("discount") || text.includes("promo") || text.includes("coupon") || text.includes("code") || text.includes("percent");
  if (isDiscountIntent) {
    applyPromoCode("AGENT15");
    actionTaken = true;
    actionDetails.push("Applied 15% discount code: AGENT15");
  }

  // Feedback to developer console
  if (actionTaken) {
    console.log(`[Parser SUCCESS] Triggered website actions:`, actionDetails);
  } else {
    console.log(`[Parser INFO] No matching keywords or instructions detected in agent message.`);
  }
}

// UI Highlight Trigger
function highlightProductInUI(productId, productName) {
  // Set window hash to navigate to product detail page!
  window.location.hash = `#product/${productId}`;
  
  // Wait for rendering to complete, then apply highlight effect
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

window.LuminaStorefront = {
  addAgentforceCartItems(productCodes = [], options = {}) {
    const codes = productCodes
      .map(productCode => String(productCode || "").trim())
      .filter(Boolean);

    if (codes.length === 0) return { added: [], missing: [] };

    const added = [];
    const missing = [];
    const serviceDetailsByCode = options.serviceDetailsByCode || {};

    codes.forEach(productCode => {
      let product = findProductByCode(productCode);

      if (!product && options.serviceCodes?.includes(productCode)) {
        product = upsertAgentforceServiceProduct(productCode, serviceDetailsByCode[productCode] || {});
      }

      if (!product) {
        missing.push(productCode);
        return;
      }

      addToCart(product.id || product.productCode, 1, true, null, null, "agentforce");
      added.push(product.id || product.productCode);
    });

    if (options.applyAgentforceDiscount !== false && added.length > 0) {
      applyPromoCode("AGENT15");
    }

    if (added.length > 0) {
      showToast(`Agentforce added ${added.length} item${added.length === 1 ? "" : "s"} to Cart`, "success");
      window.setTimeout(() => {
        renderCartDrawer();
        openCart();
      }, 0);
    }

    if (missing.length > 0) {
      showToast(`Agentforce item not found: ${missing.join(", ")}`, "error");
    }

    return { added, missing };
  },
  getProduct(productCode) {
    return findProductByCode(productCode);
  },
  createServiceProduct(productCode, details = {}) {
    return upsertAgentforceServiceProduct(productCode, details);
  },
  applyAgentforceDiscount() {
    return applyPromoCode("AGENT15");
  }
};

// --- Event Listeners and Bindings ---
function setupEventListeners() {
  // Cart toggle
  const cartBtn = document.getElementById("btnCart");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartClose = document.getElementById("cartClose");

  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartOverlay) {
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  // Mobile Menu toggle
  const mobileMenuBtn = document.getElementById("btnMobileMenu");
  const mobileNavMenu = document.getElementById("mobileNavMenu");

  if (mobileMenuBtn && mobileNavMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileNavMenu.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active");
    });
  }

  // Close mobile menu when links are clicked
  const mobileLinks = document.querySelectorAll(".mobile-nav-links a");
  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (mobileNavMenu) mobileNavMenu.classList.remove("active");
      if (mobileMenuBtn) mobileMenuBtn.classList.remove("active");
    });
  });

  // Mobile menu Admin Panel trigger
  const mobAdminOpen = document.getElementById("mobNavAdmin");
  if (mobAdminOpen) {
    mobAdminOpen.addEventListener("click", (e) => {
      e.preventDefault();
      openAdminModal();
    });
  }

  // Admin Panel modal toggles
  const adminOpen = document.getElementById("btnAdminOpen");
  const adminClose = document.getElementById("adminClose");
  const adminOverlay = document.getElementById("adminOverlay");
  const adminCancel = document.getElementById("btnAdminCancel");
  const adminReset = document.getElementById("btnAdminReset");

  if (adminOpen) adminOpen.addEventListener("click", openAdminModal);
  if (adminClose) adminClose.addEventListener("click", closeAdminModal);
  if (adminCancel) adminCancel.addEventListener("click", closeAdminModal);
  if (adminReset) {
    adminReset.addEventListener("click", () => {
      window.resetCatalogToDefaults();
    });
  }
  if (adminOverlay) {
    adminOverlay.addEventListener("click", (e) => {
      if (e.target === adminOverlay) closeAdminModal();
    });
  }

  // Admin form submission
  const adminForm = document.getElementById("adminProductForm");
  if (adminForm) {
    adminForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const productData = {
        name: document.getElementById("prodName").value.trim(),
        price: parseFloat(document.getElementById("prodPrice").value) || 0,
        category: document.getElementById("prodCategory").value,
        description: document.getElementById("prodDescription").value.trim(),
        image: document.getElementById("prodImage").value.trim(),
        keywords: document.getElementById("prodKeywords").value.trim(),
        highlighted: document.getElementById("prodHighlight").checked
      };

      if (!productData.name) {
        showToast("Product Name is required", "error");
        return;
      }

      if (editingProductId) {
        updateProduct(editingProductId, productData);
      } else {
        addProduct(productData);
      }

      closeAdminModal();
    });
  }

  // Cart Promo Code submission
  const btnApplyPromo = document.getElementById("btnApplyPromo");
  const promoInput = document.getElementById("promoInput");
  if (btnApplyPromo && promoInput) {
    btnApplyPromo.addEventListener("click", () => {
      const code = promoInput.value;
      if (code) {
        if (applyPromoCode(code)) {
          promoInput.value = "";
        }
      }
    });
  }



  // Carousel scroll buttons
  const btnPrev = document.getElementById("carouselPrev");
  const btnNext = document.getElementById("carouselNext");
  const carousel = document.getElementById("carouselContainer");
  
  if (btnPrev && carousel) {
    btnPrev.addEventListener("click", () => {
      carousel.scrollBy({ left: -320, behavior: "smooth" });
    });
  }
  if (btnNext && carousel) {
    btnNext.addEventListener("click", () => {
      carousel.scrollBy({ left: 320, behavior: "smooth" });
    });
  }
}



// Modal Toggle Helpers
function openCart() {
  document.getElementById("cartOverlay")?.classList.add("active");
}
function closeCart() {
  document.getElementById("cartOverlay")?.classList.remove("active");
}

function openAdminModal() {
  clearAdminForm();
  document.getElementById("adminOverlay")?.classList.add("active");
}
function closeAdminModal() {
  document.getElementById("adminOverlay")?.classList.remove("active");
}

// --- Toast System ---
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div style="font-size:1.1rem;">${type === 'success' ? '✦' : '✧'}</div>
    <div class="toast-msg">${message}</div>
  `;

  container.appendChild(toast);

  // Automatically fade out and remove toast after 3.5s
  setTimeout(() => {
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}
