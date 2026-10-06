# Instruções do projeto - Document Management System (DMS)

## Referências

- Consulte a [especificação do DMS](../docs/specs/dms-spec.md) antes de alterar
  contratos HTTP, propriedade de documentos ou identificação de usuários.
- Consulte o [README](../README.md) para configuração e limitações de sessão e
  armazenamento. Atualize esses documentos quando mudar comportamento público.

## Stack

- Backend: Node.js + Express (CommonJS)
- Frontend: React + Vite (ESM)
- Testes backend e frontend: runner nativo do Node (`node:test`)
- Sem TypeScript nesta fase (JavaScript puro)
- Use Node.js 24 ou superior, conforme [frontend/package.json](../frontend/package.json).

## Princípios obrigatórios

- SOLID, DRY, KISS, YAGNI
- 12-Factor App (configuração via variáveis de ambiente)
- Código legível tem prioridade sobre código complexo
- Sem overengineering e sem abstrações desnecessárias

## Arquitetura do backend (Clean Architecture simples)

Separe responsabilidades em quatro camadas dentro de `backend/src`:

- `routes/`: definem os endpoints e delegam para os controllers
- `controllers/`: tratam entrada/saída HTTP e validação básica
- `services/`: concentram as regras de negócio
- `repositories/`: cuidam da persistência

Fluxo de dependência: `routes -> controllers -> services -> repositories`.
Services e repositories não dependem de Express nem de objetos HTTP.
- Reutilize as factories existentes e os nomes em camelCase, como
  [documentService.js](../backend/src/services/documentService.js).
- Registre roteadores no [app.js](../backend/src/app.js); preserve a resolução
  da sessão antes das rotas de documentos e o tratamento global de erros ao final.

## Identidade e armazenamento

- A identificação atual é uma sessão de demonstração, não um login. O servidor
  gera o ID do proprietário e resolve `req.user.id` por cookie opaco. Não aceite
  proprietário fornecido por nome, campo, query ou cabeçalho do cliente.
- Preserve o isolamento entre sessões, inclusive quando os nomes forem iguais.
- Use `multer` com `diskStorage` local, padrão `backend/storage` e configuração
  definida no README. Nunca use o nome original como caminho de armazenamento.
- Metadados e sessões ficam em memória; não introduza banco, reindexação ou
  recuperação de conta sem mudança explícita de escopo.
- Não utilize provedores de armazenamento externos ou serviços de upload de
  terceiros. O armazenamento é estritamente local à aplicação.
- Preserve o formato de erro da especificação, sem caminhos ou stack traces;
  trate falhas de entrada e filesystem e limpe arquivos de uploads rejeitados.

## Convenções do frontend

- Componentes funcionais com React Hooks
- Organização baseada em componentes: `components/`, `pages/`, `services/`
- A comunicação com o backend é feita via `fetch`, através do prefixo `/api`
  (proxy configurado no Vite)
- Centralize chamadas em [documentApi.js](../frontend/src/services/documentApi.js).
  Preserve cookies com `credentials: 'same-origin'` e a reidentificação após `401`.
- Reutilize componentes e evite duplicação

## Validação

Execute da raiz apenas os comandos pertinentes à alteração:

| Área | Comando |
| --- | --- |
| Backend | `npm --prefix backend test` |
| Cliente de API | `npm --prefix frontend test` |
| Interface React/Vite | `npm --prefix frontend run build` |

- Reutilize [backend/test/app.test.js](../backend/test/app.test.js) e
  [frontend/test/documentApi.test.js](../frontend/test/documentApi.test.js).
- Testes HTTP usam porta efêmera e diretório temporário, com limpeza ao final;
  não escreva em `backend/storage` nem dependa dos servidores do usuário.
- Para sessões, teste criação, expiração, encerramento, cookies inválidos e
  isolamento por proprietário; não substitua esse fluxo por identidade forjada.
- Não há script de lint definido nos pacotes; não invente comandos de validação.
- Build e testes de API não comprovam aparência ou interação no navegador.
  Se faltarem bibliotecas para Playwright, relate a verificação não realizada.

## Estilo de código

- Nomes descritivos em inglês para símbolos de código
- Mensagens ao usuário e comentários em português
- Funções pequenas e com responsabilidade única
- Trate erros nos limites do sistema (entrada HTTP, leitura/escrita de arquivos)

## Restrições gerais

- Não quebrar funcionalidades existentes
- Manter a implementação simples e evolutiva
- Preferir dependências já presentes no `package.json`
