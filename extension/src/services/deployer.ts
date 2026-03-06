import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { AssetFile, DeploymentPlan, DeploymentState } from "../types";
import { getHeadCommit } from "./updateChecker";

const STATE_FILE = ".cursor-team-tools.json";

export async function deploy(plan: DeploymentPlan): Promise<void> {
  const { pluginDir, targetRoot } = plan;

  if (!fs.existsSync(pluginDir)) {
    throw new Error(`Plugin directory not found: ${pluginDir}`);
  }

  const cursorDir = path.join(targetRoot, ".cursor");
  fs.mkdirSync(path.join(cursorDir, "rules"), { recursive: true });
  fs.mkdirSync(path.join(cursorDir, "skills"), { recursive: true });

  const activeProfileNames = new Set(["common", ...plan.profiles.map((p) => p.name)]);
  const allAssets = collectAssets(pluginDir);

  const filtered = allAssets.filter((a) => {
    if (a.fileProfiles.length === 0) return true; // common
    return a.fileProfiles.some((p) => activeProfileNames.has(p));
  });

  let rulesDeployed = 0;
  let skillsDeployed = 0;

  for (const asset of filtered) {
    if (asset.category === "rules") {
      deployRule(asset, plan, cursorDir);
      rulesDeployed++;
    } else {
      deploySkill(asset, cursorDir);
      skillsDeployed++;
    }
  }

  const commit = await getHeadCommit(plan.pluginRepoPath);
  const state: DeploymentState = {
    deployedAt: new Date().toISOString(),
    sourceCommit: commit ?? "unknown",
    profiles: Array.from(activeProfileNames),
    mode: plan.mode,
    pluginDir: plan.pluginDir,
  };
  fs.writeFileSync(path.join(cursorDir, STATE_FILE), JSON.stringify(state, null, 2), "utf-8");

  vscode.window.showInformationMessage(
    `Cursor Team Tools: deployed ${rulesDeployed} rule(s) and ${skillsDeployed} skill(s) to .cursor/`
  );
}

export function readDeploymentState(workspaceRoot: string): DeploymentState | undefined {
  const stateFile = path.join(workspaceRoot, ".cursor", STATE_FILE);
  if (!fs.existsSync(stateFile)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return undefined;
  }
}

function collectAssets(pluginDir: string): AssetFile[] {
  const assets: AssetFile[] = [];

  for (const category of ["skills", "rules"] as const) {
    const categoryDir = path.join(pluginDir, category);
    if (!fs.existsSync(categoryDir)) continue;

    walkDir(categoryDir, categoryDir, (relPath, absPath) => {
      const content = fs.readFileSync(absPath, "utf-8");
      const fileProfiles = parseProfilesFromFrontmatter(content);
      assets.push({ relativePath: relPath, absolutePath: absPath, category, fileProfiles });
    });
  }

  return assets;
}

function walkDir(base: string, current: string, cb: (relPath: string, absPath: string) => void): void {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walkDir(base, full, cb);
    } else {
      cb(path.relative(base, full), full);
    }
  }
}

function deployRule(asset: AssetFile, plan: DeploymentPlan, cursorDir: string): void {
  const raw = fs.readFileSync(asset.absolutePath, "utf-8");
  const { frontmatter, body } = parseMdcFrontmatter(raw);

  const description = typeof frontmatter.description === "string"
    ? frontmatter.description
    : path.basename(asset.relativePath, ".mdc");

  const isCommon = asset.fileProfiles.length === 0;

  let newFrontmatter: string;
  if (plan.mode === "single-repo" || isCommon) {
    newFrontmatter = buildFrontmatter({ description, alwaysApply: true });
  } else {
    const globs: string[] = [];
    for (const prof of plan.profiles) {
      if (asset.fileProfiles.includes(prof.name)) {
        globs.push(...prof.repos.map((r) => `${r}/**`));
      }
    }
    newFrontmatter = globs.length > 0
      ? buildFrontmatter({ description, globs })
      : buildFrontmatter({ description, alwaysApply: true });
  }

  const outPath = path.join(cursorDir, "rules", path.basename(asset.relativePath));
  fs.writeFileSync(outPath, newFrontmatter + body, "utf-8");
}

function deploySkill(asset: AssetFile, cursorDir: string): void {
  const destPath = path.join(cursorDir, "skills", asset.relativePath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(asset.absolutePath, destPath);
}

export function parseProfilesFromFrontmatter(content: string): string[] {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return [];

  const profileLine = match[1].split(/\r?\n/).find((l) => l.trimStart().startsWith("profiles:"));
  if (!profileLine) return [];

  const arrayMatch = profileLine.match(/\[([^\]]*)\]/);
  if (!arrayMatch) return [];

  return arrayMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
}

interface MdcParsed {
  frontmatter: Record<string, unknown>;
  body: string;
}

function parseMdcFrontmatter(content: string): MdcParsed {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (key === "profiles") continue; // handled separately
    let value: unknown = line.slice(idx + 1).trim();
    if (value === "true") value = true;
    if (value === "false") value = false;
    fm[key] = value;
  }

  return { frontmatter: fm, body: match[2] };
}

interface FrontmatterOptions {
  description: string;
  alwaysApply?: boolean;
  globs?: string[];
}

function buildFrontmatter(opts: FrontmatterOptions): string {
  let fm = "---\n";
  fm += `description: ${opts.description}\n`;
  if (opts.alwaysApply) {
    fm += "alwaysApply: true\n";
  }
  if (opts.globs && opts.globs.length > 0) {
    fm += `globs: ${JSON.stringify(opts.globs)}\n`;
  }
  fm += "---\n";
  return fm;
}
