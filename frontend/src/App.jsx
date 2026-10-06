import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import SessionForm from './components/SessionForm.jsx';
import { endSession, getSession, listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [sessionVersion, setSessionVersion] = useState(0);
  const [endingSession, setEndingSession] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSessionLoading(true);
    setSessionError('');
    getSession({ signal: controller.signal })
      .then(({ user }) => {
        if (!controller.signal.aborted) setUser(user);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSessionError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionLoading(false);
      });
    return () => controller.abort();
  }, [sessionVersion]);

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
      setDocuments([]);
      setSessionError('Sua sessão expirou. Identifique-se novamente.');
    }
    window.addEventListener('dms:session-expired', handleExpiredSession);
    return () => window.removeEventListener('dms:session-expired', handleExpiredSession);
  }, []);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');

    async function loadDocuments() {
      try {
        const documents = await listDocuments({ signal: controller.signal });
        if (!controller.signal.aborted) setDocuments(documents);
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error.status === 401) setUser(null);
          else setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshVersion, user]);

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  function handleIdentified(user) {
    setDocuments([]);
    setSessionError('');
    setLoading(true);
    setUser(user);
  }

  async function handleEndSession() {
    if (!window.confirm('Encerrar a sessão? Você perderá o acesso aos documentos desta sessão.')) return;
    setEndingSession(true);
    setSessionError('');
    try {
      await endSession();
      setUser(null);
      setDocuments([]);
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setEndingSession(false);
    }
  }

  return (
    <main>
      <header className="app-header">
        <span className="brand">DMS</span>
        <h1>Gestão de documentos</h1>
      </header>
      {sessionLoading && <p role="status">Verificando identificação...</p>}
      {sessionError && (
        <div className="session-error">
          <p className="error" role="alert">{sessionError}</p>
          {!user && (
            <button type="button" className="secondary-button" onClick={() => setSessionVersion((version) => version + 1)}>
              Tentar novamente
            </button>
          )}
        </div>
      )}
      {!sessionLoading && !user && <SessionForm onIdentified={handleIdentified} />}
      {!sessionLoading && user && (
        <>
          <div className="identity-bar">
            <span>Identificado como <strong>{user.name}</strong></span>
            <button type="button" className="secondary-button" onClick={handleEndSession} disabled={endingSession}>
              {endingSession ? 'Saindo...' : 'Sair'}
            </button>
          </div>
          <UploadComponent onUploaded={refreshDocuments} disabled={loading || endingSession} />
          <DocumentList
            documents={documents}
            loading={loading}
            error={error}
            onRefresh={refreshDocuments}
          />
        </>
      )}
    </main>
  );
}
