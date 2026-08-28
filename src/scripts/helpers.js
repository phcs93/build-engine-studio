const fs = require("fs");

Helpers = {

    FindFileById(id) {
        const recursiveFindFileById = (files, id) => {
            for (const file of files) {
                if (file.id === id) {
                    return file;
                }
                if (file.files) {
                    const found = recursiveFindFileById(file.files, id);
                    if (found) {
                        return found;
                    }
                }
            }
        };
        return recursiveFindFileById(Globals.Files, id);
    },

    DeleteFileById(id) {
        const recursiveDeleteFileById = (files, id) => {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.id === id) {
                    files.splice(i, 1);
                    return;
                }
                if (file.files) {
                    recursiveDeleteFileById(file.files, id);
                }
            }
        };
        recursiveDeleteFileById(Globals.Files, id);
    },

    MoveFileById(fromFileId, position, toFileId) {

        const fromFile = Helpers.FindFileById(fromFileId);

        // abort if file not found
        if (!fromFile) return;

        // block moving to inside itself
        if (fromFileId === toFileId) return;

        // block moving to inside a descendant
        if (this.IsDescendant(fromFile, toFileId)) return;

        const recursiveMoveFile = (files) => {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.id === toFileId) {                    
                    this.DeleteFileById(fromFileId);
                    switch (position) {
                        case "before": {
                            files.splice(i, 0, fromFile);
                            break;
                        }
                        case "after": {
                            // special case for when moving a file to inside a container
                            if (file.isStorage && file.expanded) {
                                file.files.splice(0, 0, fromFile);
                            } else {
                                files.splice(i + 1, 0, fromFile);
                            }
                            break;
                        }
                    }
                    return;
                }
                if (file.files) {
                    recursiveMoveFile(file.files);
                }
            }
        };

        recursiveMoveFile(Globals.Files);

    },

    IsDescendant(parent, targetId) {

        if (!parent.files) return false;

        for (const file of parent.files) {
            if (file.id === targetId) {
                return true;
            }
            if (this.IsDescendant(file, targetId)) {
                return true;
            }
        }

        return false;

    },

    TrimString(string) {
        return string.replace(/\x00/g, "");
    },

    GetIconFileName(extension) {

        const iconFiles = fs.readdirSync("res/icons/extentions").map(file => file.split(".")[0].toUpperCase());

        if (iconFiles.includes(extension)) {
            if (extension === "CON") {
                return "con_";
            } else {
                return extension.toLowerCase();
            }
        } else {
            return "file";
        }  
        
    },

    IsStorageFile(extension) {
        return [ "GRP", "PK3", "RFF", "SSI", "WAD", "RTS" ].includes(extension.toUpperCase());
    },

    DetermineFileType (name, bytes) {

        const extension = name.split(".").at(-1).toUpperCase();

        if (name.indexOf(".") >= 0) {

            // if file has extension, check if it is an ambiguous type (like some DATs that are actually GRPs for example)
            switch (extension) {
                case "DAT": {

                    // check if it is a GRP
                    const signature = Array.from(bytes.slice(0, 12)).map(c => String.fromCharCode(c)).join("");
                    if (signature === "KenSilverman") {
                        return "GRP";
                    }

                    // we may need to differentiate between PALETTE.DAT and LOOKUP.DAT
                    // and also don't forget about .PAL and .RAW
                    // oh boy
                    return extension;

                }
                default: return extension;
            }

        } else {

            // if file has no extension, check for some known signatures
            let signature = null;

            // check is file is a VOC (usually RTS files contain VOC files named without an extension)
            signature = Array.from(bytes.slice(0, 19)).map(c => String.fromCharCode(c)).join("");
            if (signature === "Creative Voice File") {
                return "VOC";
            }

            // check if file is a WAV
            signature = Array.from(bytes.slice(0, 4)).map(c => String.fromCharCode(c)).join("");
            if (signature === "RIFF") {
                return "WAV";
            }

            return null;

        }

        
    }

}