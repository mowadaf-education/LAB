import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import fs from 'fs';

import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Rate Limiter الأمني ──────────────────────────────────────────────────
// تم تصميم هذا النظام ليكون "جاهزاً للسحاب". حالياً يعمل في الذاكرة (MemoryStore)،
// وإذا نُشر التطبيق على عدة خوادم (Horizontal Scaling)، يمكن تبديل المخزن بـ RedisStore.

interface RateLimitStore {
  increment: (key: string, windowMs: number) => Promise<{ count: number; resetAt: number }>;
}

/**
 * مخزن بسيط في الذاكرة للتحكم في عدد الطلبات.
 * ملاحظة: هذا المخزن يُفقد عند إعادة تشغيل الخادم ولا يُشارك بين المثيلات المختلفة.
 */
class MemoryStore implements RateLimitStore {
  private hits = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now > entry.resetAt) {
      const newEntry = { count: 1, resetAt: now + windowMs };
      this.hits.set(key, newEntry);
      return newEntry;
    }

    entry.count++;
    return entry;
  }
}

/**
 * TODO (للمستقبل): إذا انتقلت للسحاب واستخدمت Redis، قم بتنفيذ هذا الكائن:
 * class RedisStore implements RateLimitStore { ... }
 */

function createRateLimiter(windowMs: number, maxRequests: number, store: RateLimitStore = new MemoryStore()) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip ?? 'unknown';
      const result = await store.increment(key, windowMs);

      if (result.count > maxRequests) {
        return res.status(429).json({ 
          error: 'طلبات كثيرة جداً. يرجى الانتظار قليلاً.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
        });
      }
      next();
    } catch (error) {
      // في حال فشل Rate Limiter، نمرر الطلب لضمان استمرارية الخدمة
      next();
    }
  };
}

const geminiLimiter   = createRateLimiter(60_000, 30);   // 30 طلب / دقيقة
const adminLimiter    = createRateLimiter(60_000, 5);     // 5  طلبات / دقيقة
// ──────────────────────────────────────────────────────────────────────────

// ─── حماية نقاط الإدارة: localhost فقط ────────────────────────────────────
function requireLocalhost(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? '';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({
      error: 'هذا المسار متاح من الخادم المحلي فقط.'
    });
  }
  next();
}
// ──────────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));

  // 1. ABSOLUTE PRIORITY: Facebook Verification
  app.get('/fbvthxxtta2cr1lkxsr1x7syknal90.html', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send('fbvthxxtta2cr1lkxsr1x7syknal90');
  });

  // 2. API Gemini proxy — مع Rate Limiting
  app.post('/api/gemini', geminiLimiter, async (req, res) => {
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
      const response = await ai.models.generateContent({ model, contents, config });

      res.status(200).json({ text: response.text });
    } catch (error: any) {
      // في الإنتاج لا نُرسل تفاصيل الخطأ للعميل
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) console.error('Gemini error:', error);
      res.status(500).json({ error: isDev ? (error.message || 'Failed') : 'خطأ في خادم الذكاء الاصطناعي.' });
    }
  });

  // 3. /api/setup-admin — localhost فقط + Rate Limiting
  app.post('/api/setup-admin', requireLocalhost, adminLimiter, async (req, res) => {
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

      const appName = `adminApp-${Date.now()}`;
      const adminApp = admin.initializeApp({
        credential: admin.credential.cert(parsedConfig)
      }, appName);

      const user = await adminApp.auth().getUserByEmail(email);
      await adminApp.auth().setCustomUserClaims(user.uid, { admin: true });
      await adminApp.delete();

      res.status(200).json({ success: true, message: `Successfully assigned admin claim to ${email}` });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.error('setup-admin error:', error);
      res.status(500).json({ error: error.message || 'Failed to assign admin claim' });
    }
  });

  // 4. /api/migrate-schools — localhost فقط + Rate Limiting
  app.post('/api/migrate-schools', requireLocalhost, adminLimiter, async (req, res) => {
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
      let dbId: string | undefined;
      if (fs.existsSync(appletConfigPath)) {
        const config = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
        dbId = config.firestoreDatabaseId;
      }

      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore(adminApp, dbId);
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
      res.status(200).json({ success: true, message: 'Successfully migrated schools database.' });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.error('migrate-schools error:', error);
      res.status(500).json({ error: error.message || 'Failed to migrate schools db' });
    }
  });

  // 5. /api/schools/search — مفتوح لكن مع Rate Limiting
  app.post('/api/schools/search', geminiLimiter, async (req, res) => {
    try {
      const { suggestion } = req.body;
      if (!suggestion || !suggestion.name) {
        return res.status(400).json({ error: 'Missing suggestion name' });
      }

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
      if (process.env.NODE_ENV !== 'production') console.error('schools/search error:', error);
      res.status(500).json({ error: error.message || 'Failed to search schools' });
    }
  });

  // 6. Vite dev middleware أو static في الإنتاج
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
