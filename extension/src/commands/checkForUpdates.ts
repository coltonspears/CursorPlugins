import * as vscode from "vscode";
import { resolvePluginRepo } from "../services/pluginRepo";
import { detectWorkspace } from "../services/workspaceDetector";
import { checkForUpdates } from "../services/updateChecker";

export async function checkForUpdatesCommand(): Promise<void> {
  const pluginInfo = await resolvePluginRepo();
  if (!pluginInfo) {
    vscode.window.showWarningMessage(
      "Cursor Team Tools: plugin repo not found. Run 'Locate Plugin Repo' first."
    );
    return;
  }

  const workspace = await detectWorkspace();
  if (!workspace) {
    vscode.window.showWarningMessage("Cursor Team Tools: no workspace folder is open.");
    return;
  }

  const result = await checkForUpdates(pluginInfo.repoRoot, workspace.rootPath);

  if (result.hasUpdate) {
    const action = await vscode.window.showInformationMessage(
      `Plugin repo has been updated (deployed: ${result.deployedCommit?.slice(0, 8) ?? "none"}, current: ${result.currentCommit?.slice(0, 8) ?? "unknown"}). Re-sync?`,
      "Sync Now",
      "Dismiss"
    );
    if (action === "Sync Now") {
      vscode.commands.executeCommand("cursorTeamTools.sync");
    }
  } else {
    vscode.window.showInformationMessage("Cursor Team Tools: configuration is up to date.");
  }
}
