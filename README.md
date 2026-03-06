# CursorPlugins

Team Cursor plugin repository. Contains shared skills, rules, and the VSIX deployment extension.

## Structure

| Directory | Purpose |
|-----------|---------|
| `my-plugin/` | Plugin content (skills, rules) following the cursor/plugins pattern |
| `extension/` | VSIX extension source that deploys plugin content to workspaces |

## Getting Started

1. Install the VSIX from `extension/` (or use F5 to debug)
2. Open your workspace in Cursor
3. Run **Cursor Team Tools: Sync Config** from the command palette
