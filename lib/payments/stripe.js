"use strict";
/**
 * stripe.ts — Stripe implementation of the PaymentProvider interface.
 *
 * Handles checkout session creation, billing portal management,
 * webhook signature verification, and subscription cancellation.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentProvider = void 0;
var stripe_1 = require("stripe");
function getStripeClient() {
    var key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    return new stripe_1.default(key);
}
var StripePaymentProvider = /** @class */ (function () {
    function StripePaymentProvider() {
    }
    /**
     * Create a Stripe Checkout session for a new subscription.
     * Returns the checkout URL to redirect the user to.
     */
    StripePaymentProvider.prototype.createCheckoutSession = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getStripeClient().checkout.sessions.create({
                            mode: "subscription",
                            line_items: [{ price: params.priceId, quantity: 1 }],
                            success_url: params.successUrl,
                            cancel_url: params.cancelUrl,
                            customer_email: params.email,
                            metadata: {
                                clerkUserId: params.userId,
                            },
                            subscription_data: {
                                metadata: {
                                    clerkUserId: params.userId,
                                },
                            },
                        })];
                    case 1:
                        session = _a.sent();
                        if (!session.url) {
                            throw new Error("Failed to create checkout session URL");
                        }
                        return [2 /*return*/, session.url];
                }
            });
        });
    };
    /**
     * Create a Stripe Billing Portal session for subscription management.
     * Returns the portal URL to redirect the user to.
     */
    StripePaymentProvider.prototype.createBillingPortalSession = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, getStripeClient().billingPortal.sessions.create({
                            customer: customerId,
                            return_url: "".concat((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "http://localhost:3000", "/dashboard/settings"),
                        })];
                    case 1:
                        session = _b.sent();
                        return [2 /*return*/, session.url];
                }
            });
        });
    };
    /**
     * Verify the webhook signature and return a normalized event.
     */
    StripePaymentProvider.prototype.handleWebhook = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var body, signature, event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, request.text()];
                    case 1:
                        body = _a.sent();
                        signature = request.headers.get("stripe-signature");
                        if (!signature) {
                            throw new Error("Missing stripe-signature header");
                        }
                        event = getStripeClient().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
                        return [2 /*return*/, {
                                type: event.type,
                                data: event.data.object,
                            }];
                }
            });
        });
    };
    /**
     * Cancel a subscription gracefully at the end of the current billing period.
     */
    StripePaymentProvider.prototype.cancelSubscription = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getStripeClient().subscriptions.update(subscriptionId, {
                            cancel_at_period_end: true,
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return StripePaymentProvider;
}());
exports.StripePaymentProvider = StripePaymentProvider;
