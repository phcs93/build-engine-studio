const crypto = require("crypto");

class FileEntry {

    constructor(name, bytes) {

        this.id = crypto.randomUUID();
        this.name = Helpers.TrimString(name);

        this.selected = false;
        this.expanded = false;
        this.open = false;
        this.saved = true;

        this.type = Helpers.DetermineFileType(this.name, bytes);

        this.isStorage = this.type && Helpers.IsStorageFile(this.type);

        if (this.isStorage) {

            // unserialize the storage instance from the bytes of the file entry
            this.instance = new Build.Models.Storage(bytes);

            // we create entries for each file and store their bytes
            this.files = this.instance.Files.map(f => new FileEntry(f.name, f.bytes));

            // here we erase the individual file bytes from the storage instance so we don't waste memory
            this.instance.Files = [];

        } else {

            // if file is not a storage type, just store its bytes
            this.bytes = bytes;

        }

    }

    Serialize() {

        if (this.isStorage) {

            // transform file entries back into the format needed for the storage instance
            this.instance.Files = this.files.map(f => ({ name: f.name, bytes: f.Serialize()}));

            // serialize the storage instance into bytes
            const serialized = this.instance.Serialize();

            // clear to save memory
            this.instance.Files = [];

            // return the serialized bytes of the storage instance
            return serialized;

        } else {

            // if file is not a storage type, just return stored bytes
            return this.bytes;

        }

    }

}