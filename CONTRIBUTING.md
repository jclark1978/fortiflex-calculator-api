# Workflow

This repo uses issue-driven, branch-per-change development. `main` is protected — all
changes land via pull request, no direct pushes (enforced for admins too).

## Process

1. **File an issue** describing the change (bug, feature, chore).
2. **Branch off `main`**, named `issue-<number>-<short-slug>` (e.g. `issue-12-fix-col-resize`).
3. **Make the change**, bumping the relevant version number as part of the same PR:
   - `webgui/index.html` → the `fabricbomPlugin` meta block's `version` field, for
     calculator/plugin-facing changes.
   - `browser-extension/manifest.json` **and** `bridge.js`'s `BRIDGE_VERSION` (keep these
     two in sync) → for connector changes.
4. **Update `CHANGELOG.md`** with a dated entry under the new version.
5. **Open a PR** referencing the issue (`Fixes #<number>` in the description so it
   auto-closes on merge).
6. **Squash-merge** once reviewed/confirmed. The branch is auto-deleted on merge.
7. For browser-extension releases meant for users to download, cut a GitHub release/tag
   (`gh release create vX.Y.Z ...`) with the packaged zip as an asset.

## Branch protection on `main`

- No direct pushes (including from repo admins).
- No force-pushes, no branch deletion.
- Changes must come in through a pull request.

## Repo merge settings

- Squash merge only (linear, one-commit-per-change history).
- Feature branches are deleted automatically after merge.
