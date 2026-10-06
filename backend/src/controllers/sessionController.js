const { SESSION_MAX_AGE_MS } = require('../services/sessionService');

function createSessionController(service) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  return {
    resolveIdentity(req, res, next) {
      const token = req.headers.cookie?.match(/(?:^|;\s*)dms_session=([a-f0-9]{64})(?:;|$)/)?.[1];
      const user = token && service.findUser(token);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      }
      next();
    },
    create(req, res) {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!req.is('application/json') || !name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) {
        return res.status(400).json({
          error: { code: 'INVALID_INPUT', message: 'Informe um nome válido de até 80 caracteres.' },
        });
      }
      const session = service.create(name);
      if (req.sessionToken) service.remove(req.sessionToken);
      res.cookie('dms_session', session.token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
      res.status(201).json({ user: session.user });
    },
    current(req, res) {
      res.set('Cache-Control', 'no-store');
      res.json({ user: req.sessionToken ? req.user : null });
    },
    remove(req, res) {
      if (req.sessionToken) service.remove(req.sessionToken);
      res.clearCookie('dms_session', cookieOptions);
      res.status(204).end();
    },
  };
}

module.exports = createSessionController;