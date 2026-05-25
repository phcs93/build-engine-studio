customElements.define("art-editor", class ArtEditor extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("art-editor").content.cloneNode(true));
    }

    connectedCallback() {

        const fs = require("fs");

        // load default palette (duke nukem 3d)
        this.colors = JSON.parse(fs.readFileSync("res/palettes/duke-nukem-3d.json"));
        // render transparency indexes and trasparent by default
        this.transparency = true;

        // change palette event
        this.querySelector("select.palette-select").onchange = e => {
            this.colors = JSON.parse(fs.readFileSync(`res/palettes/${e.target.value}.json`));
            this.render();
        };

        // change grid size
        this.querySelector("input.grid-size-range").oninput = e => {
            this.querySelector("label.grid-size-label").innerHTML = e.target.value + " px";
            this.style.setProperty("--grid-size", `${e.target.value}px`);
        };

        // toggle transparency
        this.querySelector("input.transparency").onchange = e => {
            this.transparency = e.target.checked;
            this.render();
        };

        // render tile grid
        this.render();

    }

    render() {

        const file = Helpers.FindFileById(this.dataset.fileId);

        const art = new Build.Models.Art(file.bytes);

        const grid = this.querySelector("div.grid");

        grid.innerHTML = null;

        for (let t = 0; t < art.Tiles.length; t++) {

            const tile = art.Tiles[t].pixels;
            
            const canvas = document.createElement("canvas");

            if (tile.length > 0) {

                canvas.width = tile.length;
                canvas.height = tile[0].length;

                canvas.setAttribute("title", `#${art.Start + t} [${tile.length}x${tile[0].length}]`);

                const context = canvas.getContext("2d");
                const data = context.createImageData(tile.length, tile[0].length);

                for (let x = 0; x < tile.length; x++) {     
                    for (let y = 0; y < tile[0].length; y++) {                                       
                        const index = tile[x][y];
                        const color = this.colors[index];
                        const i = x + y * tile.length;
                        data.data[i * 4 + 0] = color[0];
                        data.data[i * 4 + 1] = color[1];
                        data.data[i * 4 + 2] = color[2];
                        data.data[i * 4 + 3] = this.transparency ? (index === 255 ? 0 : 255) : 255;
                    }
                }

                context.putImageData(data, 0, 0);

            } else {
                
            }

            grid.appendChild(canvas);

        }

    }

});