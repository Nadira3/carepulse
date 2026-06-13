// reminders.js — CarePulse Reminder History
// Design by Imahe — API integration by Precious

// ── Global State ─────────────────────────────────────────────────────────────
let allReminders     = [];
let filteredReminders = [];
let currentPage      = 1;
const ITEMS_PER_PAGE = 10;
let expandedRows     = new Set();
let searchTimeout;

// ── Initialize Page ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadReminders();
  attachFilterListeners();
  attachTableEventListeners();
});

// ── Load from API ─────────────────────────────────────────────────────────────
async function loadReminders() {
  const tbody = document.getElementById('remindersTableBody');
  tbody.innerHTML = '<tr><td colspan="8" class="empty-message">Loading reminders…</td></tr>';

  try {
    const res  = await apiFetch('/api/reminders?limit=200');
    if (!res) return;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load reminders');

    // Normalise API response to match the shape the render functions expect
    allReminders = (data.results || []).map(r => ({
      id:              r.id,
      patientId:       r.patientId,
      patientName:     r.patient
                         ? `${r.patient.givenName} ${r.patient.familyName}`
                         : 'Unknown',
      disease:         r.patient?.primaryDiagnosis || '—',
      messageType:     normaliseType(r.type),
      messagePreview:  r.message,
      fullMessage:     r.message,
      sentAt:          r.sentAt ? new Date(r.sentAt) : new Date(r.scheduledAt),
      deliveryStatus:  normaliseStatus(r.status, r.confirmedAt),
      patientResponse: r.confirmedAt ? 'CONFIRM' : null,
    }));

    filteredReminders = [...allReminders];
    renderTable();
    updatePagination();
  } catch (err) {
    console.error('Failed to load reminders:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="empty-message" style="color:#dc3545">
      Failed to load reminders. Please refresh.
    </td></tr>`;
  }
}

function normaliseType(type) {
  const map = { MEDICATION: 'Medication', APPOINTMENT: 'Appointment', LIFESTYLE: 'Health Tip' };
  return map[type] || type;
}

function normaliseStatus(status, confirmedAt) {
  if (confirmedAt) return 'Responded';
  const map = { SENT: 'Delivered', FAILED: 'Failed', PENDING: 'Pending', CANCELLED: 'Cancelled' };
  return map[status] || status;
}

// ── Render Table ─────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('remindersTableBody');
  tbody.innerHTML = '';

  const start        = (currentPage - 1) * ITEMS_PER_PAGE;
  const end          = start + ITEMS_PER_PAGE;
  const pageReminders = filteredReminders.slice(start, end);

  if (pageReminders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-message">No reminders found</td></tr>';
    updatePagination();
    return;
  }

  pageReminders.forEach(reminder => {
    const isExpanded = expandedRows.has(reminder.id);

    const row = document.createElement('tr');
    row.className = 'reminder-row';
    row.id        = `row-${reminder.id}`;
    row.innerHTML = `
      <td class="cell-expand">
        <button class="expand-btn" data-id="${reminder.id}" title="Expand row">
          ${isExpanded ? '▼' : '▶'}
        </button>
      </td>
      <td class="cell-patient">
        <span class="patient-link" data-patient-id="${reminder.patientId}">
          ${reminder.patientName}
        </span>
      </td>
      <td class="cell-disease">${reminder.disease}</td>
      <td class="cell-type">${reminder.messageType}</td>
      <td class="cell-preview">${reminder.messagePreview.substring(0, 60)}${reminder.messagePreview.length > 60 ? '...' : ''}</td>
      <td class="cell-sent">${formatDateTime(reminder.sentAt)}</td>
      <td class="cell-status">
        <span class="status-badge status-${reminder.deliveryStatus.toLowerCase()}">
          ${reminder.deliveryStatus}
        </span>
      </td>
      <td class="cell-response">
        ${reminder.patientResponse
          ? `<span class="response-badge">${reminder.patientResponse}</span>`
          : '—'}
      </td>
    `;
    tbody.appendChild(row);

    if (isExpanded) {
      const expandRow       = document.createElement('tr');
      expandRow.className   = 'expand-details';
      expandRow.id          = `expand-${reminder.id}`;
      expandRow.innerHTML   = `
        <td colspan="8">
          <div class="message-details">
            <h4>Full Message</h4>
            <p class="full-message-text">${reminder.fullMessage}</p>
            <p class="message-meta">
              Sent: <strong>${formatDateTime(reminder.sentAt)}</strong> |
              Status: <span class="status-badge status-${reminder.deliveryStatus.toLowerCase()}">${reminder.deliveryStatus}</span>
              ${reminder.patientResponse ? ` | Response: <strong>${reminder.patientResponse}</strong>` : ''}
            </p>
          </div>
        </td>
      `;
      tbody.appendChild(expandRow);
    }
  });

  updatePagination();
}

// ── Filtering ─────────────────────────────────────────────────────────────────
function applyFilters() {
  const searchPatient  = document.getElementById('searchPatient').value.toLowerCase();
  const messageType    = document.getElementById('filterMessageType').value;
  const deliveryStatus = document.getElementById('filterDeliveryStatus').value;
  const dateRange      = document.getElementById('filterDateRange').value;

  filteredReminders = allReminders.filter(reminder => {
    if (searchPatient && !reminder.patientName.toLowerCase().includes(searchPatient)) return false;
    if (messageType    && reminder.messageType    !== messageType)    return false;
    if (deliveryStatus && reminder.deliveryStatus !== deliveryStatus) return false;
    if (dateRange) {
      const reminderDate = reminder.sentAt.toISOString().split('T')[0];
      if (reminderDate !== dateRange) return false;
    }
    return true;
  });

  currentPage = 1;
  renderTable();
}

// ── Filter Event Listeners ────────────────────────────────────────────────────
function attachFilterListeners() {
  document.getElementById('searchPatient').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });
  document.getElementById('filterMessageType').addEventListener('change', applyFilters);
  document.getElementById('filterDeliveryStatus').addEventListener('change', applyFilters);
  document.getElementById('filterDateRange').addEventListener('change', applyFilters);

  document.getElementById('filterResetBtn').addEventListener('click', () => {
    document.getElementById('searchPatient').value        = '';
    document.getElementById('filterMessageType').value    = '';
    document.getElementById('filterDeliveryStatus').value = '';
    document.getElementById('filterDateRange').value      = '';
    filteredReminders = [...allReminders];
    currentPage       = 1;
    expandedRows.clear();
    renderTable();
  });
}

// ── Table Event Listeners ─────────────────────────────────────────────────────
function attachTableEventListeners() {
  const tbody = document.getElementById('remindersTableBody');

  tbody.addEventListener('click', (e) => {
    const expandBtn = e.target.closest('.expand-btn');
    if (expandBtn) {
      const reminderId = expandBtn.dataset.id;
      if (expandedRows.has(reminderId)) {
        expandedRows.delete(reminderId);
      } else {
        expandedRows.add(reminderId);
      }
      renderTable();
      return;
    }

    const patientLink = e.target.closest('.patient-link');
    if (patientLink) {
      showToast(`Loading patient profile…`);
    }
  });
}

// ── Pagination ────────────────────────────────────────────────────────────────
function updatePagination() {
  const total      = filteredReminders.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;
  const start      = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end        = Math.min(currentPage * ITEMS_PER_PAGE, total);

  document.getElementById('paginationStart').textContent = start;
  document.getElementById('paginationEnd').textContent   = end;
  document.getElementById('paginationTotal').textContent = total;
  document.getElementById('paginationPages').textContent = `Page ${currentPage} of ${totalPages}`;

  const prevBtn = document.getElementById('paginationPrev');
  const nextBtn = document.getElementById('paginationNext');

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  prevBtn.onclick = () => { if (currentPage > 1)           { currentPage--; renderTable(); } };
  nextBtn.onclick = () => { if (currentPage < totalPages)  { currentPage++; renderTable(); } };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(date) {
  if (!date) return '—';
  const now      = new Date();
  const diffMs   = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs  < 24) return `${diffHrs}h ago`;
  if (diffDays < 7)  return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { year: '2-digit', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'info') {
  const toast      = document.createElement('div');
  toast.className  = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#008B8B'};
    color: white; padding: 12px 20px; border-radius: 4px;
    font-size: 14px; z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
