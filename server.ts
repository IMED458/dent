import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ai: Boolean(process.env.GEMINI_API_KEY), time: new Date().toISOString() });
  });

  // Medical text helper. Only the text the user explicitly sends is forwarded to Gemini;
  // the client never sends patient identifiers.
  app.post('/api/ai/assist', async (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      res.status(503).json({ error: 'GEMINI_API_KEY არ არის კონფიგურირებული (AI Studio → Secrets).' });
      return;
    }
    const text = String(req.body?.text || '').slice(0, 8000);
    const field = String(req.body?.field || 'სამედიცინო ჩანაწერი').slice(0, 200);
    if (!text.trim()) {
      res.status(400).json({ error: 'ტექსტი ცარიელია' });
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents:
          `შენ ხარ გამოცდილი სტომატოლოგი და სამედიცინო დოკუმენტაციის რედაქტორი საქართველოში.\n` +
          `გადაწერე ქვემოთ მოცემული ტექსტი (ველი: "${field}") გამართული, ლაკონური, პროფესიული სამედიცინო ქართულით.\n` +
          `არ დაამატო ფაქტები, რომლებიც ტექსტში არ არის. შეინარჩუნე კბილების FDI ნუმერაცია და ICD-10 კოდები.\n` +
          `დააბრუნე მხოლოდ საბოლოო ტექსტი, ახსნის გარეშე.\n\n---\n${text}`,
      });
      res.json({ text: (result.text || '').trim() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'AI შეცდომა' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dental clinic server: http://0.0.0.0:${PORT}`);
  });
}

startServer();
