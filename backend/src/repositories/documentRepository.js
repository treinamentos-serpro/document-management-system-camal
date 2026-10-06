const { mkdir, unlink } = require('node:fs/promises');
const path = require('node:path');

function createDocumentRepository(storageDir) {
  const documents = new Map();

  return {
    prepareStorage() {
      return mkdir(storageDir, { recursive: true });
    },
    save(document) {
      documents.set(document.id, document);
      return document;
    },
    findByOwner(owner) {
      return [...documents.values()].filter((document) => document.owner === owner);
    },
    findById(id) {
      return documents.get(id);
    },
    getFilePath(storageName) {
      return path.join(storageDir, storageName);
    },
    async removeFile(storageName) {
      try {
        await unlink(path.join(storageDir, storageName));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    },
  };
}

module.exports = createDocumentRepository;