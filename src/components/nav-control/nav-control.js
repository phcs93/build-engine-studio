customElements.define("nav-control", class NavControl extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("nav-control").content.cloneNode(true));
    }

    connectedCallback() {

        const navControlButtons = this.querySelector("div#nav-control-buttons");
        const navControlContent = this.querySelector("div#nav-control-content");

        if (navControlButtons && navControlContent) {

            Array.from(this.children).forEach((child, index) => {

                if (child.dataset.navName && child.dataset.navIcon) {

                    navControlButtons.insertAdjacentHTML("beforeend", `
                        <input type="radio" name="nav-control" id="nav-control-${child.dataset.navName}" ${index === 0 ? "checked" : ""} />
                        <label for="nav-control-${child.dataset.navName}" ${child.dataset.navClass ? `class="${child.dataset.navClass}"` : ""}>
                            <img src="${child.dataset.navIcon}" alt="${child.dataset.navName}" title="${child.dataset.navName}" />
                        </label>
                    `);

                    navControlContent.appendChild(child);

                }

            });

        }

    }

});