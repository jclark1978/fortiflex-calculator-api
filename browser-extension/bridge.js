'use strict';

const CHANNEL = 'fortiflex-connector-v1';
const REQUEST_SOURCE = 'fortiflex-bom-plugin';
const RESPONSE_SOURCE = 'fortiflex-api-connector';
const REQUEST_EVENT = 'fortiflex-connector-request-v1';
const RESPONSE_EVENT = 'fortiflex-connector-response-v1';
const ALLOWED_ACTIONS = new Set(['status', 'openOptions', 'loadCatalog', 'calculate']);
const BRIDGE_VERSION = '0.1.4';

function isAllowedPage() {
  if (location.protocol !== 'file:') return true;
  try {
    return decodeURIComponent(location.pathname).toLowerCase().endsWith('/webgui/index.html');
  } catch {
    return location.pathname.toLowerCase().endsWith('/webgui/index.html');
  }
}

function markBridgeReady() {
  if (document.documentElement) {
    document.documentElement.setAttribute('data-fortiflex-connector-bridge', BRIDGE_VERSION);
  }
}

if (!isAllowedPage()) {
  // File access is deliberately limited even though Chrome requires a broad
  // file match before it exposes the user's file-URL permission toggle.
} else {
  markBridgeReady();
  document.addEventListener('DOMContentLoaded', markBridgeReady, { once: true });

  function handleRequest(message, reply) {
    if (!message || message.source !== REQUEST_SOURCE || message.type !== 'request') return;
    if (typeof message.id !== 'string' || !ALLOWED_ACTIONS.has(message.action)) return;

    chrome.runtime.sendMessage({
      channel: CHANNEL,
      action: message.action,
      payload: message.payload || null
    }, response => {
      const runtimeFailure = chrome.runtime.lastError;
      reply({
        source: RESPONSE_SOURCE,
        type: 'response',
        id: message.id,
        ok: runtimeFailure ? false : Boolean(response && response.ok),
        result: !runtimeFailure && response && response.ok ? response.result : null,
        error: runtimeFailure
          ? { code: 'extension_unavailable', message: 'The FortiFlex connector extension is unavailable.' }
          : (response && !response.ok ? response.error : null)
      });
    });
  }

  window.addEventListener('message', event => {
    if (location.protocol === 'file:' || event.origin !== window.location.origin) return;
    const replyWindow = event.source;
    if (!replyWindow) return;
    handleRequest(event.data, response => replyWindow.postMessage(response, event.origin));
  });

  // Chrome isolates extension JavaScript from local file JavaScript. DOM
  // events provide a dependable, shared transport for this one local page.
  document.addEventListener(REQUEST_EVENT, event => {
    if (location.protocol !== 'file:' || typeof event.detail !== 'string') return;
    let message;
    try { message = JSON.parse(event.detail); } catch { return; }
    handleRequest(message, response => {
      document.dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
        detail: JSON.stringify(response)
      }));
    });
  });
}
