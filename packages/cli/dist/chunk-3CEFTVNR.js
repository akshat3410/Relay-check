#!/usr/bin/env node

// src/render.ts
import { writeFileSync } from "fs";
async function renderResult(result, args) {
  const format = args.format ?? "terminal";
  let output;
  switch (format) {
    case "json": {
      const { JsonReporter } = await import("@relay/reporters/json");
      const reporter = new JsonReporter();
      output = await reporter.render(result, { ci: args.ci });
      break;
    }
    case "markdown": {
      const { MarkdownReporter } = await import("@relay/reporters/markdown");
      const reporter = new MarkdownReporter();
      output = await reporter.render(result);
      break;
    }
    case "sarif": {
      const { SarifReporter } = await import("@relay/reporters/sarif");
      const reporter = new SarifReporter();
      output = await reporter.render(result);
      break;
    }
    case "html": {
      const { HtmlReporter } = await import("@relay/reporters/html");
      const reporter = new HtmlReporter();
      output = await reporter.render(result);
      break;
    }
    case "github": {
      const { GithubReporter } = await import("@relay/reporters/github");
      const reporter = new GithubReporter();
      output = await reporter.render(result);
      break;
    }
    default: {
      const { TerminalReporter } = await import("@relay/reporters/terminal");
      const reporter = new TerminalReporter();
      output = await reporter.render(result, { color: !args.ci, ci: args.ci });
      break;
    }
  }
  if (args.output) {
    writeFileSync(args.output, output, "utf8");
    console.log(`Report written to ${args.output}`);
  } else {
    process.stdout.write(output);
  }
}

export {
  renderResult
};
//# sourceMappingURL=chunk-3CEFTVNR.js.map