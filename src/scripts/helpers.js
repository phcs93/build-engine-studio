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
        const recursiveMoveFile = (files) => {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.id === toFileId) {
                    const fromFile = JSON.parse(JSON.stringify(Helpers.FindFileById(fromFileId)));
                    this.DeleteFileById(fromFileId);
                    switch (position) {
                        case "before": {
                            console.log("move", fromFile.name, " to ", position, file.name);
                            files.splice(i, 0, fromFile);
                            break;
                        }
                        case "after": {
                            console.log("move", fromFile.name, " to ", position, file.name);
                            files.splice(i + 1, 0, fromFile);
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
    }

}