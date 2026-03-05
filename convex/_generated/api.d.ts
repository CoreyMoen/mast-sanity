/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiUsage from "../aiUsage.js";
import type * as analytics from "../analytics.js";
import type * as analyticsActions from "../analyticsActions.js";
import type * as approvals from "../approvals.js";
import type * as billing from "../billing.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as dataRetention from "../dataRetention.js";
import type * as emailActions from "../emailActions.js";
import type * as featureGates from "../featureGates.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as media from "../media.js";
import type * as notifications from "../notifications.js";
import type * as orgMembers from "../orgMembers.js";
import type * as organizations from "../organizations.js";
import type * as posts from "../posts.js";
import type * as publishing from "../publishing.js";
import type * as publishingActions from "../publishingActions.js";
import type * as rateLimits from "../rateLimits.js";
import type * as recurringPosts from "../recurringPosts.js";
import type * as scheduling from "../scheduling.js";
import type * as socialAccountActions from "../socialAccountActions.js";
import type * as socialAccounts from "../socialAccounts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiUsage: typeof aiUsage;
  analytics: typeof analytics;
  analyticsActions: typeof analyticsActions;
  approvals: typeof approvals;
  billing: typeof billing;
  constants: typeof constants;
  crons: typeof crons;
  dataRetention: typeof dataRetention;
  emailActions: typeof emailActions;
  featureGates: typeof featureGates;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  media: typeof media;
  notifications: typeof notifications;
  orgMembers: typeof orgMembers;
  organizations: typeof organizations;
  posts: typeof posts;
  publishing: typeof publishing;
  publishingActions: typeof publishingActions;
  rateLimits: typeof rateLimits;
  recurringPosts: typeof recurringPosts;
  scheduling: typeof scheduling;
  socialAccountActions: typeof socialAccountActions;
  socialAccounts: typeof socialAccounts;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
