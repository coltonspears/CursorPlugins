import * as vscode from "vscode";
import { syncCommand } from "./commands/sync";
import { selectProfileCommand } from "./commands/selectProfile";
import { locatePluginRepoCommand } from "./commands/locatePluginRepo";
import { checkForUpdatesCommand } from "./commands/checkForUpdates";
import { StatusTreeProvider } from "./providers/statusTreeView";
import { resolvePluginRepo } from "./services/pluginRepo";
import { detectWorkspace } from "./services/workspaceDetector";
import { promptIfUpdateAvailable, createRepoWatcher } from "./services/updateChecker";

export function activate(context: vscode.ExtensionContext): void {
  const statusTree = new StatusTreeProvider();

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorTeamTools.sync", async () => {
      await syncCommand(context);
      statusTree.refresh();
    }),
    vscode.commands.registerCommand("cursorTeamTools.selectProfile", async () => {
      await selectProfileCommand(context);
      statusTree.refresh();
    }),
    vscode.commands.registerCommand("cursorTeamTools.locatePluginRepo", async () => {
      await locatePluginRepoCommand();
      statusTree.refresh();
    }),
    vscode.commands.registerCommand("cursorTeamTools.checkForUpdates", checkForUpdatesCommand),
    vscode.commands.registerCommand("cursorTeamTools.openWalkthrough", () => {
      vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "your-team.cursor-team-tools#cursorTeamTools.setup",
        false
      );
    }),
    vscode.window.registerTreeDataProvider("cursorTeamTools.status", statusTree)
  );

  runStartupChecks(context, statusTree);
}

async function runStartupChecks(
  context: vscode.ExtensionContext,
  statusTree: StatusTreeProvider
): Promise<void> {
  const pluginInfo = await resolvePluginRepo();
  if (!pluginInfo) return;

  const watcher = createRepoWatcher(pluginInfo.repoRoot, async () => {
    const workspace = await detectWorkspace();
    if (!workspace) return;

    const shouldSync = await promptIfUpdateAvailable(pluginInfo.repoRoot, workspace.rootPath);
    if (shouldSync) {
      await syncCommand(context);
      statusTree.refresh();
    }
  });
  context.subscriptions.push(watcher);

  const config = vscode.workspace.getConfiguration("cursorTeamTools");

  if (config.get<boolean>("checkForUpdatesOnStartup")) {
    const workspace = await detectWorkspace();
    if (workspace) {
      const shouldSync = await promptIfUpdateAvailable(pluginInfo.repoRoot, workspace.rootPath);
      if (shouldSync) {
        await syncCommand(context);
        statusTree.refresh();
      }
    }
  }

  if (config.get<boolean>("autoSyncOnStartup")) {
    await syncCommand(context);
    statusTree.refresh();
  }
}

export function deactivate(): void {}
