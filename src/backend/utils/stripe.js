"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = exports.getStripe = exports.stripeSecretKey = void 0;
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
exports.stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
// Lazy initialization - stripe instance will be created at runtime
let stripeInstance = null;
const getStripe = () => {
    if (!stripeInstance) {
        stripeInstance = new stripe_1.default(exports.stripeSecretKey.value(), {
            apiVersion: "2025-11-17.clover",
            typescript: true,
        });
    }
    return stripeInstance;
};
exports.getStripe = getStripe;
// For backward compatibility
exports.stripe = new Proxy({}, {
    get: (target, prop) => {
        return (0, exports.getStripe)()[prop];
    },
});
//# sourceMappingURL=stripe.js.map