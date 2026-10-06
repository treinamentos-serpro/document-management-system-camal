---
description: Gera testes isolados com node:test para módulos, rotas e sessões do backend DMS.
name: gerar-testes
argument-hint: caminho do modulo (ex. backend/src/services/documentService.js)
agent: agent
---

# Gerar testes do backend

Gere testes automatizados para o módulo `${input:modulo:caminho do modulo}` usando
`node:test` e `node:assert`. Consulte as
[instruções do projeto](../copilot-instructions.md), os contratos da
[especificação](../../docs/specs/dms-spec.md) e os testes em
[app.test.js](../../backend/test/app.test.js).

Requisitos:

- Cubra os casos de sucesso e de erro principais.
- Mantenha os testes isolados e legíveis.
- Coloque os testes em `backend/test`.
- Prefira ampliar um arquivo de teste existente e não altere código de produção
	apenas para fazer os testes passarem.
- Não dependa de serviços externos nem de servidores em execução. Para HTTP,
	inicie o app em porta efêmera; use diretório temporário para arquivos e feche
	servidores/remova arquivos com os hooks de limpeza do `node:test`.
- Para rotas de documentos, cubra arquivo ausente, limite excedido, falta de
	identidade, proprietário diferente e respostas sem detalhes internos.
- Para identificação, use os endpoints e cookies reais de sessão; cubra nomes
	iguais em sessões diferentes, token inválido, expiração e encerramento.
- Execute `npm --prefix backend test` da raiz e informe quais testes passaram
	ou falharam. Reporte impedimentos sem enfraquecer as asserções.
