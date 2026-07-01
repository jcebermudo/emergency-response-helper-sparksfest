/**
 * Cloud Functions entry point.
 * Re-export all functions so Firebase picks them up at deploy time.
 */
export { claimTask } from "./claimTask";
export { resolveTask } from "./resolveTask";
export { exportToBigQuery } from "./exportToBigQuery";
