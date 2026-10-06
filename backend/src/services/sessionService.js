const { randomBytes, randomUUID } = require('node:crypto');

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function createSessionService(repository) {
  return {
    create(name) {
      const token = randomBytes(32).toString('hex');
      const user = { id: randomUUID(), name };
      repository.save(token, { user, expiresAt: Date.now() + SESSION_MAX_AGE_MS });
      return { token, user };
    },
    findUser(token) {
      return repository.findByToken(token)?.user;
    },
    remove(token) {
      repository.remove(token);
    },
  };
}

module.exports = { createSessionService, SESSION_MAX_AGE_MS };