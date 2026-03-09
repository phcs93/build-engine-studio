const crypto = require("crypto");
const fs = require("fs");

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

                    const recursiveIterateFiles = (fileName, bytes) => {

                        const extension = fileName.split(".").at(-1).toUpperCase();

                        const entry = {
                            id: crypto.randomUUID(),
                            name: fileName                            
                        };

                        // check if file is a storage type so we can list its files
                        if (Helpers.IsFileStorageType(extension)) {
                            // here we store the instance of the storage object
                            entry.instance = Build.Models.Storage.Unserialize(bytes);
                            // we create entries for each file and store their bytes
                            entry.files = entry.instance.Files.map(f => recursiveIterateFiles(f.name, f.bytes));
                            // here we erase the individual file bytes from the storage instance so we don't waste memory
                            entry.instance.Files = [];
                        } else {
                            // if the file is not a storage type we just store its bytes
                            entry.bytes = bytes;
                        }

                        return entry;

                    };
                    
                    Globals.Files.push(recursiveIterateFiles(uploadedFile.name, new Uint8Array(reader.result)));

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
                if (li.dataset.container === "false") {
                    const fileName = li.querySelector("span").textContent.toLowerCase();
                    if (fileName.includes(filter)) {
                        li.style.display = "";
                    } else {
                        li.style.display = "none";
                    }
                }
            });
        };

        // drag file event
        document.getElementById("files").addEventListener("dragstart", event => {
            if (event.target.tagName.toLowerCase() === "li") {
                event.dataTransfer.setData("text/plain", event.target.dataset.id);
            }
        });

        // drag file over event
        document.getElementById("files").addEventListener("dragover", event => {
            event.preventDefault();
            const ul = event.target.closest("ul");
            if (ul) {                
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
            event.preventDefault();
            const ul = event.target.closest("ul");
            if (ul) {                
                const target = event.target.closest("li");
                target.classList.remove("drag-over-bottom");
                target.classList.remove("drag-over-top");
            }
        });

        // drop file event
        document.getElementById("files").addEventListener("drop", event => {
            event.preventDefault();
            const ul = event.target.closest("ul");
            if (ul) {
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

        // right click file event (context menu)
        document.getElementById("files").addEventListener("contextmenu", event => {

            event.preventDefault();

            if (event.target.tagName.toLowerCase() === "li" || event.target.closest("li")) {            

                const li = event.target.tagName.toLowerCase() === "li" ? event.target : event.target.closest("li");
                
                const fileId = li.dataset.id;
                
                const template = [
                    {
                        label: "Export",
                        click: () => {

                            const bytes = Helpers.GetFileBytesById(fileId);

                            // perform download
                            const blob = new Blob([bytes], { type: "application/octet-stream" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = file.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);


                        }

                    }
                    // { label: 'Cut', role: 'cut' }, // Built-in roles for common actions
                    // { label: 'Copy', role: 'copy' },
                    // { label: 'Paste', role: 'paste' },
                    // { type: 'separator' },
                    // {
                    //     label: 'Inspect Element',
                    //     click: () => {
                    //         electron.getCurrentWindow().webContents.inspectElement(event.clientX, event.clientY);
                    //     }
                    // }
                ];
                    
                // You can dynamically adjust the menu based on the params object
                // (e.g., enable 'Copy' only if text is selected, check params.selectionText)

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

        // backup which ids are currently expanded so we can set it during re-render
        const expandedIds = Array.from(document.querySelectorAll("#files li label input[type=checkbox]:checked")).reduce((ids, input) => {
            ids[input.closest("li").dataset.id] = true;
            return ids;
        }, {});

        // get available icons to check for supported extentions
        const availableIcons = fs.readdirSync("res/icons/extentions").map(file => file.split(".")[0].toLowerCase());

        // recursively generate the <li> and <ul> elements for each file
        const generateHTML = (files, level) => {
            
            const elements = [];

            for (const file of files) {

                let ext = file.name.split(".").at(-1).toLowerCase();

                // con is a reserved word in windows so we have to use con_ instead
                ext = ext === "con" ? "con_" : ext; 

                elements.push(`
                    <li draggable="true" data-id="${file.id}" data-container="${file.files && file.files.length > 0 ? "true" : "false"}">
                        <label>
                            <div class="flex-columns">
                                <div class="flex-columns">
                                    ${"<div class=\"ident\"></div>".repeat(level)}
                                </div>
                                <div class="flex">
                                    <input type="checkbox" ${expandedIds[file.id] ? "checked" : ""}>
                                    <div class="caret"></div>
                                </div>
                                <div class="flex-columns flex-gap-small">
                                    <img 
                                        src="res/icons/extentions/${availableIcons.includes(ext) ? ext : "file"}.svg" 
                                        alt="${file.name.split(".").at(-1)}"
                                    >
                                    <span>${file.name}</span>
                                </div>
                            </div>
                        </label>
                    </li>
                `);

                if (file.files && file.files.length > 0) {
                    elements.push(generateHTML(file.files, level + 1));
                }

            }

            return `<ul>${elements.join("\r\n")}</ul>`;

        };

        // replace the content of the list with the newly generated html
        document.getElementById("files").innerHTML = generateHTML(Globals.Files, 0);

        // dispatch input event on the filter field to keep the filter active
        document.getElementById("filter-file-input").dispatchEvent(new Event('input', { bubbles: true }));

    }

});