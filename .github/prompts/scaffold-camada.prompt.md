---
description: Cria ou estende um recurso do backend usando as factories e camadas existentes do DMS.
name: scaffold-camada
argument-hint: nome do recurso no singular (ex. document)
agent: agent
---

# Scaffold de camada do backend

Crie ou estenda o recurso `${input:recurso:nome do recurso no singular}` seguindo
as [instruções do projeto](../copilot-instructions.md) e a
[especificação do DMS](../../docs/specs/dms-spec.md).

Antes de editar, procure a implementação existente e um teste próximo. Reutilize
os arquivos encontrados; não crie uma segunda implementação do mesmo recurso.
Quando arquivos novos forem necessários, siga os nomes e factories exemplificados em:

1. [documentRoutes.js](../../backend/src/routes/documentRoutes.js): registra rotas e compõe dependências.
2. [documentController.js](../../backend/src/controllers/documentController.js): trata HTTP e validação básica.
3. [documentService.js](../../backend/src/services/documentService.js): concentra regras de negócio.
4. [documentRepository.js](../../backend/src/repositories/documentRepository.js): encapsula persistência.

Requisitos:

- Respeite o fluxo `routes -> controllers -> services -> repositories`.
- Uploads gravados no filesystem local via multer com diskStorage.
- Metadados em memória nesta fase.
- Trate erros nos limites do sistema.
- Preserve a identidade resolvida por sessão; o cliente não escolhe o proprietário.
- Registre novas rotas no app apenas quando necessário e cubra o comportamento
	em testes existentes. Execute `npm --prefix backend test` da raiz e informe
	o resultado ou o impedimento, sem declarar validações não realizadas.
