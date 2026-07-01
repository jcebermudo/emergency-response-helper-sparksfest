"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToBigQuery = exports.resolveTask = exports.claimTask = void 0;
/**
 * Cloud Functions entry point.
 * Re-export all functions so Firebase picks them up at deploy time.
 */
var claimTask_1 = require("./claimTask");
Object.defineProperty(exports, "claimTask", { enumerable: true, get: function () { return claimTask_1.claimTask; } });
var resolveTask_1 = require("./resolveTask");
Object.defineProperty(exports, "resolveTask", { enumerable: true, get: function () { return resolveTask_1.resolveTask; } });
var exportToBigQuery_1 = require("./exportToBigQuery");
Object.defineProperty(exports, "exportToBigQuery", { enumerable: true, get: function () { return exportToBigQuery_1.exportToBigQuery; } });
//# sourceMappingURL=index.js.map