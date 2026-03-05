"use strict";
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
exports.facebookClient = void 0;
var BASE_URL = "https://graph.facebook.com/v21.0";
/**
 * Facebook platform client using the Meta Graph API.
 *
 * Publishes to Facebook Pages (not personal profiles).
 * The accountId refers to the Facebook Page ID, and the access token
 * must be a Page Access Token with the required permissions.
 */
exports.facebookClient = {
    publish: function (accessToken, accountId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var message, hasMedia, endpoint, body, response, error, data, err_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        message = [
                            payload.content,
                            (_a = payload.hashtags) === null || _a === void 0 ? void 0 : _a.map(function (tag) { return "#".concat(tag); }).join(" "),
                        ]
                            .filter(Boolean)
                            .join("\n\n");
                        hasMedia = payload.mediaUrls && payload.mediaUrls.length > 0;
                        endpoint = hasMedia
                            ? "".concat(BASE_URL, "/").concat(accountId, "/photos")
                            : "".concat(BASE_URL, "/").concat(accountId, "/feed");
                        body = {
                            access_token: accessToken,
                        };
                        if (hasMedia) {
                            body.url = payload.mediaUrls[0];
                            body.caption = message;
                        }
                        else {
                            body.message = message;
                        }
                        return [4 /*yield*/, fetch(endpoint, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                            })];
                    case 1:
                        response = _e.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        error = _e.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: (_c = (_b = error.error) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Failed to publish to Facebook.",
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _e.sent();
                        return [2 /*return*/, {
                                success: true,
                                platformPostId: ((_d = data.id) !== null && _d !== void 0 ? _d : data.post_id),
                            }];
                    case 5:
                        err_1 = _e.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: err_1 instanceof Error ? err_1.message : "Unknown Facebook publish error.",
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    getPostAnalytics: function (accessToken, platformPostId) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, insightsResponse, postResponse, insightsMap, insights, _i, _a, entry, likes, comments, shares, post;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        metrics = [
                            "post_impressions",
                            "post_impressions_unique",
                            "post_engaged_users",
                            "post_clicks",
                        ].join(",");
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(platformPostId, "/insights?metric=").concat(metrics, "&access_token=").concat(accessToken))];
                    case 1:
                        insightsResponse = _s.sent();
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(platformPostId, "?fields=likes.summary(true),comments.summary(true),shares&access_token=").concat(accessToken))];
                    case 2:
                        postResponse = _s.sent();
                        insightsMap = new Map();
                        if (!insightsResponse.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, insightsResponse.json()];
                    case 3:
                        insights = _s.sent();
                        for (_i = 0, _a = (_b = insights.data) !== null && _b !== void 0 ? _b : []; _i < _a.length; _i++) {
                            entry = _a[_i];
                            insightsMap.set(entry.name, (_e = (_d = (_c = entry.values) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : 0);
                        }
                        _s.label = 4;
                    case 4:
                        likes = 0;
                        comments = 0;
                        shares = 0;
                        if (!postResponse.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, postResponse.json()];
                    case 5:
                        post = _s.sent();
                        likes = (_h = (_g = (_f = post.likes) === null || _f === void 0 ? void 0 : _f.summary) === null || _g === void 0 ? void 0 : _g.total_count) !== null && _h !== void 0 ? _h : 0;
                        comments = (_l = (_k = (_j = post.comments) === null || _j === void 0 ? void 0 : _j.summary) === null || _k === void 0 ? void 0 : _k.total_count) !== null && _l !== void 0 ? _l : 0;
                        shares = (_o = (_m = post.shares) === null || _m === void 0 ? void 0 : _m.count) !== null && _o !== void 0 ? _o : 0;
                        _s.label = 6;
                    case 6: return [2 /*return*/, {
                            impressions: (_p = insightsMap.get("post_impressions")) !== null && _p !== void 0 ? _p : 0,
                            reach: (_q = insightsMap.get("post_impressions_unique")) !== null && _q !== void 0 ? _q : 0,
                            likes: likes,
                            comments: comments,
                            shares: shares,
                            saves: 0, // Facebook does not expose saves via API
                            clicks: (_r = insightsMap.get("post_clicks")) !== null && _r !== void 0 ? _r : 0,
                        }];
                }
            });
        });
    },
    getAccountMetrics: function (accessToken, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var pageResponse, page, insightsResponse, engagementRate, insights, engaged, fans;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(accountId, "?fields=fan_count,published_posts.summary(true)&access_token=").concat(accessToken))];
                    case 1:
                        pageResponse = _l.sent();
                        if (!pageResponse.ok) {
                            throw new Error("Failed to fetch Facebook page metrics: ".concat(pageResponse.statusText));
                        }
                        return [4 /*yield*/, pageResponse.json()];
                    case 2:
                        page = _l.sent();
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(accountId, "/insights?metric=page_engaged_users,page_post_engagements&period=day&access_token=").concat(accessToken))];
                    case 3:
                        insightsResponse = _l.sent();
                        engagementRate = 0;
                        if (!insightsResponse.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, insightsResponse.json()];
                    case 4:
                        insights = _l.sent();
                        engaged = (_e = (_d = (_c = (_b = (_a = insights.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : 0;
                        fans = (_f = page.fan_count) !== null && _f !== void 0 ? _f : 1;
                        engagementRate = fans > 0 ? (engaged / fans) * 100 : 0;
                        _l.label = 5;
                    case 5: return [2 /*return*/, {
                            followers: (_g = page.fan_count) !== null && _g !== void 0 ? _g : 0,
                            following: 0, // Facebook Pages do not have a "following" count
                            engagementRate: engagementRate,
                            postsCount: (_k = (_j = (_h = page.published_posts) === null || _h === void 0 ? void 0 : _h.summary) === null || _j === void 0 ? void 0 : _j.total_count) !== null && _k !== void 0 ? _k : 0,
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
                    case 0: return [4 /*yield*/, fetch("".concat(BASE_URL, "/oauth/access_token?") +
                            new URLSearchParams({
                                grant_type: "fb_exchange_token",
                                client_id: process.env.META_APP_ID,
                                client_secret: process.env.META_APP_SECRET,
                                fb_exchange_token: refreshTokenValue,
                            }).toString())];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to refresh Facebook token: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                refreshToken: data.access_token,
                                expiresAt: data.expires_in
                                    ? Date.now() + data.expires_in * 1000
                                    : undefined,
                            }];
                }
            });
        });
    },
};
