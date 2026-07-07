# Next Millionaire App

A minimal iOS/Android wrapper around **https://nextmillionaireqr.com**, built with
Expo + `react-native-webview`. It loads your live site full-screen, keeps
in-site navigation inside the app, and hands off anything else (external
links, `mailto:`, `tel:`) to the phone's browser/mail/dialer.

## What's in here

- `App.js` — the whole app: WebView, loading spinner, offline/error screen
  with retry, Android back-button handling, pull-to-refresh.
- `app.json` — app name, bundle identifier / package name, and icons.
- `assets/` — app icon and Android adaptive icon, generated from your
  site's existing favicon (`android-chrome-512x512.png`). These are
  upscaled from a 512×512 source — swap in real 1024×1024 artwork before
  a public store launch if you want maximum sharpness.
- `eas.json` — build profiles for EAS Build (development / preview / production).

If your domain ever changes, update `SITE_URL` (and `SITE_HOSTS`) near the
top of `App.js`.

## Run it locally

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) to try it instantly. If
`react-native-webview` doesn't behave correctly in Expo Go on your SDK
version, build a dev client instead:

```bash
npx expo run:android   # requires Android Studio
npx expo run:ios       # requires a Mac + Xcode
```

## Build a real app to share

You'll need a free Expo account and the EAS CLI:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

**For a quick investor/client demo (no store needed):**
```bash
eas build --platform android --profile preview   # gives you an installable .apk link
eas build --platform ios --profile preview        # install via TestFlight
```
Android: send the `.apk` link directly — no waiting for anyone's approval.
iOS: `preview` builds still go through **TestFlight**, so you'll need an
Apple Developer account ($99/year) and to add your testers' emails in
App Store Connect. TestFlight review is quick and lightweight compared to
a full App Store review.

**For a public store launch:**
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit -p android
eas submit -p ios
```

## Building with Codemagic instead

`codemagic.yaml` is already set up with two workflows that need **no Apple
or Google account** to run:

- **`android-apk`** — builds a debug-signed `.apk`. Installs directly on
  any Android phone or emulator, no signing setup required.
- **`ios-unsigned-ipa`** — builds an **unsigned** `.ipa`. This proves your
  iOS build compiles correctly on Codemagic's Mac runners, but iOS won't
  let it run on a real iPhone until it's re-signed with a real Apple
  Developer certificate + provisioning profile — that's an OS-level rule,
  not something any CI config can get around. Treat this as "build
  verification now, sign it properly once you have an Apple Developer
  account." The Simulator build channel is another option if you want
  something runnable sooner without paying for a developer account.

To use it:
1. Push this project to a GitHub/GitLab/Bitbucket repo — Codemagic builds
   from a connected Git repo, not an uploaded zip.
2. In Codemagic, add the repo and it'll auto-detect `codemagic.yaml`.
3. Pick a workflow (`android-apk` or `ios-unsigned-ipa`) and start a build.
4. Download the `.apk` / `.ipa` from the build's **Artifacts** tab.

Both workflows run `npx expo prebuild` on the build machine itself, so
there's no `ios/`/`android/` folder to keep in sync in your repo — it's
regenerated fresh every build from `app.json` + `App.js`.

**Why there's a `scripts/patch-ios-podfile.rb`:** disabling code signing at
the `xcodebuild` command line isn't enough on its own — Xcode 14+ still
tries to sign individual CocoaPods targets (especially resource bundles)
when building for a physical device, which fails with "requires a
development team" even though the top-level build has signing off. This
script patches the freshly-generated `ios/Podfile` right after `expo
prebuild` to turn signing off for every Pods target too. It's idempotent
(safe if it runs twice) and will print a clear error instead of silently
doing nothing if a future Expo SDK changes the Podfile template enough
that its anchor text no longer matches.

## One thing to know before submitting to the App Store

Apple's guideline **4.2 (Minimum Functionality)** lets reviewers reject
apps that are just a website in a WebView with nothing else. Google Play
doesn't enforce this. If Apple pushes back, adding one real native touch
usually resolves it — push notifications, offline caching of key pages, or
a native contact form are common fixes. Nothing in this project blocks you
from adding those later; the WebView is just the shell.

## Before you ship

- [ ] Confirm `SITE_URL` in `App.js` points to the right domain
- [ ] Replace `com.nextmillionaireqr.app` in `app.json` if you'd rather use
      a different bundle ID / package name (must be unique per store)
- [ ] Swap in higher-resolution icon artwork if you have it
- [ ] Test the offline/error screen (turn on airplane mode) and the Android
      back button before distributing
