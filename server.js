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
    settings: {
      siteName: 'Gamuna Foundation',
      tagline: 'Youth Empowerment • Madang Province, PNG',
      email: 'gamunafoundation@gmail.com',
      phone: '(675) 7988 8330',
      facebook: 'https://www.facebook.com/profile.php?id=61585581315098',
      address: 'Madang Province, Papua New Guinea'
    },
    home: {
      eyebrow: 'Est. 2026 · Madang Province, PNG',
      heroTitle: 'Advocate\nMotivate\nInspire',
      heroSubtitle: 'Empowering the youth of Papua New Guinea through education, advocacy, and community action.',
      missionLabel: 'Our Mission',
      missionText: 'To empower young people through education, advocacy, and community engagement, enabling them to overcome challenges and achieve their full potential.'
    },
    about: {
      heading: 'About Us',
      overview: 'Who we are, what drives us, and the people behind the mission.',
      vision: 'To create a vibrant and empowered generation of young leaders and communities who contribute positively to society, fostering sustainable development and community resilience in Madang Province and beyond.',
      mission: 'To empower young people through education, advocacy, and community engagement, enabling them to overcome challenges and achieve their full potential.',
      location: 'We operate in the heart of Madang Province, Papua New Guinea, engaging directly with both urban and rural communities to understand their unique challenges.'
    },
    programs: [
      {
        id: 1,
        title: 'Youth Leadership Development',
        description: 'Leadership training, mentorship, and confidence-building support for young people in Madang and surrounding communities.'
      },
      {
        id: 2,
        title: 'Education & Mentorship',
        description: 'Support for students, career guidance, and access to opportunities that help young people grow academically and socially.'
      },
      {
        id: 3,
        title: 'Community Outreach & Service',
        description: 'Volunteer outreach, donation drives, and practical service projects that connect youth with community action.'
      }
    ],
    news: [
      {
        id: 1,
        title: 'Gamuna Foundation Launches News & Updates Page',
        summary: 'We have added this space to keep our community informed between events.',
        content: 'We have added this space to keep our community informed between events — announcements, partnership news, media coverage, and behind-the-scenes updates on our work and mission.',
        tag: 'Announcement',
        date: 'July 22, 2026',
        source: ''
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

    const defaults = getDefaultStore();

    for (const key of ['settings', 'home', 'about', 'programs', 'news', 'notices']) {
      if (!(key in parsed)) parsed[key] = defaults[key];
    }

    if (!parsed.settings || typeof parsed.settings !== 'object') parsed.settings = defaults.settings;
    if (!parsed.home || typeof parsed.home !== 'object') parsed.home = defaults.home;
    if (!parsed.about || typeof parsed.about !== 'object') parsed.about = defaults.about;
    if (!Array.isArray(parsed.programs)) parsed.programs = defaults.programs;
    if (!Array.isArray(parsed.news)) parsed.news = defaults.news;
    if (!Array.isArray(parsed.notices)) parsed.notices = defaults.notices;

    if (!parsed.adminUsers) parsed.adminUsers = [{ id: 1, username: ADMIN_USERNAME, password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 10) }];
    if (!parsed.adminUsers.some(user => user.username === ADMIN_USERNAME)) {
      parsed.adminUsers.push({
        id: Date.now(),
        username: ADMIN_USERNAME,
        password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 10)
      });
    }

    fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf8');
    return parsed;
  } catch (error) {
    const defaults = getDefaultStore();
    fs.writeFileSync(dataFile, JSON.stringify(defaults, null, 2), 'utf8');
    return defaults;
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

  const user = (store.adminUsers || []).find(item => item.username === username);
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

app.get('/api/site-content', (req, res) => {
  res.json(store);
});

app.post('/api/site-content', requireAdmin, (req, res) => {
  const incoming = req.body || {};
  store = { ...store, ...incoming };
  saveStore();
  return res.json(store);
});

app.post('/api/settings', requireAdmin, (req, res) => {
  store.settings = { ...store.settings, ...(req.body || {}) };
  saveStore();
  return res.json(store.settings);
});

app.post('/api/home', requireAdmin, (req, res) => {
  store.home = { ...store.home, ...(req.body || {}) };
  saveStore();
  return res.json(store.home);
});

app.post('/api/about', requireAdmin, (req, res) => {
  store.about = { ...store.about, ...(req.body || {}) };
  saveStore();
  return res.json(store.about);
});

app.post('/api/programs', requireAdmin, (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : [req.body];
  store.programs = incoming.filter(Boolean);
  saveStore();
  return res.json(store.programs);
});

app.get('/api/programs', (req, res) => {
  res.json(store.programs || []);
});

app.get('/api/news', (req, res) => {
  res.json((store.news || []).slice().sort((a, b) => Number(b.id) - Number(a.id)));
});

app.post('/api/news', requireAdmin, (req, res) => {
  const { title, summary, content, tag, date, source } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const entry = {
    id: nextId(store.news || []),
    title: title.trim(),
    summary: summary ? summary.trim() : '',
    content: content.trim(),
    tag: tag ? tag.trim() : 'Announcement',
    date: date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    source: source ? source.trim() : ''
  };

  store.news = [entry, ...(store.news || [])];
  saveStore();
  return res.status(201).json(entry);
});

app.put('/api/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, summary, content, tag, date, source } = req.body || {};

  if (!id || !title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const index = (store.news || []).findIndex(item => Number(item.id) === id);
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

  store.news = (store.news || []).filter(item => Number(item.id) !== id);
  saveStore();
  return res.json({ success: true, id });
});

app.get('/api/notices', (req, res) => {
  res.json((store.notices || []).slice().sort((a, b) => Number(b.id) - Number(a.id)));
});

app.post('/api/notices', requireAdmin, (req, res) => {
  const { title, message, category, date } = req.body || {};

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  const entry = {
    id: nextId(store.notices || []),
    title: title.trim(),
    message: message.trim(),
    category: category ? category.trim() : 'General',
    date: date ? date.trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  store.notices = [entry, ...(store.notices || [])];
  saveStore();
  return res.status(201).json(entry);
});

app.put('/api/notices/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, message, category, date } = req.body || {};

  if (!id || !title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  const index = (store.notices || []).findIndex(item => Number(item.id) === id);
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

  store.notices = (store.notices || []).filter(item => Number(item.id) !== id);
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

module.exports = { app, getDefaultStore };
