# FortiFlex API Connector

This Chrome/Edge extension lets the FabricBOM FortiFlex calculator call Fortinet directly without a proxy. Each user's OAuth credential is stored only in the extension's local storage. The extension background process performs the OAuth, metadata, program, and calculation requests.

## Development installation

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `browser-extension` folder.
4. On the extension's Details page, enable **Allow access to file URLs** when testing `webgui/index.html` directly from disk.
5. Open the extension and choose **Save & test connection** after entering the FortiFlex API ID, client ID, and password.

### Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `browser-extension` folder.
4. On the extension's Details page, enable **Allow access to file URLs** when testing `webgui/index.html` directly from disk.
5. Open the extension and choose **Save & test connection** after entering the FortiFlex API ID, client ID, and password.

The connector activates on the official FabricBOM GitHub Pages origin, on `localhost`/`127.0.0.1`, and on a local file whose path ends in `webgui/index.html`. Chrome and Edge require explicit file-URL permission for the last option. Although the manifest requests file-page injection so Chrome can expose that permission toggle, the bridge and background process both reject every local file except `webgui/index.html`. Production distribution should use the Chrome Web Store and Microsoft Edge Add-ons so users receive a normal one-click installation and automatic updates.

## Security boundary

- Credentials are stored under `chrome.storage.local` with access restricted to trusted extension contexts.
- Credentials are never sent through FabricBOM messages.
- OAuth tokens live only in the extension background process memory.
- The page bridge exposes only four fixed actions: connector status, open settings, load catalog, and calculate.
- Network permissions are limited to Fortinet's authentication and FortiFlex API hosts.
