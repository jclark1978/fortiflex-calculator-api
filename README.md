# FortiFlex BOM Calculator

A client-side, table-first FortiFlex bill-of-materials calculator designed for the [FabricBOM](https://github.com/msalty/FabricBOM) plugin architecture.

Users can build device lists with searchable product families, models, service bundles, and add-ons. Estimates show points per device per day, daily line totals, 365-day line totals, and grand totals. Results are point estimates, not dollar quotes.

## Repository contents

- `webgui/index.html` — dependency-free FabricBOM plugin and standalone calculator page.
- `browser-extension/` — Chrome/Edge Manifest V3 connector that performs FortiFlex OAuth and API requests outside the webpage's CORS boundary.
- `docs/api-v2/` — FortiFlex API v2 OpenAPI reference documents for configurations, entitlements, groups, programs, and tools.
- `webgui/server.py` — optional local preview server.

## Quick start

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode and choose **Load unpacked**.
3. Select the `browser-extension` directory.
4. If opening `webgui/index.html` directly from disk, enable **Allow access to file URLs** on the extension's Details page.
5. Open the extension, enter your FortiFlex API ID, client ID, and password, and choose **Save & test connection**.
6. Open `webgui/index.html`, or load it through FabricBOM's plugin workflow.

## Security model

- No credentials, API keys, passwords, or OAuth tokens are embedded in this repository.
- Each user's FortiFlex credential is stored in that user's extension-local browser storage.
- Credential storage is restricted to trusted extension contexts and is not synchronized.
- OAuth access tokens are kept only in the extension service worker's memory.
- Credentials and tokens are never included in FabricBOM messages, saved BOM state, exports, or logs.
- Extension network permissions are limited to Fortinet's authentication and FortiFlex API hosts.
- The webpage receives catalog, program, calculation, status, and error results only.

Never add credential exports, `.env` files, private keys, screenshots containing secrets, or copied request bodies to the repository. See [SECURITY.md](SECURITY.md).

## FortiFlex API behavior

The connector authenticates through Fortinet OAuth and uses FortiFlex API v2:

- `tools/metadata` supplies product types, parameters, and valid values dynamically.
- `programs/list` supplies the user's available FortiFlex programs.
- `tools/calc` supplies read-only point estimates.
- Multi-value parameters are sent as repeated parameter entries with the same parameter ID.
- The API's current line total is divided by count for points per device per day, and multiplied by 365 for the annual estimate.

The local OpenAPI documents are included for development reference. Confirm current behavior against Fortinet's authoritative documentation before making compatibility-sensitive changes.

## Validation

The plugin and extension are dependency-free. JavaScript syntax, the extension manifest, DOM references, local bridge messaging, OAuth response handling, and archive structure are checked during development without using or publishing user credentials.
