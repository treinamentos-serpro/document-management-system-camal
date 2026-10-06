# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem documentos armazenados no filesystem local da aplicação, mantendo os metadados em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos, um arquivo por requisição.
- Listagem de documentos associados ao usuário identificado na requisição.
- Download de documento pelo identificador, respeitando a propriedade.
- Gravação de arquivos em `backend/storage`, usando `multer` com `diskStorage`.
- Armazenamento dos metadados em memória enquanto o processo estiver ativo.
- Identificação simples por nome de exibição e sessão temporária criada pelo servidor, sem senha.
- Interface web para enviar, listar e baixar documentos.

### Fora do escopo

- Armazenamento em nuvem, bancos de dados ou serviços externos.
- Versionamento, compartilhamento e edição de documentos.
- Cadastro, login e gestão de credenciais.
- Recuperação automática dos metadados após reinício do processo.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo por `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema gera um identificador único e um nome interno seguro para o arquivo. |
| RF-03 | Após um upload válido, o sistema retorna os metadados públicos do documento criado. |
| RF-04 | O usuário pode listar somente os documentos associados à sua identidade. |
| RF-05 | O usuário pode baixar um documento pelo identificador se for seu proprietário. |
| RF-06 | O sistema rejeita upload sem arquivo, acima do limite configurado ou sem identidade de usuário. |
| RF-07 | O sistema informa quando o documento não existe ou não pertence ao usuário, sem revelar a existência de documentos de terceiros. |
| RF-08 | Falhas de upload devem remover arquivos parciais ou temporários quando aplicável. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos são gravados exclusivamente no filesystem local com `multer` e `diskStorage`; o diretório padrão é `backend/storage`. |
| RNF-02 | Metadados são mantidos em memória e podem ser perdidos quando o processo reiniciar. |
| RNF-03 | Configurações operacionais são lidas de variáveis de ambiente, com padrões documentados. |
| RNF-04 | Backend em Node.js e Express, CommonJS e JavaScript; testes backend com `node:test`. |
| RNF-05 | Frontend em React e Vite; chamadas à API via `fetch` e prefixo `/api` no proxy do Vite. |
| RNF-06 | O nome original enviado pelo cliente nunca é usado como caminho de armazenamento. |
| RNF-07 | Erros de entrada, filesystem e persistência são tratados nos limites do sistema, sem expor detalhes internos. |

## 5. Modelo de dados

### Metadados internos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único gerado pelo sistema. |
| `originalName` | string | Nome original recebido do cliente; usado como metadado e nome sugerido no download. |
| `storageName` | string | Nome interno gerado pelo sistema para localizar o arquivo com segurança. |
| `size` | number | Tamanho do arquivo em bytes. |
| `mimeType` | string | Tipo MIME associado ao arquivo; o valor informado pelo cliente não comprova seu conteúdo. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador do usuário proprietário do documento. |

Os metadados são indexados por `id` em memória. `storageName` e caminhos locais são internos e nunca devem ser retornados pela API.

### Identidade e propriedade

A identidade deve ser fornecida por contexto confiável da requisição, como `req.user.id`, estabelecido por middleware da aplicação. Requisições sem identidade recebem `401 Unauthorized`. A implementação de autenticação não faz parte desta especificação; não se deve confiar em um identificador de proprietário arbitrário enviado pelo cliente.

Na demonstração, o usuário informa um nome de exibição e o servidor gera um ID próprio e um token de sessão aleatório. O token é enviado por cookie `dms_session` com `HttpOnly`, `SameSite=Strict`, validade de 8 horas e `Secure` quando `NODE_ENV=production`. O middleware consulta a sessão em memória e preenche `req.user.id`; o nome informado não define o proprietário nem comprova uma identidade real.

Reabrir ou atualizar a página restaura a identidade enquanto o cookie e a sessão forem válidos. Nomes iguais em sessões diferentes representam proprietários diferentes. Não há recuperação em outro navegador, após encerrar ou expirar a sessão, nem após reiniciar o backend. Os arquivos podem continuar no disco, mas os documentos da sessão encerrada deixam de ser acessíveis por essa identificação simples.

## 6. Contratos de API

As rotas do backend são `/upload`, `/documents` e `/documents/:id/download`. O frontend as acessa sob `/api` por meio do proxy do Vite.

### `POST /api/upload` (backend: `POST /upload`)

Recebe um arquivo no campo `file`.

**Entrada:** `multipart/form-data`.

**Sucesso:** `201 Created`, com os metadados públicos do documento.

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-10-06T12:00:00.000Z",
  "owner": "user-id"
}
```

**Erros:** `400 Bad Request` para arquivo ausente ou entrada inválida; `401 Unauthorized` sem identidade; `413 Payload Too Large` acima do limite; `500 Internal Server Error` em falha inesperada de armazenamento.

### `GET /api/documents` (backend: `GET /documents`)

Lista os documentos do usuário identificado. O cliente não escolhe o proprietário por query ou parâmetro.

**Sucesso:** `200 OK`, com uma lista (possivelmente vazia) de metadados públicos, no mesmo formato do upload.

**Erros:** `401 Unauthorized` sem identidade; `500 Internal Server Error` em falha inesperada.

### `GET /api/documents/:id/download` (backend: `GET /documents/:id/download`)

Baixa o conteúdo binário do documento. A resposta usa `Content-Disposition: attachment` com nome de download derivado com segurança de `originalName`. Caminhos do filesystem não são expostos. Usar `application/octet-stream` quando não houver tipo confiável disponível.

**Sucesso:** `200 OK`, com o conteúdo do arquivo.

**Erros:** `401 Unauthorized` sem identidade; `404 Not Found` para documento inexistente ou pertencente a outro usuário; `500 Internal Server Error` em falha de leitura.

### Identificação simples (backend: `/session`, frontend: `/api/session`)

- `POST /session`: recebe JSON `{ "name": "Ana" }`, com nome não vazio de até 80 caracteres, sem caracteres de controle. Retorna `201` com `{ "user": { "id": "uuid-gerado-pelo-servidor", "name": "Ana" } }` e define o cookie de sessão. Não aceita um ID escolhido pelo cliente; criar uma nova sessão substitui a sessão anterior do navegador. Entrada inválida recebe `400` com `INVALID_INPUT`.
- `GET /session`: retorna `200` com `{ "user": { "id": "uuid", "name": "Ana" } }`, ou `{ "user": null }` quando não há sessão válida. A resposta não deve ser armazenada em cache.
- `DELETE /session`: invalida a sessão, remove o cookie e retorna `204` sem corpo. A interface pede confirmação antes de encerrar a sessão, pois não há recuperação dos documentos por nome.

### Formato de erro

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

Códigos previstos: `FILE_REQUIRED`, `FILE_TOO_LARGE`, `UNAUTHENTICATED`, `DOCUMENT_NOT_FOUND`, `INVALID_INPUT` e `INTERNAL_ERROR`. As mensagens são em português. Respostas de erro não devem incluir caminhos, stack traces ou detalhes internos.

### Configuração

| Variável | Finalidade |
| --- | --- |
| `PORT` | Porta HTTP; usar o padrão definido pela aplicação quando ausente. |
| `DMS_STORAGE_DIR` | Diretório local de armazenamento; padrão `backend/storage`. |
| `DMS_MAX_FILE_SIZE_BYTES` | Limite máximo por arquivo; padrão definido e documentado pela aplicação. |

Não há lista de tipos de arquivo permitidos definida nesta fase. O MIME informado pelo cliente não deve ser considerado validação do conteúdo real.

## 7. Decisões arquiteturais

- Backend organizado em `routes -> controllers -> services -> repositories`.
- `routes/` registra endpoints e middleware de upload; não contém regras de negócio.
- `controllers/` trata entrada e saída HTTP, valida o formato básico da requisição e converte resultados/erros em respostas.
- `services/` contém as regras de upload, listagem, download e verificação de propriedade.
- `repositories/` encapsula os metadados em memória e o acesso aos arquivos locais.
- Camadas internas não dependem de Express nem de detalhes de transporte HTTP.
- Upload usa `multer` com `diskStorage`; o nome interno é gerado pela aplicação.
- Frontend organizado por componentes, páginas e serviços; chamadas HTTP centralizadas em serviço `fetch` sob `/api`.
- O mecanismo de autenticação é uma integração externa que deve preencher a identidade confiável da requisição.
- A identificação de demonstração usa sessão temporária em memória, resolvida no backend a partir de cookie opaco; ela não implementa cadastro, senha ou autenticação real.
- Após reinício, arquivos podem continuar no disco, mas os metadados em memória não são recuperados; reindexação não faz parte do escopo.

## 8. Plano de execução

As etapas abaixo são um roteiro futuro de implementação. Nesta entrega, somente este documento de especificação deve ser criado; nenhum arquivo de backend ou frontend faz parte desta etapa.

1. **Preparar configuração e armazenamento local.** Definir variáveis e valores padrão; configurar `multer` com `diskStorage`, limite de tamanho e nome interno seguro. Critério: uploads são gravados apenas no diretório configurado e respeitam o limite.
2. **Implementar metadados e regras de negócio.** Criar operações do repositório em memória e serviços para upload, listagem, download e propriedade. Critério: os dados seguem o modelo e um proprietário não acessa documentos de outro.
3. **Publicar os contratos HTTP.** Implementar rotas e controllers para as três operações e padronizar status e erros. Critério: contratos e falhas de entrada possuem testes usando `node:test`.
4. **Implementar a experiência do frontend.** Adicionar envio, listagem, estados de carregamento/erro e download via serviço `fetch` sob `/api`. Critério: as três operações podem ser realizadas pela interface.
5. **Verificar integração e limites.** Testar arquivo ausente, limite excedido, ausência de identidade, documento inexistente, propriedade e falhas de filesystem. Critério: respostas seguem os contratos e não expõem detalhes internos ou caminhos locais.