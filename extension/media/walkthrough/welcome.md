## What is Cursor Team Tools?

Cursor Team Tools deploys shared **skills**, **rules**, and **MCP configuration** from your team's CursorPlugins repository to your workspace's `.cursor/` directory.

### How it works

- **Single-repo mode** — If you open one repo per Cursor window, it deploys skills and rules for that specific repo type.
- **Multi-repo mode** — If you open a parent directory containing all repos, it deploys everything with glob-scoped rules so each repo gets the right configuration.

### Profiles

Each skill and rule is tagged with a **profile** (e.g. `wpf`, `sql`). The extension maps your repo folder names to profiles and only deploys what's relevant.
