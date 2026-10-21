# Jobsite mobile deployment: Expo to TestFlight and Google Play

This runbook covers the shared Jobsite app built from this repository with Expo SDK 57 and EAS. It starts with release preparation, sends builds to TestFlight and Google Play Internal testing, and finishes with store production rollout.

The shared app identifiers are:

| Item | Value |
| --- | --- |
| Product name | Jobsite (working title) |
| EAS client | `shared` |
| iOS bundle identifier | `ie.mesandigital.fsm` |
| Android application ID | `ie.mesandigital.fsm` |
| App version | `1.0.0` initially |
| Preview EAS profile/channel | `preview-shared` / `preview` |
| Store EAS profile/channel | `production-shared` / `production` |
| Runtime policy | Native app version |

Run every command in this document from the `fsm/` directory.

## 1. Current readiness and blockers

The project already has:

- Expo Router and `expo-updates` configured;
- separate preview and production EAS build profiles in `eas.json`;
- store build scripts in `package.json`;
- automatic remote build-number/version-code management with `appVersionSource: remote` and `autoIncrement: true`;
- stable iOS and Android identifiers;
- draft privacy, data-safety, listing, screenshot and legal notes under `docs/store/`.

The following must be completed before the first store build:

- [ ] Create/link the shared EAS project and replace `<EAS_PROJECT_ID_SHARED>` through the `EAS_PROJECT_ID` environment variable.
- [ ] Create the production Supabase project. Store builds must not point at `shared-dev` unless the release is explicitly a non-production test.
- [ ] Add preview and production public Supabase variables to the matching EAS environments.
- [ ] Supply final app icon and splash assets; `clients/shared/config.ts` currently leaves both undefined.
- [ ] Confirm the final product name is available and replace the working title if necessary.
- [ ] Enrol the owning legal organisation in the Apple Developer Program and Google Play Console.
- [ ] Create the App Store Connect and Play Console app records.
- [ ] Replace every placeholder in `eas.json`, `store.config.json`, and `docs/store/`.
- [ ] Publish privacy, support, terms and account-deletion URLs.
- [ ] Prepare an invented store-review tenant and credentials. Never expose the normal demo seed password or real customer data to reviewers.
- [ ] Capture final store screenshots using invented data.
- [ ] Add a Detox configuration and execute the critical mobile flows, or explicitly record the temporary manual-test exception. This repository currently has no runnable Detox target.

Do not submit a production build while any public client configuration points at a local Supabase instance or while `shared-prod` is missing.

## 2. Accounts and ownership

Use organisation-owned accounts rather than an individual contractor account.

### Expo

1. Create or select the Mesan Digital Ventures Expo organisation.
2. Install/update EAS CLI and authenticate:

   ```bash
   npm install --global eas-cli
   eas login
   eas whoami
   ```

3. Create or link the shared EAS project:

   ```bash
   CLIENT=shared eas init
   ```

4. Record the resulting EAS project ID. Do not commit it as a secret; it is a public project identifier.

### Apple

Required before TestFlight:

- an active Apple Developer Program organisation membership;
- an App Store Connect app using bundle ID `ie.mesandigital.fsm`;
- an App Store Connect user with Account Holder, Admin, App Manager or Developer permissions;
- agreements, tax and banking accepted where App Store Connect requires them;
- an App Store Connect API key for automated EAS submissions, or interactive Apple credentials for the initial submission.

Apple requires an App Store Connect app record before a build can be associated with the app. TestFlight internal testers must be App Store Connect users. External testers do not need to be team members, but the first external build normally goes through TestFlight Beta App Review.

### Google

Required before Google Play testing:

- an active organisation-owned Google Play developer account;
- a Play Console app using package name `ie.mesandigital.fsm`;
- the app category, contact details and required declarations;
- Play App Signing enabled during the first release;
- a Google Cloud service account with sufficient Play Console release permissions for automated EAS submission.

Expo currently supports creating a first release with EAS Submit, but manually creating the first Internal testing release in Play Console remains the clearest setup path and makes Play App Signing and declarations visible before automation is enabled.

## 3. Configure the EAS project

### 3.1 Link the project ID

Set `EAS_PROJECT_ID` in the Expo project for all three standard environments:

- `development`
- `preview`
- `production`

Also set `CLIENT=shared` in those EAS environments. Build profiles already provide it during EAS Build, but EAS Update also evaluates `app.config.js` and needs the same selector.

It may be added in Expo Dashboard → Project settings → Environment variables, or with EAS CLI:

```bash
eas env:set --environment preview --name CLIENT --value shared --visibility plaintext
eas env:set --environment preview --name EAS_PROJECT_ID --value <EAS_PROJECT_ID> --visibility plaintext
eas env:set --environment production --name CLIENT --value shared --visibility plaintext
eas env:set --environment production --name EAS_PROJECT_ID --value <EAS_PROJECT_ID> --visibility plaintext
```

Validate the resolved native configuration:

```bash
CLIENT=shared EAS_PROJECT_ID=<EAS_PROJECT_ID> npx expo config --type public
```

Confirm the output contains:

- `name: Jobsite`;
- `ios.bundleIdentifier: ie.mesandigital.fsm`;
- `android.package: ie.mesandigital.fsm`;
- the expected EAS project ID and updates URL;
- no local Supabase URL.

### 3.2 Configure public app variables

These values are compiled into the client and are not secrets:

```text
CLIENT=shared
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EAS_PROJECT_ID
```

Use:

- `preview` → `shared-dev` Supabase;
- `production` → `shared-prod` Supabase.

Verify each environment without printing secrets into release logs unnecessarily:

```bash
eas env:list --environment preview
eas env:list --environment production
```

Never add `SUPABASE_SERVICE_ROLE_KEY`, database passwords, seed passwords, Apple `.p8` contents or the Google service-account JSON to `EXPO_PUBLIC_*`. Public Expo variables are embedded in the app bundle.

### 3.3 Configure signing credentials

For the first build, allow EAS to manage:

- the iOS distribution certificate and provisioning profile;
- the Android upload keystore.

Inspect credentials at any time with:

```bash
eas credentials -p ios
eas credentials -p android
```

Treat the Android upload keystore as permanent. Back up access through the organisation-owned Expo account and document who can recover it.

### 3.4 Complete submission profiles

The current `submit.production-shared` section contains placeholders and cannot be used as-is. Resolve these values before submitting:

```text
<ASC_APP_ID>
<APPLE_TEAM_ID>
<EAS_ASC_API_KEY_FILE_SECRET>
<ASC_ISSUER_ID>
<ASC_KEY_ID>
<EAS_PLAY_SERVICE_ACCOUNT_FILE_SECRET>
```

Recommended credential handling:

- Android: upload and assign the Google service-account key under Expo Dashboard → Credentials, or through `eas credentials -p android`. After it is assigned to `ie.mesandigital.fsm`, remove `serviceAccountKeyPath` from `eas.json`; EAS Submit will use the managed key. Alternatively, point it to a secure file on the submitting machine or CI runner.
- iOS: store the App Store Connect `.p8` outside Git and set `ascApiKeyPath`, issuer ID and key ID through environment-variable placeholders supported by `eas.json`, or configure the submission credential interactively. The path is a path on the machine/runner executing EAS Submit, not the `.p8` contents.

Never commit the Apple `.p8` file or Google service-account JSON.

## 4. Release gate before building

Create a release candidate commit and work only from a clean tree:

```bash
git status --short
npm ci
npm run typecheck
npm test
npx supabase test db
```

Before proceeding, verify:

- [ ] all migrations and Edge Functions are deployed to the target Supabase project;
- [ ] Auth URLs, access-token hook and invite-only sign-in are configured;
- [ ] the review user can sign in and has the correct tenant/role claims;
- [ ] no seed script has been run against production without explicit approval;
- [ ] app name, icon, splash, version, permissions and identifiers are correct;
- [ ] camera and photo-library permission wording matches actual use;
- [ ] no service-role key or private credential appears in the JavaScript bundle;
- [ ] privacy/data-safety declarations match the final SDK inventory;
- [ ] release notes and “What to Test” text are ready;
- [ ] manual/Detox acceptance checks pass on both iOS and Android.

Critical mobile acceptance flow:

1. Launch opens sign-in directly, not the web landing page.
2. Sign in as the invented review owner.
3. Open jobs, job detail, photos, schedule, extra work and timesheets.
4. Create/update a job record and confirm Realtime refresh does not crash.
5. Take and upload a photo; background and resume the app.
6. Sign out and sign back in.
7. Confirm a user from another tenant cannot see the review tenant.
8. Confirm platform-admin screens are unavailable in the native app.

## 5. Preview builds before store builds

Preview builds are internal-distribution builds. They are useful for team acceptance but are not the binaries submitted to stores.

```bash
npm run build:ios:preview
npm run build:android:preview
```

Install each build from its EAS build page and execute the release gate above. Note that iOS internal distribution may require registered devices/provisioning; TestFlight does not require devices to be pre-registered.

List and inspect builds with:

```bash
eas build:list --profile preview-shared
```

Do not promote a preview binary to a store. Create a `production-shared` store build after preview acceptance.

## 6. Build the store binaries

Build both store binaries from the same approved commit:

```bash
npm run build:prod
```

Equivalent command:

```bash
eas build --platform all --profile production-shared
```

EAS produces:

- an iOS `.ipa` signed for App Store distribution;
- an Android `.aab` signed with the upload key.

Because this project uses remote version management and `autoIncrement`, EAS increments store build numbers automatically. The user-facing app version remains the value in `app.json` until intentionally changed.

Record in the release ticket/log:

- Git commit SHA;
- app version;
- iOS build number;
- Android version code;
- EAS build URLs/IDs;
- target Supabase project;
- test result summary;
- known limitations.

## 7. TestFlight deployment

### 7.1 Submit the latest iOS production build

```bash
npm run submit:ios
```

Equivalent command:

```bash
eas submit --platform ios --profile production-shared --latest
```

Submission uploads the binary; it does not automatically release it publicly on the App Store.

### 7.2 Complete processing in App Store Connect

In App Store Connect → Apps → Jobsite → TestFlight:

1. Wait for Apple to process the uploaded build.
2. Resolve “Missing Compliance” if shown. The app config currently declares `usesNonExemptEncryption: false`; confirm that remains truthful for the final binary.
3. Add beta description, feedback email and “What to Test”.
4. Create an Internal Testing group such as `Jobsite Internal`.
5. Add Mesan Digital Ventures staff as App Store Connect users/testers.
6. Add the build to the group and enable automatic distribution only if desired.
7. Testers install Apple’s TestFlight app and accept the invitation.

For external pilots:

1. Create an External Testing group.
2. Add the approved build and reviewer information.
3. Submit the first external build for TestFlight Beta App Review.
4. Invite testers by email or a controlled public link after approval.

TestFlight builds expire after 90 days. Internal testing supports up to 100 App Store Connect users; external testing supports up to 10,000 testers under Apple’s current limits.

## 8. Google Play Internal testing deployment

### 8.1 Recommended first release: Play Console

1. Open Play Console → Jobsite → Testing → Internal testing.
2. Create the first release.
3. Upload the `.aab` downloaded from the EAS production build page.
4. Enable Play App Signing when prompted.
5. Add release notes.
6. Review warnings/errors, save and roll out to Internal testing.
7. Create a tester email list or Google Group.
8. Share the opt-in link and verify installation from Google Play.

Complete the required Dashboard tasks, including app access instructions, ads declaration, content rating, target audience, Data safety, privacy policy and account-deletion URL. Internal testing may work before every production listing item is finished, but production submission will not.

### 8.2 Subsequent automated submissions

After the service account has access to the app and the EAS submission profile is complete:

```bash
npm run submit:android
```

Equivalent command:

```bash
eas submit --platform android --profile production-shared --latest
```

The current `production-shared` submit profile targets the Play `internal` track. EAS uploads the build; final rollout state and any Play review requirements remain visible in Play Console.

## 9. Store production release

Do not use a new, untested binary merely to submit to production. Promote the exact build accepted by testers whenever the store permits it.

### Apple App Store

1. Complete `store.config.json` and App Store Connect metadata.
2. Complete App Privacy, age rating, pricing/availability and review-contact fields.
3. Attach the accepted TestFlight build to the App Store version.
4. Supply the invented review login and precise sign-in instructions.
5. Submit for App Review.
6. Prefer manual release or phased release for the first version.
7. After approval/release, run the production smoke test from an App Store installation.

### Google Play production

1. Complete the store listing, Data safety, content rating, app access and policy declarations.
2. Promote the accepted Internal testing release through Closed/Open testing if desired, then to Production.
3. Use a staged rollout for the first public release where available.
4. Monitor Android vitals, crashes, ANRs and policy messages.
5. After rollout, install from Google Play and run the production smoke test.

## 10. OTA updates with EAS Update

Use OTA updates only for compatible JavaScript/assets changes. Native dependency changes, Expo SDK changes, permissions, app identifiers, icons, splash configuration and other native configuration changes require a new store build.

Preview update:

```bash
npm run update:preview -- --message "Describe the preview fix"
```

Production update:

```bash
npm run update:prod -- --message "Describe the production fix"
```

This repository uses `runtimeVersion: { policy: 'appVersion' }`. Updates are therefore delivered only to binaries with a compatible app version/runtime and the matching channel. Always test on `preview` before publishing the same change to `production`.

Record the EAS update group ID and commit SHA. To roll back an OTA release, republish a known-good update group:

```bash
eas update:republish --group <KNOWN_GOOD_GROUP_ID> --channel production
```

## 11. Monitoring and rollback

For every release, monitor:

- EAS build/update status;
- TestFlight feedback and crashes;
- Play Console Android vitals and ANRs;
- Supabase Auth, API, database and Edge Function logs;
- failed photo uploads and Realtime connection errors;
- support/deletion requests.

Rollback options:

- JavaScript/assets regression: republish the last known-good compatible EAS update.
- iOS binary regression: stop TestFlight distribution; submit a new incremented build. App Store binaries cannot be replaced in place.
- Android binary regression: halt/stage the rollout and upload a higher version code. Published AABs cannot be replaced in place.
- Database regression: create and test a forward corrective migration; never rewrite an applied migration.
- Credential exposure: revoke/rotate the credential first, then rebuild if the value was embedded in a client binary.

## 12. One-page release sequence

Use this sequence for each store release:

1. Finalise code and production Supabase deployment.
2. Run typecheck, unit tests, database tests and mobile acceptance tests.
3. Build/install `preview-shared` on both platforms.
4. Fix issues and repeat preview acceptance.
5. Freeze the release commit and confirm a clean tree.
6. Build `production-shared` for iOS and Android.
7. Submit iOS to TestFlight and Android to Play Internal testing.
8. Complete store-side processing/declarations and invite testers.
9. Test the store-delivered binaries against production.
10. Obtain release approval.
11. Promote the tested binaries to App Store/Play production with controlled rollout.
12. Run post-release smoke tests and monitor logs/feedback.
13. Record build IDs, versions, reviewers, results and rollback references.

## Official references

- [Expo: Create your first EAS Build](https://docs.expo.dev/build/setup/)
- [Expo: Submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/)
- [Expo: TestFlight deployment](https://docs.expo.dev/submit/testflight/)
- [Expo: First Android submission](https://docs.expo.dev/submit/android-manual/)
- [Expo: EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Apple: TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [Apple: App Store Connect workflow](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-workflow/)

Store requirements and dashboard labels change. Re-check the linked official documentation and the current App Store Connect/Play Console warnings before every release.
