const ipc = require("@electron/remote").ipcMain;

document.addEventListener("DOMContentLoaded", async () => {

    window.prompt = (message, value) => {

        return new Promise((resolve) => {

            const win = new BrowserWindow({
                parent: electron.getCurrentWindow(),
                width: 400,
                height: 128 + 16 + 8,
                resizable: false,
                movable: false,
                maximizable: false,
                minimizable: false,
                closable: true,
                modal: true,
                show: true,
                focusable: true,
                alwaysOnTop: true,
                fullscreen: false,
                fullscreenable: false,
                skipTaskbar: false,
                frame: false,
                thickFrame: true,                
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    sandbox: false
                }
            });

            win.loadFile(`lib/prompt/index.html`, {
                query: {
                    message: message,
                    value: value
                }
            });

            // inject parent css
            win.webContents.once("did-finish-load", async () => {
                await win.webContents.insertCSS(
                    Array.from(document.styleSheets).map(sheet => Array.from(sheet.cssRules).map(r => r.cssText).join("\n")).join("\n") + 
                    `:root{${Array.from(getComputedStyle(document.documentElement)).filter(x=>x.startsWith("--")).map(x=>`${x}:${getComputedStyle(document.documentElement).getPropertyValue(x)};`).join("")}}`
                );
            });

            ipc.once("prompt-result", (event, result) => {
                win.close();
                switch (result?.type) {
                    case "prompt-ok": resolve(result.value); break;
                    case "prompt-cancel": resolve(null); break;
                    default: resolve(null); break;
                }                
            });

        });

    };

});