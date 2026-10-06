import { useState } from 'react';
import { createSession } from '../services/documentApi.js';

export default function SessionForm({ onIdentified }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { user } = await createSession(name.trim());
      onIdentified(user);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="identity-section" aria-labelledby="identity-heading">
      <h2 id="identity-heading">Identificacao</h2>
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <label htmlFor="user-name">Seu nome</label>
        <div className="identity-controls">
          <input
            id="user-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
            required
            value={name}
            disabled={submitting}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Identificando...' : 'Continuar'}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </section>
  );
}