"use strict";
/**
 * email.ts — Email notification sender.
 *
 * Provides functions to send transactional email notifications
 * using a simple fetch-based approach. Stubbed for Resend/SendGrid
 * integration — set EMAIL_API_KEY and EMAIL_API_URL env vars to enable.
 *
 * Each notification type has a dedicated template builder that returns
 * branded HTML for the email body.
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = sendNotificationEmail;
exports.buildPostPublishedEmail = buildPostPublishedEmail;
exports.buildPostFailedEmail = buildPostFailedEmail;
exports.buildApprovalRequestedEmail = buildApprovalRequestedEmail;
exports.buildPostApprovedEmail = buildPostApprovedEmail;
exports.buildCreditsLowEmail = buildCreditsLowEmail;
// ─── Configuration ──────────────────────────────────────────────────────────
var EMAIL_API_URL = (_a = process.env.EMAIL_API_URL) !== null && _a !== void 0 ? _a : "https://api.resend.com/emails";
var EMAIL_API_KEY = (_b = process.env.EMAIL_API_KEY) !== null && _b !== void 0 ? _b : "";
var EMAIL_FROM = (_c = process.env.EMAIL_FROM) !== null && _c !== void 0 ? _c : "Angela <notifications@angela.app>";
/**
 * Send a transactional email via the configured email API.
 * Returns a result object instead of throwing so callers can
 * decide how to handle failures (log, retry, etc.).
 */
function sendNotificationEmail(to, subject, htmlBody) {
    return __awaiter(this, void 0, void 0, function () {
        var response, body, data, error_1, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!EMAIL_API_KEY) {
                        console.warn("[email] EMAIL_API_KEY is not configured — skipping email send.");
                        return [2 /*return*/, { success: false, error: "EMAIL_API_KEY not configured" }];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch(EMAIL_API_URL, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(EMAIL_API_KEY),
                            },
                            body: JSON.stringify({
                                from: EMAIL_FROM,
                                to: to,
                                subject: subject,
                                html: htmlBody,
                            }),
                        })];
                case 2:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    body = _b.sent();
                    console.error("[email] Send failed (".concat(response.status, "): ").concat(body));
                    return [2 /*return*/, {
                            success: false,
                            error: "HTTP ".concat(response.status, ": ").concat(body),
                        }];
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _b.sent();
                    return [2 /*return*/, { success: true, messageId: (_a = data.id) !== null && _a !== void 0 ? _a : data.messageId }];
                case 6:
                    error_1 = _b.sent();
                    message = error_1 instanceof Error ? error_1.message : "Unknown email error";
                    console.error("[email] Send error: ".concat(message));
                    return [2 /*return*/, { success: false, error: message }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// ─── HTML layout wrapper ────────────────────────────────────────────────────
/**
 * Wraps email content in a branded Angela layout with indigo accent.
 */
function wrapInLayout(title, bodyHtml) {
    var _a;
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>".concat(escapeHtml(title), "</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\">\n  <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f3f4f6;\">\n    <tr>\n      <td align=\"center\" style=\"padding: 40px 16px;\">\n        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);\">\n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #4f46e5; padding: 24px 32px;\">\n              <h1 style=\"margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;\">Angela</h1>\n            </td>\n          </tr>\n          <!-- Body -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              ").concat(bodyHtml, "\n            </td>\n          </tr>\n          <!-- Footer -->\n          <tr>\n            <td style=\"padding: 20px 32px; border-top: 1px solid #e5e7eb;\">\n              <p style=\"margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;\">\n                You're receiving this because you have notifications enabled in Angela.\n                <br />\n                <a href=\"").concat(escapeHtml((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "https://angela.app"), "/dashboard/settings\" style=\"color: #6366f1; text-decoration: none;\">Manage notification preferences</a>\n              </p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>");
}
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
// ─── Template builders ──────────────────────────────────────────────────────
/**
 * Build email HTML for a successfully published post.
 */
function buildPostPublishedEmail(postTitle, platforms) {
    var _a;
    var platformList = platforms
        .map(function (p) {
        return "<span style=\"display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 9999px; margin: 2px 4px 2px 0;\">".concat(escapeHtml(p), "</span>");
    })
        .join(" ");
    var body = "\n    <h2 style=\"margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;\">Post Published</h2>\n    <p style=\"margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;\">\n      Your post has been successfully published to all selected platforms.\n    </p>\n    <div style=\"background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;\">\n      <p style=\"margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;\">Post Title</p>\n      <p style=\"margin: 0 0 12px; font-size: 14px; color: #111827;\">".concat(escapeHtml(postTitle), "</p>\n      <p style=\"margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;\">Platforms</p>\n      <div>").concat(platformList, "</div>\n    </div>\n    <a href=\"").concat(escapeHtml((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "https://angela.app"), "/dashboard/posts\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;\">View Posts</a>\n  ");
    return {
        subject: "Published: ".concat(postTitle),
        html: wrapInLayout("Post Published", body),
    };
}
/**
 * Build email HTML for a failed post publish attempt.
 */
function buildPostFailedEmail(postTitle, error) {
    var _a;
    var body = "\n    <h2 style=\"margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;\">Post Failed to Publish</h2>\n    <p style=\"margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;\">\n      Something went wrong while publishing your post. You can retry from your dashboard.\n    </p>\n    <div style=\"background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #ef4444;\">\n      <p style=\"margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;\">Post Title</p>\n      <p style=\"margin: 0 0 12px; font-size: 14px; color: #111827;\">".concat(escapeHtml(postTitle), "</p>\n      <p style=\"margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #991b1b;\">Error</p>\n      <p style=\"margin: 0; font-size: 13px; color: #7f1d1d; font-family: monospace;\">").concat(escapeHtml(error), "</p>\n    </div>\n    <a href=\"").concat(escapeHtml((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "https://angela.app"), "/dashboard/posts\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;\">View Posts</a>\n  ");
    return {
        subject: "Failed: ".concat(postTitle),
        html: wrapInLayout("Post Failed", body),
    };
}
/**
 * Build email HTML for an approval request notification.
 */
function buildApprovalRequestedEmail(postTitle, submitterName) {
    var _a;
    var body = "\n    <h2 style=\"margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;\">Approval Requested</h2>\n    <p style=\"margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;\">\n      <strong style=\"color: #111827;\">".concat(escapeHtml(submitterName), "</strong> submitted a post for your review.\n    </p>\n    <div style=\"background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;\">\n      <p style=\"margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;\">Post Title</p>\n      <p style=\"margin: 0; font-size: 14px; color: #111827;\">").concat(escapeHtml(postTitle), "</p>\n    </div>\n    <a href=\"").concat(escapeHtml((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "https://angela.app"), "/dashboard/approvals\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;\">Review Post</a>\n  ");
    return {
        subject: "Approval needed: ".concat(postTitle),
        html: wrapInLayout("Approval Requested", body),
    };
}
/**
 * Build email HTML for a post approval notification.
 */
function buildPostApprovedEmail(postTitle, approverName) {
    var _a;
    var body = "\n    <h2 style=\"margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;\">Post Approved</h2>\n    <p style=\"margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;\">\n      <strong style=\"color: #111827;\">".concat(escapeHtml(approverName), "</strong> approved your post.\n    </p>\n    <div style=\"background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #22c55e;\">\n      <p style=\"margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;\">Post Title</p>\n      <p style=\"margin: 0; font-size: 14px; color: #111827;\">").concat(escapeHtml(postTitle), "</p>\n    </div>\n    <a href=\"").concat(escapeHtml((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "https://angela.app"), "/dashboard/posts\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;\">View Post</a>\n  ");
    return {
        subject: "Approved: ".concat(postTitle),
        html: wrapInLayout("Post Approved", body),
    };
}
/**
 * Build email HTML for a low credits warning.
 */
function buildCreditsLowEmail(creditsUsed, creditsLimit) {
    var _a;
    var percentage = Math.round((creditsUsed / creditsLimit) * 100);
    var remaining = creditsLimit - creditsUsed;
    var body = "\n    <h2 style=\"margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;\">AI Credits Running Low</h2>\n    <p style=\"margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;\">\n      You've used ".concat(percentage, "% of your monthly AI credits. Consider upgrading your plan to avoid running out.\n    </p>\n    <div style=\"background-color: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #f59e0b;\">\n      <p style=\"margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;\">Usage</p>\n      <p style=\"margin: 0 0 4px; font-size: 14px; color: #111827;\">").concat(creditsUsed, " of ").concat(creditsLimit, " credits used</p>\n      <p style=\"margin: 0; font-size: 13px; color: #92400e;\">").concat(remaining, " credits remaining</p>\n      <!-- Progress bar -->\n      <div style=\"margin-top: 12px; background-color: #fef3c7; border-radius: 9999px; height: 8px; overflow: hidden;\">\n        <div style=\"background-color: ").concat(percentage >= 90 ? "#ef4444" : "#f59e0b", "; height: 100%; width: ").concat(percentage, "%; border-radius: 9999px;\"></div>\n      </div>\n    </div>\n    <a href=\"").concat(escapeHtml((_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : "https://angela.app"), "/dashboard/settings\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;\">Upgrade Plan</a>\n  ");
    return {
        subject: "AI credits running low (".concat(percentage, "% used)"),
        html: wrapInLayout("Credits Low", body),
    };
}
