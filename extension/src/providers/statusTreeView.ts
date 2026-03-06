import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { readDeploymentState } from "../services/deployer";
import { resolvePluginRepo } from "../services/pluginRepo";
import { detectWorkspace } from "../services/workspaceDetector";
import { getRepoProfileMapping, resolveProfiles, discoverProfilesFromPlugin } from "../services/profileManager";
import { checkForUpdates } from "../services/updateChecker";

type TreeItem = vscode.TreeItem;

export class StatusTreeProvider implements vscode.TreeDataProvider<StatusNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: StatusNode): TreeItem {
    return element;
  }

  async getChildren(element?: StatusNode): Promise<StatusNode[]> {
    if (element) {
      return element.children ?? [];
    }
    return this.buildRootNodes();
  }

  private async buildRootNodes(): Promise<StatusNode[]> {
    const nodes: StatusNode[] = [];

    const workspace = await detectWorkspace();
    nodes.push(new StatusNode(
      `Workspace: ${workspace?.mode ?? "none"}`,
      vscode.TreeItemCollapsibleState.None,
      "symbol-folder"
    ));

    const pluginInfo = await resolvePluginRepo();
    if (pluginInfo) {
      const repoNode = new StatusNode(
        `Plugin Repo: ${path.basename(pluginInfo.repoRoot)}`,
        vscode.TreeItemCollapsibleState.Collapsed,
        "repo"
      );

      const statusResult = workspace
        ? await checkForUpdates(pluginInfo.repoRoot, workspace.rootPath)
        : { hasUpdate: false };

      repoNode.children = [
        new StatusNode(
          `Plugin: ${pluginInfo.pluginName}`,
          vscode.TreeItemCollapsibleState.None,
          "package"
        ),
        new StatusNode(
          `Status: ${statusResult.hasUpdate ? "update available" : "up to date"}`,
          vscode.TreeItemCollapsibleState.None,
          statusResult.hasUpdate ? "warning" : "check"
        ),
      ];
      nodes.push(repoNode);

      if (workspace) {
        const profiles = resolveProfiles(workspace);
        const available = discoverProfilesFromPlugin(pluginInfo.pluginDir);
        const profileNode = new StatusNode(
          "Profiles",
          vscode.TreeItemCollapsibleState.Collapsed,
          "symbol-enum"
        );

        const commonNode = new StatusNode(
          "common (always deployed)",
          vscode.TreeItemCollapsibleState.None,
          "symbol-constant"
        );
        profileNode.children = [commonNode];

        for (const prof of profiles) {
          profileNode.children.push(new StatusNode(
            `${prof.name} -> ${prof.repos.join(", ")}`,
            vscode.TreeItemCollapsibleState.None,
            "symbol-enum-member"
          ));
        }

        const unmapped = available.filter((a) => !profiles.some((p) => p.name === a));
        for (const name of unmapped) {
          profileNode.children.push(new StatusNode(
            `${name} (no repos mapped)`,
            vscode.TreeItemCollapsibleState.None,
            "symbol-enum-member"
          ));
        }

        nodes.push(profileNode);
      }
    } else {
      nodes.push(new StatusNode(
        "Plugin Repo: not found",
        vscode.TreeItemCollapsibleState.None,
        "warning",
        { command: "cursorTeamTools.locatePluginRepo", title: "Locate" }
      ));
    }

    if (workspace) {
      const state = readDeploymentState(workspace.rootPath);
      if (state) {
        const date = new Date(state.deployedAt);
        const formatted = date.toLocaleString();
        nodes.push(new StatusNode(
          `Last deployed: ${formatted}`,
          vscode.TreeItemCollapsibleState.None,
          "history"
        ));
      } else {
        nodes.push(new StatusNode(
          "Not yet deployed",
          vscode.TreeItemCollapsibleState.None,
          "info",
          { command: "cursorTeamTools.sync", title: "Sync" }
        ));
      }
    }

    return nodes;
  }
}

class StatusNode extends vscode.TreeItem {
  children?: StatusNode[];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    icon?: string,
    command?: vscode.Command
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon);
    }
    if (command) {
      this.command = command;
    }
  }
}
