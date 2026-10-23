const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'gamuna.db'));
db.pragma('journal_mode = WAL');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gamuna123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'gamuna-foundation-secret';

function initializeDatabase() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      tag TEXT,
      date TEXT,
      source TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      image_url TEXT,
      bio TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT,
      date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const defaultHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare(`
    INSERT OR IGNORE INTO admin_users (username, password_hash)
    VALUES (?, ?)
  `).run(ADMIN_USERNAME, defaultHash);

  const existingNews = db.prepare('SELECT COUNT(*) AS count FROM news').get();
  if (existingNews.count === 0) {
    db.prepare(`
      INSERT INTO news (title, summary, content, tag, date, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Gamuna Foundation Launches News & Updates Page',
      'We have added this space to keep our community informed between events.',
      'We have added a space to keep our community informed between events — announcements, partnership news, media coverage, and behind-the-scenes updates on our work and mission.',
      'Announcement',
      'July 22, 2026',
      ''
    );
  }

  const existingMembers = db.prepare('SELECT COUNT(*) AS count FROM members').get();
  if (existingMembers.count === 0) {
    db.prepare(`
      INSERT INTO members (name, role, image_url, bio)
      VALUES (?, ?, ?, ?)
    `).run('Nicholas Gamuna', 'President', 'assets/team/nicholas-gamuna.jpg', 'Founder and leader of the foundation.');
  }

  const existingNotices = db.prepare('SELECT COUNT(*) AS count FROM notices').get();
  if (existingNotices.count === 0) {
    db.prepare(`
      INSERT INTO notices (title, message, category, date)
      VALUES (?, ?, ?, ?)
    `).run(
      'Volunteer registration now open',
      'The foundation is welcoming volunteers for outreach and youth empowerment activities.',
      'Volunteer',
      'July 24, 2026'
    );
  }
}

initializeDatabase();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(rootDir));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      sameSite: 'lax'
    }
  })
);

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Gamuna Foundation Admin API' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  req.session.isAdmin = true;
  req.session.username = user.username;

  return res.json({ success: true, username: user.username });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: 'Unable to log out.' });
    }

    return res.json({ success: true });
  });
});

app.get('/api/admin/session', (req, res) => {
  res.json({
    loggedIn: !!(req.session && req.session.isAdmin),
    username: req.session && req.session.username ? req.session.username : null
  });
});

app.get('/api/dashboard', requireAdmin, (req, res) => {
  const counts = {
    news: db.prepare('SELECT COUNT(*) AS total FROM news').get().total,
    members: db.prepare('SELECT COUNT(*) AS total FROM members').get().total,
    notices: db.prepare('SELECT COUNT(*) AS total FROM notices').get().total
  };

  res.json(counts);
});

app.get('/api/news', (req, res) => {
  const rows = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/news', requireAdmin, (req, res) => {
  const { title, summary, content, tag, date, source } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const statement = db.prepare(`
    INSERT INTO news (title, summary, content, tag, date, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    title.trim(),
    summary ? summary.trim() : '',
    content.trim(),
    tag ? tag.trim() : 'Announcement',
    date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    source ? source.trim() : ''
  );

  const created = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
});

app.put('/api/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, summary, content, tag, date, source } = req.body || {};

  if (!id || !title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const statement = db.prepare(`
    UPDATE news
    SET title = ?, summary = ?, content = ?, tag = ?, date = ?, source = ?
    WHERE id = ?
  `);

  statement.run(
    title.trim(),
    summary ? summary.trim() : '',
    content.trim(),
    tag ? tag.trim() : 'Announcement',
    date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    source ? source.trim() : '',
    id
  );

  const updated = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  return res.json(updated);
});

app.delete('/api/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid news id.' });
  }

  db.prepare('DELETE FROM news WHERE id = ?').run(id);
  res.json({ success: true, id });
});

app.get('/api/members', (req, res) => {
  const rows = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/members', requireAdmin, (req, res) => {
  const { name, role, image_url, bio } = req.body || {};

  if (!name || !role) {
    return res.status(400).json({ message: 'Name and role are required.' });
  }

  const statement = db.prepare(`
    INSERT INTO members (name, role, image_url, bio)
    VALUES (?, ?, ?, ?)
  `);

  const result = statement.run(
    name.trim(),
    role.trim(),
    image_url ? image_url.trim() : 'assets/team/placeholder.png',
    bio ? bio.trim() : ''
  );

  const created = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
});

app.put('/api/members/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { name, role, image_url, bio } = req.body || {};

  if (!id || !name || !role) {
    return res.status(400).json({ message: 'Name and role are required.' });
  }

  db.prepare(`
    UPDATE members
    SET name = ?, role = ?, image_url = ?, bio = ?
    WHERE id = ?
  `).run(
    name.trim(),
    role.trim(),
    image_url ? image_url.trim() : 'assets/team/placeholder.png',
    bio ? bio.trim() : '',
    id
  );

  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  return res.json(updated);
});

app.delete('/api/members/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid member id.' });
  }

  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  res.json({ success: true, id });
});

app.get('/api/notices', (req, res) => {
  const rows = db.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/notices', requireAdmin, (req, res) => {
  const { title, message, category, date } = req.body || {};

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  const statement = db.prepare(`
    INSERT INTO notices (title, message, category, date)
    VALUES (?, ?, ?, ?)
  `);

  const result = statement.run(
    title.trim(),
    message.trim(),
    category ? category.trim() : 'General',
    date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  );

  const created = db.prepare('SELECT * FROM notices WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
});

app.put('/api/notices/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, message, category, date } = req.body || {};

  if (!id || !title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  db.prepare(`
    UPDATE notices
    SET title = ?, message = ?, category = ?, date = ?
    WHERE id = ?
  `).run(
    title.trim(),
    message.trim(),
    category ? category.trim() : 'General',
    date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    id
  );

  const updated = db.prepare('SELECT * FROM notices WHERE id = ?').get(id);
  return res.json(updated);
});

app.delete('/api/notices/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid notice id.' });
  }

  db.prepare('DELETE FROM notices WHERE id = ?').run(id);
  res.json({ success: true, id });
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'login.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

app.listen(port, () => {
  console.log(`Gamuna Foundation admin app is running on http://localhost:${port}`);
  console.log(`Default admin login: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
});
