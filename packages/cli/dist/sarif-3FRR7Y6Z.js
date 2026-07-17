#!/usr/bin/env node
import "./chunk-ZWE3DS7E.js";

// ../reporters/dist/chunk-DTB5VJJ7.js
var SEVERITY_MAP = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
  info: "note"
};
var SarifReporter = class {
  name = "sarif";
  render(result) {
    const rulesMap = /* @__PURE__ */ new Map();
    for (const finding of result.findings) {
      if (!rulesMap.has(finding.ruleId)) {
        rulesMap.set(finding.ruleId, {
          id: finding.ruleId,
          name: finding.ruleName ?? finding.ruleId,
          shortDescription: {
            text: finding.message
          }
        });
      }
    }
    const sarifRun = {
      tool: {
        driver: {
          name: "Relay",
          version: result.version,
          informationUri: "https://relay.dev",
          rules: Array.from(rulesMap.values())
        }
      },
      results: result.findings.map((finding) => {
        const sarifResult = {
          ruleId: finding.ruleId,
          level: SEVERITY_MAP[finding.severity],
          message: {
            text: finding.message
          }
        };
        if (finding.file) {
          sarifResult.locations = [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: finding.file,
                  uriBaseId: "%SRCROOT%"
                },
                region: {
                  startLine: finding.line ?? 1,
                  startColumn: finding.column ?? 1
                }
              }
            }
          ];
        }
        return sarifResult;
      })
    };
    const sarifDoc = {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [sarifRun]
    };
    return JSON.stringify(sarifDoc, null, 2);
  }
};
export {
  SarifReporter
};
//# sourceMappingURL=sarif-3FRR7Y6Z.js.map