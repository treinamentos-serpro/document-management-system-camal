function createSessionRepository() {
  const sessions = new Map();

  return {
    save(token, session) {
      for (const [storedToken, storedSession] of sessions) {
        if (storedSession.expiresAt <= Date.now()) sessions.delete(storedToken);
      }
      sessions.set(token, session);
    },
    findByToken(token) {
      const session = sessions.get(token);
      if (session && session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return undefined;
      }
      return session;
    },
    remove(token) {
      sessions.delete(token);
    },
  };
}

module.exports = createSessionRepository;