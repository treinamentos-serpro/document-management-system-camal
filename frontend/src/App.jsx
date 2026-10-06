import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    async function loadDocuments() {
      try {
        const documents = await listDocuments({ signal: controller.signal });
        if (!controller.signal.aborted) setDocuments(documents);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshVersion]);

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <main>
      <header className="app-header">
        <span className="brand">DMS</span>
        <h1>Gestão de documentos</h1>
      </header>
      <UploadComponent onUploaded={refreshDocuments} disabled={loading} />
      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </main>
  );
}
