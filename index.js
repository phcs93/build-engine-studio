const electron = require("@electron/remote");

document.addEventListener("DOMContentLoaded", async () => {

    const accentColor = tryGetAccentColor();
    const contrastColor = getContrastColor(accentColor);

    document.querySelector(":root").style.setProperty("--accent-color", `#${accentColor}`);
    document.querySelector(":root").style.setProperty("--contrast-color", `#${contrastColor}`);

    electron.systemPreferences.addListener("accent-color-changed", (event, color) => {
        document.querySelector(":root").style.setProperty("--accent-color", `#${color}`);
        document.querySelector(":root").style.setProperty("--contrast-color", `#${getContrastColor(color)}`);
    });

});

// gets the system accent color
function tryGetAccentColor () {
    console.log("tryGetAccentColor()...");
    let color = "FFFFFF";
    try {
        color = electron.systemPreferences.getAccentColor();
    } catch (e) {
        console.error("tryGetAccentColor() //", e);
    }
    console.log("tryGetAccentColor() =>", color);
    return color;
}

// gets a contrasting color (black or white) for the given background color
function getContrastColor (bgColor) {
    console.log(`getContrastColor(${bgColor})...`);
    const color = (bgColor.charAt(0) === "#") ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
        if (col <= 0.03928) {
        return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const l = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
    const result = l <= 0.179 ? "FFFFFF" : "000000";
    console.log(`getContrastColor(${bgColor}) // ${result}`);
    return result;
}