# scratch-desktop

Scratch 3.0 as a standalone desktop application

## Developer Instructions

### A note about `scratch-gui`

Eventually, the `scratch-desktop` branch of the Scratch GUI repository will be merged with that repository's main
development line. For now, though, the `scratch-desktop` branch holds a few changes that are necessary for the Scratch
app to function correctly but are not yet merged into the main development branch. If you only intend to build or work
on the `scratch-desktop` repository then you can ignore this, but if you intend to work on `scratch-gui` as well, make
sure you use the `scratch-desktop` branch there.

Previously it was necessary to explicitly build `scratch-gui` before building `scratch-desktop`. This is no longer
necessary and the related build scripts, such as `build-gui`, have been removed.

### Prepare media library assets

In the `scratch-desktop` directory, run `npm run fetch`. Re-run this any time you update `scratch-gui` or make any
other changes which might affect the media libraries.

### Run in development mode

`npm start`

### Make a packaged build

`npm run dist`

Node that on macOS this will require installing various certificates.

#### Signing the NSIS installer (Windows, non-store)

*This section is relevant only to members of the Scratch Team.*

By default all Windows installers are unsigned. An APPX package for the Microsoft Store shouldn't be signed: it will
be signed automatically as part of the store submission process. On the other hand, the non-Store NSIS installer
should be signed.

To generate a signed NSIS installer:

1. Acquire our latest digital signing certificate and save it on your computer as a `p12` file.
2. Set `WIN_CSC_LINK` to the path to your certificate file. For maximum compatibility I use forward slashes.
   - CMD: `set WIN_CSC_LINK=C:/Users/You/Somewhere/Certificate.p12`
   - PowerShell: `$env:WIN_CSC_LINK = "C:/Users/You/Somewhere/Certificate.p12"`
3. Set `WIN_CSC_KEY_PASSWORD` to the password string associated with your P12 file.
   - CMD: `set WIN_CSC_KEY_PASSWORD=superSecret`
   - PowerShell: `$env:WIN_CSC_KEY_PASSWORD = "superSecret"`
4. Build the NSIS installer only: building the APPX installer will fail if these environment variables are set.
   - `npm run dist -- -w nsis`

#### Workaround for code signing issue in macOS

Sometimes the macOS build process will result in a build which crashes on startup. If this happens, check in `Console`
for an entry similar to this:

```text
failed to parse entitlements for Scratch[12345]: OSUnserializeXML: syntax error near line 1
```

This appears to be an issue with `codesign` itself. Rebooting your computer and trying to build again might help. Yes,
really.

See this issue for more detail: <https://github.com/electron/electron-osx-sign/issues/218>

### Make a semi-packaged build

This will simulate a packaged build without actually packaging it: instead the files will be copied to a subdirectory
of `dist`.

`npm run dist:dir`

### Debugging

You can debug the renderer process by opening the Chromium development console. This should be the same keyboard
shortcut as Chrome on your platform. This won't work on a packaged build.

You can debug the main process the same way as any Node.js process. I like to use Visual Studio Code with a
configuration like this:

```jsonc
    "launch": {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Desktop",
                "type": "node",
                "request": "launch",
                "cwd": "${workspaceFolder:scratch-desktop}",
                "runtimeExecutable": "npm",
                "autoAttachChildProcesses": true,
                "runtimeArgs": ["start", "--"],
                "protocol": "inspector",
                "skipFiles": [
                    // it seems like skipFiles only reliably works with 1 entry :(
                    //"<node_internals>/**",
                    "${workspaceFolder:scratch-desktop}/node_modules/electron/dist/resources/*.asar/**"
                ],
                "sourceMaps": true,
                "timeout": 30000,
                "outputCapture": "std"
            }
        ]
    },
```
