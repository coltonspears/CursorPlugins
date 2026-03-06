import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { readDeploymentState } from "./deployer";

export async function getHeadCommit(repoPath: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    cp.exec("git rev-parse HEAD", { cwd: repoPath }, (err, stdout) => {
      if (err) {
        resolve(undefined);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function checkForUpdates(
  repoPath: string,
  workspaceRoot: string
): Promise<{ hasUpdate: boolean; currentCommit?: string; deployedCommit?: string }> {
  const state = readDeploymentState(workspaceRoot);
  const currentCommit = await getHeadCommit(repoPath);

  if (!state || !currentCommit) {
    return { hasUpdate: false, currentCommit, deployedCommit: state?.sourceCommit };
  }

  return {
    hasUpdate: state.sourceCommit !== currentCommit,
    currentCommit,
    deployedCommit: state.sourceCommit,
  };
}

export async function promptIfUpdateAvailable(
  repoPath: string,
  workspaceRoot: string
): Promise<boolean> {
  const result = await checkForUpdates(repoPath, workspaceRoot);
  if (!result.hasUpdate) return false;

  const action = await vscode.window.showInformationMessage(
    "Cursor Team Tools: The plugin repo has been updated since your last sync. Re-sync now?",
    "Sync Now",
    "Dismiss"
  );

  return action === "Sync Now";
}

export function createRepoWatcher(
  repoPath: string,
  onChanged: () => void
): vscode.FileSystemWatcher {
  const gitRefsPattern = new vscode.RelativePattern(
    path.join(repoPath, ".git", "refs", "heads"),
    "*"
  );
  const watcher = vscode.workspace.createFileSystemWatcher(gitRefsPattern);

  watcher.onDidChange(onChanged);
  watcher.onDidCreate(onChanged);

  return watcher;
}
