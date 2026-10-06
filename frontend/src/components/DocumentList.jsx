import DownloadButton from './DownloadButton.jsx';

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  return `${(size / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

export default function DocumentList({ documents, loading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading" aria-busy={loading}>
      <div className="section-heading">
        <h2 id="documents-heading">Meus documentos <span className="document-count">{documents.length}</span></h2>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p role="status">Carregando documentos...</p>}
      {!loading && !error && documents.length === 0 && <p className="empty-state">Nenhum documento enviado.</p>}
      {documents.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Nome</th><th scope="col">Tamanho</th><th scope="col">Enviado em</th><th scope="col">Download</th></tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="document-name">{document.originalName}</td>
                  <td>{formatSize(document.size)}</td>
                  <td><time dateTime={document.uploadedAt}>{new Date(document.uploadedAt).toLocaleString('pt-BR')}</time></td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}