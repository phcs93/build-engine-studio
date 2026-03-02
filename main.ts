import { app, BrowserWindow } from "electron";
import remote from "@electron/remote/main/index.js";
import menu from "electron-context-menu";

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

    remote.initialize();
    remote.enable(win.webContents);  
    
    app.isPackaged || menu();
    app.isPackaged || win.webContents.openDevTools();
    
    win.setMenuBarVisibility(false);
    win.loadFile("index.html");

});

app.on("window-all-closed", () => {
    app.quit();
});