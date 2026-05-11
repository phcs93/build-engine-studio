customElements.define("palette-editor", class PaletteEditor extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("palette-editor").content.cloneNode(true));
    }

    connectedCallback() {
            
        const fileId = this.dataset.fileId;
        const paletteBytes = Helpers.FindFileById(fileId).bytes;
        const palette = new Build.Models.Palette(paletteBytes);
        console.log(palette);

    }

});