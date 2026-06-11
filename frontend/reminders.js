// reminders.js — CarePulse Reminders Page
let currentPage  = 1;
const itemsPerPage = 20;
let totalReminders = 0;
let totalPages     = 1;
let activeFilters  = { type: '', status: '' };

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadReminders();
});

async function loadReminders() {
  setTableLoading(true);
  try {
    const params = new URLSearchParams({
      page:  currentPage,
      limit: itemsPerPage,
    });
    if (activeFilters.type)   params.set('type',   activeFilters.type);
    if (activeFilters.status) params.set('status', activeFilters.status);

    const res  = await apiFetch(`/api/reminders?${params}`);
    if (!res) return;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load reminders');

    totalReminders = data.total      || 0;
    totalPages     = data.totalPages || 1;

    document.getElementById('reminderCountBadge').textContent =
      `${totalReminders} Reminder${totalReminders !== 1 ? 's' : ''}`;

    renderTable(data.results || []);
    updatePagination();
  } catch (err) {
    console.error('Failed to load reminders:', err);
    document.getElementById('reminderTableBody').innerHTML = `
      <tr><td colspan="7" class="table-empty-message" style="color:#dc3545">
        Failed to load reminders. Please refresh.
      </td></tr>`;
  } finally {
    setTableLoading(false);
  }
}

function setTableLoading(loading) {
  if (loading) {
    document.getElementById('reminderTableBody').innerHTML = `
      <tr><td colspan="7" class="table-empty-message">Loading reminders…</td></tr>`;
  }
}

function renderTable(reminders) {
  const tbody = document.getElementById('reminderTableBody');
  tbody.innerHTML = '';

  if (!reminders.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="table-empty-message">No reminders found</td></tr>`;
    return;
  }

  reminders.forEach(r => {
    const row = document.createElement('tr');

    const patientName = r.patient
      ? `${r.patient.givenName} ${r.patient.familyName}`
      : '—';

    const typeIcon = {
      MEDICATION:  '💊',
      APPOINTMENT: '📅',
      LIFESTYLE:   '💡',
    }[r.type] || '🔔';

    const statusClass = {
      PENDING:   'badge-amber',
      SENT:      'badge-green',
      FAILED:    'badge-red',
      CANCELLED: 'badge-gray',
    }[r.status] || '';

    const shortMessage = r.message.length > 60
      ? r.message.slice(0, 60) + '…'
      : r.message;

    row.innerHTML = `
      <td class="table-name">${patientName}</td>
      <td>${typeIcon} ${r.type}</td>
      <td title="${r.message}">${shortMessage}</td>
      <td>${formatDateTime(r.scheduledAt)}</td>
      <td>${r.sentAt ? formatDateTime(r.sentAt) : '—'}</td>
      <td><span class="adherence-badge ${statusClass}">${r.status}</span></td>
      <td>${r.confirmedAt ? '✓ ' + formatDateTime(r.confirmedAt) : '—'}</td>
    `;
    tbody.appendChild(row);
  });
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function updatePagination() {
  document.getElementById('btnPrev').disabled = currentPage <= 1;
  document.getElementById('btnNext').disabled = currentPage >= totalPages;
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalReminders);
  document.getElementById('paginationInfo').textContent =
    totalReminders ? `Showing ${start}–${end} of ${totalReminders}` : 'No results';
  document.getElementById('pageIndicator').textContent =
    `Page ${currentPage} of ${totalPages}`;
}

function setupEventListeners() {
  document.getElementById('filterType').addEventListener('change', () => {
    activeFilters.type = document.getElementById('filterType').value;
    currentPage = 1;
    loadReminders();
  });

  document.getElementById('filterStatus').addEventListener('change', () => {
    activeFilters.status = document.getElementById('filterStatus').value;
    currentPage = 1;
    loadReminders();
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('filterType').value   = '';
    document.getElementById('filterStatus').value = '';
    activeFilters = { type: '', status: '' };
    currentPage   = 1;
    loadReminders();
  });

  document.getElementById('btnPrev').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadReminders(); window.scrollTo(0, 0); }
  });

  document.getElementById('btnNext').addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; loadReminders(); window.scrollTo(0, 0); }
  });
}
