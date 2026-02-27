customElements.define("nav-bar", class NavBar extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("nav-bar").content.cloneNode(true));
    }

    connectedCallback() {
        // manual slot implementation: move children with slot="bla" into
        // the placeholder element inside the template.
        const placeholder = this.querySelector("#nav-bar-content");
        if (placeholder) {
            Array.from(this.children).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    placeholder.appendChild(child);
                }
            });
        }
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

// shadow dom = dom can only be acessed by internal js and css (global css wont affect shadow elements)
// shadow dom = internal js and css cannot access outside
// template slots = allow insertion of html elements in determiend slots
// template slots = only works with a shadow dom (absolute garbage restriction)
// atributo shadowrootmode="open" = allows access to the shadow dom from outside js via element.shadowRoot
// atributo shadowrootmode="closed" = does not allow access to the shadow dom from outside js via element.shadowRoot