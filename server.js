const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const dataFile = path.join(dataDir, 'gamuna-data.json');

fs.mkdirSync(dataDir, { recursive: true });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gamuna123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'gamuna-foundation-secret';

function getDefaultStore() {
  return {
    adminUsers: [
      {
        id: 1,
        username: ADMIN_USERNAME,
        password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 10)
      }
    ],
    news: [
      {
        id: 1,
        title: 'Gamuna Foundation Launches News & Updates Page',
        summary: 'We have added this space to keep our community informed between events.',
        content: 'We have added a space to keep our community informed between events — announcements, partnership news, media coverage, and behind-the-scenes updates on our work and mission.',
        tag: 'Announcement',
        date: 'July 22, 2026',
        source: ''
      }
    ],
    members: [
      {
        id: 1,
        name: 'Nicholas Gamuna',
        role: 'President',
        image_url: 'assets/team/nicholas-gamuna.jpg',
        bio: 'Founder and leader of the foundation.'
      }
    ],
    notices: [
      {
        id: 1,
        title: 'Volunteer registration now open',
        message: 'The foundation is welcoming volunteers for outreach and youth empowerment activities.',
        category: 'Volunteer',
        date: 'July 24, 2026'
      }
    ]
  };
}

function ensureStoreFile() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(getDefaultStore(), null, 2), 'utf8');
  }

  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data store');
    }

    if (!Array.isArray(parsed.adminUsers)) parsed.adminUsers = [];
    if (!Array.isArray(parsed.news)) parsed.news = [];
    if (!Array.isArray(parsed.members)) parsed.members = [];
    if (!Array.isArray(parsed.notices)) parsed.notices = [];

    const defaultStore = getDefaultStore();

    if (!parsed.adminUsers.length) {
      parsed.adminUsers = defaultStore.adminUsers;
    }

    if (!parsed.news.length) {
      parsed.news = defaultStore.news;
    }

    if (!parsed.members.length) {
      parsed.members = defaultStore.members;
    }

    if (!parsed.notices.length) {
      parsed.notices = defaultStore.notices;
    }

    const existingUser = parsed.adminUsers.find(user => user.username === ADMIN_USERNAME);
    if (!existingUser) {
      parsed.adminUsers.push({
        id: Date.now(),
        username: ADMIN_USERNAME,
        password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 10)
      });
    }

    fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf8');
    return parsed;
  } catch (error) {
    const defaultStore = getDefaultStore();
    fs.writeFileSync(dataFile, JSON.stringify(defaultStore, null, 2), 'utf8');
    return defaultStore;
  }
}

let store = ensureStoreFile();

function saveStore() {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf8');
}

function nextId(list) {
  const maxId = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return maxId + 1;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Gamuna Foundation Admin API' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = store.adminUsers.find(item => item.username === username);
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
  res.json({
    news: store.news.length,
    members: store.members.length,
    notices: store.notices.length
  });
});

app.get('/api/news', (req, res) => {
  res.json(store.news.slice().sort((a, b) => Number(b.id) - Number(a.id)));
});

app.post('/api/news', requireAdmin, (req, res) => {
  const { title, summary, content, tag, date, source } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const entry = {
    id: nextId(store.news),
    title: title.trim(),
    summary: summary ? summary.trim() : '',
    content: content.trim(),
    tag: tag ? tag.trim() : 'Announcement',
    date: date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    source: source ? source.trim() : ''
  };

  store.news.unshift(entry);
  saveStore();
  return res.status(201).json(entry);
});

app.put('/api/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, summary, content, tag, date, source } = req.body || {};

  if (!id || !title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const index = store.news.findIndex(item => Number(item.id) === id);
  if (index === -1) {
    return res.status(404).json({ message: 'News item not found.' });
  }

  store.news[index] = {
    ...store.news[index],
    title: title.trim(),
    summary: summary ? summary.trim() : '',
    content: content.trim(),
    tag: tag ? tag.trim() : 'Announcement',
    date: date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    source: source ? source.trim() : ''
  };

  saveStore();
  return res.json(store.news[index]);
});

app.delete('/api/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid news id.' });
  }

  store.news = store.news.filter(item => Number(item.id) !== id);
  saveStore();
  return res.json({ success: true, id });
});

app.get('/api/members', (req, res) => {
  res.json(store.members.slice().sort((a, b) => Number(b.id) - Number(a.id)));
});

app.post('/api/members', requireAdmin, (req, res) => {
  const { name, role, image_url, bio } = req.body || {};

  if (!name || !role) {
    return res.status(400).json({ message: 'Name and role are required.' });
  }

  const entry = {
    id: nextId(store.members),
    name: name.trim(),
    role: role.trim(),
    image_url: image_url ? image_url.trim() : 'assets/team/placeholder.png',
    bio: bio ? bio.trim() : ''
  };

  store.members.unshift(entry);
  saveStore();
  return res.status(201).json(entry);
});

app.put('/api/members/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { name, role, image_url, bio } = req.body || {};

  if (!id || !name || !role) {
    return res.status(400).json({ message: 'Name and role are required.' });
  }

  const index = store.members.findIndex(item => Number(item.id) === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Member not found.' });
  }

  store.members[index] = {
    ...store.members[index],
    name: name.trim(),
    role: role.trim(),
    image_url: image_url ? image_url.trim() : 'assets/team/placeholder.png',
    bio: bio ? bio.trim() : ''
  };

  saveStore();
  return res.json(store.members[index]);
});

app.delete('/api/members/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid member id.' });
  }

  store.members = store.members.filter(item => Number(item.id) !== id);
  saveStore();
  return res.json({ success: true, id });
});

app.get('/api/notices', (req, res) => {
  res.json(store.notices.slice().sort((a, b) => Number(b.id) - Number(a.id)));
});

app.post('/api/notices', requireAdmin, (req, res) => {
  const { title, message, category, date } = req.body || {};

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  const entry = {
    id: nextId(store.notices),
    title: title.trim(),
    message: message.trim(),
    category: category ? category.trim() : 'General',
    date: date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  store.notices.unshift(entry);
  saveStore();
  return res.status(201).json(entry);
});

app.put('/api/notices/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, message, category, date } = req.body || {};

  if (!id || !title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  const index = store.notices.findIndex(item => Number(item.id) === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Notice not found.' });
  }

  store.notices[index] = {
    ...store.notices[index],
    title: title.trim(),
    message: message.trim(),
    category: category ? category.trim() : 'General',
    date: date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  saveStore();
  return res.json(store.notices[index]);
});

app.delete('/api/notices/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid notice id.' });
  }

  store.notices = store.notices.filter(item => Number(item.id) !== id);
  saveStore();
  return res.json({ success: true, id });
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
