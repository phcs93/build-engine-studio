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

            this.render();

        };

    }

    render() {

        const generateHTML = files => {
            
            const elements = [];

            for (const file of files) {

                if (file.files && file.files.length > 0) {
                    elements.push(`
                        <li>
                            <label class="debug">
                                <input type="checkbox">
                                <span>${file.name}</span>
                            </label>                            
                        </li>
                    `);
                    elements.push(generateHTML(file.files));
                } else {
                    elements.push(`
                        <li>
                            <span>${file.name}</span>
                        </li>
                    `);
                }

            }

            return `<ul>${elements.join("\r\n")}</ul>`;

        };

        document.getElementById("files").innerHTML = generateHTML(Globals.Files);

    }

});