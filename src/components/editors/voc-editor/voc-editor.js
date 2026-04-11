const ffmpegPath = require("ffmpeg-static");
const { spawn } = require("child_process");

customElements.define("voc-editor", class VocEditor extends HTMLElement {

    constructor() {
        super();
        this.appendChild(document.getElementById("voc-editor").content.cloneNode(true));
    }

    async connectedCallback() {

        try {
            
            const fileId = this.dataset.fileId;
            const vocBytes = Helpers.FindFileById(fileId).bytes;

            const wavBuffer = await this.vocToWav(vocBytes);

            const blob = new Blob([wavBuffer], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);

            this.querySelector("div.error-message").remove();
            const audio = this.querySelector("audio");

            audio.src = url;

        } catch (err) {
            this.querySelector("audio").remove();
            this.querySelector("div.error-message").textContent = err.message;
        }

    }

    vocToWav(uint8Array) {

        return new Promise((resolve, reject) => {

            const output = [];

            const ffmpeg = spawn(ffmpegPath, [
                "-i", "pipe:0",
                "-c:a", "pcm_s16le",
                "-ar", "48000",
                "-ac", "1",
                "-f", "wav",
                "pipe:1"
            ], {
                windowsHide: true
            });

            const chunks = [];

            ffmpeg.stdout.on("data", (chunk) => {
                chunks.push(chunk);
            });

            ffmpeg.stderr.on("data", (data) => {
                output.push(data.toString());
            });

            ffmpeg.on("error", (err) => {                
                reject(new Error(`FFmpeg error: ${err.message}\r\n` + output.join("\r\n")));
            });

            ffmpeg.on("close", (code) => {
                if (code !== 0) {
                    reject(new Error(`FFmpeg exited with code ${code}\r\n` + output.join("\r\n")));
                } else {
                    resolve(Buffer.concat(chunks));
                }
            });

            ffmpeg.stdin.write(Buffer.from(uint8Array));
            ffmpeg.stdin.end();

        });

    }

});