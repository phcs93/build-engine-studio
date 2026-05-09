const remote = require("@electron/remote");
const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);    
    const win = remote.getCurrentWindow();

    const message = params.get("message") || "";
    const value = params.get("value") || "";

    document.getElementById("prompt-message").textContent = message;
    const input = document.getElementById("prompt-value");
    input.value = value;
    input.focus();
    input.select();

    document.getElementById("prompt-form").onsubmit = event => {
        event.preventDefault();
        ipcRenderer.send("prompt-result", {
            type: "prompt-ok",
            value: input.value
        });
    };

    document.getElementById("prompt-cancel").onclick = () => {
        ipcRenderer.send("prompt-result", {
            type: "prompt-cancel"
        });
    };

});