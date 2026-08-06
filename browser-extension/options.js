'use strict';

const CHANNEL = 'fortiflex-connector-v1';
const CREDENTIAL_KEY = 'fortiflexCredentials';
const apiIdInput = document.getElementById('api-id');
const clientIdInput = document.getElementById('client-id');
const passwordInput = document.getElementById('password');
const saveButton = document.getElementById('save-btn');
const clearButton = document.getElementById('clear-btn');
const statusBox = document.getElementById('status');

function setStatus(message, type = '') {
  statusBox.textContent = message;
  statusBox.className = `status${type ? ` ${type}` : ''}`;
}

async function notifyBackground() {
  await chrome.runtime.sendMessage({ channel: CHANNEL, action: 'credentialsChanged', payload: null });
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(CREDENTIAL_KEY);
  const credentials = stored[CREDENTIAL_KEY];
  if (credentials) {
    apiIdInput.value = credentials.apiId || '';
    clientIdInput.value = credentials.clientId || '';
    passwordInput.value = credentials.password || '';
    setStatus('A FortiFlex credential is saved locally in this extension.', 'ok');
  } else {
    setStatus('No FortiFlex credential is saved yet.');
  }
}

document.getElementById('show-btn').addEventListener('click', event => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  event.target.textContent = passwordInput.type === 'password' ? 'Show' : 'Hide';
});

saveButton.addEventListener('click', async () => {
  const credentials = {
    apiId: apiIdInput.value.trim(),
    clientId: clientIdInput.value.trim(),
    password: passwordInput.value
  };
  if (!credentials.apiId || !credentials.clientId || !credentials.password) {
    setStatus('Complete all three credential fields.', 'error');
    return;
  }
  saveButton.disabled = true;
  saveButton.textContent = 'Testing…';
  try {
    await chrome.storage.local.set({ [CREDENTIAL_KEY]: credentials });
    await notifyBackground();
    const response = await chrome.runtime.sendMessage({ channel: CHANNEL, action: 'testConnection', payload: null });
    if (!response || !response.ok) throw new Error(response && response.error ? response.error.message : 'Connection test failed.');
    setStatus(`Connected successfully. Fortinet returned ${response.result.productTypeCount} product families.`, 'ok');
  } catch (error) {
    setStatus(error && error.message ? error.message : 'The connector could not authenticate with Fortinet.', 'error');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save & test connection';
  }
});

clearButton.addEventListener('click', async () => {
  if (!confirm('Remove the locally saved FortiFlex credential from this extension?')) return;
  await chrome.storage.local.remove(CREDENTIAL_KEY);
  await notifyBackground();
  apiIdInput.value = '';
  clientIdInput.value = '';
  passwordInput.value = '';
  setStatus('The saved credential was removed.', 'ok');
});

loadSettings().catch(() => setStatus('The extension could not read its local settings.', 'error'));
