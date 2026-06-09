# Windows build matrix

scratch-desktop ships Windows in three formats across up to three architectures. This document captures which cells we ship, which we deliberately don't, and why.

## Matrix

| Target | x64 | ARM64 | x86 (ia32) |
|---|---|---|---|
| **NSIS** (direct download from scratch.mit.edu) | ✅ | ✅ | ✅ |
| **MSI** (managed deployment via Intune/SCCM/GPO) | ✅ | — | — |
| **AppX** (Microsoft Store) | ✅ | ✅ | ✅ |

Seven shipping artifacts per release.

## Format-by-format

### NSIS

The interactive setup.exe a home user downloads from the website. Allows the user to pick per-user or per-machine install. Runs as the foreground process during install — UAC prompts as you'd expect for a Windows installer.

Ships on **all three architectures**. Surface Pro X, Snapdragon-X laptops, and other Windows-on-ARM devices get a native ARM64 binary; older 32-bit devices keep their ia32 path.

### MSI

The managed-deployment installer for IT administrators using Intune, SCCM, or Group Policy. Per-machine install with HKLM registration. Silent install supported via `msiexec /i "Scratch <version> x64.msi" /quiet` (the filename has spaces, so quote it). Uninstall via `msiexec /x` or Add/Remove Programs.

Ships **x64 only**.

- **No ARM64 MSI**: ARM64 managed-deployment environments use the Store AppX deployed through Intune's "Microsoft Store app (new)" type, which is Microsoft's recommended ARM64 enterprise path. The MSI route on ARM64 would currently produce an x64-stamped artifact installing an ARM64 payload (an electron-builder + WiX 4 limitation), which some enterprise validation tooling rejects.
- **No ia32 MSI**: 32-bit Windows fleets large enough to centralize deployment are uncommon enough that we haven't built ia32 MSI testing into the matrix. Adding it later is a one-line change if a specific deployment use case justifies it.

### AppX

The Microsoft Store distribution. Auto-updates through Store. Sandboxed by default. Reaches the broadest passive-update audience.

Ships on **all three architectures**. Modern Intune-managed environments — including those with ARM64 devices — deploy this through Intune's Store integration without needing the MSI or NSIS paths.

## How multi-arch builds are produced

`scripts/electron-builder-wrapper.js` is authoritative for which architectures each target builds. Each entry in `availableTargets` uses electron-builder's `<target>:<arch>` CLI syntax, with multiple archs joined by spaces:

```js
microsoftStore:           { name: 'appx:ia32 appx:x64 appx:arm64',                platform: 'win32' },
windowsDirectDownload:    { name: 'nsis:ia32 nsis:x64 nsis:arm64',                platform: 'win32' },
windowsManagedDeployment: { name: 'msi:x64',                                      platform: 'win32' },
windowsInstallers:        { name: 'nsis:ia32 nsis:x64 nsis:arm64 msi:x64',        platform: 'win32' },
```

This form overrides any per-target `arch:` list in `electron-builder.yaml`. To add or remove an arch from a target, edit the wrapper string.

Local `npm run dist` and the release-candidate workflow both build Windows in two passes: AppX in one (intentionally unsigned — the Microsoft Store re-signs during certification), and NSIS + MSI together in `windowsInstallers` (signed in a single electron-builder invocation). The per-format short names (`nsis`, `msi`) remain available for local granular builds.

The release-candidate workflow uses `--target=<shortname>` to fan targets out across runners; the mapping from shortname to wrapper entry is in the same file.

## Identifying which build a user has

Useful for diagnosing reports from users on unusual configurations.

- **NSIS**: filename includes the arch (`Scratch <version> ia32 Setup.exe`, etc.).
- **MSI**: filename includes the arch.
- **AppX**: visible in Settings → Apps → Scratch → Advanced options → "Architecture" field, or in the Store listing.

To confirm an installed app is running natively vs. under emulation on Windows-on-ARM: Task Manager → Details → Scratch.exe → the **Architecture** column should read `ARM64` for native ARM64 builds; `x86` or `x64` indicates emulation.
