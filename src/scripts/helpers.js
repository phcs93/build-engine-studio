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
                            if (file.isStorageType && file.expanded) {
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
        
    },

    GetEditorComponentByFileType(extension) {
        
    }

}