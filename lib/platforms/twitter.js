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
exports.twitterClient = void 0;
var BASE_URL = "https://api.twitter.com/2";
var UPLOAD_BASE_URL = "https://upload.twitter.com/1.1";
/**
 * Twitter media upload size limits.
 * Images up to 5MB can use simple upload; larger files and videos
 * must use the chunked upload flow (INIT/APPEND/FINALIZE).
 */
var SIMPLE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
var CHUNK_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB per chunk
/**
 * Determine the Twitter media category from a MIME type string.
 */
function getTwitterMediaCategory(mimeType) {
    if (mimeType === "image/gif")
        return "tweet_gif";
    if (mimeType.startsWith("video/"))
        return "tweet_video";
    return "tweet_image";
}
/**
 * Convert an ArrayBuffer to a base64-encoded string.
 * Works in both Node.js and edge/browser environments.
 */
function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    // Use Buffer if available (Node.js / Convex runtime), otherwise manual conversion
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64");
    }
    var binary = "";
    for (var i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
/**
 * Upload media using the simple (non-chunked) upload endpoint.
 * Suitable for images <= 5 MB.
 *
 * The v1.1 media/upload endpoint supports OAuth 2.0 User Context
 * (Bearer token with user authentication) as of late 2022.
 */
function simpleUpload(accessToken, media) {
    return __awaiter(this, void 0, void 0, function () {
        var base64Data, params, url, response, error, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    base64Data = arrayBufferToBase64(media.data);
                    params = new URLSearchParams({
                        media_data: base64Data,
                        media_category: getTwitterMediaCategory(media.mimeType),
                    });
                    url = "".concat(UPLOAD_BASE_URL, "/media/upload.json");
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: {
                                Authorization: "Bearer ".concat(accessToken),
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: params.toString(),
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    error = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "Twitter simple media upload failed (".concat(response.status, "): ").concat(error),
                        }];
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            mediaId: data.media_id_string,
                        }];
            }
        });
    });
}
/**
 * Upload media using the chunked upload flow (INIT -> APPEND -> FINALIZE).
 * Required for videos and files larger than 5 MB.
 *
 * Flow:
 *   1. INIT:     Tell Twitter the file size, MIME type, and category.
 *   2. APPEND:   Send the file in chunks (up to 4 MB each, base64-encoded).
 *   3. FINALIZE: Signal that all chunks have been uploaded.
 *   4. STATUS:   (For async video processing) Poll until processing is done.
 */
function chunkedUpload(accessToken, media) {
    return __awaiter(this, void 0, void 0, function () {
        var mediaCategory, url, authHeader, initParams, initResponse, error, initData, mediaIdString, totalBytes, segmentIndex, offset, end, chunk, chunkBase64, appendParams, appendResponse, error, finalizeParams, finalizeResponse, error, finalizeData, statusResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mediaCategory = getTwitterMediaCategory(media.mimeType);
                    url = "".concat(UPLOAD_BASE_URL, "/media/upload.json");
                    authHeader = "Bearer ".concat(accessToken);
                    initParams = new URLSearchParams({
                        command: "INIT",
                        total_bytes: String(media.fileSize),
                        media_type: media.mimeType,
                        media_category: mediaCategory,
                    });
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: {
                                Authorization: authHeader,
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: initParams.toString(),
                        })];
                case 1:
                    initResponse = _a.sent();
                    if (!!initResponse.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, initResponse.text()];
                case 2:
                    error = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "Twitter chunked INIT failed (".concat(initResponse.status, "): ").concat(error),
                        }];
                case 3: return [4 /*yield*/, initResponse.json()];
                case 4:
                    initData = _a.sent();
                    mediaIdString = initData.media_id_string;
                    totalBytes = media.data.byteLength;
                    segmentIndex = 0;
                    offset = 0;
                    _a.label = 5;
                case 5:
                    if (!(offset < totalBytes)) return [3 /*break*/, 9];
                    end = Math.min(offset + CHUNK_SIZE_BYTES, totalBytes);
                    chunk = media.data.slice(offset, end);
                    chunkBase64 = arrayBufferToBase64(chunk);
                    appendParams = new URLSearchParams({
                        command: "APPEND",
                        media_id: mediaIdString,
                        segment_index: String(segmentIndex),
                        media_data: chunkBase64,
                    });
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: {
                                Authorization: authHeader,
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: appendParams.toString(),
                        })];
                case 6:
                    appendResponse = _a.sent();
                    if (!!appendResponse.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, appendResponse.text()];
                case 7:
                    error = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "Twitter chunked APPEND failed at segment ".concat(segmentIndex, " (").concat(appendResponse.status, "): ").concat(error),
                        }];
                case 8:
                    offset = end;
                    segmentIndex++;
                    return [3 /*break*/, 5];
                case 9:
                    finalizeParams = new URLSearchParams({
                        command: "FINALIZE",
                        media_id: mediaIdString,
                    });
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: {
                                Authorization: authHeader,
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: finalizeParams.toString(),
                        })];
                case 10:
                    finalizeResponse = _a.sent();
                    if (!!finalizeResponse.ok) return [3 /*break*/, 12];
                    return [4 /*yield*/, finalizeResponse.text()];
                case 11:
                    error = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "Twitter chunked FINALIZE failed (".concat(finalizeResponse.status, "): ").concat(error),
                        }];
                case 12: return [4 /*yield*/, finalizeResponse.json()];
                case 13:
                    finalizeData = _a.sent();
                    if (!finalizeData.processing_info) return [3 /*break*/, 15];
                    return [4 /*yield*/, pollMediaProcessing(accessToken, mediaIdString, finalizeData.processing_info)];
                case 14:
                    statusResult = _a.sent();
                    if (!statusResult.success) {
                        return [2 /*return*/, statusResult];
                    }
                    _a.label = 15;
                case 15: return [2 /*return*/, {
                        success: true,
                        mediaId: mediaIdString,
                    }];
            }
        });
    });
}
/**
 * Poll the media STATUS endpoint until processing is complete.
 * Twitter processes videos/GIFs asynchronously after FINALIZE.
 */
function pollMediaProcessing(accessToken, mediaId, processingInfo) {
    return __awaiter(this, void 0, void 0, function () {
        var info, maxAttempts, attempts, _loop_1, state_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    info = processingInfo;
                    maxAttempts = 30;
                    attempts = 0;
                    _loop_1 = function () {
                        var waitSeconds, statusUrl, statusResponse, error, statusData;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    waitSeconds = (_a = info.check_after_secs) !== null && _a !== void 0 ? _a : 5;
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitSeconds * 1000); })];
                                case 1:
                                    _f.sent();
                                    statusUrl = "".concat(UPLOAD_BASE_URL, "/media/upload.json?command=STATUS&media_id=").concat(mediaId);
                                    return [4 /*yield*/, fetch(statusUrl, {
                                            method: "GET",
                                            headers: {
                                                Authorization: "Bearer ".concat(accessToken),
                                            },
                                        })];
                                case 2:
                                    statusResponse = _f.sent();
                                    if (!!statusResponse.ok) return [3 /*break*/, 4];
                                    return [4 /*yield*/, statusResponse.text()];
                                case 3:
                                    error = _f.sent();
                                    return [2 /*return*/, { value: {
                                                success: false,
                                                error: "Twitter media STATUS check failed (".concat(statusResponse.status, "): ").concat(error),
                                            } }];
                                case 4: return [4 /*yield*/, statusResponse.json()];
                                case 5:
                                    statusData = _f.sent();
                                    info = (_b = statusData.processing_info) !== null && _b !== void 0 ? _b : { state: "succeeded" };
                                    attempts++;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _e.label = 1;
                case 1:
                    if (!(info.state !== "succeeded" &&
                        info.state !== "failed" &&
                        attempts < maxAttempts)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _e.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3:
                    if (info.state === "failed") {
                        return [2 /*return*/, {
                                success: false,
                                error: "Twitter media processing failed: ".concat((_d = (_c = info.error) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Unknown processing error"),
                            }];
                    }
                    if (info.state !== "succeeded") {
                        return [2 /*return*/, {
                                success: false,
                                error: "Twitter media processing timed out after ".concat(maxAttempts, " status checks"),
                            }];
                    }
                    return [2 /*return*/, { success: true, mediaId: mediaId }];
            }
        });
    });
}
/**
 * X/Twitter platform client using the Twitter API v2.
 *
 * Uses OAuth 2.0 with PKCE for authorization and Bearer tokens for API calls.
 * Media upload uses the v1.1 media/upload endpoint (which also supports
 * OAuth 2.0 User Context since late 2022).
 */
exports.twitterClient = {
    publish: function (accessToken, _accountId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var text, body, response, error, data, err_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        text = [
                            payload.content,
                            (_a = payload.hashtags) === null || _a === void 0 ? void 0 : _a.map(function (tag) { return "#".concat(tag); }).join(" "),
                        ]
                            .filter(Boolean)
                            .join("\n\n");
                        body = { text: text };
                        // If mediaUrls are present, they should be platform-specific media IDs
                        // (obtained from a prior uploadMedia() call). Attach them to the tweet.
                        if (payload.mediaUrls && payload.mediaUrls.length > 0) {
                            body.media = {
                                media_ids: payload.mediaUrls,
                            };
                        }
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/tweets"), {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                    "Content-Type": "application/json",
                                },
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
                                error: (_c = (_b = error.detail) !== null && _b !== void 0 ? _b : error.title) !== null && _c !== void 0 ? _c : "Failed to publish tweet.",
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _e.sent();
                        return [2 /*return*/, {
                                success: true,
                                platformPostId: (_d = data.data) === null || _d === void 0 ? void 0 : _d.id,
                            }];
                    case 5:
                        err_1 = _e.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: err_1 instanceof Error ? err_1.message : "Unknown Twitter publish error.",
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Upload media to Twitter via the v1.1 media/upload endpoint.
     *
     * Uses simple upload for images <= 5 MB, and chunked upload for
     * larger files and videos. Returns the Twitter media_id_string
     * which must be passed to the publish() method in the payload's
     * mediaUrls array.
     */
    uploadMedia: function (accessToken, media) {
        return __awaiter(this, void 0, void 0, function () {
            var isVideo, isGif, isLarge, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        isVideo = media.mimeType.startsWith("video/");
                        isGif = media.mimeType === "image/gif";
                        isLarge = media.fileSize > SIMPLE_UPLOAD_MAX_BYTES;
                        if (!(isVideo || isGif || isLarge)) return [3 /*break*/, 2];
                        return [4 /*yield*/, chunkedUpload(accessToken, media)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, simpleUpload(accessToken, media)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        err_2 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: err_2 instanceof Error
                                    ? err_2.message
                                    : "Unknown Twitter media upload error.",
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
    getPostAnalytics: function (accessToken, platformPostId) {
        return __awaiter(this, void 0, void 0, function () {
            var fields, response, data, pub, nonPub, organic;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            return __generator(this, function (_q) {
                switch (_q.label) {
                    case 0:
                        fields = [
                            "public_metrics",
                            "non_public_metrics",
                            "organic_metrics",
                        ].join(",");
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/tweets/").concat(platformPostId, "?tweet.fields=").concat(fields), {
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                },
                            })];
                    case 1:
                        response = _q.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch tweet metrics: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _q.sent();
                        pub = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a.public_metrics) !== null && _b !== void 0 ? _b : {};
                        nonPub = (_d = (_c = data.data) === null || _c === void 0 ? void 0 : _c.non_public_metrics) !== null && _d !== void 0 ? _d : {};
                        organic = (_f = (_e = data.data) === null || _e === void 0 ? void 0 : _e.organic_metrics) !== null && _f !== void 0 ? _f : {};
                        return [2 /*return*/, {
                                impressions: (_h = (_g = nonPub.impression_count) !== null && _g !== void 0 ? _g : organic.impression_count) !== null && _h !== void 0 ? _h : 0,
                                reach: 0, // Twitter does not provide a reach metric
                                likes: (_j = pub.like_count) !== null && _j !== void 0 ? _j : 0,
                                comments: (_k = pub.reply_count) !== null && _k !== void 0 ? _k : 0,
                                shares: pub.retweet_count + ((_l = pub.quote_count) !== null && _l !== void 0 ? _l : 0),
                                saves: (_m = pub.bookmark_count) !== null && _m !== void 0 ? _m : 0,
                                clicks: (_p = (_o = nonPub.url_link_clicks) !== null && _o !== void 0 ? _o : organic.url_link_clicks) !== null && _p !== void 0 ? _p : 0,
                            }];
                }
            });
        });
    },
    getAccountMetrics: function (accessToken, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var fields, response, data, metrics;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        fields = ["public_metrics"].join(",");
                        return [4 /*yield*/, fetch("".concat(BASE_URL, "/users/").concat(accountId, "?user.fields=").concat(fields), {
                                headers: {
                                    Authorization: "Bearer ".concat(accessToken),
                                },
                            })];
                    case 1:
                        response = _f.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch Twitter user metrics: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _f.sent();
                        metrics = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a.public_metrics) !== null && _b !== void 0 ? _b : {};
                        return [2 /*return*/, {
                                followers: (_c = metrics.followers_count) !== null && _c !== void 0 ? _c : 0,
                                following: (_d = metrics.following_count) !== null && _d !== void 0 ? _d : 0,
                                engagementRate: 0, // Must be calculated from individual tweet metrics
                                postsCount: (_e = metrics.tweet_count) !== null && _e !== void 0 ? _e : 0,
                            }];
                }
            });
        });
    },
    refreshToken: function (refreshTokenValue) {
        return __awaiter(this, void 0, void 0, function () {
            var clientId, clientSecret, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clientId = process.env.TWITTER_CLIENT_ID;
                        clientSecret = process.env.TWITTER_CLIENT_SECRET;
                        return [4 /*yield*/, fetch("https://api.twitter.com/2/oauth2/token", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    Authorization: "Basic ".concat(Buffer.from("".concat(clientId, ":").concat(clientSecret)).toString("base64")),
                                },
                                body: new URLSearchParams({
                                    grant_type: "refresh_token",
                                    refresh_token: refreshTokenValue,
                                    client_id: clientId,
                                }).toString(),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to refresh Twitter token: ".concat(response.statusText));
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
