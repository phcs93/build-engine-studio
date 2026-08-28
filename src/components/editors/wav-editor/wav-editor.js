// ============================================================
// WAV EDITOR
// ============================================================

customElements.define("wav-editor", class WavEditor extends HTMLElement {

    constructor() {

        super();

        this.appendChild(
            document
                .getElementById("wav-editor")
                .content
                .cloneNode(true)
        );

        // URL temporária usada pelo elemento <audio>
        this._audioUrl = null;

        // Bytes do WAV atualmente carregado
        this._wavBytes = null;

        // Referência ao arquivo original
        this._file = null;

    }


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    async connectedCallback() {

        try {

            const fileId = this.dataset.fileId;

            const file =
                Helpers.FindFileById(fileId);


            if (!file || !file.bytes) {

                throw new Error(
                    "Arquivo WAV não encontrado"
                );

            }


            // Guarda a referência do arquivo
            this._file = file;


            // Carrega e reproduz o WAV
            this.attachWav(file.bytes);


            // Remove mensagem de erro, se existir
            const error =
                this.querySelector(
                    "div.error-message"
                );


            if (error) {
                error.remove();
            }


        } catch (err) {

            // Remove o player em caso de erro
            const audioEl =
                this.querySelector("audio");


            if (audioEl) {
                audioEl.remove();
            }


            console.error(err);


            // Exibe o erro
            const error =
                this.querySelector(
                    "div.error-message"
                );


            if (error) {

                error.textContent =
                    err.message ||
                    "Erro ao reproduzir WAV";

            }

        }

    }


    // =========================================================
    // DESTRUIÇÃO
    // =========================================================

    disconnectedCallback() {

        this.revokeAudioUrl();

    }


    // =========================================================
    // CARREGA O WAV
    // =========================================================

    attachWav(bytes) {

        // -----------------------------------------------------
        // Converte para Uint8Array
        // -----------------------------------------------------

        const data =
            bytes instanceof Uint8Array
                ? bytes
                : new Uint8Array(bytes);


        // -----------------------------------------------------
        // Validação básica
        // -----------------------------------------------------

        if (data.length < 12) {

            throw new Error(
                "Arquivo WAV inválido ou corrompido"
            );

        }


        // -----------------------------------------------------
        // Verifica RIFF
        // -----------------------------------------------------

        const riff =
            String.fromCharCode(
                data[0],
                data[1],
                data[2],
                data[3]
            );


        // -----------------------------------------------------
        // Verifica WAVE
        // -----------------------------------------------------

        const wave =
            String.fromCharCode(
                data[8],
                data[9],
                data[10],
                data[11]
            );


        if (
            riff !== "RIFF" ||
            wave !== "WAVE"
        ) {

            throw new Error(
                "Arquivo WAV inválido"
            );

        }


        // -----------------------------------------------------
        // Guarda uma cópia dos bytes
        // -----------------------------------------------------

        this._wavBytes =
            new Uint8Array(data);


        // -----------------------------------------------------
        // Remove URL anterior
        // -----------------------------------------------------

        this.revokeAudioUrl();


        // -----------------------------------------------------
        // Cria Blob do WAV
        // -----------------------------------------------------

        const wavBlob =
            new Blob(
                [this._wavBytes],
                {
                    type: "audio/wav"
                }
            );


        // -----------------------------------------------------
        // Cria URL para reprodução
        // -----------------------------------------------------

        const audioUrl =
            URL.createObjectURL(
                wavBlob
            );


        // -----------------------------------------------------
        // Localiza elemento <audio>
        // -----------------------------------------------------

        const audioEl =
            this.querySelector(
                "audio"
            );


        if (!audioEl) {

            // Libera a URL caso não exista player
            URL.revokeObjectURL(audioUrl);


            throw new Error(
                "Elemento <audio> não encontrado"
            );

        }


        // -----------------------------------------------------
        // Configura o player
        // -----------------------------------------------------

        audioEl.src = audioUrl;

        audioEl.load();


        // -----------------------------------------------------
        // Guarda a URL atual
        // -----------------------------------------------------

        this._audioUrl =
            audioUrl;


        // -----------------------------------------------------
        // Reproduz automaticamente
        // -----------------------------------------------------

        audioEl
            .play()
            .catch(() => {});

    }


    // =========================================================
    // LIBERA URL DO ÁUDIO
    // =========================================================

    revokeAudioUrl() {

        if (!this._audioUrl) {
            return;
        }


        URL.revokeObjectURL(
            this._audioUrl
        );


        this._audioUrl = null;

    }

});