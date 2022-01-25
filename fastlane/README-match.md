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
2. Run `fastlane match init` and answer the questions

...yep, that's it.

## Obtaining & Updating Certs

1. If you plan to make and internally share development builds for testing purposes, run:
   * `fastlane match_dev`
2. If you plan to make builds for release, run:
   * `fastlane match_dist`
