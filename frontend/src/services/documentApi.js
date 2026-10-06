async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Nao foi possivel conectar ao servidor. Tente novamente.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dms:session-expired'));
    }
    const error = new Error(body?.error?.message || 'Nao foi possivel processar a solicitacao.');
    error.status = response.status;
    throw error;
  }

  return response;
}

export async function getSession({ signal } = {}) {
  const response = await request('/session', { signal });
  return response.json();
}

export async function createSession(name) {
  const response = await request('/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return response.json();
}

export async function endSession() {
  await request('/session', { method: 'DELETE' });
}

export async function listDocuments({ signal } = {}) {
  const response = await request('/documents', { signal });
  return response.json();
}

export async function uploadDocument(file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}