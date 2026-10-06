# Document Management System com GitHub Copilot

## Backend DMS

Execute `npm install` no diretório `backend`, seguido de `npm start`.
Para executar os testes, use `npm test` no mesmo diretório.

O backend fornece `POST /upload` (multipart no campo `file`), `GET /documents`
e `GET /documents/:id/download`. Na interface, informe seu nome para iniciar
uma sessão temporária. O servidor gera a identidade usada em `req.user.id` e
envia um cookie `HttpOnly`; o nome não é usado como ID de proprietário.
As rotas retornam `401` sem sessão válida.
`GET /health` permanece público.

`POST /session` recebe JSON `{ "name": "Ana" }`; `GET /session` consulta a
identidade atual e `DELETE /session` encerra a sessão. A sessão dura 8 horas
e é restaurada ao atualizar a página enquanto permanecer válida. Nomes iguais
em sessões diferentes não dão acesso aos mesmos documentos. Não há login com
senha nem recuperação após encerrar/expirar a sessão, trocar de navegador ou
reiniciar o backend. Encerrar a sessão torna seus documentos inacessíveis por
essa identificação simples. Em produção (`NODE_ENV=production`), o cookie
usa `Secure` e exige HTTPS.

| Variável | Padrão |
| --- | --- |
| `PORT` | `3000` |
| `DMS_STORAGE_DIR` | `backend/storage`, independente do diretório de execução |
| `DMS_MAX_FILE_SIZE_BYTES` | `10485760` (10 MiB); inteiro positivo |

Os arquivos são locais, com nomes internos gerados pelo servidor. Metadados
são mantidos somente em memória e são perdidos ao reiniciar o processo.
O proprietário não é aceito por campos, query ou cabeçalhos do cliente.

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey camalbazzi-sketch!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-camal/issues/1)

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

