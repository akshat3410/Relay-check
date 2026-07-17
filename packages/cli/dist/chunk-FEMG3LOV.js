#!/usr/bin/env node

// src/render.ts
import { writeFileSync } from "fs";
async function renderResult(result, args) {
  const format = args.format ?? "terminal";
  let output;
  switch (format) {
    case "json": {
      const { JsonReporter } = await import("./json-ZLIMSNI6.js");
      const reporter = new JsonReporter();
      output = await reporter.render(result, { ci: args.ci });
      break;
    }
    case "markdown": {
      const { MarkdownReporter } = await import("./markdown-Y5KWHADD.js");
      const reporter = new MarkdownReporter();
      output = await reporter.render(result);
      break;
    }
    case "sarif": {
      const { SarifReporter } = await import("./sarif-3FRR7Y6Z.js");
      const reporter = new SarifReporter();
      output = await reporter.render(result);
      break;
    }
    case "html": {
      const { HtmlReporter } = await import("./html-J3ENDDM2.js");
      const reporter = new HtmlReporter();
      output = await reporter.render(result);
      break;
    }
    case "github": {
      const { GithubReporter } = await import("./github-XEYKPAOX.js");
      const reporter = new GithubReporter();
      output = await reporter.render(result);
      break;
    }
    default: {
      const { TerminalReporter } = await import("./terminal-6P7DSEK5.js");
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
//# sourceMappingURL=chunk-FEMG3LOV.js.map