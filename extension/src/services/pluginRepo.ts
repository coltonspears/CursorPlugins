import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { PluginRepoInfo } from "../types";

const PLUGIN_MANIFEST = ".cursor-plugin/plugin.json";
const DEFAULT_REPO_NAME = "CursorPlugins";

export function getConfiguredPluginRepoPath(): string {
  return vscode.workspace.getConfiguration("cursorTeamTools").get<string>("pluginRepoPath") ?? "";
}

export async function resolvePluginRepo(): Promise<PluginRepoInfo | undefined> {
  const configured = getConfiguredPluginRepoPath();
  if (configured) {
    const info = scanForPlugin(configured);
    if (info) return info;
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;

  const rootPath = folders[0].uri.fsPath;

  // Multi-repo: CursorPlugins is a subfolder of the workspace
  const asSubfolder = path.join(rootPath, DEFAULT_REPO_NAME);
  const subInfo = scanForPlugin(asSubfolder);
  if (subInfo) return subInfo;

  // Single-repo: CursorPlugins is a sibling directory
  const parent = path.dirname(rootPath);
  const asSibling = path.join(parent, DEFAULT_REPO_NAME);
  const sibInfo = scanForPlugin(asSibling);
  if (sibInfo) return sibInfo;

  return undefined;
}

function scanForPlugin(repoRoot: string): PluginRepoInfo | undefined {
  if (!fs.existsSync(repoRoot)) return undefined;

  try {
    const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "extension") continue;
      const manifestPath = path.join(repoRoot, entry.name, PLUGIN_MANIFEST);
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        return {
          repoRoot,
          pluginDir: path.join(repoRoot, entry.name),
          pluginName: manifest.name ?? entry.name,
        };
      }
    }
  } catch {
    // directory not readable
  }

  return undefined;
}

export function validatePluginDir(pluginDir: string): boolean {
  const hasSkills = fs.existsSync(path.join(pluginDir, "skills"));
  const hasRules = fs.existsSync(path.join(pluginDir, "rules"));
  const hasManifest = fs.existsSync(path.join(pluginDir, PLUGIN_MANIFEST));
  return hasManifest && (hasSkills || hasRules);
}
