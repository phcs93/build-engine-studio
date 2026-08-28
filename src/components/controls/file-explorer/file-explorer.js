const { BrowserWindow } = require("@electron/remote");

customElements.define("file-explorer", class FileExplorer extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("file-explorer").content.cloneNode(true));
    }

    connectedCallback() {

        // open file event
        document.getElementById("open-file-button").onchange = async event => {

            await Promise.all(Array.from(event.target.files).map(uploadedFile => new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => {                    
                    Globals.Files.push(new FileEntry(uploadedFile.name, new Uint8Array(reader.result)));
                    resolve();
                };
                reader.readAsArrayBuffer(uploadedFile);
            })));

            // reset value so that the same file can be selected again if needed
            event.target.value = "";

            this.render();

        };

        // filter file event
        document.getElementById("filter-file-input").oninput = event => {
            const filter = event.target.value.toLowerCase();
            document.querySelectorAll("#files li").forEach(li => {
                if (li.dataset.storage === "false") {
                    const fileName = li.querySelector("span").textContent.toLowerCase();
                    if (fileName.includes(filter)) {
                        li.style.display = "";
                    } else {
                        li.style.display = "none";
                    }
                }
            });
        };

        // disable drag over event on file filter input
        document.getElementById("filter-file-input").addEventListener("dragover", event => {
            event.preventDefault();
        });

        // disable drag leave event on file filter input
        document.getElementById("filter-file-input").addEventListener("dragleave", event => {
            event.preventDefault();
        });

        // disable drop event on file filter input
        document.getElementById("filter-file-input").addEventListener("drop", event => {
            event.preventDefault();
        });

        // expand file event
        document.getElementById("files").addEventListener("click", event => {
            const li = event.target.closest("li");
            if (li && li.dataset.storage) {
                const isExpanded = li.dataset.expanded === "true";
                li.dataset.expanded = !isExpanded;
                // here we update the global state of the file to keep it consistent with the DOM
                Helpers.FindFileById(li.dataset.id).expanded = !isExpanded;
            }
        });

        // drag file event
        document.getElementById("files").addEventListener("dragstart", event => {
            if (event.target.tagName.toLowerCase() === "li") {
                event.dataTransfer.setData("text/plain", event.target.dataset.id);
            }
        });

        // drag file over event
        document.getElementById("files").addEventListener("dragover", event => {
            if (event.target.closest("ul")) {
                event.preventDefault();
                const target = event.target.closest("li");
                const rect = target.getBoundingClientRect();
                const offset = event.clientY - rect.top;
                if (offset < rect.height / 2) {
                    target.classList.add("drag-over-top");
                    target.classList.remove("drag-over-bottom");
                } else {
                    target.classList.add("drag-over-bottom");
                    target.classList.remove("drag-over-top");
                }
            }
        });

        // drag file leave event
        document.getElementById("files").addEventListener("dragleave", event => {
            if (event.target.closest("ul")) {
                event.preventDefault();
                const target = event.target.closest("li");
                target.classList.remove("drag-over-bottom");
                target.classList.remove("drag-over-top");
            }
        });

        // drop file event
        document.getElementById("files").addEventListener("drop", event => {            
            if (event.target.closest("ul")) {
                event.preventDefault();
                const target = event.target.closest("li");
                target.classList.remove("drag-over-bottom");
                target.classList.remove("drag-over-top");
                const rect = target.getBoundingClientRect();
                const offset = event.clientY - rect.top; 
                const position = offset < rect.height / 2 ? "before" : "after";
                const fromFileId = event.dataTransfer.getData("text/plain");
                const toFileId = target.dataset.id;
                Helpers.MoveFileById(fromFileId, position, toFileId);
                this.render();
            }
        });

        // left click file event
        document.getElementById("files").addEventListener("click", event => {
            const li = event.target.closest("li");
            if (!li || li.dataset.storage === "true") return;
            const fileId = li.dataset.id;
            // dispatch event so that other components can listen to it and react accordingly (e.g. open file in tab control)
            Globals.Events.dispatchEvent(new CustomEvent("file-clicked", { detail: { fileId } }));
        });

        // right click file event (context menu)
        document.getElementById("files").addEventListener("contextmenu", event => {

            event.preventDefault();

            if (event.target.tagName.toLowerCase() === "li" || event.target.closest("li")) {            

                const li = event.target.tagName.toLowerCase() === "li" ? event.target : event.target.closest("li");
                
                const fileId = li.dataset.id;
                
                const template = [
                    {
                        label: "Rename",
                        icon: electron.nativeImage.createFromPath("res/icons/context-menu/nucleo/rename.png").resize({ width: 16, height: 16 }),
                        click: async () => {
                            const name = await prompt("ENTER FILE NAME", li.querySelector("span").textContent);
                            if (name) {
                                const file = Helpers.FindFileById(fileId);
                                file.name = name;
                                Globals.Events.dispatchEvent(new CustomEvent("file-renamed", { detail: { fileId, name } }));
                                this.render();
                            }
                        }
                    },
                    {
                        label: "Duplicate",
                        icon: electron.nativeImage.createFromPath("res/icons/context-menu/nucleo/duplicate.png").resize({ width: 16, height: 16 }),
                        click: async () => {
                            const file = Helpers.FindFileById(fileId);
                            const name = file.name.replace(/(\.\w+)?$/, " Copy$1");
                            const duplicate = new FileEntry(name, file.Serialize());
                            Globals.Files.push(duplicate);
                            Helpers.MoveFileById(duplicate.id, "after", fileId);
                            this.render();
                        }
                    },
                    {
                        label: "Remove",
                        icon: electron.nativeImage.createFromPath("res/icons/context-menu/nucleo/delete.png").resize({ width: 16, height: 16 }),
                        click: async () => {
                            const answer = confirm(`All changes will be lost. Are you sure you want to remove [${li.querySelector("span").textContent}]?`);
                            if (answer) {
                                Helpers.DeleteFileById(fileId);
                                Globals.Events.dispatchEvent(new CustomEvent("file-deleted", { detail: { fileId } }));
                                this.render();
                            }
                        }
                    },
                    {
                        label: "Export",
                        icon: electron.nativeImage.createFromPath("res/icons/context-menu/nucleo/export.png").resize({ width: 16, height: 16 }),
                        click: () => {
                            const file = Helpers.FindFileById(fileId);
                            const blob = new Blob([file.Serialize()], { type: "application/octet-stream" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = file.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Inspect Element',
                        click: () => {
                            electron.getCurrentWindow().webContents.inspectElement(event.clientX, event.clientY);
                        }
                    }
                ];

                // specific context menu entries by file format
                const file = Helpers.FindFileById(fileId);

                if (file.type === "RTS") {
                    // add element before existing ones and add separator
                    template.unshift(
                        {
                            label: "Normalize Volume",
                            icon: electron.nativeImage.createFromPath("res/icons/context-menu/nucleo/normalize.png").resize({ width: 16, height: 16 }),
                            click: async () => {
                                const answer = confirm(`Normalize all RTS audio entries to -10 dBFS? (ideal volume for ingame RTS voices)`);
                                if (answer) {
                                    for (const f of file.files) {
                                        switch (f.type) {
                                            case "VOC": {
                                                console.log("VOC normalization not implemented yet");
                                                break;
                                            }
                                            case "WAV": {
                                                f.bytes = WAV.NormalizeWAV(f.bytes, -10);
                                                break;
                                            }
                                        }
                                    }
                                    // Helpers.DeleteFileById(fileId);
                                    // Globals.Events.dispatchEvent(new CustomEvent("file-deleted", { detail: { fileId } }));
                                    this.render();
                                }
                            }
                        },
                        { type: 'separator' },
                    );
                }

                const menu = electron.Menu.buildFromTemplate(template);
                
                menu.popup({ 
                    window: electron.getCurrentWindow(), 
                    x: event.clientX, 
                    y: event.clientY
                });

            }

        });

    }

    render() {

        // recursively generate the <li> and <ul> elements for each file
        const generateHTML = (files, level) => {
            
            const elements = [];

            for (const file of files) {

                elements.push(`
                    <li draggable="true" 
                        data-id="${file.id}" 
                        data-storage="${file.isStorage}"
                        data-selected="${file.selected}"
                        data-expanded="${file.expanded}"
                        data-open="${file.open}"
                        data-saved="${file.saved}"
                        data-type="${file.type}"
                        >
                        <div class="flex-columns flex-gap-small">
                            ${"<div class=\"ident\"></div>".repeat(level)}
                            <div class="caret"></div>
                            <img src="res/icons/extentions/${Helpers.GetIconFileName(file.type)}.svg" alt="${file.type}">                            
                            <span>${file.name}</span>
                        </div>
                    </li>
                `);

                if (file.isStorage) {
                    elements.push(generateHTML(file.files, level + 1));
                }

            }

            return `<ul>${elements.join("\r\n")}</ul>`;

        };

        // replace the content of the list with the newly generated html
        document.getElementById("files").innerHTML = generateHTML(Globals.Files, 0);

        // dispatch input event on the filter field to keep the filter active
        document.getElementById("filter-file-input").dispatchEvent(new Event("input", { bubbles: true }));

    }

});