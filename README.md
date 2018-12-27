# scratch-desktop

Scratch 3.0 as a standalone desktop application

## Developer Instructions

### Prepare `scratch-gui`

This step is temporary: eventually, the `scratch-desktop` branch of the Scratch GUI repository will be merged with
that repository's main development line. For now, though, there's a separate branch:

1. Clone the `scratch-gui` repository if you haven't already.
2. Switch to the `scratch-desktop` branch with `git checkout scratch-desktop`
3. Build with `BUILD_MODE=dist`:
   - macOS, WSL, or Cygwin: run `BUILD_MODE=dist npm run build` or `BUILD_MODE=dist npm run watch`
   - CMD: run `set BUILD_MODE=dist` once, then `npm run build` or `npm run watch` any number of times in the same
     window.
   - PowerShell: run `$env:BUILD_MODE = "dist"` once, then `npm run build` or `npm run watch` any number of times in
     the same window.

### Prepare media library assets

In the `scratch-desktop` directory, run `npm run fetch`. Re-run this any time you update `scratch-gui` or make any
other changes which might affect the media libraries.

### Run in development mode

`npm start`

### Make a packaged build

`npm run dist`

Node that on macOS this will require installing various certificates.

### Make a semi-packaged build

This will simulate a packaged build without actually packaging it: instead the files will be copied to a subdirectory
of `dist`.

`npm run dist:dir`

### Debugging

You can debug the renderer process by opening the Chromium development console. This should be the same keyboard
shortcut as Chrome on your platform. This won't work on a packaged build.

You can debug the main process the same way as any Node.js process. I like to use Visual Studio Code with a
configuration like this:

```json
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
