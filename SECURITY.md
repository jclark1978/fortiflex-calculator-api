# Security

## Credential handling

FortiFlex credentials belong only in the installed browser extension's settings page. They must never be committed to source control, placed in plugin HTML, added to API documentation, included in BOM exports, or copied into issue reports.

The connector stores the API ID, client ID, and password in `chrome.storage.local` with access restricted to trusted extension contexts. OAuth tokens remain in service-worker memory and are discarded when that worker stops.

## Before committing

Review the complete staged file list and scan staged content for secrets. Pay particular attention to files with names containing `credential`, `secret`, `token`, `.env`, `key`, or `password`. The repository `.gitignore` blocks common local-secret filenames, but it is not a substitute for reviewing staged changes.

If a credential is ever committed, revoke or rotate it immediately and remove it from the repository's full history. Deleting it in a later commit is not sufficient.

## Reporting a security issue

Do not include live credentials, OAuth tokens, request bodies, or sensitive screenshots in a public GitHub issue. Share only sanitized error messages and reproduction steps.
