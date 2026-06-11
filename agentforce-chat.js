(function () {
  "use strict";

  const ROUTE_HIGHLIGHT_CLASS = "agent-highlighted";
  const ROUTE_HIGHLIGHT_DURATION = 5000;

  if (window.__luminaAgentforceChatRoutingInitialized) {
    return;
  }

  window.__luminaAgentforceChatRoutingInitialized = true;

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

    return (
      payload.abstractMessage?.staticContent?.text ||
      payload.abstractMessage?.text ||
      payload.staticContent?.text ||
      payload.messageText ||
      payload.message ||
      payload.text ||
      ""
    );
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
    const recommendedRingsLine = getListenerLine(messageText, "Showing recommended rings:");
    if (recommendedRingsLine) {
      const productIds = extractProductIds(recommendedRingsLine);

      if (productIds.length > 0) {
        return {
          type: "recommended",
          productIds
        };
      }
    }

    const requestedRingsLine = getListenerLine(messageText, "Showing requested rings:");
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

  function routeAgentCartFromMessage(messageText) {
    const cartLines = getListenerLines(messageText, [
      "Added ring with engraving to cart:",
      "Added rings with engraving to cart:",
      "Added ring to cart:",
      "Added rings to cart:"
    ]);

    if (cartLines.length === 0) return false;

    const ringCodes = [];
    const serviceCodes = [];

    cartLines.forEach(line => {
      const codes = extractCodes(line);
      const lineRingCodes = codes.filter(code => /^prod-/i.test(code));
      const lineHasEngraving = /^added rings? with engraving to cart:/i.test(line);
      const lineServiceCodes = lineHasEngraving
        ? codes.filter(code => !/^prod-/i.test(code))
        : [];

      ringCodes.push(...lineRingCodes);

      if (lineHasEngraving && lineServiceCodes.length > 0) {
        if (lineServiceCodes.length === 1 && lineRingCodes.length > 1) {
          lineRingCodes.forEach(() => serviceCodes.push(lineServiceCodes[0]));
        } else {
          serviceCodes.push(...lineServiceCodes);
        }
      }
    });

    if (ringCodes.length === 0 && serviceCodes.length === 0) return false;

    const storefront = window.LuminaStorefront;
    if (!storefront || typeof storefront.addAgentforceCartItems !== "function") {
      window.setTimeout(() => routeAgentCartFromMessage(messageText), 250);
      return true;
    }

    storefront.addAgentforceCartItems([...ringCodes, ...serviceCodes], {
      source: "agentforce",
      serviceCodes,
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
    if (!isAgentforceResponse(eventDetail)) return;

    const messageText = getAgentforceMessageText(eventDetail);
    if (!messageText) return;

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
