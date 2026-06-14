// settings.js — CarePulse Settings
// Profile + Clinician Management (API) + Hospital/SMS/Reminder/AI config (localStorage)

let currentUser = null;

// ── Default Settings ──────────────────────────────────────────────────────
const defaultSettings = {
  hospital:  { name: 'ISTH Irrua', address: '', adminName: '', contactEmail: '' },
  sms:       { senderId: 'CarePulse', defaultLanguage: 'English' },
  reminders: { medicationReminders: true, appointmentReminders: true, healthTips: true, appointmentLeadTime: '3' },
  gemini:    { messageStyle: 'Friendly', includePatientName: true, includeMedicationName: true },
};

document.addEventListener('DOMContentLoaded', async () => {
  // Load user profile from sessionStorage
  currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const myName = document.getElementById('myName');
  const myEmail = document.getElementById('myEmail');
  const myRole  = document.getElementById('myRole');

  if (myName)  myName.value  = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  if (myEmail) myEmail.value = currentUser.email || '';
  if (myRole)  myRole.value  = currentUser.role  || '';

  // Show admin section only for admins
  if (currentUser.role === 'ADMIN') {
    const adminSection = document.getElementById('adminSection');
    if (adminSection) {
      adminSection.style.display = 'block';
      await loadUsers();
    }
  }

  // Load hospital/SMS/reminder/AI settings from localStorage
  loadSettingsFromStorage();
  attachToggleListeners();
  setupEventListeners();
});

// ── Profile & Clinician Management ────────────────────────────────────────
async function loadUsers() {
  try {
    const data = await listUsers();
    renderUsers(data.results || []);
  } catch (err) {
    console.error('Failed to load users:', err);
    const tbody = document.getElementById('usersTableBody');
    if (tbody) tbody.innerHTML =
      '<tr><td colspan="6" class="table-empty-message" style="color:#dc3545">Failed to load users</td></tr>';
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty-message">No users found</td></tr>';
    return;
  }

  users.forEach(u => {
    const row      = document.createElement('tr');
    const isMe     = u.id === currentUser.id;
    const lastLogin = u.lastLoginAt
      ? new Date(u.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
      : 'Never';

    row.innerHTML = `
      <td>${u.firstName} ${u.lastName} ${isMe ? '<span class="adherence-badge badge-green">You</span>' : ''}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${lastLogin}</td>
      <td><span class="adherence-badge ${u.isActive ? 'badge-green' : 'badge-red'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>${!isMe ? `<button class="action-icon" onclick="toggleUserStatus('${u.id}', ${u.isActive})" title="${u.isActive ? 'Deactivate' : 'Activate'}">${u.isActive ? '🔒' : '🔓'}</button>` : '—'}</td>
    `;
    tbody.appendChild(row);
  });
}

async function toggleUserStatus(id, currentlyActive) {
  try {
    await updateUserStatus(id, !currentlyActive);
    showToast(`User ${currentlyActive ? 'deactivated' : 'activated'} successfully`);
    await loadUsers();
  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  }
}

function setupEventListeners() {
  const btnAdd    = document.getElementById('btnAddClinician');
  const btnCancel = document.getElementById('btnCancelAdd');
  const btnCreate = document.getElementById('btnCreateClinician');

  if (btnAdd) btnAdd.addEventListener('click', () => {
    document.getElementById('addClinicianForm').style.display = 'block';
    btnAdd.style.display = 'none';
  });

  if (btnCancel) btnCancel.addEventListener('click', () => {
    document.getElementById('addClinicianForm').style.display = 'none';
    document.getElementById('btnAddClinician').style.display  = 'inline-block';
    clearForm();
  });

  if (btnCreate) btnCreate.addEventListener('click', handleCreateClinician);
}

async function handleCreateClinician() {
  const firstName = document.getElementById('newFirstName').value.trim();
  const lastName  = document.getElementById('newLastName').value.trim();
  const email     = document.getElementById('newEmail').value.trim();
  const password  = document.getElementById('newPassword').value;
  const role      = document.getElementById('newRole').value;

  if (!firstName || !lastName || !email || !password) {
    showToast('All fields are required', 'error'); return;
  }
  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error'); return;
  }

  const btnCreate       = document.getElementById('btnCreateClinician');
  btnCreate.disabled    = true;
  btnCreate.textContent = 'Creating…';

  try {
    await createClinician({ firstName, lastName, email, password, role });
    showToast(`${role === 'ADMIN' ? 'Admin' : 'Clinician'} account created successfully`);
    document.getElementById('addClinicianForm').style.display = 'none';
    document.getElementById('btnAddClinician').style.display  = 'inline-block';
    clearForm();
    await loadUsers();
  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  } finally {
    btnCreate.disabled    = false;
    btnCreate.textContent = '✓ Create Account';
  }
}

function clearForm() {
  ['newFirstName','newLastName','newEmail','newPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const roleEl = document.getElementById('newRole');
  if (roleEl) roleEl.value = 'CLINICIAN';
}

// ── Hospital / SMS / Reminder / AI Settings (localStorage) ───────────────
function loadSettingsFromStorage() {
  const stored   = localStorage.getItem('carepulseSettings');
  const settings = stored ? JSON.parse(stored) : defaultSettings;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const chk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

  set('hospitalName',        settings.hospital.name);
  set('hospitalAddress',     settings.hospital.address);
  set('adminName',           settings.hospital.adminName);
  set('contactEmail',        settings.hospital.contactEmail);
  set('smsSenderId',         settings.sms.senderId);
  set('defaultLanguage',     settings.sms.defaultLanguage);
  set('appointmentLeadTime', settings.reminders.appointmentLeadTime);
  set('messageStyle',        settings.gemini.messageStyle);
  chk('medicationToggle',    settings.reminders.medicationReminders);
  chk('appointmentToggle',   settings.reminders.appointmentReminders);
  chk('healthTipToggle',     settings.reminders.healthTips);
  chk('includePatientName',  settings.gemini.includePatientName);
  chk('includeMedicationName', settings.gemini.includeMedicationName);
}

function getStoredSettings() {
  const stored = localStorage.getItem('carepulseSettings');
  return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultSettings));
}

function saveSettings(settings) {
  localStorage.setItem('carepulseSettings', JSON.stringify(settings));
}

function saveHospitalSettings() {
  const settings = getStoredSettings();
  settings.hospital = {
    name:         document.getElementById('hospitalName')?.value || '',
    address:      document.getElementById('hospitalAddress')?.value || '',
    adminName:    document.getElementById('adminName')?.value || '',
    contactEmail: document.getElementById('contactEmail')?.value || '',
  };
  saveSettings(settings);
  showToast('Hospital settings saved', 'success');
}

function saveSmsSettings() {
  const senderId = document.getElementById('smsSenderId')?.value.trim() || '';
  if (!senderId)       { showToast('SMS Sender ID is required', 'error'); return; }
  if (senderId.length > 11) { showToast('Sender ID must be ≤11 characters', 'error'); return; }
  const settings = getStoredSettings();
  settings.sms = {
    senderId,
    defaultLanguage: document.getElementById('defaultLanguage')?.value || 'English',
  };
  saveSettings(settings);
  showToast('SMS settings saved', 'success');
}

function saveReminderSettings() {
  const settings = getStoredSettings();
  settings.reminders = {
    medicationReminders:  document.getElementById('medicationToggle')?.checked ?? true,
    appointmentReminders: document.getElementById('appointmentToggle')?.checked ?? true,
    healthTips:           document.getElementById('healthTipToggle')?.checked ?? true,
    appointmentLeadTime:  document.getElementById('appointmentLeadTime')?.value || '3',
  };
  saveSettings(settings);
  showToast('Reminder settings saved', 'success');
}

function saveGeminiSettings() {
  const settings = getStoredSettings();
  settings.gemini = {
    messageStyle:          document.getElementById('messageStyle')?.value || 'Friendly',
    includePatientName:    document.getElementById('includePatientName')?.checked ?? true,
    includeMedicationName: document.getElementById('includeMedicationName')?.checked ?? true,
  };
  saveSettings(settings);
  showToast('AI settings saved', 'success');
}

function attachToggleListeners() {
  document.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', function() {
      this.parentElement.parentElement.classList.add('toggled');
    });
  });
}

function showResetConfirmation() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.add('hidden');
}

function confirmReset() {
  localStorage.removeItem('carepulseSettings');
  closeModal();
  showToast('Settings reset to defaults', 'success');
  setTimeout(() => location.reload(), 1500);
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  // Use existing toast div if present (our design)
  const existing = document.getElementById('toast');
  if (existing) {
    document.getElementById('toastMessage').textContent = message;
    existing.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    existing.classList.add('show');
    setTimeout(() => existing.classList.remove('show'), 4000);
    return;
  }
  // Fallback inline toast (Imahe's design)
  const toast      = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#008B8B'};color:white;padding:12px 20px;border-radius:4px;font-size:14px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.15)`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
