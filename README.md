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

## Prerequisites: FortiFlex account and API credentials

Before using the calculator, you need a FortiCloud account with FortiFlex activated and a FortiFlex API user. The connector uses that user's credential to load your available catalog and programs and to request read-only point estimates.

1. Sign in to [Fortinet Support](https://support.fortinet.com), then go to **Services → IAM**.
2. Create an active permission profile that includes access to the FortiFlex portal. Read-only permission is sufficient for this calculator; create or change operations require read/write permission.
3. Create an API user and assign that permission profile.
4. Choose **Download Credentials** and set a password. Fortinet downloads an encrypted CSV containing the API user's credentials.
5. In the connector's settings page, enter the API ID/username and password from that CSV, plus the client ID supplied for your FortiFlex API flow. Fortinet's standard FortiFlex OAuth example uses `flexvm` as the client ID.
6. Choose **Save & test connection**. The credential stays only in the local browser extension.

Downloading API-user credentials resets that API user's prior security credentials, so update the connector if you download a replacement CSV. You do not need to manually acquire or paste an OAuth access token—the connector handles OAuth locally.

See Fortinet's [FortiFlex API administration guide](https://docs.fortinet.com/document/fortiflex/26.2.1/administration-guide/fortiflex-api) for the authoritative API-user and IAM steps.

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
