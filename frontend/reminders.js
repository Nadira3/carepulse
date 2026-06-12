// reminders.js — Screen 7: Reminder History
// Full log of SMS sent to patients with expandable rows and real-time filtering

// ── Mock Reminder Data ──────────────────────────────────────────────────────
const mockReminders = [
  // Ade - 3 medication reminders (all Delivered, no response)
  {
    id: 'rem-001',
    patientId: 'patient-1',
    patientName: 'Ade Okafor',
    disease: 'Hypertension',
    messageType: 'Medication',
    messagePreview: 'Good morning! Time to take your Lisinopril 10mg. Please take it with water before breakfast.',
    fullMessage: 'Good morning Ade! Time to take your Lisinopril 10mg. Please take it with water before breakfast. This medication helps control your blood pressure. If you experience any side effects, contact your clinic. Reply YES when taken.',
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },
  {
    id: 'rem-002',
    patientId: 'patient-1',
    patientName: 'Ade Okafor',
    disease: 'Hypertension',
    messageType: 'Medication',
    messagePreview: 'Evening reminder: Take your Lisinopril 10mg before bed with plenty of water.',
    fullMessage: 'Evening reminder Ade: Take your Lisinopril 10mg before bed with plenty of water. This helps manage your blood pressure overnight. Reply YES when taken.',
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },
  {
    id: 'rem-003',
    patientId: 'patient-1',
    patientName: 'Ade Okafor',
    disease: 'Hypertension',
    messageType: 'Medication',
    messagePreview: 'Morning dose: Your Lisinopril 10mg is due. Take with breakfast and water as prescribed.',
    fullMessage: 'Morning dose Ade: Your Lisinopril 10mg is due. Take with breakfast and water as prescribed. Consistent timing helps control your blood pressure better.',
    sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },

  // Ngozi - 2 medication reminders + 1 appointment reminder (all Responded: YES)
  {
    id: 'rem-004',
    patientId: 'patient-2',
    patientName: 'Ngozi Amara',
    disease: 'Diabetes Type 2',
    messageType: 'Medication',
    messagePreview: 'Time for your Metformin 500mg. Take with food for better absorption and to avoid stomach upset.',
    fullMessage: 'Hi Ngozi! Time for your Metformin 500mg. Take with food for better absorption and to avoid stomach upset. This helps control your blood sugar. Reply YES when taken.',
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Responded',
    patientResponse: 'YES'
  },
  {
    id: 'rem-005',
    patientId: 'patient-2',
    patientName: 'Ngozi Amara',
    disease: 'Diabetes Type 2',
    messageType: 'Appointment',
    messagePreview: 'Reminder: Your follow-up appointment is scheduled for tomorrow at 2:00 PM at the Endocrinology clinic.',
    fullMessage: 'Reminder Ngozi: Your follow-up appointment is scheduled for tomorrow at 2:00 PM at the Endocrinology clinic. Please arrive 15 minutes early. Reply YES to confirm or RESCHEDULE to request a different time.',
    sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Responded',
    patientResponse: 'YES'
  },
  {
    id: 'rem-006',
    patientId: 'patient-2',
    patientName: 'Ngozi Amara',
    disease: 'Diabetes Type 2',
    messageType: 'Medication',
    messagePreview: 'Evening reminder: Metformin 500mg due. Take with your evening meal for consistency.',
    fullMessage: 'Evening reminder Ngozi: Metformin 500mg is due. Take with your evening meal for consistency. Taking at the same time each day helps maintain steady blood sugar levels.',
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Responded',
    patientResponse: 'YES'
  },

  // Musa - 2 medication reminders (1 Delivered, 1 Failed) + 1 appointment reminder (no response)
  {
    id: 'rem-007',
    patientId: 'patient-3',
    patientName: 'Musa Ibrahim',
    disease: 'Hypertension',
    messageType: 'Medication',
    messagePreview: 'Morning dose due: Amlodipine 5mg with breakfast. Keep taking regularly for blood pressure control.',
    fullMessage: 'Good morning Musa! Your Amlodipine 5mg is due. Take with breakfast and water. Keep taking regularly for blood pressure control. Reply YES when taken.',
    sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },
  {
    id: 'rem-008',
    patientId: 'patient-3',
    patientName: 'Musa Ibrahim',
    disease: 'Hypertension',
    messageType: 'Medication',
    messagePreview: 'Evening reminder: Amlodipine 5mg due before bed. Please take with water.',
    fullMessage: 'Evening reminder Musa: Your Amlodipine 5mg is due before bed. Please take with water. This helps maintain steady blood pressure control throughout the night.',
    sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Failed',
    patientResponse: null
  },
  {
    id: 'rem-009',
    patientId: 'patient-3',
    patientName: 'Musa Ibrahim',
    disease: 'Hypertension',
    messageType: 'Appointment',
    messagePreview: 'IMPORTANT: Your follow-up appointment is due. Please call the clinic on 0801-XXX-XXXX to reschedule.',
    fullMessage: 'IMPORTANT Musa: Your follow-up appointment is due. Please call the clinic on 0801-XXX-XXXX to reschedule. Regular check-ups help track your blood pressure progress.',
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },

  // Additional mock reminders to fill table
  {
    id: 'rem-010',
    patientId: 'patient-1',
    patientName: 'Ade Okafor',
    disease: 'Hypertension',
    messageType: 'Health Tip',
    messagePreview: 'Health tip: Reduce salt intake to help manage your blood pressure better. Aim for less than 5g salt per day.',
    fullMessage: 'Health tip for you Ade: Reduce salt intake to help manage your blood pressure better. Aim for less than 5g salt per day. More information: avoid processed foods and read food labels carefully.',
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },
  {
    id: 'rem-011',
    patientId: 'patient-2',
    patientName: 'Ngozi Amara',
    disease: 'Diabetes Type 2',
    messageType: 'Health Tip',
    messagePreview: 'Healthy eating: Include more vegetables in your meals for better diabetes management.',
    fullMessage: 'Healthy eating tip Ngozi: Include more vegetables in your meals for better diabetes management. Vegetables are low in calories and help maintain steady blood sugar levels.',
    sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  },
  {
    id: 'rem-012',
    patientId: 'patient-3',
    patientName: 'Musa Ibrahim',
    disease: 'Hypertension',
    messageType: 'Medication',
    messagePreview: 'Medication reminder: Ensure you have sufficient stock of Amlodipine. Refill if needed before running out.',
    fullMessage: 'Medication reminder Musa: Ensure you have sufficient stock of Amlodipine. Refill if needed before running out. Contact your pharmacy or clinic to arrange a refill today.',
    sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    deliveryStatus: 'Delivered',
    patientResponse: null
  }
];

// ── Global State ─────────────────────────────────────────────────────────────
let filteredReminders = [...mockReminders];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let expandedRows = new Set();

// ── Initialize Page ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  attachFilterListeners();
  attachTableEventListeners();
  updatePagination();
});

// ── Render Table ─────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('remindersTableBody');
  tbody.innerHTML = '';

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageReminders = filteredReminders.slice(start, end);

  if (pageReminders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-message">No reminders found</td></tr>';
    return;
  }

  pageReminders.forEach((reminder, index) => {
    const rowId = `row-${reminder.id}`;
    const isExpanded = expandedRows.has(reminder.id);

    // Main row
    const row = document.createElement('tr');
    row.className = 'reminder-row';
    row.id = rowId;
    row.innerHTML = `
      <td class="cell-expand">
        <button class="expand-btn" data-id="${reminder.id}" title="Expand row">
          ${isExpanded ? '▼' : '▶'}
        </button>
      </td>
      <td class="cell-patient">
        <a href="#" class="patient-link" data-patient-id="${reminder.patientId}">
          ${reminder.patientName}
        </a>
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
        ${reminder.patientResponse ? `<span class="response-badge">${reminder.patientResponse}</span>` : '—'}
      </td>
    `;
    tbody.appendChild(row);

    // Expanded row (if expanded)
    if (isExpanded) {
      const expandRow = document.createElement('tr');
      expandRow.className = 'expand-details';
      expandRow.id = `expand-${reminder.id}`;
      expandRow.innerHTML = `
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

// ── Filtering ────────────────────────────────────────────────────────────────
function applyFilters() {
  const searchPatient = document.getElementById('searchPatient').value.toLowerCase();
  const messageType = document.getElementById('filterMessageType').value;
  const deliveryStatus = document.getElementById('filterDeliveryStatus').value;
  const dateRange = document.getElementById('filterDateRange').value;

  filteredReminders = mockReminders.filter(reminder => {
    // Patient name filter
    if (searchPatient && !reminder.patientName.toLowerCase().includes(searchPatient)) {
      return false;
    }

    // Message type filter
    if (messageType && reminder.messageType !== messageType) {
      return false;
    }

    // Delivery status filter
    if (deliveryStatus && reminder.deliveryStatus !== deliveryStatus) {
      return false;
    }

    // Date range filter
    if (dateRange) {
      const reminderDate = reminder.sentAt.toISOString().split('T')[0];
      if (reminderDate !== dateRange) {
        return false;
      }
    }

    return true;
  });

  currentPage = 1;
  renderTable();
}

// ── Filter Event Listeners ───────────────────────────────────────────────────
function attachFilterListeners() {
  document.getElementById('searchPatient').addEventListener('input', applyFilters);
  document.getElementById('filterMessageType').addEventListener('change', applyFilters);
  document.getElementById('filterDeliveryStatus').addEventListener('change', applyFilters);
  document.getElementById('filterDateRange').addEventListener('change', applyFilters);

  document.getElementById('filterResetBtn').addEventListener('click', () => {
    document.getElementById('searchPatient').value = '';
    document.getElementById('filterMessageType').value = '';
    document.getElementById('filterDeliveryStatus').value = '';
    document.getElementById('filterDateRange').value = '';
    filteredReminders = [...mockReminders];
    currentPage = 1;
    expandedRows.clear();
    renderTable();
  });
}

// ── Table Event Listeners ────────────────────────────────────────────────────
function attachTableEventListeners() {
  const tbody = document.getElementById('remindersTableBody');

  tbody.addEventListener('click', (e) => {
    // Expand/collapse row
    if (e.target.classList.contains('expand-btn')) {
      const reminderId = e.target.dataset.id;
      if (expandedRows.has(reminderId)) {
        expandedRows.delete(reminderId);
      } else {
        expandedRows.add(reminderId);
      }
      renderTable();
      attachTableEventListeners(); // Re-attach after re-render
    }

    // Patient link click
    if (e.target.classList.contains('patient-link')) {
      e.preventDefault();
      const patientId = e.target.dataset.patientId;
      sessionStorage.setItem('selectedPatientId', patientId);
      // In a real app, this would navigate to patient profile
      // For now, show a notification
      showToast(`View patient profile for ${e.target.textContent}`);
    }
  });
}

// ── Pagination ───────────────────────────────────────────────────────────────
function updatePagination() {
  const total = filteredReminders.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const start = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

  document.getElementById('paginationStart').textContent = start;
  document.getElementById('paginationEnd').textContent = end;
  document.getElementById('paginationTotal').textContent = total;
  document.getElementById('paginationPages').textContent = `Page ${currentPage} of ${totalPages}`;

  const prevBtn = document.getElementById('paginationPrev');
  const nextBtn = document.getElementById('paginationNext');

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };
}

// ── Helper Functions ─────────────────────────────────────────────────────────
function formatDateTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#008B8B'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
