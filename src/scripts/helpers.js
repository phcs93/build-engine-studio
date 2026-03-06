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
    }

}