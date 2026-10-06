const { randomUUID } = require('node:crypto');

function publicMetadata(document) {
  const { storageName, ...metadata } = document;
  return metadata;
}

function createDocumentService(repository) {
  return {
    async upload(file, owner) {
      try {
        const document = repository.save({
          id: randomUUID(),
          originalName: file.originalname,
          storageName: file.filename,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString(),
          owner,
        });
        return publicMetadata(document);
      } catch (error) {
        await repository.removeFile(file.filename);
        throw error;
      }
    },
    list(owner) {
      return repository.findByOwner(owner).map(publicMetadata);
    },
    download(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) {
        const error = new Error('Documento não encontrado.');
        error.code = 'DOCUMENT_NOT_FOUND';
        throw error;
      }
      return {
        filePath: repository.getFilePath(document.storageName),
        originalName: document.originalName,
      };
    },
  };
}

module.exports = createDocumentService;