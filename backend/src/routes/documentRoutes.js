const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const createDocumentRepository = require('../repositories/documentRepository');
const createDocumentService = require('../services/documentService');
const {
  createDocumentController,
  requireIdentity,
  handleError,
} = require('../controllers/documentController');

function createDocumentRouter({
  storageDir = process.env.DMS_STORAGE_DIR || path.resolve(__dirname, '../../storage'),
  maxFileSize = Number(process.env.DMS_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024),
} = {}) {
  if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
    throw new Error('DMS_MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  const repository = createDocumentRepository(path.resolve(storageDir));
  const controller = createDocumentController(createDocumentService(repository));
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        repository.prepareStorage().then(
          () => callback(null, path.resolve(storageDir)),
          (error) => callback(error),
        );
      },
      filename(req, file, callback) {
        callback(null, randomUUID());
      },
    }),
    limits: { fileSize: maxFileSize, files: 1 },
  });

  const router = express.Router();
  router.post('/upload', requireIdentity, upload.single('file'), controller.upload);
  router.get('/documents', requireIdentity, controller.list);
  router.get('/documents/:id/download', requireIdentity, controller.download);
  router.use(handleError);
  return router;
}

module.exports = createDocumentRouter;