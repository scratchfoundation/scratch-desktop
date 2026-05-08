fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Mac

### mac match_dev

```sh
[bundle exec] fastlane mac match_dev
```

Use Fastlane Match to install development certificates

### mac match_dist

```sh
[bundle exec] fastlane mac match_dist
```

Use Fastlane Match to install distribution certificates

### mac nuke_dev

```sh
[bundle exec] fastlane mac nuke_dev
```

Revoke and remove all development certificates from Apple and the match storage

### mac nuke_dist

```sh
[bundle exec] fastlane mac nuke_dist
```

Revoke and remove App Store distribution certificates (and the installer companion)

### mac prepare_signing

```sh
[bundle exec] fastlane mac prepare_signing
```

Prepare for a signed CI build

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
