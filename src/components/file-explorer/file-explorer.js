customElements.define("file-explorer", class FileExplorer extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("file-explorer").content.cloneNode(true));
    }

    connectedCallback() {

        document.getElementById("open-file-button").onchange = async event => {

            await Promise.all(Array.from(event.target.files).map(file => new Promise(resolve => {

                const reader = new FileReader();

                reader.onload = () => {
                    
                    const extension = file.name.split(".").at(-1).toUpperCase();

                    Globals.Files.push({
                        name: file.name,
                        bytes: new Uint8Array(reader.result)
                    });

                    // check if file is a storage type so we can list its files
                    if (["GRP", "RFF", "PK3", "SSI"].some(ext => ext === extension)) {
                        const storage = Build.Models.Storage.Unserialize(Globals.Files[Globals.Files.length-1].bytes);
                        Globals.Files[Globals.Files.length-1].files = storage.Files.map(f => ({
                            name: f.name,
                            bytes: f.bytes
                        }));
                    }

                    resolve();

                };

                reader.readAsArrayBuffer(file);

            })));

            // reset value so that the same file can be selected again if needed
            event.target.value = "";

            this.render();

        };

    }

    render() {

        const generateHTML = (files, level) => {
            
            const elements = [];

            for (const file of files) {

                elements.push(`
                    <li>
                        <label>
                            <div class="flex-columns">
                                <div>
                                    ${"<div class=\"ident\"></div>".repeat(level)}
                                </div>
                                <div class="flex">
                                    <input type="checkbox">
                                    <div class="caret"></div>
                                </div>
                                <div>
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

        document.getElementById("files").innerHTML = generateHTML(Globals.Files, 0);

    }

});