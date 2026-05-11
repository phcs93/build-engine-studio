customElements.define("tab-control", class TabControl extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("tab-control").content.cloneNode(true));
    }

    connectedCallback() {

        // click close tab event
        document.getElementById("tabs-headers").addEventListener("click", event => {
            const closeButton = event.target.closest("div.close-tab-button");
            if (!closeButton) return;
            const tabId = closeButton.dataset.id;
            this.closeTab(tabId);
        });

        // prevent "middle mouse click auto scroll" when middle clicking tabs
        document.getElementById("tabs-headers").addEventListener("mousedown", event => {
            if (event.button === 1) {
                event.preventDefault();
            }
        });

        // close tabs with middle mouse click
        document.getElementById("tabs-headers").addEventListener("auxclick", event => {
            if (event.button === 1) {
                const tabHeader = event.target.closest("label.tab-header");
                if (tabHeader) {
                    const tabId = tabHeader.dataset.id;
                    this.closeTab(tabId);
                }
            }
        });

        // drag tab event
        document.getElementById("tabs-headers").addEventListener("dragstart", event => {
            if (event.target.tagName.toLowerCase() === "label") {
                event.dataTransfer.setData("text/plain", event.target.dataset.id);
            }
        });

        // drag tab over event
        document.getElementById("tabs-headers").addEventListener("dragover", event => {
            if (event.target.closest("label.tab-header")) {
                event.preventDefault();
                const target = event.target.closest("label.tab-header");
                const rect = target.getBoundingClientRect();
                const offset = event.clientX - rect.left;
                if (offset < rect.width / 2) {
                    target.classList.add("drag-over-left");
                    target.classList.remove("drag-over-right");
                } else {
                    target.classList.add("drag-over-right");
                    target.classList.remove("drag-over-left");
                }
            }
        });

        // drag tab leave event
        document.getElementById("tabs-headers").addEventListener("dragleave", event => {
            if (event.target.closest("label.tab-header")) {
                event.preventDefault();
                const target = event.target.closest("label.tab-header");
                target.classList.remove("drag-over-right");
                target.classList.remove("drag-over-left");
            }
        });

        // drop tab event
        document.getElementById("tabs-headers").addEventListener("drop", event => {    

            if (event.target.closest("label.tab-header")) {

                event.preventDefault();
                const target = event.target.closest("label.tab-header");
                target.classList.remove("drag-over-left");
                target.classList.remove("drag-over-right");
                const fromTabId = event.dataTransfer.getData("text/plain");
                const toTabId = target.dataset.id;
                if (fromTabId === -1 || toTabId === -1 || fromTabId === toTabId) return;

                const rect = target.getBoundingClientRect();
                const offset = event.clientX - rect.left; 
                const position = offset < rect.width / 2 ? "before" : "after";

                const fromTabHeader = document.querySelector(`#tabs-headers label.tab-header[data-id="${fromTabId}"]`);
                const toTabHeader = document.querySelector(`#tabs-headers label.tab-header[data-id="${toTabId}"]`);
                const tabHeadersContainer = document.querySelector("div#tabs-headers");

                if (position === "before") {
                    tabHeadersContainer.insertBefore(fromTabHeader, toTabHeader);
                } else {
                    if (toTabHeader.nextSibling) {
                        tabHeadersContainer.insertBefore(fromTabHeader, toTabHeader.nextSibling);
                    } else {
                        tabHeadersContainer.appendChild(fromTabHeader);
                    }
                }

                const fromTabContent = document.querySelector(`#tabs-contents div.tab-content[data-id="${fromTabId}"]`);
                const toTabContent = document.querySelector(`#tabs-contents div.tab-content[data-id="${toTabId}"]`);
                const tabContentsContainer = document.querySelector("div#tabs-contents");

                if (position === "before") {
                    tabContentsContainer.insertBefore(fromTabContent, toTabContent);
                } else {
                    if (toTabContent.nextSibling) {
                        tabContentsContainer.insertBefore(fromTabContent, toTabContent.nextSibling);
                    } else {
                        tabContentsContainer.appendChild(fromTabContent);
                    }
                }

                this.selectTab(fromTabId);

            }
        });

        // listen for file clicks to open them in a new tab
        Globals.Events.addEventListener("file-clicked", event => {
            // get number of open tabs
            if (document.querySelectorAll("#tabs-headers label.tab-header").length === 64) {
                alert("Dude, chill out, you have too many open tabs!");
                return;
            }
            const fileId = event.detail.fileId;
            const existingTab = document.querySelector(`#tabs-headers label.tab-header[data-id="${fileId}"]`);
            if (existingTab) {
                this.selectTab(fileId);
            } else {
                const file = Helpers.FindFileById(fileId);
                this.render(fileId, file.extension, file.name, true);
                this.selectTab(fileId);
            }
        });

        // listen for file renaming
        Globals.Events.addEventListener("file-renamed", event => {
            const fileId = event.detail.fileId;
            const existingTab = document.querySelector(`#tabs-headers label.tab-header[data-id="${fileId}"]`);
            if (existingTab) {
                existingTab.querySelector(".title").textContent = event.detail.name;
            }
        });

        // listen for file deletion
        Globals.Events.addEventListener("file-deleted", event => {
            this.closeTab(event.detail.fileId);
        });

    }

    render(id, extension, title, selected) {

        // create tab header
        document.getElementById("tabs-headers").insertAdjacentHTML("beforeend", `
            <label class="tab-header" data-id="${id}" draggable="true">
                <div class="flex-columns flex-gap-small padding-medium">
                    <input type="radio" name="tab-control" ${selected ? "checked" : ""} />
                    <img src="res/icons/extentions/${Helpers.GetIconFileName(extension)}.svg" alt="${extension}">
                    <div class="title">${title}</div>
                    <div class="close-tab-button" data-id="${id}">
                        <img src="res/icons/close.svg" alt="Close">
                    </div>
                </div>
            </label>
        `);

        const editorComponent = Helpers.GetEditorComponentByFileType(id);

        // create tab content
        document.getElementById("tabs-contents").insertAdjacentHTML("beforeend", `
            <div class="tab-content flex-grow" data-id="${id}">
                <${editorComponent} data-file-id="${id}"></${editorComponent}>
            </div>
        `);

    }

    selectTab(id) {

        document.querySelector(`#tabs-headers label.tab-header[data-id="${id}"] input[type="radio"]`).checked = true;

        // scroll to selected tab
        const selectedTab = document.querySelector(`#tabs-headers label.tab-header[data-id="${id}"]`);
        if (selectedTab) {
            selectedTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }

    }

    closeTab(id) {

        const tabHeader = document.querySelector(`#tabs-headers label.tab-header[data-id="${id}"]`);
        const tabContent = document.querySelector(`#tabs-contents div.tab-content[data-id="${id}"]`);

        // if the closed tab was selected, select the previous adjacent tab (if exists)
        if (tabHeader && tabHeader.querySelector("input[type='radio']").checked) {
            const previousTabHeader = tabHeader.previousElementSibling;
            const nextTabHeader = tabHeader.nextElementSibling;
            if (previousTabHeader) {
                this.selectTab(previousTabHeader.dataset.id);
            } else if (nextTabHeader) {
                this.selectTab(nextTabHeader.dataset.id);
            }
        }

        if (tabHeader) tabHeader.remove();
        if (tabContent) tabContent.remove();

    }

});