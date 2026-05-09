import { app, BrowserWindow } from "electron";
import remote from "@electron/remote/main/index.js";
import menu from "electron-context-menu";

remote.initialize();

app.on("browser-window-created", (_, w) => {
    remote.enable(w.webContents);
});   

app.whenReady().then(async () => { 

    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            //devTools: !app.isPackaged,
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
            //enableRemoteModule: true
        }
    });
    
    app.isPackaged || menu();
    app.isPackaged || win.webContents.openDevTools();
    
    win.setMenuBarVisibility(false);
    win.loadFile("index.html");

});

app.on("window-all-closed", () => {
    app.quit();
});