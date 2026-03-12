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

        // right click file event (context menu)
        document.getElementById("files").addEventListener("contextmenu", event => {

            event.preventDefault();

            if (event.target.tagName.toLowerCase() === "li" || event.target.closest("li")) {            

                const li = event.target.tagName.toLowerCase() === "li" ? event.target : event.target.closest("li");
                
                const fileId = li.dataset.id;
                
                const template = [
                    {
                        label: "Export File",
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

        // helper function to handle extension icon file name
        const getIconFileName = extension => {

            const iconFiles = fs.readdirSync("res/icons/extentions").map(file => file.split(".")[0].toLowerCase());

            if (iconFiles.includes(extension)) {
                if (extension === "con") {
                    return "con_";
                } else {
                    return extension;
                }
            } else {
                return "file";
            }  
            
        };

        // recursively generate the <li> and <ul> elements for each file
        const generateHTML = (files, level) => {
            
            const elements = [];

            for (const file of files) {

                elements.push(`
                    <li draggable="true" 
                        data-id="${file.id}" 
                        data-storage="${file.isStorageType}"
                        data-selected="${file.selected}"
                        data-expanded="${file.expanded}"
                        data-open="${file.open}"
                        data-saved="${file.saved}"
                        >
                        <div class="flex-columns flex-gap-small">
                            ${"<div class=\"ident\"></div>".repeat(level)}
                            <div class="caret"></div>
                            <img src="res/icons/extentions/${getIconFileName(file.extension)}.svg" alt="${file.extension}">                            
                            <span>${file.name}</span>
                        </div>
                    </li>
                `);

                if (file.isStorageType) {
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