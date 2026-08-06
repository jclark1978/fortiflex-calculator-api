'use strict';

const CHANNEL = 'fortiflex-connector-v1';
const AUTH_URL = 'https://customerapiauth.fortinet.com/api/v1/oauth/token/';
const API_BASE = 'https://support.fortinet.com/ES/api/fortiflex/v2/';
const CREDENTIAL_KEY = 'fortiflexCredentials';
const FABRICBOM_ORIGIN = 'https://msalty.github.io';

let accessToken = '';
let tokenExpiresAt = 0;

class ConnectorError extends Error {
  constructor(message, code = 'connector_error', httpStatus = 0) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function protectCredentialStorage() {
  if (chrome.storage.local.setAccessLevel) {
    chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(protectCredentialStorage);
chrome.runtime.onStartup.addListener(protectCredentialStorage);
protectCredentialStorage();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[CREDENTIAL_KEY]) {
    accessToken = '';
    tokenExpiresAt = 0;
  }
});

function senderAllowed(sender) {
  if (!sender || sender.id !== chrome.runtime.id) return false;
  const senderUrl = typeof sender.url === 'string'
    ? sender.url
    : (typeof sender.tab?.url === 'string' ? sender.tab.url : '');
  if (!senderUrl) return false;
  if (senderUrl.startsWith(`chrome-extension://${chrome.runtime.id}/`)) return true;
  try {
    const pageUrl = new URL(senderUrl);
    if (pageUrl.origin === FABRICBOM_ORIGIN) return true;
    if (pageUrl.protocol === 'file:') {
      return pageUrl.pathname.toLowerCase().endsWith('/webgui/index.html');
    }
    return pageUrl.protocol === 'http:' && (
      pageUrl.hostname === 'localhost' ||
      pageUrl.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

async function getCredentials() {
  const stored = await chrome.storage.local.get(CREDENTIAL_KEY);
  const credentials = stored[CREDENTIAL_KEY];
  if (!credentials || !credentials.apiId || !credentials.password || !credentials.clientId) {
    throw new ConnectorError('Open the connector settings and add your FortiFlex API credentials.', 'not_configured');
  }
  return credentials;
}

async function postJSON(url, body, token = '') {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body || {})
    });
  } catch {
    throw new ConnectorError('The connector could not reach Fortinet. Check the network connection and try again.', 'network_error');
  }

  const responseText = await response.text();
  let data = {};
  if (responseText) {
    try { data = JSON.parse(responseText); } catch { data = {}; }
  }
  if (!response.ok) {
    const reason = typeof data.message === 'string'
      ? data.message
      : (typeof data.error === 'string' ? data.error : `Fortinet returned HTTP ${response.status}.`);
    throw new ConnectorError(reason, response.status === 401 ? 'authentication_failed' : 'api_error', response.status);
  }
  // FortiFlex API responses use numeric status codes (0 means success), while
  // the OAuth service can return a descriptive text status such as
  // "successfully authenticated". Only interpret truly numeric statuses here.
  const statusValue = data.status;
  const hasNumericStatus = typeof statusValue === 'number'
    || (typeof statusValue === 'string' && /^-?\d+(?:\.\d+)?$/.test(statusValue.trim()));
  if (hasNumericStatus && Number(statusValue) !== 0) {
    throw new ConnectorError(typeof data.message === 'string' ? data.message : 'Fortinet rejected the request.', 'api_error', response.status);
  }
  return data;
}

async function authenticate(force = false) {
  if (!force && accessToken && Date.now() < tokenExpiresAt) return accessToken;
  const credentials = await getCredentials();
  const tokenData = await postJSON(AUTH_URL, {
    username: credentials.apiId,
    password: credentials.password,
    client_id: credentials.clientId,
    grant_type: 'password'
  });
  if (!tokenData.access_token) throw new ConnectorError('Fortinet did not return an OAuth access token.', 'authentication_failed');
  accessToken = tokenData.access_token;
  const ttl = Number(tokenData.expires_in) || 3600;
  tokenExpiresAt = Date.now() + Math.max(60, ttl - 60) * 1000;
  return accessToken;
}

async function apiPost(endpoint, body = {}, retry = true) {
  const token = await authenticate();
  try {
    return await postJSON(API_BASE + endpoint, body, token);
  } catch (error) {
    if (retry && error.httpStatus === 401) {
      accessToken = '';
      tokenExpiresAt = 0;
      await authenticate(true);
      return apiPost(endpoint, body, false);
    }
    throw error;
  }
}

function sanitizeCalculation(payload) {
  if (!payload || typeof payload !== 'object') throw new ConnectorError('The calculation request is invalid.', 'invalid_request');
  const programSerialNumber = String(payload.programSerialNumber || '').trim();
  const count = Number(payload.count);
  const productTypeId = Number(payload.productTypeId);
  if (!programSerialNumber || programSerialNumber.length > 100) throw new ConnectorError('A valid FortiFlex program is required.', 'invalid_request');
  if (!Number.isInteger(count) || count < 1 || count > 1000000) throw new ConnectorError('The device count is invalid.', 'invalid_request');
  if (!Number.isInteger(productTypeId) || productTypeId < 1) throw new ConnectorError('The product type is invalid.', 'invalid_request');
  if (!Array.isArray(payload.parameters) || payload.parameters.length > 500) throw new ConnectorError('The parameter list is invalid.', 'invalid_request');
  const parameters = payload.parameters.map(parameter => {
    const id = Number(parameter && parameter.id);
    const value = String(parameter && parameter.value !== undefined ? parameter.value : '');
    if (!Number.isInteger(id) || id < 1 || value.length > 500) throw new ConnectorError('A calculation parameter is invalid.', 'invalid_request');
    return { id, value };
  });
  return { programSerialNumber, count, productTypeId, parameters };
}

async function handleAction(action, payload) {
  if (action === 'status') {
    try {
      await getCredentials();
      return { configured: true, tokenReady: Boolean(accessToken && Date.now() < tokenExpiresAt) };
    } catch {
      return { configured: false, tokenReady: false };
    }
  }
  if (action === 'openOptions') {
    await chrome.runtime.openOptionsPage();
    return { opened: true };
  }
  if (action === 'credentialsChanged') {
    accessToken = '';
    tokenExpiresAt = 0;
    return { reset: true };
  }
  if (action === 'testConnection') {
    await authenticate(true);
    const metadata = await apiPost('tools/metadata', {});
    return { productTypeCount: Array.isArray(metadata.productTypes) ? metadata.productTypes.length : 0 };
  }
  if (action === 'loadCatalog') {
    const [metadata, programData] = await Promise.all([
      apiPost('tools/metadata', {}),
      apiPost('programs/list', {})
    ]);
    return { metadata, programs: programData };
  }
  if (action === 'calculate') {
    return apiPost('tools/calc', sanitizeCalculation(payload));
  }
  throw new ConnectorError('Unsupported connector action.', 'invalid_action');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!senderAllowed(sender) || !message || message.channel !== CHANNEL) {
    sendResponse({ ok: false, error: { code: 'unauthorized', message: 'Connector request was not authorized.' } });
    return false;
  }
  handleAction(message.action, message.payload)
    .then(result => sendResponse({ ok: true, result }))
    .catch(error => sendResponse({
      ok: false,
      error: {
        code: error && error.code ? error.code : 'connector_error',
        message: error && error.message ? error.message : 'The FortiFlex connector failed.'
      }
    }));
  return true;
});
