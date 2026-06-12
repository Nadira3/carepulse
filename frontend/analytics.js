// analytics.js — Screen 6: Programme Analytics Dashboard
// Displays static charts from Joshua's research, handles export and date range

// ── KPI Data by Date Range ─────────────────────────────────────────────────
const kpiData = {
  '1month': {
    adherenceRate: 72,
    missedAppointments: 18,
    messagesSent: 950,
    deliveryRate: 94
  },
  '3months': {
    adherenceRate: 78,
    missedAppointments: 14,
    messagesSent: 2847,
    deliveryRate: 96
  },
  '6months': {
    adherenceRate: 82,
    missedAppointments: 10,
    messagesSent: 5694,
    deliveryRate: 97
  },
  '1year': {
    adherenceRate: 85,
    missedAppointments: 8,
    messagesSent: 11388,
    deliveryRate: 98
  }
};

// ── Initialize Analytics Page ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set initial date range and KPIs
  const dateRange = document.getElementById('dateRange').value;
  updateKpis(dateRange);

  // Date range selector change event
  document.getElementById('dateRange').addEventListener('change', (e) => {
    updateKpis(e.target.value);
  });

  // Export button
  document.getElementById('exportBtn').addEventListener('click', handleExport);

  // Set hospital name in navbar
  const hospitalName = sessionStorage.getItem('hospitalName') || 'CarePulse Hospital';
  document.getElementById('hospitalName').textContent = hospitalName;

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// ── Update KPI Cards Based on Date Range ────────────────────────────────────
function updateKpis(dateRange) {
  const data = kpiData[dateRange];
  
  if (data) {
    document.getElementById('kpiAdherence').textContent = data.adherenceRate + '%';
    document.getElementById('kpiMissedAppt').textContent = data.missedAppointments + '%';
    document.getElementById('kpiMessagesSent').textContent = data.messagesSent.toLocaleString();
    document.getElementById('kpiDeliveryRate').textContent = data.deliveryRate + '%';
  }
}

// ── Handle Export to PDF ────────────────────────────────────────────────────
function handleExport() {
  const dateRange = document.getElementById('dateRange').value;
  const dateText = {
    '1month': 'Last 1 Month',
    '3months': 'Last 3 Months',
    '6months': 'Last 6 Months',
    '1year': 'Last 1 Year'
  }[dateRange];

  showToast(`PDF export prepared for ${dateText}. Integration with backend pending.`, 'info');
}

// ── Logout Handler ──────────────────────────────────────────────────────────
function handleLogout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ── Toast Notification ──────────────────────────────────────────────────────
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

// ── Toast Notification ─────────────────────────────────────────────────────
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

// ── Toast Animations ──────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);
