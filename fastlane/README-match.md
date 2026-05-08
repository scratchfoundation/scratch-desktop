# Fastlane Match setup

## You might not need to do this!

If you don't plan to build this application, you don't need Fastlane Match.

If you don't plan to build this application for macOS, you don't need Fastlane Match.

If you plan to only run your builds locally for your own debug purposes, you don't need Fastlane Match.

If you don't have access to a Fastlane Match storage repository or bucket, you don't need Fastlane Match.

## Configuration

The `Matchfile` is committed to this repository. Storage and authentication settings are read from environment variables (see [Storage](#storage) and [Authentication](#authentication) below), so the `Matchfile` itself contains no secrets.

## Storage

The match repo's contents live in a separate git repo. Three
environment variables configure access:

| Variable | What it is |
| --- | --- |
| `GIT_URL` | URL of the match storage repo. |
| `STORAGE_MODE` | Match storage mode. Set to `git` for this repo. |
| `MATCH_PASSWORD` | Password fastlane match uses to encrypt stored certs. |

`GIT_URL` and `STORAGE_MODE` are mandatory: the `Matchfile` calls
`ENV.fetch` on both and exits if either is missing. `MATCH_PASSWORD` is
required whenever you pull or update certs.

In CI, `GIT_URL` and `MATCH_PASSWORD` come from GitHub Actions `secrets`
and `STORAGE_MODE` from `vars`. Locally, set them in `fastlane/.env`.

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

## Nuking & Regenerating Certs

When a certificate has expired, been revoked, or is otherwise invalid, Match keeps trying to use the stale file from storage. The fix is to nuke and regenerate.

Nuking revokes certificates in the Apple Developer portal **and** deletes them from the match storage repo. Anyone else on the team using these certs will need to re-pull after a fresh `match_dev` / `match_dist`. Coordinate before running.

1. To nuke development certificates:
   * `bundle exec fastlane nuke_dev`
2. To nuke App Store distribution certificates (and the `mac_installer_distribution` installer companion):
   * `bundle exec fastlane nuke_dist`

After nuking, re-run `match_dev` / `match_dist` to regenerate fresh certs.

`nuke_dist` passes `additional_cert_types: "mac_installer_distribution"` so the installer companion is revoked alongside the App Store distribution cert. Without that, the companion ends up orphaned in match storage and breaks the next `match_dist` run.

### Developer ID certs need manual cleanup

`match_nuke` cannot currently revoke `developer_id` or `developer_id_installer` certificates (see [fastlane/fastlane#21147](https://github.com/fastlane/fastlane/issues/21147)). When you need to reset those:

1. Revoke the **Developer ID Application** and **Developer ID Installer** certificates in the Apple Developer portal: <https://developer.apple.com/account/resources/certificates/list>.
2. Delete the corresponding cert files (`.cer`, `.p12`) from the match storage repo, under the `certs/developer_id_application/` and `certs/developer_id_installer/` directories.
3. Re-run `match_dist` to generate fresh certs.
