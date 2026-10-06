const express = require('express');
const createDocumentRouter = require('./routes/documentRoutes');
const createSessionRouter = require('./routes/sessionRoutes');
const { handleError } = require('./controllers/documentController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(createSessionRouter());
app.use(createDocumentRouter());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(handleError);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
