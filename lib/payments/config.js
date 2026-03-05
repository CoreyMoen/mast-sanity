"use strict";
/**
 * config.ts — Payment provider configuration and plan metadata.
 *
 * Centralizes provider selection, price ID mappings, and plan metadata
 * so that switching payment providers is as simple as changing the
 * PAYMENT_PROVIDER environment variable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_METADATA = void 0;
exports.getActivePaymentProvider = getActivePaymentProvider;
exports.getPaymentConfig = getPaymentConfig;
exports.getPriceId = getPriceId;
// ─── Plan metadata ───────────────────────────────────────────────────────────
// Shared across all providers — defines what each tier includes.
exports.PLAN_METADATA = {
    free: {
        name: "Free",
        description: "Get started with basic scheduling",
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            "1 connected account",
            "10 scheduled posts/mo",
            "1 team member",
            "10 AI credits/mo",
            "7-day analytics",
        ],
    },
    pro: {
        name: "Pro",
        description: "For creators and small teams",
        monthlyPrice: 19,
        yearlyPrice: 190,
        features: [
            "10 connected accounts",
            "Unlimited scheduled posts",
            "3 team members",
            "100 AI credits/mo",
            "90-day analytics",
            "Approval workflows",
            "Recurring posts",
        ],
    },
    business: {
        name: "Business",
        description: "For agencies and growing teams",
        monthlyPrice: 49,
        yearlyPrice: 490,
        features: [
            "25 connected accounts",
            "Unlimited scheduled posts",
            "15 team members",
            "Unlimited AI credits",
            "365-day analytics",
            "Approval workflows",
            "Recurring posts",
            "Priority support",
            "Custom branding",
        ],
    },
};
// ─── Provider-specific price ID maps ─────────────────────────────────────────
function getStripePrices() {
    var _a, _b, _c, _d;
    return {
        pro: {
            monthly: (_a = process.env.STRIPE_PRO_MONTHLY_PRICE_ID) !== null && _a !== void 0 ? _a : "",
            yearly: (_b = process.env.STRIPE_PRO_YEARLY_PRICE_ID) !== null && _b !== void 0 ? _b : "",
        },
        business: {
            monthly: (_c = process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID) !== null && _c !== void 0 ? _c : "",
            yearly: (_d = process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID) !== null && _d !== void 0 ? _d : "",
        },
    };
}
function getConvergePrices() {
    var _a, _b, _c, _d;
    return {
        pro: {
            monthly: (_a = process.env.CONVERGE_PRO_MONTHLY_PRICE_ID) !== null && _a !== void 0 ? _a : "",
            yearly: (_b = process.env.CONVERGE_PRO_YEARLY_PRICE_ID) !== null && _b !== void 0 ? _b : "",
        },
        business: {
            monthly: (_c = process.env.CONVERGE_BUSINESS_MONTHLY_PRICE_ID) !== null && _c !== void 0 ? _c : "",
            yearly: (_d = process.env.CONVERGE_BUSINESS_YEARLY_PRICE_ID) !== null && _d !== void 0 ? _d : "",
        },
    };
}
// ─── Public API ──────────────────────────────────────────────────────────────
/**
 * Returns the active payment provider name from the environment.
 * Defaults to "stripe" if PAYMENT_PROVIDER is not set.
 */
function getActivePaymentProvider() {
    var _a;
    var provider = (_a = process.env.PAYMENT_PROVIDER) !== null && _a !== void 0 ? _a : "stripe";
    if (provider !== "stripe" && provider !== "converge") {
        throw new Error("Invalid PAYMENT_PROVIDER \"".concat(provider, "\". Expected \"stripe\" or \"converge\"."));
    }
    return provider;
}
/**
 * Returns the full payment configuration for the active provider,
 * including price ID mappings and the public key for client-side use.
 */
function getPaymentConfig() {
    var _a, _b;
    var provider = getActivePaymentProvider();
    switch (provider) {
        case "stripe":
            return {
                provider: provider,
                prices: getStripePrices(),
                publicKey: (_a = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) !== null && _a !== void 0 ? _a : "",
            };
        case "converge":
            return {
                provider: provider,
                prices: getConvergePrices(),
                publicKey: (_b = process.env.NEXT_PUBLIC_CONVERGE_PUBLIC_KEY) !== null && _b !== void 0 ? _b : "",
            };
        default:
            throw new Error("Unsupported payment provider: ".concat(provider));
    }
}
/**
 * Resolve a plan tier and billing interval to a concrete price ID
 * for the active payment provider.
 */
function getPriceId(tier, interval) {
    if (interval === void 0) { interval = "monthly"; }
    var config = getPaymentConfig();
    var priceId = config.prices[tier][interval];
    if (!priceId) {
        throw new Error("No price ID configured for ".concat(tier, "/").concat(interval, " on ").concat(config.provider, ". ") +
            "Set the appropriate environment variable.");
    }
    return priceId;
}
