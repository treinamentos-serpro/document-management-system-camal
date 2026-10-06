const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const express = require('express');
const { once } = require('node:events');
const { mkdtemp, readdir, readFile, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const createDocumentRouter = require('../src/routes/documentRoutes');
const createDocumentService = require('../src/services/documentService');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('contratos HTTP dos documentos', async (context) => {
  const storageDir = await mkdtemp(path.join(tmpdir(), 'dms-test-'));
  const testApp = express();
  testApp.use((req, res, next) => {
    if (req.headers['x-test-user']) req.user = { id: req.headers['x-test-user'] };
    next();
  });
  testApp.use(createDocumentRouter({ storageDir, maxFileSize: 16 }));
  testApp.use(app);
  const server = testApp.listen(0, '127.0.0.1');
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
    await rm(storageDir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  function request(endpoint, options = {}, owner = 'alice') {
    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: owner ? { 'x-test-user': owner } : {},
    });
  }

  function upload(content, field = 'file') {
    const body = new FormData();
    body.append(field, new Blob([content], { type: 'text/plain' }), 'relatorio.txt');
    return { method: 'POST', body };
  }

  let document;
  await context.test('saúde continua disponível', async () => {
    const response = await request('/health', {}, null);
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(await response.json(), { status: 'ok' });
  });

  await context.test('exige identidade antes de gravar arquivos', async () => {
    for (const [endpoint, options] of [
      ['/upload', upload('teste')],
      ['/documents', {}],
      ['/documents/desconhecido/download', {}],
    ]) {
      const response = await request(endpoint, options, null);
      assert.strictEqual(response.status, 401);
      assert.strictEqual((await response.json()).error.code, 'UNAUTHENTICATED');
    }
    assert.deepStrictEqual(await readdir(storageDir), []);
  });

  await context.test('lista vazia inicialmente e rejeita arquivo ausente', async () => {
    const response = await request('/documents');
    assert.deepStrictEqual(await response.json(), []);
    const missing = await request('/upload', { method: 'POST' });
    assert.strictEqual(missing.status, 400);
    assert.strictEqual((await missing.json()).error.code, 'FILE_REQUIRED');
  });

  await context.test('upload grava nome seguro e retorna somente metadados públicos', async () => {
    const response = await request('/upload', upload('conteudo'));
    assert.strictEqual(response.status, 201);
    document = await response.json();
    assert.deepStrictEqual(Object.keys(document).sort(),
      ['id', 'mimeType', 'originalName', 'owner', 'size', 'uploadedAt'].sort());
    assert.strictEqual(document.originalName, 'relatorio.txt');
    assert.strictEqual(document.owner, 'alice');
    assert.strictEqual(document.size, 8);
    assert.strictEqual(document.mimeType, 'text/plain');
    assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
    const files = await readdir(storageDir);
    assert.strictEqual(files.length, 1);
    assert.match(files[0], /^[0-9a-f-]{36}$/);
    assert.strictEqual(await readFile(path.join(storageDir, files[0]), 'utf8'), 'conteudo');
  });

  await context.test('listagem e download respeitam o proprietário', async () => {
    const list = await request('/documents?owner=bob');
    assert.deepStrictEqual(await list.json(), [document]);
    const otherList = await request('/documents?owner=alice', {}, 'bob');
    assert.deepStrictEqual(await otherList.json(), []);
    const response = await request(`/documents/${document.id}/download`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /attachment;.*relatorio.txt/);
    assert.strictEqual(response.headers.get('content-type'), 'application/octet-stream');
    assert.strictEqual(await response.text(), 'conteudo');
    const forbidden = await request(`/documents/${document.id}/download`, {}, 'bob');
    const missing = await request('/documents/desconhecido/download');
    assert.strictEqual(forbidden.status, 404);
    assert.strictEqual(missing.status, 404);
    assert.deepStrictEqual(await forbidden.json(), await missing.json());
  });

  await context.test('limite e campo inválido não deixam arquivos ou metadados', async () => {
    const oversized = await request('/upload', upload('x'.repeat(17)));
    assert.strictEqual(oversized.status, 413);
    assert.strictEqual((await oversized.json()).error.code, 'FILE_TOO_LARGE');
    const invalid = await request('/upload', upload('teste', 'outro'));
    assert.strictEqual(invalid.status, 400);
    assert.strictEqual((await readdir(storageDir)).length, 1);
    const response = await request('/documents');
    assert.deepStrictEqual(await response.json(), [document]);
  });

  await context.test('falha de leitura não expõe caminhos internos', async () => {
    const [storageName] = await readdir(storageDir);
    await rm(path.join(storageDir, storageName));
    const response = await request(`/documents/${document.id}/download`);
    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(await response.json(), {
      error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a solicitação.' },
    });
  });

  await context.test('multipart malformado retorna erro de entrada', async () => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-test-user': 'alice', 'content-type': 'multipart/form-data' },
      body: 'inválido',
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'INVALID_INPUT');
    assert.deepStrictEqual(await readdir(storageDir), []);
  });

  await context.test('falha de gravação não expõe detalhes nem cria metadados', async () => {
    await rm(storageDir, { recursive: true });
    await writeFile(storageDir, 'não é um diretório');
    const response = await request('/upload', upload('teste'));
    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(await response.json(), {
      error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a solicitação.' },
    });
    const list = await request('/documents');
    assert.deepStrictEqual(await list.json(), [document]);
  });
});

test('falha ao salvar metadados remove o arquivo enviado', async () => {
  const failure = new Error('Falha de persistência');
  const removed = [];
  const service = createDocumentService({
    save() { throw failure; },
    async removeFile(storageName) { removed.push(storageName); },
  });
  await assert.rejects(service.upload({ filename: 'arquivo-interno' }, 'alice'),
    (error) => error === failure);
  assert.deepStrictEqual(removed, ['arquivo-interno']);
});
