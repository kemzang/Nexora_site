import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

// withSentryConfig() only touches the build when SENTRY_AUTH_TOKEN is set
// (source map upload) — without it, this wraps the config as a no-op, so
// normal builds/deploys never require a Sentry project to succeed.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
});
