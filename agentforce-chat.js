(function () {
  "use strict";

  const ROUTE_HIGHLIGHT_CLASS = "agent-highlighted";
  const ROUTE_HIGHLIGHT_DURATION = 5000;
  const DEFAULT_AGENTFORCE_KEYWORDS = {
    showingRecommendedRings: "Showing recommended rings:",
    showingRequestedRings: "Showing requested rings:",
    addedRingWithEngravingToCart: "Added ring with engraving to cart:",
    addedRingsWithEngravingToCart: "Added rings with engraving to cart:",
    addedRingToCart: "Added ring to cart:",
    addedRingsToCart: "Added rings to cart:",
    addToCartPayload: "LUMINA_ADD_TO_CART|"
  };
  const AGENTFORCE_KEYWORDS = {
    ...DEFAULT_AGENTFORCE_KEYWORDS,
    ...(window.LuminaAgentforceKeywords || {})
  };
  const CART_KEYWORDS = [
    AGENTFORCE_KEYWORDS.addedRingWithEngravingToCart,
    AGENTFORCE_KEYWORDS.addedRingsWithEngravingToCart,
    AGENTFORCE_KEYWORDS.addedRingToCart,
    AGENTFORCE_KEYWORDS.addedRingsToCart
  ];
  const CART_WITH_ENGRAVING_KEYWORDS = [
    AGENTFORCE_KEYWORDS.addedRingWithEngravingToCart,
    AGENTFORCE_KEYWORDS.addedRingsWithEngravingToCart
  ];

  if (window.__luminaAgentforceChatRoutingInitialized) {
    return;
  }

  window.__luminaAgentforceChatRoutingInitialized = true;
  window.LuminaAgentforceKeywords = AGENTFORCE_KEYWORDS;

  function parseJson(value) {
    if (!value) return null;
    if (typeof value === "object") return value;

    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function getNestedText(payload) {
    if (!payload || typeof payload !== "object") return "";

    const directText = (
      payload.abstractMessage?.staticContent?.text ||
      payload.abstractMessage?.text ||
      payload.staticContent?.text ||
      payload.messageText ||
      payload.message ||
      payload.text ||
      ""
    );

    if (directText) return directText;

    const textParts = [];
    const seen = new Set();

    function collectText(value, key = "") {
      if (!value || seen.has(value)) return;

      if (typeof value === "string") {
        if (/^(text|message|messagetext|value|content)$/i.test(key) && value.trim()) {
          textParts.push(value.trim());
        }
        return;
      }

      if (typeof value !== "object") return;

      seen.add(value);
      Object.entries(value).forEach(([childKey, childValue]) => collectText(childValue, childKey));
    }

    collectText(payload);
    return textParts.join("\n");
  }

  function getAgentforceMessageText(eventDetail) {
    const entry = eventDetail?.conversationEntry || eventDetail?.entry || eventDetail;
    const payload = parseJson(entry?.entryPayload) || parseJson(eventDetail?.entryPayload);

    return (
      getNestedText(payload) ||
      entry?.messageText ||
      entry?.text ||
      eventDetail?.messageText ||
      eventDetail?.text ||
      ""
    ).trim();
  }

  function isAgentforceResponse(eventDetail) {
    const entry = eventDetail?.conversationEntry || eventDetail?.entry || eventDetail;
    const sender = entry?.sender || eventDetail?.sender || {};
    const role = String(sender.role || sender.type || entry?.senderRole || eventDetail?.senderRole || "").toLowerCase();

    if (role.includes("user") || role.includes("customer") || role.includes("visitor") || role.includes("enduser")) {
      return false;
    }

    return role.includes("agent") || role.includes("bot") || role.includes("copilot") || role.includes("assistant");
  }

  function extractProductIds(text) {
    return Array.from(text.matchAll(/\bprod-[a-z0-9_-]+\b/gi), match => match[0])
      .filter((id, index, ids) => ids.findIndex(existing => existing.toLowerCase() === id.toLowerCase()) === index);
  }

  function extractCodes(text) {
    const codeText = String(text || "").includes(":")
      ? String(text || "").split(":").slice(1).join(":")
      : String(text || "");

    return Array.from(codeText.matchAll(/\b[a-z0-9][a-z0-9_-]*\b/gi), match => match[0])
      .filter(code => !["and", "or", "with"].includes(code.toLowerCase()))
      .filter(code => !/^\d+$/.test(code))
      .filter((code, index, codes) => codes.findIndex(existing => existing.toLowerCase() === code.toLowerCase()) === index);
  }

  function normalizeCodeKey(code) {
    return String(code || "").trim().toLowerCase();
  }

  function parsePrice(value) {
    const normalized = String(value || "").replace(/[$,]/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function addDetails(detailsByCode, code, details) {
    const normalizedCode = String(code || "").trim();
    if (!normalizedCode) return;

    detailsByCode[normalizedCode] = {
      ...(detailsByCode[normalizedCode] || {}),
      ...details
    };
  }

  function startsWithKeyword(line, keyword) {
    return String(line || "").trim().toLowerCase().startsWith(String(keyword || "").toLowerCase());
  }

  function startsWithAnyKeyword(line, keywords) {
    return keywords.some(keyword => startsWithKeyword(line, keyword));
  }

  function isCartKeywordLine(line) {
    return startsWithAnyKeyword(line, CART_KEYWORDS);
  }

  function isCartWithEngravingKeywordLine(line) {
    return startsWithAnyKeyword(line, CART_WITH_ENGRAVING_KEYWORDS);
  }

  function extractCartDetails(messageText) {
    const productDetailsByCode = {};
    const serviceDetailsByCode = {};
    const lines = String(messageText || "").split(/\r?\n/).map(line => line.trim());

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!isCartKeywordLine(line)) continue;

      const block = [];
      for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
        const nextLine = lines[blockIndex];
        if (isCartKeywordLine(nextLine)) break;
        block.push(nextLine);
      }

      const blockText = block.join("\n");
      const codeMatch = blockText.match(/\*\*Code:\*\*\s*([a-z0-9_-]+)/i);
      const codesMatch = blockText.match(/\*\*Codes:\*\*\s*(.+)$/im);
      const lineCodes = extractCodes(line);
      const lineHasEngraving = isCartWithEngravingKeywordLine(line);
      const ringCode = codeMatch?.[1] || lineCodes[0];
      const productName = blockText.match(/\*\*Product name:\*\*\s*(.+)$/im)?.[1]?.trim();
      const ringPrice = parsePrice(blockText.match(/\*\*Ring price:\*\*\s*(.+)$/im)?.[1]);

      if (ringCode && (productName || ringPrice !== undefined)) {
        addDetails(productDetailsByCode, ringCode, {
          name: productName,
          price: ringPrice
        });
      }

      const engravingName = blockText.match(/\*\*Engraving service:\*\*\s*(.+)$/im)?.[1]?.trim();
      const engravingPrice = parsePrice(blockText.match(/\*\*Engraving price:\*\*\s*(.+)$/im)?.[1]);
      const codes = codesMatch ? extractCodes(codesMatch[1]) : extractCodes(line);
      const serviceCode = lineHasEngraving && codes.length > 1 ? codes[codes.length - 1] : "";

      if (serviceCode && (engravingName || engravingPrice !== undefined)) {
        addDetails(serviceDetailsByCode, serviceCode, {
          name: engravingName,
          price: engravingPrice
        });
      }
    }

    return {
      productDetailsByCode,
      serviceDetailsByCode
    };
  }

  function parseCartPayloadLines(messageText) {
    const items = [];

    String(messageText || "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => startsWithKeyword(line, AGENTFORCE_KEYWORDS.addToCartPayload))
      .forEach(line => {
        const fields = {};
        line.split("|").slice(1).forEach(part => {
          const [key, ...valueParts] = part.split("=");
          if (!key) return;
          fields[key] = valueParts.join("=");
        });

        if (fields.productId) {
          items.push({
            productCode: decodeURIComponent(fields.productId),
            productDetails: {
              name: fields.name ? decodeURIComponent(fields.name) : undefined
            },
            serviceCode: fields.serviceProductId ? decodeURIComponent(fields.serviceProductId) : "",
            serviceDetails: {
              name: fields.serviceName ? decodeURIComponent(fields.serviceName) : undefined
            }
          });
        }
      });

    return items;
  }

  function getListenerLine(messageText, listenerPrefix) {
    const normalizedPrefix = listenerPrefix.toLowerCase();

    return String(messageText || "")
      .split(/\r?\n/)
      .find(line => line.trim().toLowerCase().startsWith(normalizedPrefix)) || "";
  }

  function getListenerLines(messageText, listenerPrefixes) {
    const normalizedPrefixes = listenerPrefixes.map(prefix => prefix.toLowerCase());

    return String(messageText || "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => normalizedPrefixes.some(prefix => line.toLowerCase().startsWith(prefix)));
  }

  function parseHumanRouteSentence(messageText) {
    const recommendedRingsLine = getListenerLine(messageText, AGENTFORCE_KEYWORDS.showingRecommendedRings);
    if (recommendedRingsLine) {
      const productIds = extractProductIds(recommendedRingsLine);

      if (productIds.length > 0) {
        return {
          type: "recommended",
          productIds
        };
      }
    }

    const requestedRingsLine = getListenerLine(messageText, AGENTFORCE_KEYWORDS.showingRequestedRings);
    if (requestedRingsLine) {
      const productIds = extractProductIds(requestedRingsLine);

      if (productIds.length > 0) {
        return {
          type: "product",
          productIds: [productIds[0]]
        };
      }
    }

    const recommendationMatch = messageText.match(/\bShowing recommendations for\s+(.+?)(?:[.!?]\s|[.!?]?$|$)/i);

    if (recommendationMatch) {
      const productIds = extractProductIds(recommendationMatch[1]);

      if (productIds.length > 0) {
        return {
          type: "recommended",
          productIds
        };
      }
    }

    const productMatch = messageText.match(/\bShowing product\s+([a-z0-9_-]+)/i);

    if (productMatch) {
      return {
        type: "product",
        productIds: [productMatch[1]]
      };
    }

    return null;
  }

  function parseProductCodes(messageText) {
    const productIds = Array.from(messageText.matchAll(/^Code:\s*([a-z0-9_-]+)/gim), match => match[1])
      .filter((id, index, ids) => ids.findIndex(existing => existing.toLowerCase() === id.toLowerCase()) === index);

    if (productIds.length > 1) {
      return {
        type: "recommended",
        productIds
      };
    }

    if (productIds.length === 1) {
      return {
        type: "product",
        productIds
      };
    }

    return null;
  }

  function routeFromAgentMessage(messageText) {
    return parseHumanRouteSentence(messageText) || parseProductCodes(messageText);
  }

  function hasLuminaListenerKeyword(messageText) {
    return String(messageText || "")
      .split(/\r?\n/)
      .some(line =>
        startsWithKeyword(line, AGENTFORCE_KEYWORDS.showingRecommendedRings) ||
        startsWithKeyword(line, AGENTFORCE_KEYWORDS.showingRequestedRings) ||
        startsWithAnyKeyword(line, CART_KEYWORDS) ||
        startsWithKeyword(line, AGENTFORCE_KEYWORDS.addToCartPayload)
      );
  }

  function routeAgentCartFromMessage(messageText) {
    const cartLines = getListenerLines(messageText, CART_KEYWORDS);

    const ringCodes = [];
    const serviceCodes = [];
    const payloadItems = parseCartPayloadLines(messageText);
    const { productDetailsByCode, serviceDetailsByCode } = extractCartDetails(messageText);

    if (cartLines.length === 0 && payloadItems.length === 0) return false;

    cartLines.forEach(line => {
      const codes = extractCodes(line);
      const lineHasEngraving = isCartWithEngravingKeywordLine(line);
      const lineServiceCodes = lineHasEngraving && codes.length > 1
        ? [codes[codes.length - 1]]
        : [];
      const lineRingCodes = lineHasEngraving && codes.length > 1
        ? codes.slice(0, -1)
        : codes;

      ringCodes.push(...lineRingCodes);

      if (lineHasEngraving && lineServiceCodes.length > 0) {
        if (lineServiceCodes.length === 1 && lineRingCodes.length > 1) {
          lineRingCodes.forEach(() => serviceCodes.push(lineServiceCodes[0]));
        } else {
          serviceCodes.push(...lineServiceCodes);
        }
      }
    });

    payloadItems.forEach(item => {
      ringCodes.push(item.productCode);
      addDetails(productDetailsByCode, item.productCode, item.productDetails);

      if (item.serviceCode) {
        serviceCodes.push(item.serviceCode);
        addDetails(serviceDetailsByCode, item.serviceCode, item.serviceDetails);
      }
    });

    if (ringCodes.length === 0 && serviceCodes.length === 0) return false;

    const storefront = window.LuminaStorefront;
    if (!storefront || typeof storefront.addAgentforceCartItems !== "function") {
      window.setTimeout(() => routeAgentCartFromMessage(messageText), 250);
      return true;
    }

    const uniqueServiceCodes = serviceCodes.filter((code, index, codes) =>
      codes.findIndex(existing => normalizeCodeKey(existing) === normalizeCodeKey(code)) === index
    );

    storefront.addAgentforceCartItems([...ringCodes, ...serviceCodes], {
      source: "agentforce",
      serviceCodes: uniqueServiceCodes,
      productDetailsByCode,
      serviceDetailsByCode,
      applyAgentforceDiscount: true
    });

    return true;
  }

  function setHashForRoute(route) {
    if (!route || route.productIds.length === 0) return;

    const hash = route.type === "recommended"
      ? `#recommended/${route.productIds.map(encodeURIComponent).join("/")}`
      : `#product/${encodeURIComponent(route.productIds[0])}`;

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }

  function highlightRecommendationCards() {
    const recommendationMatch = window.location.hash.match(/^#\/?(recommended|recommendation)\/(.+)/);
    if (!recommendationMatch) return;

    const productIds = recommendationMatch[2]
      .split("/")
      .map(id => decodeURIComponent(id).trim())
      .filter(Boolean);

    productIds.forEach(productId => {
      const card = document.getElementById(`card-${productId}`);
      if (!card) return;

      card.classList.add(ROUTE_HIGHLIGHT_CLASS);
      setTimeout(() => {
        card.classList.remove(ROUTE_HIGHLIGHT_CLASS);
      }, ROUTE_HIGHLIGHT_DURATION);
    });
  }

  function handleAgentforceMessage(eventDetail) {
    const messageText = getAgentforceMessageText(eventDetail);
    if (!messageText) return;

    if (!isAgentforceResponse(eventDetail) && !hasLuminaListenerKeyword(messageText)) return;

    const route = routeFromAgentMessage(messageText);
    setHashForRoute(route);
    routeAgentCartFromMessage(messageText);
  }

  function registerModernEmbeddedMessagingListeners() {
    [
      "onEmbeddedMessageSent",
      "onEmbeddedMessagingMessageReceived",
      "onEmbeddedMessagingConversationEntryReceived"
    ].forEach(eventName => {
      window.addEventListener(eventName, event => {
        handleAgentforceMessage(event.detail);
      });
    });
  }

  function registerLegacyEmbeddedServiceListener() {
    const intervalId = window.setInterval(() => {
      if (!window.embedded_svc || typeof window.embedded_svc.addEventHandler !== "function") {
        return;
      }

      window.clearInterval(intervalId);
      window.embedded_svc.addEventHandler("onAgentMessage", data => {
        const messageText = String(data?.messageText || data?.text || "").trim();
        if (!messageText) return;

        const route = routeFromAgentMessage(messageText);
        setHashForRoute(route);
        routeAgentCartFromMessage(messageText);
      });
    }, 1000);

    window.setTimeout(() => window.clearInterval(intervalId), 10000);
  }

  registerModernEmbeddedMessagingListeners();
  registerLegacyEmbeddedServiceListener();

  window.addEventListener("hashchange", () => {
    window.setTimeout(highlightRecommendationCards, 150);
  });

  window.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(highlightRecommendationCards, 150);
  });
})();
