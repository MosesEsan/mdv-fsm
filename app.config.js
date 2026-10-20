// Build-time client config. CLIENT must pick clients/<client>/config.ts.
require('tsx/cjs');
const fs = require('node:fs');
const path = require('node:path');

const client = process.env.CLIENT;
if (!client) throw new Error('CLIENT is required. Use CLIENT=shared locally or select an EAS build profile.');
const configPath = path.join(__dirname, 'clients', client, 'config.ts');
if (!fs.existsSync(configPath)) throw new Error(`Unknown CLIENT "${client}". Add clients/${client}/config.ts first.`);
const { config } = require(configPath);
const hasEasProject = Boolean(config.easProjectId && !config.easProjectId.startsWith('<'));

module.exports = ({ config: base }) => ({
  ...base,
  name: config.appName,
  slug: config.slug,
  scheme: config.scheme,
  experiments: {
    ...base.experiments,
    ...(process.env.EXPO_PUBLIC_WEB_BASE_URL ? { baseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL } : {}),
  },
  ...(config.icon ? { icon: config.icon } : {}),
  ...(config.splashImage ? { splash: { image: config.splashImage, resizeMode: 'contain' } } : {}),
  runtimeVersion: { policy: 'appVersion' },
  ...(hasEasProject ? { updates: { url: `https://u.expo.dev/${config.easProjectId}` } } : {}),
  ios: {
    ...base.ios,
    bundleIdentifier: config.iosBundleId,
    config: { ...base.ios?.config, usesNonExemptEncryption: false },
    infoPlist: {
      ...base.ios?.infoPlist,
      NSCameraUsageDescription: 'Take photos to document work at a job site.',
      NSPhotoLibraryUsageDescription: 'Choose photos to attach to a job record.',
    },
  },
  android: { ...base.android, package: config.androidPackage },
  extra: {
    ...base.extra,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    lockedTenantId: config.lockedTenantId,
    ...(hasEasProject ? { eas: { projectId: config.easProjectId } } : {}),
  },
});
