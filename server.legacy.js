const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'belikhub.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    report_type TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS partnerships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    institution TEXT NOT NULL,
    need TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const signToken = (user) => jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET || 'dev-secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'belikhub-api', database: 'sqlite' }));

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const name = clean(req.body.name, 100);
  const email = clean(req.body.email, 160).toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !isEmail(email) || password.length < 8) {
    return res.status(400).json({ error: 'Name, valid email, and password of at least 8 characters are required' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, passwordHash);
    const user = { id: Number(result.lastInsertRowid), name, email, role: 'user' };
    return res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Email is already registered' });
    console.error(error);
    return res.status(500).json({ error: 'Could not create account' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const email = clean(req.body.email, 160).toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect' });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: signToken(user) });
});

app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.post('/api/reports', auth, (req, res) => {
  const reportType = clean(req.body.reportType || 'Spring Survey', 80);
  const location = clean(req.body.location, 160);
  const notes = clean(req.body.notes, 2000);
  const userId = req.user.sub;
  const points = reportType.toLowerCase().includes('restor') ? 1000 : reportType.toLowerCase().includes('rorak') ? 500 : 100;
  if (!location || !notes) return res.status(400).json({ error: 'Location and notes are required' });
  const result = db.prepare('INSERT INTO reports (user_id, report_type, location, notes, points) VALUES (?, ?, ?, ?, ?)').run(userId, reportType, location, notes, points);
  res.status(201).json({ id: Number(result.lastInsertRowid), status: 'pending', points });
});

app.get('/api/reports', auth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const query = isAdmin
    ? `SELECT r.id, r.report_type AS reportType, r.location, r.notes, r.points, r.status, r.created_at AS createdAt, u.name AS author, u.email AS authorEmail FROM reports r LEFT JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 200`
    : `SELECT r.id, r.report_type AS reportType, r.location, r.notes, r.points, r.status, r.created_at AS createdAt, u.name AS author FROM reports r LEFT JOIN users u ON u.id = r.user_id WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 100`;
  const reports = isAdmin ? db.prepare(query).all() : db.prepare(query).all(req.user.sub);
  res.json({ reports });
});

app.patch('/api/reports/:id/status', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = clean(req.body.status, 20);
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const result = db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Report not found' });
  res.json({ id, status });
});

app.post('/api/partnerships', authLimiter, (req, res) => {
  const name = clean(req.body.name, 100);
  const institution = clean(req.body.institution, 160);
  const need = clean(req.body.need, 120);
  const email = clean(req.body.email, 160).toLowerCase();
  if (!name || !institution || !need) return res.status(400).json({ error: 'Name, institution, and partnership need are required' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'Email is invalid' });
  const result = db.prepare('INSERT INTO partnerships (name, institution, need, email) VALUES (?, ?, ?, ?)').run(name, institution, need, email || null);
  res.status(201).json({ id: Number(result.lastInsertRowid), status: 'new' });
});

app.get('/api/partnerships', auth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const query = isAdmin
    ? 'SELECT id, name, institution, need, email, status, created_at AS createdAt FROM partnerships ORDER BY created_at DESC LIMIT 200'
    : 'SELECT id, name, institution, need, email, status, created_at AS createdAt FROM partnerships WHERE email = ? ORDER BY created_at DESC LIMIT 100';
  const partnerships = isAdmin ? db.prepare(query).all() : db.prepare(query).all(req.user.email);
  res.json({ partnerships });
});

app.patch('/api/partnerships/:id/status', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = clean(req.body.status, 20);
  const allowed = ['new', 'contacted', 'in_progress', 'completed', 'declined'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const result = db.prepare('UPDATE partnerships SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Partnership not found' });
  res.json({ id, status });
});

app.get('/api/admin/stats', auth, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const reports = db.prepare('SELECT COUNT(*) as count, status FROM reports GROUP BY status').all();
  const partnerships = db.prepare('SELECT COUNT(*) as count, status FROM partnerships GROUP BY status').all();
  res.json({ users: users.count, reports, partnerships });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`BelikHub running at http://localhost:${PORT}`));