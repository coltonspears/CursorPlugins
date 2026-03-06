import * as vscode from "vscode";
import { resolvePluginRepo, validatePluginDir } from "../services/pluginRepo";

export async function locatePluginRepoCommand(): Promise<void> {
  const auto = await resolvePluginRepo();
  if (auto) {
    const use = await vscode.window.showInformationMessage(
      `Found plugin repo at: ${auto.repoRoot} (plugin: ${auto.pluginName}). Use this?`,
      "Yes",
      "Browse..."
    );
    if (use === "Yes") {
      await savePluginRepoPath(auto.repoRoot);
      return;
    }
    if (!use) return;
  }

  const picked = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: "Select CursorPlugins repo root",
    title: "Locate the CursorPlugins repository",
  });

  if (!picked || picked.length === 0) return;

  const selectedPath = picked[0].fsPath;
  await savePluginRepoPath(selectedPath);
}

async function savePluginRepoPath(repoPath: string): Promise<void> {
  const config = vscode.workspace.getConfiguration("cursorTeamTools");
  await config.update("pluginRepoPath", repoPath, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Cursor Team Tools: plugin repo set to ${repoPath}`);
}
