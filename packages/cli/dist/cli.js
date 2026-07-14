#!/usr/bin/env node
import {
  renderResult
} from "./chunk-3CEFTVNR.js";

// src/cli.ts
import { defineCommand as defineCommand8, runMain } from "citty";

// src/commands/doctor.ts
import { existsSync } from "fs";
import { join } from "path";
import { RelayEngine } from "@relay/core";
import { defineCommand } from "citty";
import { createConsola } from "consola";
var logger = createConsola({ level: 4 });
var doctorCommand = defineCommand({
  meta: {
    name: "doctor",
    description: "Diagnose your Relay installation and project configuration"
  },
  args: {
    cwd: {
      type: "string",
      description: "Project root directory",
      default: process.cwd()
    }
  },
  async run({ args }) {
    const cwd = args.cwd;
    let allPassed = true;
    console.log("\n  Relay Doctor\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
    const nodeVer = process.version;
    const nodeMajor = Number.parseInt(nodeVer.slice(1));
    if (nodeMajor >= 18) {
      logger.success(`Node ${nodeVer} detected (minimum: 18)`);
    } else {
      logger.error(`Node ${nodeVer} \u2014 upgrade to 18+ required`);
      allPassed = false;
    }
    const engine = new RelayEngine();
    logger.success(`@relay/cli ${engine.version}`);
    const configFiles = [".relayrc.json", "relay.config.ts", "relay.config.js"];
    const foundConfig = configFiles.find((f) => existsSync(join(cwd, f)));
    if (foundConfig) {
      logger.success(`Config found: ${foundConfig}`);
      const validation = await engine.validate(null);
      if (validation.valid) {
        logger.success("Config is valid");
      } else {
        logger.error(`Config invalid:
${validation.errors.join("\n")}`);
        allPassed = false;
      }
    } else {
      logger.warn("No config file found \u2014 using defaults");
      logger.info("Run `relay init` to create one");
    }
    const detection = await engine.detect(cwd);
    if (detection.framework !== "unknown") {
      logger.success(
        `Framework detected: ${detection.framework} (${detection.confidence} confidence)`
      );
    } else {
      logger.warn("Framework not detected \u2014 may affect rule loading");
    }
    const lockfiles = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb"];
    const foundLock = lockfiles.find((f) => existsSync(join(cwd, f)));
    if (foundLock) {
      logger.success(`Lockfile found: ${foundLock}`);
    } else {
      logger.warn("No lockfile found \u2014 consider committing one");
    }
    if (existsSync(join(cwd, ".git"))) {
      logger.success("Git repository detected");
    } else {
      logger.warn("Not a git repository");
    }
    console.log("");
    if (allPassed) {
      logger.success("All checks passed \u2014 ready to run `relay review`\n");
    } else {
      logger.error("Some checks failed \u2014 fix the issues above\n");
      process.exit(1);
    }
  }
});

// src/commands/init.ts
import { existsSync as existsSync2, writeFileSync } from "fs";
import { join as join2 } from "path";
import { defineCommand as defineCommand2 } from "citty";
import { createConsola as createConsola2 } from "consola";
var logger2 = createConsola2({ level: 4 });
var DEFAULT_CONFIG = {
  $schema: "https://relay.dev/schema/config.json",
  framework: "auto",
  severity: "info",
  rules: {},
  plugins: [],
  ignore: ["dist/**", "build/**", "node_modules/**", "coverage/**"],
  report: {
    format: "terminal"
  },
  thresholds: {
    score: 0,
    critical: 0
  }
};
var initCommand = defineCommand2({
  meta: {
    name: "init",
    description: "Initialize Relay in the current project"
  },
  args: {
    cwd: {
      type: "string",
      description: "Project root directory",
      default: process.cwd()
    },
    force: {
      type: "boolean",
      description: "Overwrite existing config",
      default: false
    }
  },
  async run({ args }) {
    const cwd = args.cwd;
    const configPath = join2(cwd, ".relayrc.json");
    console.log("\n  Relay Init\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
    if (existsSync2(configPath) && !args.force) {
      logger2.warn(".relayrc.json already exists. Use --force to overwrite.");
      return;
    }
    writeFileSync(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}
`, "utf8");
    logger2.success("Created .relayrc.json");
    console.log("\n  Next steps:\n");
    console.log("    1. Review .relayrc.json and adjust thresholds");
    console.log("    2. Install rule packs:");
    console.log("       pnpm add -D @relay/rules-security @relay/rules-accessibility");
    console.log("    3. Run your first review:");
    console.log("       relay review");
    console.log("");
  }
});

// src/commands/install-skills.ts
import { existsSync as existsSync3, mkdirSync, readFileSync, readdirSync, writeFileSync as writeFileSync2 } from "fs";
import { homedir } from "os";
import { dirname, join as join3 } from "path";
import { fileURLToPath } from "url";
import { defineCommand as defineCommand3 } from "citty";
import { createConsola as createConsola3 } from "consola";
var logger3 = createConsola3({ level: 4 });
async function runInstallSkills(args) {
  const cwd = args.cwd;
  const providerList = args.providers.split(",").map((p) => p.trim().toLowerCase());
  const isAll = providerList.includes("all");
  console.log("\n  Relay Skill Installer\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const searchPaths = [
    join3(currentFileDir, "skills"),
    // dist output
    join3(currentFileDir, "../../skills"),
    // local dev from packages/cli/src/
    join3(currentFileDir, "../../../../skills"),
    // local dev/test from packages/cli/src/commands/
    join3(cwd, "skills"),
    // local dev fallback from cwd
    join3(cwd, "packages/cli/dist/skills")
    // monorepo root pointing to dist
  ];
  let sourceSkillsDir = "";
  for (const p of searchPaths) {
    if (existsSync3(p)) {
      sourceSkillsDir = p;
      break;
    }
  }
  if (!sourceSkillsDir) {
    logger3.error("Could not locate the Relay skills source directory.");
    process.exit(1);
  }
  logger3.info(`Source skills directory: ${sourceSkillsDir}`);
  const skillsList = [];
  try {
    const entries = readdirSync(sourceSkillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFilePath = join3(sourceSkillsDir, entry.name, "SKILL.md");
        if (existsSync3(skillFilePath)) {
          const content = readFileSync(skillFilePath, "utf8");
          skillsList.push({ name: entry.name, content });
        }
      }
    }
  } catch (err) {
    logger3.error("Failed to read source skills directory:", err);
    process.exit(1);
  }
  if (skillsList.length === 0) {
    logger3.warn("No skills found to install.");
    return;
  }
  logger3.success(
    `Discovered ${skillsList.length} skills: ${skillsList.map((s) => s.name).join(", ")}`
  );
  const safeWriteFile = (dir, filename, content) => {
    try {
      if (!existsSync3(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const filePath = join3(dir, filename);
      writeFileSync2(filePath, content, "utf8");
      logger3.success(`Installed: ${join3(dir, filename)}`);
    } catch (err) {
      logger3.error(`Failed to write file in ${dir}:`, err);
    }
  };
  if (isAll || providerList.includes("cursor")) {
    const cursorDir = join3(cwd, ".cursor", "rules");
    logger3.info("Installing Cursor rules...");
    for (const skill of skillsList) {
      safeWriteFile(cursorDir, `relay-${skill.name}.md`, skill.content);
    }
  }
  if (isAll || providerList.includes("claude")) {
    if (args.global) {
      const globalClaudeDir = join3(homedir(), ".claude", "skills");
      logger3.info("Installing Claude Code skills globally...");
      for (const skill of skillsList) {
        safeWriteFile(globalClaudeDir, `relay-${skill.name}.md`, skill.content);
      }
    } else {
      const localClaudeDir = join3(cwd, ".claude", "skills");
      logger3.info("Installing Claude Code skills locally...");
      for (const skill of skillsList) {
        safeWriteFile(localClaudeDir, `relay-${skill.name}.md`, skill.content);
      }
      const claudeCommandsDir = join3(cwd, ".claude", "commands");
      logger3.info("Installing Claude Code slash commands...");
      for (const skill of skillsList) {
        let cleanContent = skill.content;
        if (cleanContent.startsWith("---")) {
          const parts = cleanContent.split("---");
          if (parts.length >= 3) {
            cleanContent = parts.slice(2).join("---").trim();
          }
        }
        safeWriteFile(claudeCommandsDir, `relay-${skill.name}.md`, cleanContent);
      }
    }
  }
  if (isAll || providerList.includes("agents")) {
    const agentsDir = join3(cwd, ".agents", "skills");
    logger3.info("Installing general agent skills...");
    for (const skill of skillsList) {
      safeWriteFile(agentsDir, `relay-${skill.name}.md`, skill.content);
    }
  }
  if (isAll || providerList.includes("copilot")) {
    const githubDir = join3(cwd, ".github");
    const copilotFile = join3(githubDir, "copilot-instructions.md");
    logger3.info("Installing Copilot instructions...");
    const separatorBegin = "<!-- BEGIN RELAY SKILLS -->";
    const separatorEnd = "<!-- END RELAY SKILLS -->";
    let combinedContent = `${separatorBegin}
# Relay Assistant Skills

`;
    for (const skill of skillsList) {
      let cleanContent = skill.content;
      if (cleanContent.startsWith("---")) {
        const parts = cleanContent.split("---");
        if (parts.length >= 3) {
          cleanContent = parts.slice(2).join("---").trim();
        }
      }
      combinedContent += `## Skill: ${skill.name}

${cleanContent}

`;
    }
    combinedContent += `${separatorEnd}`;
    try {
      if (!existsSync3(githubDir)) {
        mkdirSync(githubDir, { recursive: true });
      }
      let finalFileContent = combinedContent;
      if (existsSync3(copilotFile)) {
        const existingContent = readFileSync(copilotFile, "utf8");
        const beginIdx = existingContent.indexOf(separatorBegin);
        const endIdx = existingContent.indexOf(separatorEnd);
        if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
          finalFileContent = existingContent.slice(0, beginIdx) + combinedContent + existingContent.slice(endIdx + separatorEnd.length);
        } else {
          finalFileContent = `${existingContent.trim()}

${combinedContent}
`;
        }
      }
      writeFileSync2(copilotFile, finalFileContent, "utf8");
      logger3.success(`Installed: ${copilotFile}`);
    } catch (err) {
      logger3.error("Failed to write Copilot instructions:", err);
    }
  }
  console.log("\n  Relay Skill Installation Complete!\n");
}
var installSkillsCommand = defineCommand3({
  meta: {
    name: "install-skills",
    description: "Automatically install Relay agent skills into AI assistant configuration directories"
  },
  args: {
    cwd: {
      type: "string",
      description: "Project root directory",
      default: process.cwd()
    },
    providers: {
      type: "string",
      description: "Comma-separated assistant providers to install for (cursor, claude, copilot, agents, all)",
      default: "all"
    },
    global: {
      type: "boolean",
      description: "Install Claude skills globally (~/.claude/skills)",
      default: false
    }
  },
  async run({ args }) {
    await runInstallSkills(args);
  }
});

// src/commands/misc.ts
import { RelayEngine as RelayEngine2 } from "@relay/core";
import { defineCommand as defineCommand4 } from "citty";

// src/shared-args.ts
var sharedReviewArgs = {
  cwd: {
    type: "string",
    description: "Project root directory (default: current directory)",
    default: process.cwd(),
    alias: "C"
  },
  format: {
    type: "string",
    description: "Output format: terminal | json | markdown | html | sarif | github",
    default: "terminal",
    alias: "f"
  },
  output: {
    type: "string",
    description: "Write report to file",
    alias: "o"
  },
  framework: {
    type: "string",
    description: "Force framework detection result"
  },
  severity: {
    type: "string",
    description: "Minimum severity: critical | high | medium | low | info",
    default: "info",
    alias: "s"
  },
  ci: {
    type: "boolean",
    description: "CI mode: no color, machine-friendly output",
    default: false
  },
  verbose: {
    type: "boolean",
    description: "Verbose debug output",
    default: false,
    alias: "v"
  },
  config: {
    type: "string",
    description: "Config file path (default: auto-detect)"
  }
};
function toRunOptions(args, categories) {
  const opts = {
    cwd: args.cwd,
    severity: args.severity
  };
  if (args.framework !== void 0) {
    opts.framework = args.framework;
  }
  if (categories !== void 0) {
    opts.categories = categories;
  }
  return opts;
}
function toExitCode(status) {
  switch (status) {
    case "ship":
      return 0;
    case "warn":
      return 1;
    case "hold":
      return 2;
    case "critical":
      return 3;
    default:
      return 2;
  }
}

// src/commands/misc.ts
var accessibilityCommand = defineCommand4({
  meta: { name: "accessibility", description: "Accessibility review (WCAG 2.1)" },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine2();
    const result = await engine.run(toRunOptions(args, ["accessibility"]));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});
var architectureCommand = defineCommand4({
  meta: { name: "architecture", description: "Architecture review \u2014 coupling, patterns, deps" },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine2();
    const result = await engine.run(toRunOptions(args, ["architecture"]));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});
var performanceCommand = defineCommand4({
  meta: { name: "performance", description: "Performance review \u2014 bundle, rendering, caching" },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine2();
    const result = await engine.run(toRunOptions(args, ["performance"]));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});
var reportCommand = defineCommand4({
  meta: { name: "report", description: "Re-render a saved scan result in a different format" },
  args: {
    input: {
      type: "string",
      description: "Path to saved JSON scan result",
      required: true
    },
    format: {
      type: "string",
      description: "Output format: terminal | json | markdown | html | sarif | github",
      default: "terminal"
    },
    output: {
      type: "string",
      description: "Write to file"
    }
  },
  async run({ args }) {
    const { readFileSync: readFileSync2 } = await import("fs");
    const { renderResult: renderResult2 } = await import("./render-DLKUYNFS.js");
    const raw = readFileSync2(args.input, "utf8");
    const result = JSON.parse(raw);
    await renderResult2(result, {
      format: args.format,
      output: args.output,
      ci: false,
      verbose: false
    });
  }
});
var versionCommand = defineCommand4({
  meta: { name: "version", description: "Show Relay version information" },
  args: {},
  run() {
    const engine = new RelayEngine2();
    console.log(`relay ${engine.version}`);
  }
});

// src/commands/release.ts
import { RelayEngine as RelayEngine3 } from "@relay/core";
import { defineCommand as defineCommand5 } from "citty";
var releaseCommand = defineCommand5({
  meta: {
    name: "release",
    description: "Release readiness gate \u2014 tests, changelog, version, deps"
  },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine3();
    const opts = toRunOptions(args, ["testing", "deployment", "security", "documentation"]);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});

// src/commands/review.ts
import { RelayEngine as RelayEngine4 } from "@relay/core";
import { defineCommand as defineCommand6 } from "citty";
var reviewCommand = defineCommand6({
  meta: {
    name: "review",
    description: "Run a full project review across all categories"
  },
  args: {
    ...sharedReviewArgs
  },
  async run({ args }) {
    const engine = new RelayEngine4();
    const opts = toRunOptions(args);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});

// src/commands/security.ts
import { RelayEngine as RelayEngine5 } from "@relay/core";
import { defineCommand as defineCommand7 } from "citty";
var securityCommand = defineCommand7({
  meta: {
    name: "security",
    description: "Run a security-focused review (OWASP Top 10, secrets, headers)"
  },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine5();
    const opts = toRunOptions(args, ["security"]);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});

// src/cli.ts
var main = defineCommand8({
  meta: {
    name: "relay",
    version: "0.1.0",
    description: "Developer review platform \u2014 QA, security, release, architecture"
  },
  subCommands: {
    review: reviewCommand,
    release: releaseCommand,
    security: securityCommand,
    accessibility: accessibilityCommand,
    architecture: architectureCommand,
    performance: performanceCommand,
    report: reportCommand,
    doctor: doctorCommand,
    init: initCommand,
    "install-skills": installSkillsCommand,
    version: versionCommand
  }
});
runMain(main);
//# sourceMappingURL=cli.js.map