customElements.define("file-control", class FileControl extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("file-control").content.cloneNode(true));
    }

});