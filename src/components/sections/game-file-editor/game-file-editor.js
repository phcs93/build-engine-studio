customElements.define("game-file-editor", class GameFileEditor extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("game-file-editor").content.cloneNode(true));
    }

});