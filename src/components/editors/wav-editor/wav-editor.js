customElements.define("wav-editor", class WavEditor extends HTMLElement {

    constructor() {

        super();

        this.appendChild(
            document.getElementById("wav-editor").content.cloneNode(true)
        );

        this._audioUrl = null;        

    }

    async connectedCallback() {

        try {

            const fileId = this.dataset.fileId;
            const file = Helpers.FindFileById(fileId);

            if (!file || !file.bytes) {
                throw new Error("Arquivo WAV não encontrado");
            }

            this.attachWav(file.bytes);

            const error = this.querySelector("div.error-message");
            if (error) error.remove();

        } catch (err) {

            const audioEl = this.querySelector("audio");
            if (audioEl) audioEl.remove();

            console.error(err);

            const error = this.querySelector("div.error-message");

            if (error) {
                error.textContent = err.message || "Erro ao reproduzir WAV";
            }

        }

    }

    disconnectedCallback() {

        if (this._audioUrl) {
            URL.revokeObjectURL(this._audioUrl);
            this._audioUrl = null;
        }

    }

    attachWav(bytes) {

        const data = bytes instanceof Uint8Array
            ? bytes
            : new Uint8Array(bytes);

        if (data.length < 12) {
            throw new Error("Arquivo WAV inválido ou corrompido");
        }

        // Verifica RIFF
        const riff = String.fromCharCode(
            data[0],
            data[1],
            data[2],
            data[3]
        );

        // Verifica WAVE
        const wave = String.fromCharCode(
            data[8],
            data[9],
            data[10],
            data[11]
        );

        if (riff !== "RIFF" || wave !== "WAVE") {
            throw new Error("Arquivo WAV inválido");
        }

        // Libera a URL anterior, caso o componente seja reutilizado
        if (this._audioUrl) {
            URL.revokeObjectURL(this._audioUrl);
            this._audioUrl = null;
        }

        // Cria o Blob diretamente com o WAV original.
        // Não fazemos conversão nem reamostragem.
        const wavBlob = new Blob(
            [data],
            { type: "audio/wav" }
        );

        const audioUrl = URL.createObjectURL(wavBlob);

        const audioEl = this.querySelector("audio");

        if (!audioEl) {
            throw new Error("Elemento <audio> não encontrado");
        }

        audioEl.src = audioUrl;
        audioEl.load();

        // Autoplay opcional
        audioEl.play().catch(() => {});

        this._audioUrl = audioUrl;

        console.log({
            format: "WAV",
            size: (data.byteLength / 1024).toFixed(1) + " KB"
        });

    }

});