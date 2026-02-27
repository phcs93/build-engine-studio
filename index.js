const electron = require("@electron/remote");

document.addEventListener("DOMContentLoaded", async () => {

    console.log(electron.systemPreferences.getAccentColor());

});