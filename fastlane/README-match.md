# Fastlane Match setup

## You might not need to do this!

If you don't plan to build this application, you don't need Fastlane Match.

If you don't plan to build this application for macOS, you don't need Fastlane Match.

If you plan to only run your builds locally for your own debug purposes, you don't need Fastlane Match.

If you don't have access to a Fastlane Match storage repository or bucket, you don't need Fastlane Match.

## Initial Configuration

The `Matchfile` containing settings for Fastlane Match includes private information about our storage, so it's set to be ignored by `git`.

This means that you'll need to initialize Fastlane Match yourself when you clone this repository in a new place.

To initialize Fastlane Match:

1. Enter this repository's base directory (not the `fastlane` subdirectory)
2. Run `bundle exec fastlane match init` and answer the questions

...yep, that's it.

## Authentication

Match authenticates with Apple via an App Store Connect API Team Key.
Three environment variables drive this:

| Variable | What it is |
| --- | --- |
| `APP_STORE_CONNECT_API_KEY_KEY_ID` | The Key ID shown in App Store Connect (short string). |
| `APP_STORE_CONNECT_API_KEY_ISSUER_ID` | The team's Issuer ID (UUID). |
| `APP_STORE_CONNECT_API_KEY_KEY_FILEPATH` *or* `APP_STORE_CONNECT_API_KEY_KEY` | The path to your `.p8` file *or* its base64-encoded contents. |

When using `_KEY` (base64), also set `APP_STORE_CONNECT_API_KEY_IS_KEY_CONTENT_BASE64=true`.

In CI these are wired up from GitHub Actions `vars` (the IDs) and `secrets` (the
key contents). Locally, the easiest pattern is a `fastlane/.env` file (gitignored)
pointing `APP_STORE_CONNECT_API_KEY_KEY_FILEPATH` at your downloaded `.p8`.

If the Key ID env var is empty, Match falls back to whatever auth Apple's
tooling can find — useful only for read-only operations against an existing
match repo.

## Obtaining & Updating Certs

1. If you plan to make and internally share development builds for testing purposes, run:
   * `bundle exec fastlane match_dev`
2. If you plan to make builds for release, run:
   * `bundle exec fastlane match_dist`
