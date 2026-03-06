import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DetectedWorkspace, ProfileMapping, ResolvedProfile, DeploymentPlan } from "../types";
import { parseProfilesFromFrontmatter } from "./deployer";

export function getRepoProfileMapping(): ProfileMapping {
  return vscode.workspace.getConfiguration("cursorTeamTools").get<ProfileMapping>("repoProfiles") ?? {};
}

export function resolveProfiles(workspace: DetectedWorkspace): ResolvedProfile[] {
  const mapping = getRepoProfileMapping();
  const grouped = new Map<string, string[]>();

  for (const repo of workspace.repos) {
    const profile = mapping[repo];
    if (!profile) continue;
    const existing = grouped.get(profile) ?? [];
    existing.push(repo);
    grouped.set(profile, existing);
  }

  return Array.from(grouped.entries()).map(([name, repos]) => ({ name, repos }));
}

export function buildDeploymentPlan(
  workspace: DetectedWorkspace,
  pluginRepoPath: string,
  pluginDir: string
): DeploymentPlan {
  return {
    mode: workspace.mode,
    targetRoot: workspace.rootPath,
    profiles: resolveProfiles(workspace),
    pluginRepoPath,
    pluginDir,
  };
}

/**
 * Scan the plugin directory to discover which profile names are referenced in frontmatter.
 */
export function discoverProfilesFromPlugin(pluginDir: string): string[] {
  const profiles = new Set<string>();

  for (const category of ["skills", "rules"]) {
    const dir = path.join(pluginDir, category);
    if (!fs.existsSync(dir)) continue;
    walkForProfiles(dir, profiles);
  }

  return Array.from(profiles).sort();
}

function walkForProfiles(dir: string, profiles: Set<string>): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkForProfiles(full, profiles);
    } else {
      try {
        const content = fs.readFileSync(full, "utf-8");
        for (const p of parseProfilesFromFrontmatter(content)) {
          profiles.add(p);
        }
      } catch { /* skip unreadable */ }
    }
  }
}
