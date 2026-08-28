WAV = {

    NormalizeWAV (bytes, targetRmsDb) {

        targetRmsDb = parseFloat(targetRmsDb);

        // =========================================================
        // VALIDAÇÃO DOS PARÂMETROS
        // =========================================================

        if (
            !(bytes instanceof Uint8Array) &&
            !(bytes instanceof ArrayBuffer)
        ) {
            throw new Error(
                "O parâmetro bytes deve ser Uint8Array ou ArrayBuffer."
            );
        }

        if (!Number.isFinite(targetRmsDb)) {
            throw new Error(
                "target_rms_db inválido."
            );
        }


        // =========================================================
        // CRIA UMA CÓPIA DOS BYTES
        // =========================================================

        const data =
            bytes instanceof Uint8Array
                ? new Uint8Array(bytes)
                : new Uint8Array(bytes);


        if (data.length < 12) {

            throw new Error(
                "Arquivo WAV inválido ou corrompido."
            );

        }


        // =========================================================
        // VERIFICA RIFF / WAVE
        // =========================================================

        const riff = String.fromCharCode(
            data[0],
            data[1],
            data[2],
            data[3]
        );

        const wave = String.fromCharCode(
            data[8],
            data[9],
            data[10],
            data[11]
        );


        if (riff !== "RIFF" || wave !== "WAVE") {

            throw new Error(
                "Arquivo WAV inválido."
            );

        }


        // =========================================================
        // DATA VIEW
        // =========================================================

        const view =
            new DataView(
                data.buffer,
                data.byteOffset,
                data.byteLength
            );


        // =========================================================
        // LOCALIZA OS CHUNKS fmt E data
        // =========================================================

        let fmtOffset = -1;
        let dataOffset = -1;
        let dataSize = 0;

        let offset = 12;


        while (offset + 8 <= data.length) {

            const chunkId =
                String.fromCharCode(
                    data[offset],
                    data[offset + 1],
                    data[offset + 2],
                    data[offset + 3]
                );


            const chunkSize =
                view.getUint32(
                    offset + 4,
                    true
                );


            if (chunkId === "fmt ") {

                fmtOffset =
                    offset + 8;

            }


            if (chunkId === "data") {

                dataOffset =
                    offset + 8;

                dataSize =
                    chunkSize;

                break;

            }


            offset += 8 + chunkSize;


            // Chunks WAV são alinhados em 2 bytes
            if (offset % 2 !== 0) {

                offset++;

            }

        }


        if (fmtOffset === -1) {

            throw new Error(
                "Chunk fmt não encontrado."
            );

        }


        if (dataOffset === -1) {

            throw new Error(
                "Chunk data não encontrado."
            );

        }


        if (
            dataOffset < 0 ||
            dataOffset + dataSize > data.length
        ) {

            throw new Error(
                "Chunk data inválido."
            );

        }


        // =========================================================
        // INFORMAÇÕES DO WAV
        // =========================================================

        const audioFormat =
            view.getUint16(
                fmtOffset,
                true
            );


        const channels =
            view.getUint16(
                fmtOffset + 2,
                true
            );


        const blockAlign =
            view.getUint16(
                fmtOffset + 12,
                true
            );


        const bitsPerSample =
            view.getUint16(
                fmtOffset + 14,
                true
            );


        if (audioFormat !== 1) {

            throw new Error(
                "Somente WAV PCM é suportado."
            );

        }


        if (
            bitsPerSample !== 8 &&
            bitsPerSample !== 16 &&
            bitsPerSample !== 24 &&
            bitsPerSample !== 32
        ) {

            throw new Error(
                `WAV ${bitsPerSample}-bit não suportado.`
            );

        }


        if (blockAlign <= 0) {

            throw new Error(
                "BlockAlign inválido."
            );

        }


        if (channels <= 0) {

            throw new Error(
                "Número de canais inválido."
            );

        }


        // =========================================================
        // 1. CALCULA RMS E PEAK
        // =========================================================

        let sumSquares = 0;
        let sampleCount = 0;
        let peak = 0;


        // =========================================================
        // PCM 8-BIT
        // =========================================================

        if (bitsPerSample === 8) {

            for (
                let i = dataOffset;
                i < dataOffset + dataSize;
                i++
            ) {

                const sample =
                    (data[i] - 128) / 128;


                sumSquares +=
                    sample * sample;


                peak =
                    Math.max(
                        peak,
                        Math.abs(sample)
                    );


                sampleCount++;

            }

        }


        // =========================================================
        // PCM 16-BIT
        // =========================================================

        else if (bitsPerSample === 16) {

            for (
                let i = dataOffset;
                i + 1 < dataOffset + dataSize;
                i += 2
            ) {

                const sample =
                    view.getInt16(
                        i,
                        true
                    ) / 32768;


                sumSquares +=
                    sample * sample;


                peak =
                    Math.max(
                        peak,
                        Math.abs(sample)
                    );


                sampleCount++;

            }

        }


        // =========================================================
        // PCM 24-BIT
        // =========================================================

        else if (bitsPerSample === 24) {

            for (
                let i = dataOffset;
                i + 2 < dataOffset + dataSize;
                i += 3
            ) {

                let sample =
                    data[i] |
                    (data[i + 1] << 8) |
                    (data[i + 2] << 16);


                // Converte signed 24-bit
                if (sample & 0x800000) {

                    sample |= 0xff000000;

                }


                sample /= 8388608;


                sumSquares +=
                    sample * sample;


                peak =
                    Math.max(
                        peak,
                        Math.abs(sample)
                    );


                sampleCount++;

            }

        }


        // =========================================================
        // PCM 32-BIT
        // =========================================================

        else if (bitsPerSample === 32) {

            for (
                let i = dataOffset;
                i + 3 < dataOffset + dataSize;
                i += 4
            ) {

                const sample =
                    view.getInt32(
                        i,
                        true
                    ) / 2147483648;


                sumSquares +=
                    sample * sample;


                peak =
                    Math.max(
                        peak,
                        Math.abs(sample)
                    );


                sampleCount++;

            }

        }


        // =========================================================
        // VALIDA RMS
        // =========================================================

        if (sampleCount === 0) {

            throw new Error(
                "Nenhum sample encontrado no WAV."
            );

        }


        const rms =
            Math.sqrt(
                sumSquares / sampleCount
            );


        if (rms === 0) {

            throw new Error(
                "O arquivo WAV está completamente silencioso."
            );

        }


        // =========================================================
        // 2. RMS ATUAL EM dBFS
        // =========================================================

        const currentRmsDb =
            20 * Math.log10(rms);


        // =========================================================
        // 3. CALCULA GANHO
        // =========================================================

        const gainDb =
            targetRmsDb - currentRmsDb;


        let gain =
            Math.pow(
                10,
                gainDb / 20
            );


        // =========================================================
        // 4. APLICA O GANHO
        // =========================================================

        // ---------------------------------------------------------
        // PCM 8-BIT
        // ---------------------------------------------------------

        if (bitsPerSample === 8) {

            for (
                let i = dataOffset;
                i < dataOffset + dataSize;
                i++
            ) {

                let sample =
                    (data[i] - 128) / 128;


                sample *= gain;


                sample =
                    Math.max(
                        -1,
                        Math.min(
                            1,
                            sample
                        )
                    );


                data[i] =
                    Math.round(
                        sample * 128 + 128
                    );

            }

        }


        // ---------------------------------------------------------
        // PCM 16-BIT
        // ---------------------------------------------------------

        else if (bitsPerSample === 16) {

            for (
                let i = dataOffset;
                i + 1 < dataOffset + dataSize;
                i += 2
            ) {

                let sample =
                    view.getInt16(
                        i,
                        true
                    ) / 32768;


                sample *= gain;


                sample =
                    Math.max(
                        -1,
                        Math.min(
                            1,
                            sample
                        )
                    );


                let value =
                    Math.round(
                        sample * 32768
                    );


                value =
                    Math.max(
                        -32768,
                        Math.min(
                            32767,
                            value
                        )
                    );


                view.setInt16(
                    i,
                    value,
                    true
                );

            }

        }


        // ---------------------------------------------------------
        // PCM 24-BIT
        // ---------------------------------------------------------

        else if (bitsPerSample === 24) {

            for (
                let i = dataOffset;
                i + 2 < dataOffset + dataSize;
                i += 3
            ) {

                let sample =
                    data[i] |
                    (data[i + 1] << 8) |
                    (data[i + 2] << 16);


                // Signed 24-bit
                if (sample & 0x800000) {

                    sample |= 0xff000000;

                }


                sample /= 8388608;


                sample *= gain;


                sample =
                    Math.max(
                        -1,
                        Math.min(
                            1,
                            sample
                        )
                    );


                let value =
                    Math.round(
                        sample * 8388608
                    );


                value =
                    Math.max(
                        -8388608,
                        Math.min(
                            8388607,
                            value
                        )
                    );


                // Converte novamente para unsigned 24-bit
                if (value < 0) {

                    value += 0x1000000;

                }


                data[i] =
                    value & 0xff;


                data[i + 1] =
                    (value >> 8) & 0xff;


                data[i + 2] =
                    (value >> 16) & 0xff;

            }

        }


        // ---------------------------------------------------------
        // PCM 32-BIT
        // ---------------------------------------------------------

        else if (bitsPerSample === 32) {

            for (
                let i = dataOffset;
                i + 3 < dataOffset + dataSize;
                i += 4
            ) {

                let sample =
                    view.getInt32(
                        i,
                        true
                    ) / 2147483648;


                sample *= gain;


                sample =
                    Math.max(
                        -1,
                        Math.min(
                            1,
                            sample
                        )
                    );


                let value =
                    Math.round(
                        sample * 2147483648
                    );


                value =
                    Math.max(
                        -2147483648,
                        Math.min(
                            2147483647,
                            value
                        )
                    );


                view.setInt32(
                    i,
                    value,
                    true
                );

            }

        }


        // =========================================================
        // RETORNA O WAV MODIFICADO
        // =========================================================

        return data;

    }

}