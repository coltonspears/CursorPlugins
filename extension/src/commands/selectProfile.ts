import * as vscode from "vscode";
import { resolvePluginRepo } from "../services/pluginRepo";
import { discoverProfilesFromPlugin } from "../services/profileManager";
import { deploy } from "../services/deployer";
import { DeploymentPlan } from "../types";

export async function selectProfileCommand(context: vscode.ExtensionContext): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("Cursor Team Tools: no workspace folder is open.");
    return;
  }

  const pluginInfo = await resolvePluginRepo();
  if (!pluginInfo) {
    vscode.window.showWarningMessage(
      "Cursor Team Tools: plugin repo not found. Run 'Locate Plugin Repo' first."
    );
    return;
  }

  const rootPath = folders[0].uri.fsPath;
  const available = discoverProfilesFromPlugin(pluginInfo.pluginDir);

  if (available.length === 0) {
    vscode.window.showWarningMessage("Cursor Team Tools: no profiles found in plugin.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    available.map((p) => ({ label: p, picked: true })),
    { canPickMany: true, placeHolder: "Select profiles to deploy (common is always included)" }
  );

  if (!picked || picked.length === 0) return;

  const mode = await vscode.window.showQuickPick(
    [
      { label: "Single-repo", description: "alwaysApply on all rules", value: "single-repo" as const },
      { label: "Multi-repo", description: "Rules scoped with globs", value: "multi-repo" as const },
    ],
    { placeHolder: "How should rules be scoped?" }
  );

  if (!mode) return;

  const plan: DeploymentPlan = {
    mode: mode.value,
    targetRoot: rootPath,
    profiles: picked.map((p) => ({ name: p.label, repos: [p.label] })),
    pluginRepoPath: pluginInfo.repoRoot,
    pluginDir: pluginInfo.pluginDir,
  };

  try {
    await deploy(plan);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Cursor Team Tools: deployment failed — ${message}`);
  }
}
