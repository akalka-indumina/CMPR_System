import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function sharedAppData() {
  const dataDirectory = path.resolve(process.cwd(), 'node_modules', '.cache', 'pcms-demo');
  const dataFile = path.join(dataDirectory, 'shared-data.json');
  const legacyDataFile = path.resolve(process.cwd(), 'node_modules', '.vite', 'pcms-demo-data.json');
  const documentsDirectory = path.join(dataDirectory, 'registration-documents');

  const readDataFile = async file => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  };
  const readData = async () => (await readDataFile(dataFile)) || readDataFile(legacyDataFile);

  const writeData = async data => {
    await fs.mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporaryFile, JSON.stringify(data), 'utf8');
      await fs.rename(temporaryFile, dataFile);
    } finally {
      await fs.rm(temporaryFile, { force: true });
    }
  };

  const initializeData = async data => {
    await fs.mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporaryFile, JSON.stringify(data), 'utf8');
      try {
        await fs.link(temporaryFile, dataFile);
        return data;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        return await readData();
      }
    } finally {
      await fs.rm(temporaryFile, { force: true });
    }
  };

  return {
    name: 'shared-demo-app-data',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        const documentPrefix = '/__pcms-documents/';
        const isDocumentRequest = pathname.startsWith(documentPrefix);
        if (pathname !== '/__pcms-data' && !isDocumentRequest) {
          next();
          return;
        }

        const send = (status, body) => {
          response.statusCode = status;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify(body));
        };

        try {
          if (isDocumentRequest) {
            const applicationId = pathname.slice(documentPrefix.length);
            if (!/^[A-Za-z0-9_-]+$/.test(applicationId)) {
              send(400, { error: 'Invalid application ID.' });
              return;
            }
            const documentFile = path.join(documentsDirectory, `${applicationId}.json`);
            if (request.method === 'GET') {
              try {
                send(200, { documents: JSON.parse(await fs.readFile(documentFile, 'utf8')) });
              } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                send(404, { error: 'Registration documents are not available.' });
              }
              return;
            }
            if (request.method === 'DELETE') {
              await fs.rm(documentFile, { force: true });
              send(200, { deleted: true });
              return;
            }
            if (request.method !== 'POST') {
              send(405, { error: 'Method not allowed.' });
              return;
            }

            let body = '';
            for await (const chunk of request) {
              body += chunk;
              if (body.length > 20 * 1024 * 1024) {
                send(413, { error: 'Registration documents exceed the request size limit.' });
                return;
              }
            }
            const payload = JSON.parse(body);
            const documents = payload.documents;
            if (!documents || typeof documents !== 'object' || Array.isArray(documents)
              || !Object.values(documents).every(document => (
                document && typeof document.name === 'string'
                && typeof document.type === 'string'
                && typeof document.dataUrl === 'string'
                && document.dataUrl.length <= 7 * 1024 * 1024
                && /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(document.dataUrl)
              ))) {
              send(400, { error: 'Invalid registration document payload.' });
              return;
            }
            await fs.mkdir(documentsDirectory, { recursive: true });
            const temporaryFile = `${documentFile}.${randomUUID()}.tmp`;
            try {
              await fs.writeFile(temporaryFile, JSON.stringify(documents), 'utf8');
              await fs.rename(temporaryFile, documentFile);
            } finally {
              await fs.rm(temporaryFile, { force: true });
            }
            send(200, { saved: true });
            return;
          }

          if (request.method === 'GET') {
            const data = await readData();
            send(data ? 200 : 404, data ? { data } : { error: 'Shared demo data is not initialized.' });
            return;
          }

          if (request.method !== 'POST' && request.method !== 'PUT') {
            send(405, { error: 'Method not allowed.' });
            return;
          }

          let body = '';
          for await (const chunk of request) {
            body += chunk;
            if (body.length > 10 * 1024 * 1024) {
              send(413, { error: 'Shared demo data exceeds the request size limit.' });
              return;
            }
          }

          const payload = JSON.parse(body);
          if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
            send(400, { error: 'Shared demo data must be an object.' });
            return;
          }

          const data = request.method === 'POST'
            ? await initializeData(payload.data)
            : (await writeData(payload.data), payload.data);
          send(200, { data });
        } catch (error) {
          console.error('Shared demo data request failed.', error);
          send(500, { error: 'Shared demo data request failed.' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), sharedAppData()],
  server: {
    port: mode === 'staff' ? 5174 : 5173,
    strictPort: true,
  },
}));
