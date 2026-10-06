import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    let url;
    let link;
    try {
      const blob = await downloadDocument(document.id);
      url = URL.createObjectURL(blob);
      link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
    } catch (error) {
      setError(error.message);
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        type="button"
        className="secondary-button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`Baixar ${document.originalName}`}
        aria-busy={downloading}
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}