import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DetectedWorkspace, WorkspaceMode } from "../types";

export async function detectWorkspace(): Promise<DetectedWorkspace | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }

  const rootPath = folders[0].uri.fsPath;
  const rootHasGit = fs.existsSync(path.join(rootPath, ".git"));

  if (rootHasGit) {
    return { mode: "single-repo", rootPath, repos: [path.basename(rootPath)] };
  }

  const subRepos = await findSubRepos(rootPath);
  if (subRepos.length > 0) {
    return { mode: "multi-repo", rootPath, repos: subRepos };
  }

  const picked = await promptForMode();
  return { mode: picked, rootPath, repos: picked === "single-repo" ? [path.basename(rootPath)] : [] };
}

async function findSubRepos(rootPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(rootPath, { withFileTypes: true });
  const repos: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }
    const gitPath = path.join(rootPath, entry.name, ".git");
    if (fs.existsSync(gitPath)) {
      repos.push(entry.name);
    }
  }

  return repos;
}

async function promptForMode(): Promise<WorkspaceMode> {
  const choice = await vscode.window.showQuickPick(
    [
      { label: "Single Repository", description: "This workspace is a single repo", value: "single-repo" as const },
      { label: "Multiple Repositories", description: "This workspace contains multiple repos as subfolders", value: "multi-repo" as const },
    ],
    { placeHolder: "How is this workspace organized?" }
  );

  return choice?.value ?? "unknown";
}
