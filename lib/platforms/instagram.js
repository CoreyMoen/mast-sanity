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
exports.instagramClient = void 0;
var BASE_URL = "https://graph.facebook.com/v21.0";
/**
 * Instagram platform client using the Meta Graph API.
 *
 * Publishing to Instagram via the Content Publishing API requires:
 *   1. Create a media container (image/video/carousel)
 *   2. Publish the container to the Instagram account
 */
exports.instagramClient = {
    publish: function (accessToken, accountId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var mediaUrl, caption, containerResponse, error, container, containerId, publishResponse, error, published, err_1;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 9, , 10]);
                        mediaUrl = (_a = payload.mediaUrls) === null || _a === void 0 ? void 0 : _a[0];
                        if (!mediaUrl) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Instagram requires at least one media attachment.",
                                }];
                        }
                        caption = [
                            payload.content,
                            (_b = payload.hashtags) === null || _b === void 0 ? void 0 : _b.map(function (tag) { return "#".concat(tag); }).join(" "),
                        ]
                            .filter(Boolean)
                            .join("\n\n");
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(accountId, "/media"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    image_url: mediaUrl,
                                    caption: caption,
                                    access_token: accessToken,
                                }),
                            })];
                    case 1:
                        containerResponse = _g.sent();
                        if (!!containerResponse.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, containerResponse.json()];
                    case 2:
                        error = _g.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: (_d = (_c = error.error) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Failed to create media container.",
                            }];
                    case 3: return [4 /*yield*/, containerResponse.json()];
                    case 4:
                        container = _g.sent();
                        containerId = container.id;
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(accountId, "/media_publish"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    creation_id: containerId,
                                    access_token: accessToken,
                                }),
                            })];
                    case 5:
                        publishResponse = _g.sent();
                        if (!!publishResponse.ok) return [3 /*break*/, 7];
                        return [4 /*yield*/, publishResponse.json()];
                    case 6:
                        error = _g.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: (_f = (_e = error.error) === null || _e === void 0 ? void 0 : _e.message) !== null && _f !== void 0 ? _f : "Failed to publish media.",
                            }];
                    case 7: return [4 /*yield*/, publishResponse.json()];
                    case 8:
                        published = _g.sent();
                        return [2 /*return*/, {
                                success: true,
                                platformPostId: published.id,
                            }];
                    case 9:
                        err_1 = _g.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: err_1 instanceof Error ? err_1.message : "Unknown Instagram publish error.",
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    },
    getPostAnalytics: function (accessToken, platformPostId) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, response, data, insightsMap, _i, _a, entry;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        metrics = [
                            "impressions",
                            "reach",
                            "likes",
                            "comments",
                            "shares",
                            "saved",
                            "video_views",
                        ].join(",");
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(platformPostId, "/insights?metric=").concat(metrics, "&access_token=").concat(accessToken))];
                    case 1:
                        response = _m.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch Instagram post insights: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _m.sent();
                        insightsMap = new Map();
                        for (_i = 0, _a = (_b = data.data) !== null && _b !== void 0 ? _b : []; _i < _a.length; _i++) {
                            entry = _a[_i];
                            insightsMap.set(entry.name, (_e = (_d = (_c = entry.values) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : 0);
                        }
                        return [2 /*return*/, {
                                impressions: (_f = insightsMap.get("impressions")) !== null && _f !== void 0 ? _f : 0,
                                reach: (_g = insightsMap.get("reach")) !== null && _g !== void 0 ? _g : 0,
                                likes: (_h = insightsMap.get("likes")) !== null && _h !== void 0 ? _h : 0,
                                comments: (_j = insightsMap.get("comments")) !== null && _j !== void 0 ? _j : 0,
                                shares: (_k = insightsMap.get("shares")) !== null && _k !== void 0 ? _k : 0,
                                saves: (_l = insightsMap.get("saved")) !== null && _l !== void 0 ? _l : 0,
                                clicks: 0, // Instagram insights API does not expose clicks directly
                            }];
                }
            });
        });
    },
    getAccountMetrics: function (accessToken, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var profileResponse, profile, insightsResponse, engagementRate, insights, engaged, followers;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(accountId, "?fields=followers_count,follows_count,media_count&access_token=").concat(accessToken))];
                    case 1:
                        profileResponse = _j.sent();
                        if (!profileResponse.ok) {
                            throw new Error("Failed to fetch Instagram account metrics: ".concat(profileResponse.statusText));
                        }
                        return [4 /*yield*/, profileResponse.json()];
                    case 2:
                        profile = _j.sent();
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(accountId, "/insights?metric=accounts_engaged&period=day&metric_type=total_value&access_token=").concat(accessToken))];
                    case 3:
                        insightsResponse = _j.sent();
                        engagementRate = 0;
                        if (!insightsResponse.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, insightsResponse.json()];
                    case 4:
                        insights = _j.sent();
                        engaged = (_d = (_c = (_b = (_a = insights.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.total_value) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0;
                        followers = (_e = profile.followers_count) !== null && _e !== void 0 ? _e : 1;
                        engagementRate = followers > 0 ? (engaged / followers) * 100 : 0;
                        _j.label = 5;
                    case 5: return [2 /*return*/, {
                            followers: (_f = profile.followers_count) !== null && _f !== void 0 ? _f : 0,
                            following: (_g = profile.follows_count) !== null && _g !== void 0 ? _g : 0,
                            engagementRate: engagementRate,
                            postsCount: (_h = profile.media_count) !== null && _h !== void 0 ? _h : 0,
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
                    case 0: return [4 /*yield*/, fetch("".concat(BASE_URL, "/oauth/access_token?grant_type=ig_exchange_token&client_secret=").concat(process.env.META_APP_SECRET, "&access_token=").concat(refreshTokenValue))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to refresh Instagram token: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                refreshToken: data.access_token, // Instagram reuses the same long-lived token
                                expiresAt: data.expires_in
                                    ? Date.now() + data.expires_in * 1000
                                    : undefined,
                            }];
                }
            });
        });
    },
};
