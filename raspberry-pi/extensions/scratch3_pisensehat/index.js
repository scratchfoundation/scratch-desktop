const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const fs = window.require('fs');
const cp = window.require('child_process');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzM1N2M1Mzt9LmNscy0ye2ZpbGw6IzMzMzt9LmNscy0ze2ZpbGw6I2ZmZjt9LmNscy00e2ZpbGw6I2M4YzhjODt9LmNscy01e2ZpbGw6IzczNjM1Nzt9LmNscy02e2ZpbGw6I2Q5YWM1Mzt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlNlbnNlIEhBVCBTY3JhdGNoIEljb248L3RpdGxlPjxnIGlkPSJMYXllcl8xIiBkYXRhLW5hbWU9IkxheWVyIDEiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTk2LDhINGE0LDQsMCwwLDAtNCw0VjMzYTIsMiwwLDAsMCwyLDJINi4xNWEyLDIsMCwwLDEsMiwyVjYzYTIsMiwwLDAsMS0yLDJIMmEyLDIsMCwwLDAtMiwyVjg4YTQsNCwwLDAsMCw0LDRIOTZhNCw0LDAsMCwwLDQtNFYxMkE0LDQsMCwwLDAsOTYsOFpNNS41LDkwQTMuNSwzLjUsMCwxLDEsOSw4Ni41LDMuNSwzLjUsMCwwLDEsNS41LDkwWm0wLTczQTMuNSwzLjUsMCwxLDEsOSwxMy41LDMuNSwzLjUsMCwwLDEsNS41LDE3Wm04OSw3M0EzLjUsMy41LDAsMSwxLDk4LDg2LjUsMy41LDMuNSwwLDAsMSw5NC41LDkwWm0wLTczQTMuNSwzLjUsMCwxLDEsOTgsMTMuNSwzLjUsMy41LDAsMCwxLDk0LjUsMTdaIi8+PHJlY3QgY2xhc3M9ImNscy0yIiB4PSIxMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI3Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIxMSIgeT0iMjEiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjE0IiBjeT0iMjQiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjEyIiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iMTIiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSIxNiIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjE2IiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iMjAiIHk9IjExIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSIyMCIgeT0iMTUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjI0IiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iMjQiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSIyOCIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjI4IiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iMzIiIHk9IjExIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSIzMiIgeT0iMTUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjM2IiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iMzYiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI0MCIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjQwIiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iNDQiIHk9IjExIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI0NCIgeT0iMTUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjQ4IiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iNDgiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI1MiIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjUyIiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iNTYiIHk9IjExIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI1NiIgeT0iMTUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjYwIiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iNjAiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI2NCIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjY0IiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iNjgiIHk9IjExIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI2OCIgeT0iMTUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9IjcyIiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iNzIiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI3NiIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9Ijc2IiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iODAiIHk9IjExIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI4MCIgeT0iMTUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9Ijg0IiB5PSIxMSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtNSIgeD0iODQiIHk9IjE1IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIi8+PHJlY3QgY2xhc3M9ImNscy01IiB4PSI4OCIgeT0iMTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48cmVjdCBjbGFzcz0iY2xzLTUiIHg9Ijg4IiB5PSIxNSIgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMzMiIHk9IjgwIiB3aWR0aD0iOSIgaGVpZ2h0PSI5Ii8+PHJlY3QgY2xhc3M9ImNscy0yIiB4PSI4MiIgeT0iMjciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiLz48cmVjdCBjbGFzcz0iY2xzLTIiIHg9IjY5IiB5PSIyNSIgd2lkdGg9IjciIGhlaWdodD0iMTEiLz48cmVjdCBjbGFzcz0iY2xzLTIiIHg9IjcwIiB5PSI0NyIgd2lkdGg9IjYiIGhlaWdodD0iNCIvPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iOTEiIHk9IjQ1IiB3aWR0aD0iNCIgaGVpZ2h0PSI0Ii8+PHJlY3QgY2xhc3M9ImNscy0yIiB4PSI5MCIgeT0iNTQiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiLz48cmVjdCBjbGFzcz0iY2xzLTIiIHg9Ijc4IiB5PSI2MiIgd2lkdGg9IjciIGhlaWdodD0iNSIvPjxyZWN0IGNsYXNzPSJjbHMtNCIgeD0iNzUuNiIgeT0iNzYuNjkiIHdpZHRoPSIxMC43NiIgaGVpZ2h0PSIxMC43NiIgcng9IjIuMTciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNC4zMSA4MS4zKSByb3RhdGUoLTQ1KSIvPjxjaXJjbGUgY2xhc3M9ImNscy0yIiBjeD0iODEiIGN5PSI4MiIgcj0iMyIvPjxwYXRoIGNsYXNzPSJjbHMtNiIgZD0iTTk0LjUsMThBNC41LDQuNSwwLDEsMCw5MCwxMy41LDQuNDksNC40OSwwLDAsMCw5NC41LDE4Wm0wLTYuNzVhMi4yNSwyLjI1LDAsMSwxLTIuMjUsMi4yNUEyLjI1LDIuMjUsMCwwLDEsOTQuNSwxMS4yNVoiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjE4IiB5PSIyMSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMjEiIGN5PSIyNCIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMjUiIHk9IjIxIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIyOCIgY3k9IjI0IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIzMiIgeT0iMjEiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjM1IiBjeT0iMjQiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjM5IiB5PSIyMSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNDIiIGN5PSIyNCIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNDYiIHk9IjIxIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI0OSIgY3k9IjI0IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI1MyIgeT0iMjEiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjU2IiBjeT0iMjQiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjYwIiB5PSIyMSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNjMiIGN5PSIyNCIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMTEiIHk9IjI4IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIxNCIgY3k9IjMxIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIxOCIgeT0iMjgiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjIxIiBjeT0iMzEiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjI1IiB5PSIyOCIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMjgiIGN5PSIzMSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMzIiIHk9IjI4IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIzNSIgY3k9IjMxIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIzOSIgeT0iMjgiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjQyIiBjeT0iMzEiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjQ2IiB5PSIyOCIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNDkiIGN5PSIzMSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNTMiIHk9IjI4IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI1NiIgY3k9IjMxIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI2MCIgeT0iMjgiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjYzIiBjeT0iMzEiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjExIiB5PSIzNSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMTQiIGN5PSIzOCIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMTgiIHk9IjM1IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIyMSIgY3k9IjM4IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIyNSIgeT0iMzUiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjI4IiBjeT0iMzgiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjMyIiB5PSIzNSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMzUiIGN5PSIzOCIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMzkiIHk9IjM1IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI0MiIgY3k9IjM4IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI0NiIgeT0iMzUiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjQ5IiBjeT0iMzgiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjUzIiB5PSIzNSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNTYiIGN5PSIzOCIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNjAiIHk9IjM1IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI2MyIgY3k9IjM4IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIxMSIgeT0iNDIiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjE0IiBjeT0iNDUiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjE4IiB5PSI0MiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMjEiIGN5PSI0NSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMjUiIHk9IjQyIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIyOCIgY3k9IjQ1IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIzMiIgeT0iNDIiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjM1IiBjeT0iNDUiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjM5IiB5PSI0MiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNDIiIGN5PSI0NSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNDYiIHk9IjQyIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI0OSIgY3k9IjQ1IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI1MyIgeT0iNDIiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjU2IiBjeT0iNDUiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjYwIiB5PSI0MiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNjMiIGN5PSI0NSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMTEiIHk9IjQ5IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIxNCIgY3k9IjUyIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIxOCIgeT0iNDkiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjIxIiBjeT0iNTIiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjI1IiB5PSI0OSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMjgiIGN5PSI1MiIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMzIiIHk9IjQ5IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIzNSIgY3k9IjUyIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIzOSIgeT0iNDkiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjQyIiBjeT0iNTIiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjQ2IiB5PSI0OSIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNDkiIGN5PSI1MiIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNTMiIHk9IjQ5IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI1NiIgY3k9IjUyIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI2MCIgeT0iNDkiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjYzIiBjeT0iNTIiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjExIiB5PSI1NiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMTQiIGN5PSI1OSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMTgiIHk9IjU2IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIyMSIgY3k9IjU5IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIyNSIgeT0iNTYiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjI4IiBjeT0iNTkiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjMyIiB5PSI1NiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMzUiIGN5PSI1OSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMzkiIHk9IjU2IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI0MiIgY3k9IjU5IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI0NiIgeT0iNTYiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjQ5IiBjeT0iNTkiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjUzIiB5PSI1NiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNTYiIGN5PSI1OSIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNjAiIHk9IjU2IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI2MyIgY3k9IjU5IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIxMSIgeT0iNjMiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjE0IiBjeT0iNjYiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjE4IiB5PSI2MyIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMjEiIGN5PSI2NiIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMjUiIHk9IjYzIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIyOCIgY3k9IjY2IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIzMiIgeT0iNjMiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjM1IiBjeT0iNjYiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjM5IiB5PSI2MyIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNDIiIGN5PSI2NiIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNDYiIHk9IjYzIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI0OSIgY3k9IjY2IiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI1MyIgeT0iNjMiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjU2IiBjeT0iNjYiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjYwIiB5PSI2MyIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNjMiIGN5PSI2NiIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMTEiIHk9IjcwIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIxNCIgY3k9IjczIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIxOCIgeT0iNzAiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjIxIiBjeT0iNzMiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjI1IiB5PSI3MCIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMjgiIGN5PSI3MyIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iMzIiIHk9IjcwIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIzNSIgY3k9IjczIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSIzOSIgeT0iNzAiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjQyIiBjeT0iNzMiIHI9IjIuNzUiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjQ2IiB5PSI3MCIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPjxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iNDkiIGN5PSI3MyIgcj0iMi43NSIvPjxyZWN0IGNsYXNzPSJjbHMtMyIgeD0iNTMiIHk9IjcwIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSI1NiIgY3k9IjczIiByPSIyLjc1Ii8+PHJlY3QgY2xhc3M9ImNscy0zIiB4PSI2MCIgeT0iNzAiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz48Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjYzIiBjeT0iNzMiIHI9IjIuNzUiLz48cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik01LjUsMThBNC41LDQuNSwwLDEsMCwxLDEzLjUsNC40OSw0LjQ5LDAsMCwwLDUuNSwxOFptMC02Ljc1QTIuMjUsMi4yNSwwLDEsMSwzLjI1LDEzLjUsMi4yNSwyLjI1LDAsMCwxLDUuNSwxMS4yNVoiLz48cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik05NC41LDkxQTQuNSw0LjUsMCwxLDAsOTAsODYuNSw0LjQ5LDQuNDksMCwwLDAsOTQuNSw5MVptMC02Ljc1YTIuMjUsMi4yNSwwLDEsMS0yLjI1LDIuMjVBMi4yNSwyLjI1LDAsMCwxLDk0LjUsODQuMjVaIi8+PHBhdGggY2xhc3M9ImNscy02IiBkPSJNNS41LDkxQTQuNSw0LjUsMCwxLDAsMSw4Ni41LDQuNDksNC40OSwwLDAsMCw1LjUsOTFabTAtNi43NUEyLjI1LDIuMjUsMCwxLDEsMy4yNSw4Ni41LDIuMjUsMi4yNSwwLDAsMSw1LjUsODQuMjVaIi8+PC9nPjwvc3ZnPg=='

/**
 * Class for the SenseHAT blocks in Scratch 3.0
 * @constructor
 */
class Scratch3PiSenseHatBlocks {
    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Raspberry Pi Sense HAT';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'pisensehat';
    }

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // set up canvases for scaling graphics to display on the matrix
        this.bigCanvas = document.createElement('canvas');
        this.bigCanvas.width = 480 * 2;
        this.bigCanvas.height = 360 * 2;
        this.bigCtx = this.bigCanvas.getContext('2d');
        this.bigCtx.imageSmoothingEnabled = true;
        this.bigCtx.imageSmoothingQuality = 'high';

        this.smallCanvas = document.createElement('canvas');
        this.smallCanvas.width = 8;
        this.smallCanvas.height = 8;
        this.smallCtx = this.smallCanvas.getContext('2d');
        this.smallCtx.imageSmoothingEnabled = true;
        this.smallCtx.imageSmoothingQuality = 'high';

        // global colours
        this._fg = [255, 255, 255];
        this._bg = [0, 0, 0];

        // global rotation
        this._orient = 0;

        // movement timeout
        this._moved = 0;
        this._movtim = 0;

        // tilt triggered
        this._xtilt = 0;
        this._ytilt = 0;

        this._imu = [0,0,0,0,0,0,0,0,0];

        // find the framebuffer on the SenseHAT
        this.fbfile = "";
        var fbtest = 0;
        while (1)
        {
            var fname = "/sys/class/graphics/fb" + fbtest.toString () + "/name";
            if (fs.existsSync (fname))
            {
                var data = fs.readFileSync (fname, 'utf8');
                if (data.indexOf ('RPi-Sense FB') != -1)
                {
                    this.fbfile = "/dev/fb" + fbtest.toString ();

                    const read = cp.spawn ("RTIMUCLI");

                    read.stdout.on ('data', (readd) => {
                        const str = String.fromCharCode.apply (null, readd);
                        this._imu = str.split (":");
                    });

                    break;
                }
            }
            else
            {
                // fall back to the emulator if possible
                cp.spawn ("sense_emu_gui");
                this.fbfile = "/dev/shm/rpi-sense-emu-screen";
                break;
            }
            fbtest++;
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3PiSenseHatBlocks.EXTENSION_ID,
            name: Scratch3PiSenseHatBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'scroll_message',
                    text: formatMessage({
                        id: 'pisensehat.scroll_message',
                        default: 'display text [MESSAGE]',
                        description: 'scroll message across in foreground colour'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        }
                    }
                },
                {
                    opcode: 'show_letter',
                    text: formatMessage({
                        id: 'pisensehat.show_letter',
                        default: 'display character [LETTER]',
                        description: 'show letter in foreground colour'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        LETTER: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A'
                        },
                    }
                },
                {
                    opcode: 'display_symbol',
                    text: formatMessage({
                        id: 'pisensehat.display_symbol',
                        default: 'display [MATRIX]',
                        description: 'display a pattern on the LEDs'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MATRIX: {
                            type: ArgumentType.MATRIX8,
                            defaultValue: '0110011001111110001111000011110001111110011111100011110000011000'
                        }
                    }
                },
                {
                    opcode: 'display_sprite',
                    text: formatMessage({
                        id: 'pisensehat.display_sprite',
                        default: 'display sprite',
                        description: 'display the current sprite on the LED matrix'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'display_stage',
                    text: formatMessage({
                        id: 'pisensehat.display_stage',
                        default: 'display stage',
                        description: 'display the stage on the LED matrix'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'all_off',
                    text: formatMessage({
                        id: 'pisensehat.all_off',
                        default: 'clear display',
                        description: 'turn off all LEDs'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'set_fg',
                    text: formatMessage({
                        id: 'pisensehat.set_fg',
                        default: 'set colour to [COLOUR]',
                        description: 'set foreground colour from colour picker'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        COLOUR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'set_bg',
                    text: formatMessage({
                        id: 'pisensehat.set_bg',
                        default: 'set background to [COLOUR]',
                        description: 'set background colour from colour picker'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        COLOUR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'set_pixel',
                    text: formatMessage({
                        id: 'pisensehat.set_pixel',
                        default: 'set pixel x [X] y [Y] to [COLOUR]',
                        description: 'set pixel from colour picker'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.STRING,
                            menu: 'coords',
                            defaultValue: '0'
                        },
                        Y: {
                            type: ArgumentType.STRING,
                            menu: 'coords',
                            defaultValue: '0'
                        },
                        COLOUR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'set_orient',
                    text: formatMessage({
                        id: 'pisensehat.set_orient',
                        default: 'set rotation to [ROT] degrees',
                        description: 'set rotation of LED matrix'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        ROT: {
                            type: ArgumentType.STRING,
                            menu: 'rots',
                            defaultValue: '0'
                        }
                    }
                },
                '---',
                {
                    opcode: 'when_joystick',
                    text: formatMessage({
                        id: 'pisensehat.when_joystick',
                        default: 'when joystick pushed [STICK]',
                        description: 'when the joystick is pushed'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        STICK: {
                            type: ArgumentType.STRING,
                            menu: 'stick',
                            defaultValue: 'up arrow'
                        }
                    }
                },
                {
                    opcode: 'joystick_pushed',
                    text: formatMessage({
                        id: 'pisensehat.joystick_pushed',
                        default: 'joystick pushed [STICK] ?',
                        description: 'is the joystick pushed?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        STICK: {
                            type: ArgumentType.STRING,
                            menu: 'stick',
                            defaultValue: 'up arrow'
                        }
                    }
                },
                {
                    opcode: 'when_moved',
                    text: formatMessage({
                        id: 'pisensehat.when_moved',
                        default: 'when shaken',
                        description: 'when the SenseHAT is shaken'
                    }),
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'when_tilted',
                    text: formatMessage({
                        id: 'pisensehat.when_tilted',
                        default: 'when tilted [TILT]',
                        description: 'when the SenseHAT is tilted'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        TILT: {
                            type: ArgumentType.STRING,
                            menu: 'tilt',
                            defaultValue: 'forward'
                        }
                    }
                },
                '---',
                {
                    opcode: 'get_temp',
                    text: formatMessage({
                        id: 'pisensehat.get_temp',
                        default: 'temperature',
                        description: 'gets temperature'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'get_press',
                    text: formatMessage({
                        id: 'pisensehat.get_press',
                        default: 'pressure',
                        description: 'gets pressure'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'get_humid',
                    text: formatMessage({
                        id: 'pisensehat.get_humid',
                        default: 'humidity',
                        description: 'gets humidity'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'get_ox',
                    text: formatMessage({
                        id: 'pisensehat.get_ox',
                        default: 'roll',
                        description: 'gets roll'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'get_oy',
                    text: formatMessage({
                        id: 'pisensehat.get_oy',
                        default: 'pitch',
                        description: 'gets pitch'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'get_oz',
                    text: formatMessage({
                        id: 'pisensehat.get_oz',
                        default: 'yaw',
                        description: 'gets yaw'
                    }),
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
                coords: {
                    acceptReporters: true,
                    items: ['0','1','2','3','4','5','6','7']
                },
                rots: {
                    items: ['0', '90', '180', '270']
                },
                stick: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'pisensehat.jup',
                                default: 'up',
                                description: 'joystick up'
                            }),
                            value: 'up arrow'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.jdown',
                                default: 'down',
                                description: 'joystick down'
                            }),
                            value: 'down arrow'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.jleft',
                                default: 'left',
                                description: 'joystick left'
                            }),
                            value: 'left arrow'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.jright',
                                default: 'right',
                                description: 'joystick right'
                            }),
                            value: 'right arrow'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.jcentre',
                                default: 'centre',
                                description: 'joystick centre'
                            }),
                            value: 'enter'
                        }
                    ]
                },
                tilt: {
                    items: [
                        {
                            text: formatMessage({
                                id: 'pisensehat.forward',
                                default: 'forward',
                                description: 'tilt forward'
                            }),
                            value: 'forward'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.backward',
                                default: 'backward',
                                description: 'tilt backward'
                            }),
                            value: 'backward'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.left',
                                default: 'left',
                                description: 'tilt left'
                            }),
                            value: 'left'
                        },
                        {
                            text: formatMessage({
                                id: 'pisensehat.right',
                                default: 'right',
                                description: 'tilt right'
                            }),
                            value: 'right'
                        }
                    ]
                }
            }
        };
    }

    get_temp ()
    {
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (20);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-pressure", "r");
            fs.readSync (fd, data, 0, 20, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 20);
            return Number((view.getInt16 (16, true) / 480) + 37).toFixed (2);
        }
        else return Number (this._imu[4]);
    };

    get_press ()
    {
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (20);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-pressure", "r");
            fs.readSync (fd, data, 0, 20, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 20);
            return Number (view.getInt32 (12, true) / 4096).toFixed (2);
        }
        else return Number (this._imu[3]);
    };

    get_humid ()
    {
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (28);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-humidity", "r");
            fs.readSync (fd, data, 0, 28, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 28);
            return Number (view.getInt16 (22, true) / 256).toFixed (2);
        }
        else return Number (this._imu[5]);
    };

    get_ox ()
    {
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (56);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-imu", "r");
            fs.readSync (fd, data, 0, 56, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 56);
            return Number (view.getInt16 (50, true) >= 0 ? view.getInt16 (50, true) * 360 / 32768 : 360 + (view.getInt16 (50, true) * 360 / 32768)).toFixed (2);
        }
        else return Number (this._imu[0]);
    };

    get_oy ()
    {
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (56);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-imu", "r");
            fs.readSync (fd, data, 0, 56, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 56);
            return Number (view.getInt16 (52, true) >= 0 ? view.getInt16 (52, true) * 360 / 32768 : 360 + (view.getInt16 (52, true) * 360 / 32768)).toFixed (2);
        }
        else return Number (this._imu[1]);
    };

    get_oz ()
    {
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (56);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-imu", "r");
            fs.readSync (fd, data, 0, 56, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 56);
            return Number (view.getInt16 (54, true) >= 0 ? view.getInt16 (54, true) * 360 / 32768 : 360 + (view.getInt16 (54, true) * 360 / 32768)).toFixed (2);
        }
        else return Number (this._imu[2]);
    };

    _pixel_remap (pos)
    {
        const x = pos % 8;
        const y = (pos - x) / 8;

        if (this._orient == 90)
            return (x * 8 + (7 - y));
        else if (this._orient == 180)
            return (63 - (y * 8 + x));
        else if (this._orient == 270)
            return ((7 - x) * 8 + y);
        else
            return pos;
    }

    set_pixel (args)
    {
        const x = Cast.toNumber (args.X);
        const y = Cast.toNumber (args.Y);

        if (x >= 0 && x <= 7 && y >= 0 && y <= 7)
        {
            const colour = Cast.toRgbColorList (args.COLOUR);
            const val = (Math.trunc (colour[2] / 32) * 1024) + (Math.trunc (colour[0] / 32) * 32) + Math.trunc (colour[1] / 32);

            let pix = new Uint8Array (2);
            pix[0] = val / 256;
            pix[1] = val % 256;

            const pos = this._pixel_remap ((y * 8) + x);

            const fd = fs.openSync (this.fbfile, "r+");
            fs.writeSync (fd, pix, 0, 2, pos * 2);
            fs.closeSync (fd);
        }
    }

    display_symbol (args)
    {
        const symbol = Cast.toString(args.MATRIX).replace(/\s/g, '');
        const valf = (Math.trunc (this._fg[2] / 32) * 1024) + (Math.trunc (this._fg[0] / 32) * 32) + Math.trunc (this._fg[1] / 32);
        const valb = (Math.trunc (this._bg[2] / 32) * 1024) + (Math.trunc (this._bg[0] / 32) * 32) + Math.trunc (this._bg[1] / 32);

        let pix = new Uint8Array (128);
        for (count = 0; count < 64; count++)
        {
            if (symbol.charAt (count) == '1') val = valf;
            else val = valb;

            const pos = this._pixel_remap (count);
            pix[pos * 2] = val / 256;
            pix[pos * 2 + 1] = val % 256;
        }

        const fd = fs.openSync (this.fbfile, "r+");
        fs.writeSync (fd, pix, 0, 128, 0);
        fs.closeSync (fd);
    }

    display_stage ()
    {
      this.runtime.renderer.draw();
      const gl = this.runtime.renderer._gl;

      const xOffset = (gl.canvas.width - gl.canvas.height) / 2;
      this.smallCtx.drawImage(gl.canvas, xOffset, 0, gl.canvas.height, gl.canvas.height, 0, 0, 8, 8);
      const matrixImageData = this.smallCtx.getImageData(0, 0, 8, 8);

      this._displayImageData(matrixImageData);

      this.smallCtx.clearRect(0, 0, this.smallCanvas.width, this.smallCanvas.height);

      // Yield for a frame
      return Promise.resolve();
    }

    display_sprite (args, util) {
      const drawable = this.runtime.renderer.extractDrawable(util.target.drawableID, util.target.x, util.target.y);
      if ((drawable.width < 1) || (drawable.height < 1)) return;

      // fit the sprite in a square
      let xOffset = 0;
      let yOffset = 0;
      let squareSize = 0;
      if (drawable.width > drawable.height) {
          squareSize = drawable.width;
          yOffset = (drawable.width - drawable.height) / 2;
      } else {
          squareSize = drawable.height;
          xOffset = (drawable.height - drawable.width) / 2;
      }

      const imageData = this.bigCtx.createImageData(drawable.width, drawable.height);
      imageData.data.set(drawable.data);
      this.bigCtx.putImageData(imageData, xOffset, yOffset);
      this.smallCtx.drawImage(this.bigCanvas,
          0, 0, squareSize, squareSize,
          0, 0, 8, 8);
      const matrixImageData = this.smallCtx.getImageData(0, 0, 8, 8);

      this._displayImageData(matrixImageData);

      this.smallCtx.clearRect(0, 0, this.smallCanvas.width, this.smallCanvas.height);
      this.bigCtx.clearRect(0, 0, this.bigCanvas.width, this.bigCanvas.height);

      // Yield for a frame
      return Promise.resolve();
    }

    _displayImageData (imageData) {
      let pix = new Uint8Array (128);
      for (let count = 0; count < 64; count++)
      {
        const r = imageData.data[count * 4];
        const g = imageData.data[(count * 4) + 1];
        const b = imageData.data[(count * 4) + 2];

        const val = (Math.trunc (b / 32) * 1024) + (Math.trunc (r / 32) * 32) + Math.trunc (g / 32);

        const pos = this._pixel_remap (count);
        pix[pos * 2] = val / 256;
        pix[pos * 2 + 1] = val % 256;
      }

      const fd = fs.openSync (this.fbfile, "r+");
      fs.writeSync (fd, pix, 0, 128, 0);
      fs.closeSync (fd);
    }

    _all_pixels (val)
    {
        let pix = new Uint8Array (128);
        let count = 0;
        while (count < 64)
        {
            pix[count * 2] = val / 256;
            pix[count * 2 + 1] = val % 256;
            count++;
        }
        const fd = fs.openSync (this.fbfile, "r+");
        fs.writeSync (fd, pix, 0, 128, 0);
        fs.closeSync (fd);
    }

    all_off ()
    {
        this._all_pixels (0);
    }

    set_fg (args)
    {
        const colour = Cast.toRgbColorList(args.COLOUR);
        this._fg[0] = colour[0];
        this._fg[1] = colour[1];
        this._fg[2] = colour[2];
    }

    set_bg (args)
    {
        const colour = Cast.toRgbColorList(args.COLOUR);
        this._bg[0] = colour[0];
        this._bg[1] = colour[1];
        this._bg[2] = colour[2];
        const val = (Math.trunc (this._bg[2] / 32) * 1024) + (Math.trunc (this._bg[0] / 32) * 32) + Math.trunc (this._bg[1] / 32);

        this._all_pixels (val)
    }

    set_orient (args)
    {
        const orient = Cast.toNumber(args.ROT);
        this._orient = orient;
    }

    _map_orient (pos, orient)
    {
        if (orient == 0)
        {
            let x = pos % 8;
            let y = (pos - x) / 8;
            if (x > 5) return 48;
            else return ((x * 1) + 1) * 8 - 1 - (y * 1);
        }
        else if (orient == 90)
        {
            if (pos < 48) return pos;
            else return 48;
        }
        else if (orient == 180)
        {
            let x = pos % 8;
            let y = (pos - x) / 8;
            if (x < 2) return 48;
            else return (7 - (x * 1)) * 8 + (y * 1);
        }
        else if (orient == 270)
        {
            if (pos > 16) return 63 - pos;
            else return 48;
        }
        return 48;
    }

    _load_letter (lett)
    {
        const dict = " +-*/!\"#$><0123456789.=)(ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz?,;:|@%[&_']\\~"
        let lgr = new Uint8Array (80);
        let inv = 90 - dict.indexOf (lett);
        if (inv > 90) inv = 90;
        const fd = fs.openSync ('/usr/lib/scratch3/sense_hat_text.bmp', 'r');
        for (count = 0; count < 5; count++)
            fs.readSync (fd, lgr, count * 16, 16, 3098 + inv * 80 + (64 - count * 16));
        fs.closeSync (fd);
        return lgr;
    }

    _letter (lett, orient, valf, valb)
    {
        let pix = new Uint8Array (128);
        const lgr = this._load_letter (lett);
        for (count = 0; count < 64; count++)
        {
            const map = this._map_orient (count, orient);
            if (map > 7 && map < 48 && lgr[(map - 8) * 2] == 0xFF) val = valf;
            else val = valb;
            pix[count * 2] = val / 256;
            pix[count * 2 + 1] = val % 256;
        }
        const fd = fs.openSync (this.fbfile, "r+");
        fs.writeSync (fd, pix, 0, 128, 0);
        fs.closeSync (fd);
    };

    show_letter (args)
    {
        const lett = Cast.toString(args.LETTER);
        const valf = (Math.trunc (this._fg[2] / 32) * 1024) + (Math.trunc (this._fg[0] / 32) * 32) + Math.trunc (this._fg[1] / 32);
        const valb = (Math.trunc (this._bg[2] / 32) * 1024) + (Math.trunc (this._bg[0] / 32) * 32) + Math.trunc (this._bg[1] / 32);

        if (lett.length != 1) return;
        this._letter (lett, this._orient, valf, valb);
    }

    _message (message, orient, valf, valb)
    {
        let pix = new Uint8Array (128);
        let char_ind = 0;
        let lett_ind = 0;
        const pix0 = valf / 256;
        const pix1 = valf % 256;
        const bg0 = valb / 256;
        const bg1 = valb % 256;

        // clear the grid to off and output
        for (pel = 0; pel < 64; pel++)
        {
            pix[pel*2] = bg0;
            pix[pel*2 + 1] = bg1;
        }
        const fd = fs.openSync (this.fbfile, "r+");
        fs.writeSync (fd, pix, 0, 128, 0);
        fs.closeSync (fd);

        for (lett_ind = 0; lett_ind < message.length + 2; lett_ind++)
        {
            const lgrid = this._load_letter (message[lett_ind]);
            for (char_ind = 0; char_ind < 6; char_ind++)
            {
                // scroll the grid
                for (col = 0; col < 7; col++)
                {
                    for (row = 0; row < 8; row++)
                    {
                        if (orient == 0)
                        {
                            // from right to left
                            pix[(row * 16) + (col * 2)] = pix[(row * 16) + (col + 1) * 2];
                            pix[(row * 16) + (col * 2) + 1] = pix[(row * 16) + (col + 1) * 2 + 1];
                        }
                        else if (orient == 90)
                        {
                            // from the bottom up
                            pix[(col * 16) + (row * 2)] = pix[((col + 1) * 16) + (row * 2)];
                            pix[(col * 16) + (row * 2) + 1] = pix[((col + 1) * 16) + (row * 2) + 1];
                        }
                        else if (orient == 180)
                        {
                            // from left to right inverted
                            pix[(row * 16) + ((7 - col) * 2)] = pix[(row * 16) + (6 - col) * 2];
                            pix[(row * 16) + ((7 - col) * 2) + 1] = pix[(row * 16) + (6 - col) * 2 + 1];
                        }
                        else if (orient == 270)
                        {
                            // from the top down
                            pix[((7 - col) * 16) + (row * 2)] = pix[((6 - col) * 16) + (row * 2)];
                            pix[((7 - col) * 16) + (row * 2) + 1] = pix[((6 - col) * 16) + (row * 2) + 1];
                        }
                    }
                }

                // add the new line of pixels
                for (row = 0; row < 8; row++)
                {
                    if (orient == 0)
                    {
                        if (char_ind > 5)
                        {
                            pix[(row * 16) + 14] = bg0;
                            pix[(row * 16) + 15] = bg1;
                        }
                        else if (lgrid[char_ind * 16 + (14 - row * 2)] == 0xFF)
                        {
                            pix[(row * 16) + 14] = pix0;
                            pix[(row * 16) + 15] = pix1;
                        }
                        else
                        {
                            pix[(row * 16) + 14] = bg0;
                            pix[(row * 16) + 15] = bg1;
                        }
                    }
                    else if (orient == 90)
                    {
                        if (char_ind > 5)
                        {
                            pix[112 + (14 - row * 2)] = bg0;
                            pix[113 + (14 - row * 2)] = bg1;
                        }
                        else if (lgrid[char_ind * 16 + (14 - row * 2)] == 0xFF)
                        {
                            pix[112 + (14 - row * 2)] = pix0;
                            pix[113 + (14 - row * 2)] = pix1;
                        }
                        else
                        {
                            pix[112 + (14 - row * 2)] = bg0;
                            pix[113 + (14 - row * 2)] = bg1;
                        }
                    }
                    else if (orient == 180)
                    {
                        if (char_ind > 5)
                        {
                            pix[((7 - row) * 16)] = bg0;
                            pix[((7 - row) * 16) + 1] = bg1;
                        }
                        else if (lgrid[char_ind * 16 + (14 - row * 2)] == 0xFF)
                        {
                            pix[((7 - row) * 16)] = pix0;
                            pix[((7 - row) * 16) + 1] = pix1;
                        }
                        else
                        {
                            pix[((7 - row) * 16)] = bg0;
                            pix[((7 - row) * 16) + 1] = bg1;
                        }
                    }
                    else if (orient == 270)
                    {
                        if (char_ind > 5)
                        {
                            pix[row * 2] = bg0;
                            pix[row * 2 + 1] = bg1;
                        }
                        else if (lgrid[char_ind * 16 + (14 - row * 2)] == 0xFF)
                        {
                            pix[row * 2] = pix0;
                            pix[row * 2 + 1] = pix1;
                        }
                        else
                        {
                            pix[row * 2] = bg0;
                            pix[row * 2 + 1] = bg1;
                        }
                    }
                }

                // output the buffer
                const fd = fs.openSync (this.fbfile, "r+");
                fs.writeSync (fd, pix, 0, 128, 0);
                fs.closeSync (fd);

                // pause for a bit
                const start = new Date().getTime();
                for (i = 0; i < 1e7; i++)
                {
                    if ((new Date().getTime() - start) > 100) break;
                }
            }
        }
    }

    scroll_message (args)
    {
        const message = Cast.toString (args.MESSAGE);
        const valf = (Math.trunc (this._fg[2] / 32) * 1024) + (Math.trunc (this._fg[0] / 32) * 32) + Math.trunc (this._fg[1] / 32);
        const valb = (Math.trunc (this._bg[2] / 32) * 1024) + (Math.trunc (this._bg[0] / 32) * 32) + Math.trunc (this._bg[1] / 32);

        this._message (message, this._orient, valf, valb);
    }

    when_joystick (args, util)
    {
        return util.ioQuery('keyboard', 'getKeyIsDown', [args.STICK]);
    }

    joystick_pushed (args, util)
    {
        return util.ioQuery('keyboard', 'getKeyIsDown', [args.STICK]);
    }

    _unlock_move (obj)
    {
        obj._moved = 0;
        obj._movtim = 0;
    }

    when_moved ()
    {
        let x = 0;
        let y = 0;
        let z = 0;
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (56);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-imu", "r");
            fs.readSync (fd, data, 0, 56, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 56);
            x = Number (view.getInt16 (32, true) * 8 / 32768);
            y = Number (view.getInt16 (34, true) * 8 / 32768);
            z = Number (view.getInt16 (36, true) * 8 / 32768);
        }
        else
        {
            x = Number (this._imu[6]);
            y = Number (this._imu[7]);
            z = Number (this._imu[8]);
        }

        const targ = 1.6 * 1.6;
        const mag = x * x + y * y + z * z;
        if (mag > targ)
        {
            if (this._movtim != 0) clearTimeout (this._movtim);
            this._movtim = setTimeout (this._unlock_move, 500, this);
            if (this._moved == 0)
            {
                this._moved = 1;
                return true;
            }
        }
        return false;
    }

    when_tilted (args)
    {
        const tilt = Cast.toString (args.TILT);

        let x = 0;
        let y = 0;
        if (this.fbfile == "/dev/shm/rpi-sense-emu-screen")
        {
            let data = new Uint8Array (56);
            const fd = fs.openSync ("/dev/shm/rpi-sense-emu-imu", "r");
            fs.readSync (fd, data, 0, 56, 0);
            fs.closeSync (fd);
            const view = new DataView (data.buffer, 0, 56);
            x = view.getInt16 (50, true) * 360 / 32768;
            y = view.getInt16 (52, true) * 360 / 32768;
        }
        else
        {
            x = Number (this._imu[0]);
            y = Number (this._imu[1]);
            if (x > 180.0) x -= 360.0;
            if (y > 180.0) y -= 360.0;
        }

        let dir = 0;
        if (tilt === "forward") dir = 1;
        else if (tilt === "right") dir = 2;
        else if (tilt === "backward") dir = 3;
        else if (tilt === "left") dir = 4;

        if (this._orient == 90) dir += 1;
        else if (this._orient == 180) dir += 2;
        else if (this._orient == 270) dir += 3;
        if (dir > 4) dir -= 4;

        let x_tilt = 0;
        if (x < -15 && x > -90) x_tilt = 1;
        if (x > 15 && x < 90) x_tilt = -1;

        let y_tilt = 0;
        if (y < -15 && y > -90) y_tilt = 1;
        if (y > 15 && y < 90) y_tilt = -1;

        if (this._xtilt != x_tilt)
        {
            if ((dir == 1 && x_tilt == 1) || (dir == 3 && x_tilt == -1))
            {
                this._xtilt = x_tilt;
                return true;
            }
            if (x_tilt == 0) this._xtilt = x_tilt;
        }

        if (this._ytilt != y_tilt)
        {
            if ((dir == 2 && y_tilt == 1) || (dir == 4 && y_tilt == -1))
            {
                this._ytilt = y_tilt;
                return true;
            }
            if (y_tilt == 0) this._ytilt = y_tilt;
        }

        return false;
     }
}

module.exports = Scratch3PiSenseHatBlocks;
