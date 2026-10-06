const multer = require('multer');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function requireIdentity(req, res, next) {
  if (typeof req.user?.id !== 'string' || !req.user.id.trim()) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Identidade de usuário obrigatória.');
  }
  next();
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_INPUT', 'JSON inválido.');
  }
  if (error.code === 'DOCUMENT_NOT_FOUND') {
    return sendError(res, 404, error.code, 'Documento não encontrado.');
  }
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'FILE_TOO_LARGE', 'Arquivo excede o limite permitido.');
    }
    return sendError(res, 400, 'INVALID_INPUT', 'Upload inválido.');
  }
  if (['Multipart: Boundary not found', 'Unexpected end of form',
    'Unexpected end of file', 'Malformed part header'].includes(error.message)) {
    return sendError(res, 400, 'INVALID_INPUT', 'Upload inválido.');
  }
  return sendError(res, 500, 'INTERNAL_ERROR', 'Não foi possível processar a solicitação.');
}

function createDocumentController(service) {
  return {
    async upload(req, res) {
      if (!req.file) {
        return sendError(res, 400, 'FILE_REQUIRED', 'Arquivo obrigatório.');
      }
      const document = await service.upload(req.file, req.user.id);
      res.status(201).json(document);
    },
    list(req, res) {
      res.json(service.list(req.user.id));
    },
    download(req, res, next) {
      const document = service.download(req.params.id, req.user.id);
      res.type('application/octet-stream');
      res.download(document.filePath, document.originalName, (error) => {
        if (error) next(error);
      });
    },
  };
}

module.exports = { createDocumentController, requireIdentity, handleError };