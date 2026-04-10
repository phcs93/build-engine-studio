customElements.define("tab-control", class TabControl extends HTMLElement {

    /*
        {
            id: string,
            icon: string,
            title: string,
            selected: boolean
        }
    */
    Tabs = [];

    constructor() {
        super();
        this.appendChild(document.getElementById("tab-control").content.cloneNode(true));
    }

    connectedCallback() {

        // click tab event
        document.getElementById("tabs").addEventListener("click", event => {
            if (event.target.closest("div.close-tab-button")) return;
            const div = event.target.closest("div.tab");
            if (!div) return;
            const tabId = div.dataset.id;
            this.selectTab(tabId);
        });

        // click close tab event
        document.getElementById("tabs").addEventListener("click", event => {
            const closeButton = event.target.closest("div.close-tab-button");
            if (!closeButton) return;
            const tabId = closeButton.dataset.id;
            this.closeTab(tabId);
        });

        // drag tab event
        document.getElementById("tabs").addEventListener("dragstart", event => {
            if (event.target.tagName.toLowerCase() === "div") {
                event.dataTransfer.setData("text/plain", event.target.dataset.id);
            }
        });

        // drag tab over event
        document.getElementById("tabs").addEventListener("dragover", event => {
            if (event.target.closest("div.tab")) {
                event.preventDefault();
                const target = event.target.closest("div.tab");
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
        document.getElementById("tabs").addEventListener("dragleave", event => {
            if (event.target.closest("div.tab")) {
                event.preventDefault();
                const target = event.target.closest("div.tab");
                target.classList.remove("drag-over-right");
                target.classList.remove("drag-over-left");
            }
        });

        // drop tab event
        document.getElementById("tabs").addEventListener("drop", event => {            
            if (event.target.closest("div.tab")) {
                event.preventDefault();
                const target = event.target.closest("div.tab");
                target.classList.remove("drag-over-left");
                target.classList.remove("drag-over-right");
                const rect = target.getBoundingClientRect();
                const offset = event.clientX - rect.left; 
                const position = offset < rect.width / 2 ? "before" : "after";
                const fromTabId = event.dataTransfer.getData("text/plain");
                const toTabId = target.dataset.id;
                const fromTab = this.Tabs.find(t => t.id === fromTabId);
                const fromIndex = this.Tabs.findIndex(t => t.id === fromTabId);
                const toIndex = this.Tabs.findIndex(t => t.id === toTabId);
                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
                this.Tabs.splice(fromIndex, 1);
                const newIndex = position === "before" ? toIndex : toIndex + 1;
                this.Tabs.splice(newIndex, 0, fromTab);
                this.selectTab(fromTabId);
            }
        });

        // listen for file clicks to open them in a new tab
        Globals.Events.addEventListener("file-clicked", event => {
            const fileId = event.detail.fileId;
            const existingTab = this.Tabs.find(t => t.id === fileId);
            if (existingTab) {
                this.selectTab(existingTab.id);
            } else {
                const file = Helpers.FindFileById(fileId);
                const newTab = {
                    id: fileId,
                    icon: file.extension,
                    title: file.name,
                    selected: true
                };
                this.Tabs.push(newTab);
                this.selectTab(newTab.id);
            }
        });

    }

    render() {

        const elements = [];

        for (const tab of this.Tabs) {

            elements.push(`
                <div class="tab flex-columns flex-gap-small padding-medium" data-id="${tab.id}" data-selected="${tab.selected}" draggable="true">
                    <img src="res/icons/extentions/${Helpers.GetIconFileName(tab.icon)}.svg" alt="${tab.icon}">
                    <div class="title">${tab.title}</div>
                    <div class="close-tab-button" data-id="${tab.id}">
                        <img src="res/icons/close.svg" alt="Close">
                    </div>
                </div>
            `);

        }

        // add filler for bottom border
        if (this.Tabs.length > 0) {
            elements.push(`<div class="tab tab-filler flex-grow"></div>`);
        }

        // draw elements to screen
        document.getElementById("tabs").innerHTML = elements.join("");

        // scroll to selected tab (after draw)
        const selectedTab = document.querySelector("#tabs .tab[data-selected='true']");
        if (selectedTab) {
            selectedTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }

    }

    selectTab(id) {
        this.Tabs.forEach(t => t.selected = (t.id === id));
        this.render();
    }

    closeTab(id) {
        const index = this.Tabs.findIndex(t => t.id === id);
        if (index !== -1) {
            // if the closed tab is selected, select the previous adjacent tab (if exists)
            if (this.Tabs[index].selected) {                
                if (this.Tabs.length > 1) {
                    const newSelectedIndex = index === 0 ? 1 : index - 1;
                    this.Tabs[newSelectedIndex].selected = true;
                }
            }
            this.Tabs.splice(index, 1);
            this.render();
        }
    }

});