import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadContent } from './content.ts';
import { openDb } from './db.ts';
import { createRouter } from './routes.ts';
import { checkJdk } from './java/runner.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4400);

const content = loadContent();
if (content.errors.length) {
  console.error('Content errors:');
  for (const e of content.errors) console.error('  -', e);
}
console.log(`Loaded ${content.exercises.size} exercises across ${content.curriculum.units.length} units.`);

const db = openDb(); // JAVAPREPARE_DB env var overrides the DB path
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', createRouter(content, db));

// Serve the built client in production (`npm start`)
const clientDist = path.resolve(__dirname, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`JavaPrepare server → http://localhost:${PORT}`);
  const jdk = await checkJdk();
  if (jdk.ok) console.log(`JDK OK: ${jdk.javacVersion}`);
  else console.warn(`⚠ JDK problem: ${jdk.problem}`);
});
