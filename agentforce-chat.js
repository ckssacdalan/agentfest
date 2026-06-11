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

  function parseHumanRouteSentence(messageText) {
    const recommendationMatch = messageText.match(/\bShowing recommendations for\s+(.+?)(?:[.!?]\s|[.!?]?$|$)/i);

    if (recommendationMatch) {
      const productIds = extractProductIds(recommendationMatch[1]);

      if (productIds.length > 0) {
        return {
          type: "recommendation",
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
        type: "recommendation",
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

  function setHashForRoute(route) {
    if (!route || route.productIds.length === 0) return;

    const hash = route.type === "recommendation"
      ? `#recommendation/${route.productIds.map(encodeURIComponent).join("/")}`
      : `#product/${encodeURIComponent(route.productIds[0])}`;

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }

  function highlightRecommendationCards() {
    const recommendationMatch = window.location.hash.match(/^#\/?recommendation\/(.+)/);
    if (!recommendationMatch) return;

    const productIds = recommendationMatch[1]
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
