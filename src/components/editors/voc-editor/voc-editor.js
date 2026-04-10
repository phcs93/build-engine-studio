customElements.define("voc-editor", class VocEditor extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("voc-editor").content.cloneNode(true));
    }

});