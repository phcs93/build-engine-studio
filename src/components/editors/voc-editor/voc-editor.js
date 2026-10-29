customElements.define("voc-editor", class VocEditor extends HTMLElement {

    constructor() {

        super();

        this.appendChild(
            document.getElementById("voc-editor").content.cloneNode(true)
        );

        this.audioContext = null;
        this.source = null;
        this._audioUrl = null;

    }

    async connectedCallback() {

        try {

            const fileId = this.dataset.fileId;
            const vocBytes = Helpers.FindFileById(fileId).bytes;

            const voc = this.parseVoc(vocBytes);

            this.attachVoc(voc);

            const error = this.querySelector("div.error-message");
            if (error) error.remove();

        } catch (err) {

            this.querySelector("audio").remove();

            console.error(err);

            const error = this.querySelector("div.error-message");

            if (error) {
                error.textContent = err.message || "Erro ao reproduzir VOC";
            }

        }

    }

    disconnectedCallback() {

        if (this.source) {
            try { this.source.stop(); } catch {}
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this._audioUrl) {
            URL.revokeObjectURL(this._audioUrl);
            this._audioUrl = null;
        }

    }

    parseVoc(uint8Array) {

        const data = uint8Array instanceof Uint8Array
            ? uint8Array
            : new Uint8Array(uint8Array);

        if (data.length < 26) {
            throw new Error("Invalid VOC");
        }

        if (data[19] !== 26 || data[20] !== 26 || data[21] !== 0) {
            throw new Error("Invalid VOC header");
        }

        let codec = -1;
        let sampleRate = 8000;
        let channels = 1;
        let bitsPerSample = 8;

        const pcmChunks = [];

        let i = 26;
        const e = data.length;

        while (i < e) {
            const blockType = data[i];
            const blockSize = data[i + 1] | (data[i + 2] << 8) | (data[i + 3] << 16);
            i += 4;

            if (blockType === 0) break;
            if (i + blockSize > e) throw new Error("VOC truncated");

            switch (blockType) {
                case 1: { // Sound data
                    const timeConstant = data[i];
                    const blockCodec = data[i + 1];

                    if (codec !== -1 && codec !== blockCodec) {
                        throw new Error("Multiple codecs not supported");
                    }

                    codec = blockCodec;
                    sampleRate = Math.floor(1000000 / (256 - timeConstant));

                    if (codec === 0) bitsPerSample = 8;
                    else if (codec === 4) bitsPerSample = 16;
                    else throw new Error(`Unsupported VOC codec ${codec}`);

                    pcmChunks.push(data.slice(i + 2, i + blockSize));
                    break;
                }

                case 2: { // Continuation
                    pcmChunks.push(data.slice(i, i + blockSize));
                    break;
                }

                case 9: { // New format (Creative)
                    sampleRate = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24);
                    bitsPerSample = data[i + 4];
                    channels = data[i + 5];
                    codec = data[i + 6] | (data[i + 7] << 8);

                    if (codec !== 0 && codec !== 4) {
                        throw new Error(`Unsupported VOC codec ${codec}`);
                    }

                    pcmChunks.push(data.slice(i + 12, i + blockSize));
                    break;
                }
            }

            i += blockSize;
        }

        let totalSize = 0;
        for (const chunk of pcmChunks) totalSize += chunk.length;

        const pcmData = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of pcmChunks) {
            pcmData.set(chunk, offset);
            offset += chunk.length;
        }

        return { codec, sampleRate, channels, bitsPerSample, pcmData };
    }

    upsampleNearest8bitMono(pcmData, srcRate, dstRate) {
        const ratio = dstRate / srcRate;
        const outLength = Math.floor(pcmData.length * ratio);
        const out = new Float32Array(outLength);

        for (let i = 0; i < outLength; i++) {
            const srcIndex = Math.floor(i / ratio);
            out[i] = (pcmData[srcIndex] - 128) / 128;
        }
        return out;
    }

    upsampleNearest16bitMono(pcmData, srcRate, dstRate) {
        const view = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
        const sampleCount = pcmData.length >> 1;
        const ratio = dstRate / srcRate;
        const outLength = Math.floor(sampleCount * ratio);
        const out = new Float32Array(outLength);

        for (let i = 0; i < outLength; i++) {
            const srcIndex = Math.floor(i / ratio);
            const sample = view.getInt16(srcIndex * 2, true);
            out[i] = sample / 32768;
        }
        return out;
    }

    createWavBlob(samples, sampleRate = 48000) {
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);
        const dataSize = samples.length * (bitsPerSample / 8);

        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // RIFF
        this.writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + dataSize, true);
        this.writeString(view, 8, "WAVE");

        // fmt
        this.writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);

        // data
        this.writeString(view, 36, "data");
        view.setUint32(40, dataSize, true);

        // Float32 -> PCM16
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: "audio/wav" });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    attachVoc(voc) {
        const { codec, sampleRate, channels, bitsPerSample, pcmData } = voc;

        if (channels !== 1) {
            throw new Error("Only mono VOC supported");
        }

        const outputRate = 48000;

        let samples;

        if (codec === 0) {
            samples = this.upsampleNearest8bitMono(pcmData, sampleRate, outputRate);
        } else if (codec === 4) {
            samples = this.upsampleNearest16bitMono(pcmData, sampleRate, outputRate);
        } else {
            throw new Error(`Unsupported codec ${codec}`);
        }

        const wavBlob = this.createWavBlob(samples, outputRate);
        const audioUrl = URL.createObjectURL(wavBlob);

        const audioEl = this.querySelector("audio");
        if (audioEl) {
            audioEl.src = audioUrl;
            audioEl.play().catch(() => {}); // autoplay opcional
        }

        this._audioUrl = audioUrl;
        
    }

});