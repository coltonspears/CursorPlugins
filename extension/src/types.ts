export type WorkspaceMode = "single-repo" | "multi-repo" | "unknown";

export interface DetectedWorkspace {
  mode: WorkspaceMode;
  rootPath: string;
  repos: string[];
}

export interface ProfileMapping {
  [repoName: string]: string;
}

export interface ResolvedProfile {
  name: string;
  repos: string[];
}

export interface DeploymentPlan {
  mode: WorkspaceMode;
  targetRoot: string;
  profiles: ResolvedProfile[];
  pluginRepoPath: string;
  pluginDir: string;
}

export interface AssetFile {
  relativePath: string;
  absolutePath: string;
  category: "skills" | "rules";
  /** Profiles parsed from frontmatter. Empty array means common. */
  fileProfiles: string[];
}

export interface DeploymentState {
  deployedAt: string;
  sourceCommit: string;
  profiles: string[];
  mode: WorkspaceMode;
  pluginDir: string;
}

export interface PluginRepoInfo {
  repoRoot: string;
  pluginDir: string;
  pluginName: string;
}
