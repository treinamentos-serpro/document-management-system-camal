import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSession, downloadDocument, endSession, getSession, listDocuments, uploadDocument } from '../src/services/documentApi.js';

test('lista documentos pelo prefixo /api e encaminha cancelamento', async (context) => {
  const documents = [{ id: 'document-1', originalName: 'relatorio.txt' }];
  const { signal } = new AbortController();
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.signal, signal);
    assert.equal(options.credentials, 'same-origin');
    return Response.json(documents);
  });
  assert.deepEqual(await listDocuments({ signal }), documents);
});

test('envia arquivo no campo file sem fixar Content-Type multipart', async (context) => {
  const file = new File(['conteudo'], 'relatorio.txt');
  const document = { id: 'document-1', originalName: file.name };
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined);
    assert.equal(options.body.get('file').name, file.name);
    assert.equal(await options.body.get('file').text(), 'conteudo');
    return Response.json(document, { status: 201 });
  });
  assert.deepEqual(await uploadDocument(file), document);
});

test('baixa conteudo binario e codifica o identificador', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/documents/document%2F1/download');
    return new Response(new Uint8Array([0, 255, 42]));
  });
  const blob = await downloadDocument('document/1');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([0, 255, 42]));
});

test('preserva mensagens de erro do backend em todas as operacoes', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { code: 'UNAUTHENTICATED', message: 'Identidade de usuário obrigatória.' },
  }, { status: 401 }));
  for (const operation of [listDocuments, () => uploadDocument(new File([], 'a.txt')), () => downloadDocument('1')]) {
    await assert.rejects(operation, { message: 'Identidade de usuário obrigatória.' });
  }
});

test('trata respostas de erro sem JSON e falhas de rede', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response('Indisponivel', { status: 502 }));
  await assert.rejects(listDocuments, /Nao foi possivel processar/);
  fetchMock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(listDocuments, /Nao foi possivel conectar/);
});

test('preserva AbortError para cancelamento da listagem', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Cancelado', 'AbortError'); });
  await assert.rejects(listDocuments, { name: 'AbortError' });
});

test('cria sessão enviando somente o nome e usando cookies', async (context) => {
  const user = { id: 'server-id', name: 'Ana' };
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/session');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'same-origin');
    assert.deepEqual(JSON.parse(options.body), { name: 'Ana' });
    assert.equal(options.headers['Content-Type'], 'application/json');
    return Response.json({ user }, { status: 201 });
  });
  assert.deepEqual(await createSession('Ana'), { user });
});

test('restaura sessão e encerra sem tentar ler JSON do 204', async (context) => {
  const { signal } = new AbortController();
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/session');
    assert.equal(options.credentials, 'same-origin');
    if (options.method === 'DELETE') return new Response(null, { status: 204 });
    assert.equal(options.signal, signal);
    return Response.json({ user: null });
  });
  assert.deepEqual(await getSession({ signal }), { user: null });
  await endSession();
});

test('erros preservam status para detectar sessão expirada', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { message: 'Identidade obrigatória.' },
  }, { status: 401 }));
  await assert.rejects(listDocuments, { status: 401, message: 'Identidade obrigatória.' });
});

test('avisa a interface quando a sessão expira em qualquer operação', async (context) => {
  const browser = new EventTarget();
  const events = [];
  browser.addEventListener('dms:session-expired', (event) => events.push(event.type));
  globalThis.window = browser;
  context.after(() => { delete globalThis.window; });
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { message: 'Sessão expirada.' },
  }, { status: 401 }));
  for (const operation of [listDocuments, () => uploadDocument(new File([], 'a.txt')), () => downloadDocument('1')]) {
    await assert.rejects(operation, { status: 401 });
  }
  assert.equal(events.length, 3);
});