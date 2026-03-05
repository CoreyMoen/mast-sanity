"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.linkedinClient = void 0;
var BASE_URL = "https://api.linkedin.com/v2";
/**
 * LinkedIn platform client using the LinkedIn Marketing API.
 *
 * Uses the UGC Posts API for publishing and the Share Statistics API
 * for analytics. The accountId represents the LinkedIn person URN
 * (e.g., "urn:li:person:abc123") or organization URN.
 */
exports.linkedinClient = {
    publish: function (accessToken, accountId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var text, authorUrn, ugcPost, response, error, postUrn, _a, err_1;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 7, , 8]);
                        text = [
                            payload.content,
                            (_b = payload.hashtags) === null || _b === void 0 ? void 0 : _b.map(function (tag) { return "#".concat(tag); }).join(" "),
                        ]
                            .filter(Boolean)
                            .join("\n\n");
                        authorUrn = accountId.startsWith("urn:li:")
                            ? accountId
                            : "urn:li:person:".concat(accountId);
                        ugcPost = {
                            author: authorUrn,
                            lifecycleState: "PUBLISHED",
                            specificContent: {
                                "com.linkedin.ugc.ShareContent": __assign({ shareCommentary: {
                                        text: text,
                                    }, shareMediaCategory: payload.mediaUrls && payload.mediaUrls.length > 0
                                        ? "IMAGE"
                                        : "NONE" }, (payload.mediaUrls && payload.mediaUrls.length > 0
                                    ? {
                                        media: payload.mediaUrls.map(function (url) { return ({
                                            status: "READY",
                                            originalUrl: url,
                                            description: {
                                                text: payload.content.substring(0, 200),
                                            },
                                        }); }),
                                    }
                                    : {})),
                            },
                            visibility: {
                                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
                            },
                        };
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/ugcPosts"), {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                    "Content-Type": "application/json",
                                    "X-Restli-Protocol-Version": "2.0.0",
                                },
                                body: JSON.stringify(ugcPost),
                            })];
                    case 1:
                        response = _f.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        error = _f.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: (_d = (_c = error.message) !== null && _c !== void 0 ? _c : error.serviceErrorCode) !== null && _d !== void 0 ? _d : "Failed to publish to LinkedIn.",
                            }];
                    case 3:
                        if (!((_e = response.headers.get("x-restli-id")) !== null && _e !== void 0)) return [3 /*break*/, 4];
                        _a = _e;
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        _a = (_f.sent()).id;
                        _f.label = 6;
                    case 6:
                        postUrn = _a;
                        return [2 /*return*/, {
                                success: true,
                                platformPostId: postUrn,
                            }];
                    case 7:
                        err_1 = _f.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: err_1 instanceof Error ? err_1.message : "Unknown LinkedIn publish error.",
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    },
    getPostAnalytics: function (accessToken, platformPostId) {
        return __awaiter(this, void 0, void 0, function () {
            var encodedUrn, response, data, statsResponse, impressions, clicks, reach, stats, totalShareStatistics;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        encodedUrn = encodeURIComponent(platformPostId);
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/socialActions/").concat(encodedUrn), {
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                    "X-Restli-Protocol-Version": "2.0.0",
                                },
                            })];
                    case 1:
                        response = _l.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch LinkedIn post analytics: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _l.sent();
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/organizationalEntityShareStatistics?q=organizationalEntity&shares[0]=").concat(encodedUrn), {
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                    "X-Restli-Protocol-Version": "2.0.0",
                                },
                            })];
                    case 3:
                        statsResponse = _l.sent();
                        impressions = 0;
                        clicks = 0;
                        reach = 0;
                        if (!statsResponse.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, statsResponse.json()];
                    case 4:
                        stats = _l.sent();
                        totalShareStatistics = (_c = (_b = (_a = stats.elements) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.totalShareStatistics) !== null && _c !== void 0 ? _c : {};
                        impressions = (_d = totalShareStatistics.impressionCount) !== null && _d !== void 0 ? _d : 0;
                        clicks = (_e = totalShareStatistics.clickCount) !== null && _e !== void 0 ? _e : 0;
                        reach = (_f = totalShareStatistics.uniqueImpressionsCount) !== null && _f !== void 0 ? _f : 0;
                        _l.label = 5;
                    case 5: return [2 /*return*/, {
                            impressions: impressions,
                            reach: reach,
                            likes: (_h = (_g = data.likesSummary) === null || _g === void 0 ? void 0 : _g.totalLikes) !== null && _h !== void 0 ? _h : 0,
                            comments: (_k = (_j = data.commentsSummary) === null || _j === void 0 ? void 0 : _j.totalFirstLevelComments) !== null && _k !== void 0 ? _k : 0,
                            shares: 0, // LinkedIn does not expose reshare counts via this endpoint
                            saves: 0,
                            clicks: clicks,
                        }];
                }
            });
        });
    },
    getAccountMetrics: function (accessToken, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var isOrg, encodedUrn, response_1, data, stats, response;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        isOrg = accountId.includes("organization");
                        encodedUrn = encodeURIComponent(accountId.startsWith("urn:li:")
                            ? accountId
                            : "urn:li:".concat(isOrg ? "organization" : "person", ":").concat(accountId));
                        if (!isOrg) return [3 /*break*/, 3];
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=").concat(encodedUrn), {
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                    "X-Restli-Protocol-Version": "2.0.0",
                                },
                            })];
                    case 1:
                        response_1 = _e.sent();
                        if (!response_1.ok) {
                            throw new Error("Failed to fetch LinkedIn org metrics: ".concat(response_1.statusText));
                        }
                        return [4 /*yield*/, response_1.json()];
                    case 2:
                        data = _e.sent();
                        stats = (_b = (_a = data.elements) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : {};
                        return [2 /*return*/, {
                                followers: (_d = (_c = stats.followerCounts) === null || _c === void 0 ? void 0 : _c.organicFollowerCount) !== null && _d !== void 0 ? _d : 0,
                                following: 0,
                                engagementRate: 0,
                                postsCount: 0,
                            }];
                    case 3: return [4 /*yield*/, fetch("".concat(BASE_URL, "/me"), {
                            headers: {
                                Authorization: "Bearer ".concat(accessToken),
                            },
                        })];
                    case 4:
                        response = _e.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch LinkedIn profile metrics: ".concat(response.statusText));
                        }
                        return [2 /*return*/, {
                                followers: 0, // Personal profile follower count requires separate permissions
                                following: 0,
                                engagementRate: 0,
                                postsCount: 0,
                            }];
                }
            });
        });
    },
    refreshToken: function (refreshTokenValue) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("https://www.linkedin.com/oauth/v2/accessToken", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: new URLSearchParams({
                                grant_type: "refresh_token",
                                refresh_token: refreshTokenValue,
                                client_id: process.env.LINKEDIN_CLIENT_ID,
                                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                            }).toString(),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to refresh LinkedIn token: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                refreshToken: data.refresh_token,
                                expiresAt: data.expires_in
                                    ? Date.now() + data.expires_in * 1000
                                    : undefined,
                            }];
                }
            });
        });
    },
};
