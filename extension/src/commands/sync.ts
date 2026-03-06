import * as vscode from "vscode";
import { detectWorkspace } from "../services/workspaceDetector";
import { buildDeploymentPlan } from "../services/profileManager";
import { resolvePluginRepo } from "../services/pluginRepo";
import { deploy } from "../services/deployer";

export async function syncCommand(context: vscode.ExtensionContext): Promise<void> {
  const workspace = await detectWorkspace();
  if (!workspace) {
    vscode.window.showWarningMessage("Cursor Team Tools: no workspace folder is open.");
    return;
  }

  if (workspace.mode === "unknown") {
    vscode.window.showWarningMessage(
      "Cursor Team Tools: could not determine workspace layout. Use 'Select Profile' to configure manually."
    );
    return;
  }

  const pluginInfo = await resolvePluginRepo();
  if (!pluginInfo) {
    const action = await vscode.window.showWarningMessage(
      "Cursor Team Tools: plugin repo not found.",
      "Locate Plugin Repo",
      "Cancel"
    );
    if (action === "Locate Plugin Repo") {
      vscode.commands.executeCommand("cursorTeamTools.locatePluginRepo");
    }
    return;
  }

  const plan = buildDeploymentPlan(workspace, pluginInfo.repoRoot, pluginInfo.pluginDir);

  if (plan.profiles.length === 0) {
    const proceed = await vscode.window.showWarningMessage(
      "No repo-to-profile mappings matched this workspace. Only common assets will be deployed.",
      "Deploy Common Only",
      "Cancel"
    );
    if (proceed !== "Deploy Common Only") return;
  }

  const profileNames = plan.profiles.map((p) => p.name);
  const label = profileNames.length > 0
    ? `common + ${profileNames.join(", ")}`
    : "common only";

  const confirm = await vscode.window.showInformationMessage(
    `Deploy .cursor/ config (${plan.mode}, profiles: ${label})?`,
    "Deploy",
    "Cancel"
  );

  if (confirm !== "Deploy") return;

  try {
    await deploy(plan);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Cursor Team Tools: deployment failed — ${message}`);
  }
}
