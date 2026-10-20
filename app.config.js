// Build-time client config. CLIENT picks clients/<client>/config.ts (default: shared).
// tsx/cjs lets this file load the TypeScript client configs.
require('tsx/cjs');

const client = process.env.CLIENT || 'shared';
const { config } = require(`./clients/${client}/config`);

module.exports = ({ config: base }) => ({
  ...base, // keeps app.json settings (e.g. typed routes)
  name: config.appName,
  slug: config.slug,
  scheme: config.slug,
  plugins: ['expo-router'],
  ios: { ...base.ios, bundleIdentifier: config.iosBundleId },
  android: { ...base.android, package: config.androidPackage },
  extra: {
    ...base.extra,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    lockedTenantId: config.lockedTenantId,
  },
});
