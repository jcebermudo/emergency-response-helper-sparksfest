"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
// Initialise once; subsequent imports reuse the same app instance.
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
exports.db = (0, firestore_1.getFirestore)((0, app_1.getApp)());
exports.auth = (0, auth_1.getAuth)((0, app_1.getApp)());
//# sourceMappingURL=firebase.js.map