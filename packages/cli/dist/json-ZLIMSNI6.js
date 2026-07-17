#!/usr/bin/env node
import "./chunk-ZWE3DS7E.js";

// ../reporters/dist/chunk-YRXF3JYJ.js
var JsonReporter = class {
  name = "json";
  render(result, opts = {}) {
    if (opts.ci) {
      return JSON.stringify(result);
    }
    return JSON.stringify(result, null, 2);
  }
};
export {
  JsonReporter
};
//# sourceMappingURL=json-ZLIMSNI6.js.map