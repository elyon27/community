const SUPABASE_URL = "https://mzpuuukpqjmxezltekxy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cHV1dWtwcWpteGV6bHRla3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzg5NzMsImV4cCI6MjA4OTk1NDk3M30.U8PBcRYo9p5J5yhyh0AGKS0t9hHJDPjgfAc47Mqs3_Y";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const els = {
  authPanel: document.getElementById('authPanel'),
  sessionPanel: document.getElementById('sessionPanel'),
  dashboardPanel: document.getElementById('dashboardPanel'),
  authStatus: document.getElementById('authStatus'),
  mainStatus: document.getElementById('mainStatus'),
  adminLoginForm: document.getElementById('adminLoginForm'),
  adminEmail: document.getElementById('adminEmail'),
  sessionEmail: document.getElementById('sessionEmail'),
  signOutBtn: document.getElementById('signOutBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  pathFilter: document.getElementById('pathFilter'),
  entriesTableBody: document.getElementById('entriesTableBody'),
  statTotal: document.getElementById('statTotal'),
  statNew: document.getElementById('statNew'),
  statReviewed: document.getElementById('statReviewed'),
  statApproved: document.getElementById('statApproved'),
  statArchived: document.getElementById('statArchived'),
  statUnique: document.getElementById('statUnique'),
};

let allEntries = [];
let realtimeChannel = null;

function setBox(el, message = '', type = '') {
  el.textContent = message;
  el.className = type ? `status-box ${type}` : 'status-box';
}

function setInline(message = '') {
  els.mainStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function computeStats(entries) {
  const uniqueEmails = new Set();
  const stats = { total: entries.length, new: 0, reviewed: 0, approved: 0, archived: 0, unique: 0 };

  entries.forEach((entry) => {
    const status = (entry.status || '').toLowerCase();
    if (status in stats) stats[status] += 1;
    if (entry.email) uniqueEmails.add(entry.email.toLowerCase());
  });

  stats.unique = uniqueEmails.size;
  return stats;
}

function renderStats(entries) {
  const stats = computeStats(entries);
  els.statTotal.textContent = stats.total;
  els.statNew.textContent = stats.new;
  els.statReviewed.textContent = stats.reviewed;
  els.statApproved.textContent = stats.approved;
  els.statArchived.textContent = stats.archived;
  els.statUnique.textContent = stats.unique;
}

function applyFilters(entries) {
  const search = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const path = els.pathFilter.value;

  return entries.filter((entry) => {
    const normalizedPath = (entry.path || '').trim().toLowerCase() || 'unspecified';
    const haystack = [entry.name, entry.email, entry.path, entry.intention, entry.status]
      .join(' ')
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesStatus = status === 'all' || (entry.status || '').toLowerCase() === status;
    const matchesPath = path === 'all' || normalizedPath === path;

    return matchesSearch && matchesStatus && matchesPath;
  });
}

function renderTable(entries) {
  if (!entries.length) {
    els.entriesTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">No entries matched your filters.</td></tr>';
    return;
  }

  els.entriesTableBody.innerHTML = entries.map((entry) => {
    const safeStatus = escapeHtml(entry.status || 'new');
    const path = escapeHtml(entry.path || 'Unspecified');
    const intention = escapeHtml(entry.intention || '—');

    return `
      <tr>
        <td>
          <div>${escapeHtml(formatDate(entry.created_at))}</div>
          <div class="small-meta">${escapeHtml(entry.id)}</div>
        </td>
        <td>${escapeHtml(entry.name)}</td>
        <td>
          <div>${escapeHtml(entry.email)}</div>
          <div class="small-meta">${escapeHtml((entry.email || '').split('@')[1] || '')}</div>
        </td>
        <td><span class="badge">${path}</span></td>
        <td><div class="intention-copy">${intention}</div></td>
        <td><span class="badge ${safeStatus}">${safeStatus}</span></td>
        <td class="row-actions">
          <select data-entry-id="${escapeHtml(entry.id)}" class="status-select">
            <option value="new" ${entry.status === 'new' ? 'selected' : ''}>New</option>
            <option value="reviewed" ${entry.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
            <option value="approved" ${entry.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="archived" ${entry.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', handleStatusChange);
  });
}

function rerender() {
  const filtered = applyFilters(allEntries);
  renderStats(allEntries);
  renderTable(filtered);
}

async function loadEntries() {
  setInline('Loading entries...');

  const { data, error } = await supabaseClient
    .from('join_circle_entries')
    .select('id, name, email, path, intention, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Load entries error:', error);
    allEntries = [];
    renderStats([]);
    renderTable([]);
    setInline(error.message || 'Unable to load entries.');
    return;
  }

  allEntries = data || [];
  rerender();
  setInline(`Loaded ${allEntries.length} entr${allEntries.length === 1 ? 'y' : 'ies'}.`);
}

async function handleStatusChange(event) {
  const select = event.target;
  const entryId = select.dataset.entryId;
  const status = select.value;

  select.disabled = true;
  setInline('Updating entry status...');

  const { error } = await supabaseClient
    .from('join_circle_entries')
    .update({ status })
    .eq('id', entryId);

  if (error) {
    console.error('Status update error:', error);
    setInline(error.message || 'Status update failed.');
    select.disabled = false;
    return;
  }

  const target = allEntries.find((item) => item.id === entryId);
  if (target) target.status = status;

  rerender();
  setInline('Entry status updated.');
  select.disabled = false;
}

async function handleLogin(event) {
  event.preventDefault();

  const email = els.adminEmail.value.trim();
  if (!email) return;

  setBox(els.authStatus, 'Sending magic link...', 'info');

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.error('Login error:', error);
    setBox(els.authStatus, error.message || 'Unable to send magic link.', 'error');
    return;
  }

  setBox(els.authStatus, 'Magic link sent. Open it from your email, then return to this page.', 'success');
}

async function handleSignOut() {
  await supabaseClient.auth.signOut();

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  allEntries = [];
  renderStats([]);
  renderTable([]);
  updateSessionUI(null);
  setInline('Signed out.');
}

function updateSessionUI(session) {
  const user = session?.user || null;

  if (user) {
    els.authPanel.classList.add('hidden');
    els.sessionPanel.classList.remove('hidden');
    els.dashboardPanel.classList.remove('hidden');
    els.sessionEmail.textContent = `Signed in as ${user.email}`;
  } else {
    els.authPanel.classList.remove('hidden');
    els.sessionPanel.classList.add('hidden');
    els.dashboardPanel.classList.add('hidden');
    els.sessionEmail.textContent = 'Signed out';
  }
}

function subscribeRealtime() {
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel('join-circle-admin-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'join_circle_entries' },
      async () => {
        await loadEntries();
      }
    )
    .subscribe();
}

async function init() {
  els.adminLoginForm.addEventListener('submit', handleLogin);
  els.signOutBtn.addEventListener('click', handleSignOut);
  els.refreshBtn.addEventListener('click', loadEntries);
  els.searchInput.addEventListener('input', rerender);
  els.statusFilter.addEventListener('change', rerender);
  els.pathFilter.addEventListener('change', rerender);

  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session || null;

  updateSessionUI(session);

  if (session?.user) {
    await loadEntries();
    subscribeRealtime();
    setBox(els.authStatus, '');
  }

  supabaseClient.auth.onAuthStateChange(async (_event, sessionState) => {
    updateSessionUI(sessionState);

    if (sessionState?.user) {
      await loadEntries();
      subscribeRealtime();
      setBox(els.authStatus, 'Signed in successfully.', 'success');
    }
  });
}

init();