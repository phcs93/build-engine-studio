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
                    const fromFile = structuredClone(Helpers.FindFileById(fromFileId));
                    this.DeleteFileById(fromFileId);
                    switch (position) {
                        case "before": {
                            files.splice(i, 0, fromFile);
                            break;
                        }
                        case "after": {
                            // special case for when moving a file to inside a container
                            if (file.files) {
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

    IsFileStorageType(extension) {        
        return Object.values(Build.Enums.StorageType).includes(extension);
    },

    GetFileBytesById(id) {

        const recursiveIterateFiles = (file) => {

            const extension = file.name.split(".").at(-1).toUpperCase();

            // check if file is a storage type because we have to get the bytes of the individual file entries and put them back into the instance
            if (Helpers.IsFileStorageType(extension)) {
                file.instance.Files = file.files.map(f => {
                    const bytes = recursiveIterateFiles(f);
                    return { name: f.name, bytes: bytes };
                });
                const serialized = Build.Models.Storage.Serialize(file.instance);
                file.instance.Files = []; // clear to save memory
                return serialized;
            } else {
                return file.bytes;
            }

        };

        const file = Helpers.FindFileById(id);
        const bytes = recursiveIterateFiles(file);

        return bytes;

    }

}