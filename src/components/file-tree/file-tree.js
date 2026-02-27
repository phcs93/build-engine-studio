customElements.define("file-tree", class FileTree extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("file-tree").content.cloneNode(true));
    }

    static get observedAttributes() {
        return [];//["attribute"];
    }

    // connectedCallback() { }
    // disconnectedCallback() { }
    // adoptedCallback() { }

    // attributeChangedCallback(property, oldValue, newValue) {
    //     if (oldValue === newValue) return;
    //     this[property] = newValue;
    // }

});

// shadow dom = dom can only be acessed by internal js and css
// shadow dom = internal js and css cannot access outside

// template slots = allow insertion of html elements in determiend slots