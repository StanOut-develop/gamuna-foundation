const state = {
  news: [],
  members: [],
  notices: []
};

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

async function ensureAdminSession() {
  try {
    const session = await apiRequest('/api/admin/session');
    if (!session.loggedIn) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  } catch (error) {
    window.location.href = '/login.html';
    return false;
  }
}

function renderSummary() {
  document.getElementById('newsCount').textContent = state.news.length;
  document.getElementById('memberCount').textContent = state.members.length;
  document.getElementById('noticeCount').textContent = state.notices.length;
}

function renderNews() {
  const container = document.getElementById('newsList');
  if (!container) return;

  if (!state.news.length) {
    container.innerHTML = '<p class="empty-state">No news items yet.</p>';
    return;
  }

  container.innerHTML = state.news
    .map(
      (item) => `
        <div class="record-item">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.summary || item.content.slice(0, 100))}</p>
          </div>
          <div class="record-actions">
            <button class="btn btn-outline small" data-delete="news" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

function renderMembers() {
  const container = document.getElementById('memberList');
  if (!container) return;

  if (!state.members.length) {
    container.innerHTML = '<p class="empty-state">No members yet.</p>';
    return;
  }

  container.innerHTML = state.members
    .map(
      (item) => `
        <div class="record-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(item.role)}</p>
          </div>
          <div class="record-actions">
            <button class="btn btn-outline small" data-delete="members" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

function renderNotices() {
  const container = document.getElementById('noticeList');
  if (!container) return;

  if (!state.notices.length) {
    container.innerHTML = '<p class="empty-state">No notices yet.</p>';
    return;
  }

  container.innerHTML = state.notices
    .map(
      (item) => `
        <div class="record-item">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.message.slice(0, 120))}</p>
          </div>
          <div class="record-actions">
            <button class="btn btn-outline small" data-delete="notices" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

async function loadData() {
  const [news, members, notices] = await Promise.all([
    apiRequest('/api/news'),
    apiRequest('/api/members'),
    apiRequest('/api/notices')
  ]);

  state.news = news;
  state.members = members;
  state.notices = notices;

  renderSummary();
  renderNews();
  renderMembers();
  renderNotices();
}

async function attachFormHandlers() {
  const newsForm = document.getElementById('newsForm');
  if (newsForm) {
    newsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(newsForm);
      const payload = Object.fromEntries(formData.entries());

      await apiRequest('/api/news', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      newsForm.reset();
      await loadData();
    });
  }

  const memberForm = document.getElementById('memberForm');
  if (memberForm) {
    memberForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(memberForm);
      const payload = Object.fromEntries(formData.entries());

      await apiRequest('/api/members', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      memberForm.reset();
      await loadData();
    });
  }

  const noticeForm = document.getElementById('noticeForm');
  if (noticeForm) {
    noticeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(noticeForm);
      const payload = Object.fromEntries(formData.entries());

      await apiRequest('/api/notices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      noticeForm.reset();
      await loadData();
    });
  }

  document.body.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;

    const { delete: resourceType, id } = button.dataset;
    if (!resourceType || !id) return;

    if (!window.confirm('Delete this item?')) {
      return;
    }

    await apiRequest(`/api/${resourceType}/${id}`, {
      method: 'DELETE'
    });

    await loadData();
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await apiRequest('/api/admin/logout', { method: 'POST' });
      window.location.href = '/login.html';
    });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

(async function init() {
  const isLoggedIn = await ensureAdminSession();
  if (!isLoggedIn) return;

  await attachFormHandlers();
  await loadData();
})();
