import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ onUploaded, disabled = false }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (uploading || disabled) return;
    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    const form = event.currentTarget;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const document = await uploadDocument(file);
      onUploaded(document);
      form.reset();
      setFile(null);
      setMessage(`Arquivo "${document.originalName}" enviado com sucesso.`);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form onSubmit={handleSubmit} aria-busy={uploading}>
        <label htmlFor="document-file">Arquivo</label>
        <div className="upload-controls">
          <input
            id="document-file"
            name="file"
            type="file"
            disabled={disabled || uploading}
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              setError('');
              setMessage('');
            }}
          />
          <button type="submit" disabled={disabled || uploading || !file}>
            {uploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="upload-status" role="status">{message}</p>
      </form>
    </section>
  );
}