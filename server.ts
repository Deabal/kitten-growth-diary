import express from 'express';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import * as Minio from 'minio';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// MinIO Client setup
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET || 'kitten-diary';

// Ensure bucket exists
async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      // Set bucket policy to public for viewing
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }
  } catch (err) {
    console.error('MinIO Bucket Error:', err);
  }
}
ensureBucket();

app.use(express.json());

// Helper to get file URL
const getFileUrl = (filename: string) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  
  return `${protocol}://${endpoint}:${port}/${bucketName}/${filename}`;
};

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage: storage });

// Setup SQLite Database
const db = new Database('kitten_diary.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS cats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    birthday TEXT,
    characteristics TEXT
  );

  CREATE TABLE IF NOT EXISTS behaviors (
    id TEXT PRIMARY KEY,
    cat_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'weight', 'photo', 'audio'
    value TEXT, -- weight value or file path
    notes TEXT,
    FOREIGN KEY(cat_id) REFERENCES cats(id)
  );

  CREATE TABLE IF NOT EXISTS cares (
    id TEXT PRIMARY KEY,
    cat_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'brush_teeth', 'ext_deworm', 'int_deworm', 'probiotics', 'canned_food', 'treats', 'lactoferrin', etc.
    notes TEXT,
    FOREIGN KEY(cat_id) REFERENCES cats(id)
  );

  CREATE TABLE IF NOT EXISTS abnormalities (
    id TEXT PRIMARY KEY,
    cat_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'vet', 'tooth', 'soft_stool', 'vomit', etc.
    severity INTEGER, -- 1-5
    notes TEXT,
    photos TEXT, -- JSON array of filenames
    FOREIGN KEY(cat_id) REFERENCES cats(id)
  );
`);

// API Routes

// --- Cats ---
app.get('/api/cats', (req, res) => {
  const cats = db.prepare('SELECT * FROM cats').all().map((cat: any) => ({
    ...cat,
    avatar: getFileUrl(cat.avatar)
  }));
  res.json(cats);
});

app.post('/api/cats', upload.single('avatar'), async (req, res) => {
  const { name, birthday, characteristics } = req.body;
  const id = uuidv4();
  let avatar = null;

  if (req.file) {
    const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;
    await minioClient.fPutObject(bucketName, filename, req.file.path);
    avatar = filename;
    // Clean up local file
    fs.unlinkSync(req.file.path);
  }
  
  const stmt = db.prepare('INSERT INTO cats (id, name, avatar, birthday, characteristics) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, name, avatar, birthday, characteristics);
  
  res.json({ id, name, avatar: getFileUrl(avatar), birthday, characteristics });
});

app.put('/api/cats/:id', upload.single('avatar'), async (req, res) => {
  const { id } = req.params;
  const { name, birthday, characteristics } = req.body;
  let avatar = req.body.avatar; // Keep existing if no new file

  if (req.file) {
    const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;
    await minioClient.fPutObject(bucketName, filename, req.file.path);
    avatar = filename;
    fs.unlinkSync(req.file.path);
  } else if (avatar && avatar.startsWith('http')) {
    // If it's a URL, we need to extract the filename or keep it as is if it's external
    // But our getFileUrl handles it. If it's from our MinIO, we should just store the filename.
    const urlParts = avatar.split('/');
    avatar = urlParts[urlParts.length - 1];
  }
  
  const stmt = db.prepare('UPDATE cats SET name = ?, avatar = ?, birthday = ?, characteristics = ? WHERE id = ?');
  stmt.run(name, avatar, birthday, characteristics, id);
  
  res.json({ id, name, avatar: getFileUrl(avatar), birthday, characteristics });
});

// --- Behaviors ---
app.get('/api/behaviors/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const behaviors = db.prepare('SELECT * FROM behaviors WHERE cat_id = ? ORDER BY date DESC').all(cat_id).map((b: any) => ({
    ...b,
    value: b.type !== 'weight' ? getFileUrl(b.value) : b.value
  }));
  res.json(behaviors);
});

app.post('/api/behaviors', upload.single('file'), async (req, res) => {
  const { cat_id, date, type, value, notes } = req.body;
  const id = uuidv4();
  let finalValue = value;
  
  if (req.file) {
    const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;
    await minioClient.fPutObject(bucketName, filename, req.file.path);
    finalValue = filename;
    // Clean up local file
    fs.unlinkSync(req.file.path);
  }
  
  const stmt = db.prepare('INSERT INTO behaviors (id, cat_id, date, type, value, notes) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, cat_id, date, type, finalValue, notes);
  
  res.json({ id, cat_id, date, type, value: getFileUrl(finalValue), notes });
});

// --- Cares ---
app.get('/api/cares/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const cares = db.prepare('SELECT * FROM cares WHERE cat_id = ? ORDER BY date DESC').all(cat_id);
  res.json(cares);
});

app.post('/api/cares', (req, res) => {
  const { cat_id, date, type, notes } = req.body;
  const id = uuidv4();
  
  const stmt = db.prepare('INSERT INTO cares (id, cat_id, date, type, notes) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, cat_id, date, type, notes);
  
  res.json({ id, cat_id, date, type, notes });
});

app.delete('/api/cares/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM cares WHERE id = ?').run(id);
  res.json({ ok: true });
});

// --- Abnormalities ---
app.get('/api/abnormalities/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const abnormalities = db.prepare('SELECT * FROM abnormalities WHERE cat_id = ? ORDER BY date DESC').all(cat_id).map((a: any) => ({
    ...a,
    photos: a.photos ? JSON.parse(a.photos).map((p: string) => getFileUrl(p)) : []
  }));
  res.json(abnormalities);
});

app.post('/api/abnormalities', upload.array('photos', 10), async (req, res) => {
  const { cat_id, date, type, severity, notes } = req.body;
  const id = uuidv4();
  const photos: string[] = [];

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      await minioClient.fPutObject(bucketName, filename, file.path);
      photos.push(filename);
      fs.unlinkSync(file.path);
    }
  }
  
  const stmt = db.prepare('INSERT INTO abnormalities (id, cat_id, date, type, severity, notes, photos) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, cat_id, date, type, severity, notes, JSON.stringify(photos));
  
  res.json({ id, cat_id, date, type, severity, notes, photos: photos.map(p => getFileUrl(p)) });
});

// --- AI Chatbot ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: message,
      config: {
        systemInstruction: "You are a helpful and knowledgeable assistant specializing in cat care, health, and behavior. Answer questions concisely and friendly."
      }
    });
    
    res.json({ text: response.text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// --- AI Image Analysis ---
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Read file and convert to base64
    const fileData = fs.readFileSync(req.file.path);
    const base64EncodeString = fileData.toString('base64');
    
    const imagePart = {
      inlineData: {
        mimeType: req.file.mimetype,
        data: base64EncodeString,
      },
    };
    
    const textPart = {
      text: "Analyze this image of a cat. Describe what the cat is doing, its mood, and any potential health or behavioral signs you notice.",
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts: [imagePart, textPart] },
    });
    
    // Clean up local file
    fs.unlinkSync(req.file.path);
    
    res.json({ text: response.text });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// --- Random Photo ---
app.get('/api/random-photo/:cat_id', (req, res) => {
  const { cat_id } = req.params;
  const photo = db.prepare('SELECT * FROM behaviors WHERE cat_id = ? AND type = "photo" ORDER BY RANDOM() LIMIT 1').get(cat_id) as any;
  if (photo) {
    photo.value = getFileUrl(photo.value);
  }
  res.json(photo || null);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
