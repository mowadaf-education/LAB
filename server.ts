import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import fs from 'fs';

import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // 1. ABSOLUTE PRIORITY: Facebook Verification
  // This MUST be the first route to prevent any redirects from other middlewares
  app.get('/fbvthxxtta2cr1lkxsr1x7syknal90.html', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send('fbvthxxtta2cr1lkxsr1x7syknal90');
  });

  // API to securely proxy Gemini requests
  app.post('/api/gemini', async (req, res) => {
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Server is missing Gemini API key configuration.' });
      }

      const { model, contents, config } = req.body;
      if (!model || !contents) {
        return res.status(400).json({ error: 'Missing model or contents field.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      res.status(200).json({ text: response.text });
    } catch (error: any) {
      console.error('Error generating content from Gemini in server:', error);
      res.status(500).json({ error: error.message || 'Failed to call Gemini API' });
    }
  });

  // API to set custom admin claim dynamically
  app.post('/api/setup-admin', async (req, res) => {
    try {
      const { email, serviceAccountJson } = req.body;
      if (!email || !serviceAccountJson) {
        return res.status(400).json({ error: 'Missing email or serviceAccountJson' });
      }

      let parsedConfig;
      if (typeof serviceAccountJson === 'string') {
        parsedConfig = JSON.parse(serviceAccountJson);
      } else {
        parsedConfig = serviceAccountJson;
      }

      // Create a unique app name to avoid conflicts if called multiple times
      const appName = `adminApp-${Date.now()}`;
      const adminApp = admin.initializeApp({
        credential: admin.credential.cert(parsedConfig)
      }, appName);

      const user = await adminApp.auth().getUserByEmail(email);
      await adminApp.auth().setCustomUserClaims(user.uid, { admin: true });
      
      // Clean up the app instance
      await adminApp.delete();

      res.status(200).json({ success: true, message: `Successfully assigned admin claim to ${email}` });
    } catch (error: any) {
      console.error("Error in /api/setup-admin:", error);
      res.status(500).json({ error: error.message || "Failed to assign admin claim" });
    }
  });

  // API to migrate schools database to Firestore
  app.post('/api/migrate-schools', async (req, res) => {
    try {
      const { serviceAccountJson } = req.body;
      if (!serviceAccountJson) {
        return res.status(400).json({ error: 'Missing serviceAccountJson' });
      }

      let parsedConfig;
      if (typeof serviceAccountJson === 'string') {
        parsedConfig = JSON.parse(serviceAccountJson);
      } else {
        parsedConfig = serviceAccountJson;
      }

      const appName = `migrateApp-${Date.now()}`;
      const adminApp = admin.initializeApp({
        credential: admin.credential.cert(parsedConfig)
      }, appName);

      const appletConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
      let dbId = undefined;
      if (fs.existsSync(appletConfigPath)) {
        const config = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
        dbId = config.firestoreDatabaseId;
      }

      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore(adminApp, dbId);

      // Dynamic import to keep it out of the main bundle loading
      const { SCHOOL_DB } = await import('./src/data/schools');

      const directoratesList: any[] = [];
      const batchList: any[] = [];
      let currentBatch = db.batch();
      let operationCount = 0;

      for (const [dirId, dirData] of Object.entries(SCHOOL_DB)) {
        const anyDir = dirData as any;
        directoratesList.push({ id: dirId, name: anyDir.name });
        
        const docRef = db.collection('schools').doc(dirId);
        currentBatch.set(docRef, anyDir);
        operationCount++;

        if (operationCount >= 400) {
          batchList.push(currentBatch.commit());
          currentBatch = db.batch();
          operationCount = 0;
        }
      }

      const metaRef = db.collection('school_metadata').doc('directorates');
      currentBatch.set(metaRef, { list: directoratesList });
      batchList.push(currentBatch.commit());

      await Promise.all(batchList);
      
      await adminApp.delete();
      res.status(200).json({ success: true, message: 'Successfully migrated schools database to Firestore.' });
    } catch (error: any) {
      console.error('Error in /api/migrate-schools:', error);
      res.status(500).json({ error: error.message || 'Failed to migrate schools db' });
    }
  });

  // API to search schools server-side
  app.post('/api/schools/search', async (req, res) => {
    try {
      const { suggestion } = req.body;
      if (!suggestion || !suggestion.name) {
        return res.status(400).json({ error: 'Missing suggestion name' });
      }

      // Dynamic import to keep it out of the main bundle loading
      const { SCHOOL_DB } = await import('./src/data/schools');

      const normalizedSuggestion = suggestion.name.toLowerCase().trim();
      let bestMatch = null;
      let maxScore = 0;

      for (const [dirId, dir] of Object.entries(SCHOOL_DB) as Array<[string, any]>) {
        const dirName = dir.name.toLowerCase();
        const dirHint = suggestion.directorate?.toLowerCase() || '';
        const dirMatch = dirHint && (dirName.includes(dirHint) || dirHint.includes(dirName));
        
        for (const [comId, com] of Object.entries(dir.communes) as Array<[string, any]>) {
          const comName = com.name.toLowerCase();
          const comHint = suggestion.commune?.toLowerCase() || '';
          const comMatch = comHint && (comName.includes(comHint) || comHint.includes(comName));

          for (const [cycle, schools] of Object.entries(com.cycles) as Array<[string, any]>) {
            const cycleHint = suggestion.cycle?.toLowerCase() || '';
            const cycleMatch = cycleHint && (cycle.toLowerCase().includes(cycleHint) || cycleHint.includes(cycle.toLowerCase()));

            for (const school of schools) {
              const normalizedSchool = school.name.toLowerCase().trim();
              let score = 0;
              
              if (normalizedSchool === normalizedSuggestion) score += 100;
              else if (normalizedSchool.includes(normalizedSuggestion) || normalizedSuggestion.includes(normalizedSchool)) score += 50;
              
              if (dirMatch) score += 20;
              if (comMatch) score += 20;
              if (cycleMatch) score += 10;

              if (score > maxScore) {
                maxScore = score;
                bestMatch = { dirId, comId, cycle, schoolCode: school.code };
              }
            }
          }
        }
      }

      res.status(200).json({ bestMatch });
    } catch (error: any) {
      console.error('Error in /api/schools/search:', error);
      res.status(500).json({ error: error.message || 'Failed to search schools' });
    }
  });

  // 2. API routes
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
