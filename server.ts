import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Alpine Ranger & Dispatch Gemini Chat
app.post('/api/ranger-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: "Basecamp Dispatch Notice: Ranger A Pao is currently on the high ridge (radio silence). Standard advisory: Pack 4-season insulation, start at Tram Ton Gate 06:30 AM, and keep pack weight under 15kg. Stay safe on the cloud ridge!"
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are Giang A Pao, Lead High-Mountain Guide (WFR certified) and Chief Basecamp Dispatcher for Hoang Lien Son National Biosphere, Sapa Peak Expeditions, and WeTrek.
You provide real backcountry guidance for Fansipan Peak (3,143m), Ky Quan San / Bach Moc Luong Tu (3,046m), Ta Xua Cloud Sea Ridge, Ta Nang - Phan Dung, Pu Luong, and Lan Ha Bay.

Your responsibilities:
- Meeting Point Briefing: Tram Ton Pass Gate (1,900m MSL) at 06:30 AM sharp.
- Weather & Cloud Inversion: Sapa highlands have swift temperature drops down to 2-5°C at Camp II (2,800m). Cloud inversions best observed at dawn (05:45 - 06:30).
- Gear Checks: Warm 4-season sleeping bag (-5°C rating), thermal base layer, waterproof shell jacket, sturdy trekking boots, headlamp with spare batteries, trekking poles.
- Porter Regulations: Strict adherence to park guidelines - 18kg max load per porter, fair daily living wage, warm tent shelter provided.
- Altitude Acclimatization: Steady pace, 1 guide per 4 climbers, stay hydrated, report early dizziness or acute mountain sickness immediately.
- VHF Emergency Radio Frequency: 147.425 MHz.

Tone: Authoritative, calm, experienced high-mountain professional. Direct, encouraging, clear formatting with bullet points when listing gear or rules. Keep responses crisp (under 160 words).`;

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.content || item.text || '' }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Transmission received from Tram Ton Gate. Proceed with scheduled briefing.";
    res.json({ reply });
  } catch (error: any) {
    console.error('Ranger chat error:', error);
    res.status(500).json({
      error: 'Radio interference on alpine band.',
      reply: "Basecamp Radio Advisory: Weather is holding steady with cool summit winds (6°C). Please ensure your trekking pass #HLP-8924 is ready for QR scanning at Tram Ton Gate by 06:30 AM."
    });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WeTrek Alpine Dispatch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
