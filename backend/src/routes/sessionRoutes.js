const express = require('express');
const createSessionRepository = require('../repositories/sessionRepository');
const { createSessionService } = require('../services/sessionService');
const createSessionController = require('../controllers/sessionController');

function createSessionRouter() {
  const controller = createSessionController(createSessionService(createSessionRepository()));
  const router = express.Router();
  router.use(controller.resolveIdentity);
  router.post('/session', controller.create);
  router.get('/session', controller.current);
  router.delete('/session', controller.remove);
  return router;
}

module.exports = createSessionRouter;