// Convex authentication configuration for Clerk integration.
// The CLERK_JWT_ISSUER_DOMAIN env var must be set in the Convex dashboard
// to your Clerk frontend API URL (e.g., "https://your-app.clerk.accounts.dev").

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
