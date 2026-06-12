<<<<<<< HEAD
// settings.js — Screen 8: Admin Settings
// Configuration panel for hospital settings, SMS, reminders, and AI

// ── Default Settings ────────────────────────────────────────────────────────
const defaultSettings = {
  hospital: {
    name: 'ISTH Irrua',
    address: '',
    adminName: '',
    contactEmail: ''
  },
  sms: {
    senderId: 'CarePulse',
    defaultLanguage: 'English',
    smsProvider: 'Termii'
  },
  reminders: {
    medicationReminders: true,
    appointmentReminders: true,
    healthTips: true,
    appointmentLeadTime: '3'
  },
  gemini: {
    messageStyle: 'Friendly',
    includePatientName: true,
    includeMedicationName: true
  }
};

// ── Initialize Settings Page ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettingsFromStorage();
  attachToggleListeners();
});

// ── Load Settings from Local Storage ────────────────────────────────────────
function loadSettingsFromStorage() {
  const stored = localStorage.getItem('carepulseSettings');
  const settings = stored ? JSON.parse(stored) : defaultSettings;

  // Hospital Profile
  document.getElementById('hospitalName').value = settings.hospital.name;
  document.getElementById('hospitalAddress').value = settings.hospital.address;
  document.getElementById('adminName').value = settings.hospital.adminName;
  document.getElementById('contactEmail').value = settings.hospital.contactEmail;

  // SMS Configuration
  document.getElementById('smsSenderId').value = settings.sms.senderId;
  document.getElementById('defaultLanguage').value = settings.sms.defaultLanguage;
  document.getElementById('smsProvider').value = settings.sms.smsProvider;

  // Reminder Defaults
  document.getElementById('medicationToggle').checked = settings.reminders.medicationReminders;
  document.getElementById('appointmentToggle').checked = settings.reminders.appointmentReminders;
  document.getElementById('healthTipToggle').checked = settings.reminders.healthTips;
  document.getElementById('appointmentLeadTime').value = settings.reminders.appointmentLeadTime;

  // Gemini Settings
  document.getElementById('messageStyle').value = settings.gemini.messageStyle;
  document.getElementById('includePatientName').checked = settings.gemini.includePatientName;
  document.getElementById('includeMedicationName').checked = settings.gemini.includeMedicationName;
}

// ── Save Hospital Settings ──────────────────────────────────────────────────
function saveHospitalSettings() {
  const settings = getStoredSettings();
  
  settings.hospital = {
    name: document.getElementById('hospitalName').value,
    address: document.getElementById('hospitalAddress').value,
    adminName: document.getElementById('adminName').value,
    contactEmail: document.getElementById('contactEmail').value
  };

  if (!validateEmail(settings.hospital.contactEmail) && settings.hospital.contactEmail) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  saveSettings(settings);
  showToast('Hospital settings saved successfully', 'success');
}

// ── Save SMS Settings ───────────────────────────────────────────────────────
function saveSmsSettings() {
  const settings = getStoredSettings();
  const senderId = document.getElementById('smsSenderId').value.trim();

  if (!senderId) {
    showToast('SMS Sender ID is required', 'error');
    return;
  }

  if (senderId.length > 11) {
    showToast('SMS Sender ID must be 11 characters or less', 'error');
    return;
  }

  settings.sms = {
    senderId: senderId,
    defaultLanguage: document.getElementById('defaultLanguage').value,
    smsProvider: 'Termii'
  };

  saveSettings(settings);
  showToast('SMS settings saved successfully', 'success');
}

// ── Save Reminder Settings ──────────────────────────────────────────────────
function saveReminderSettings() {
  const settings = getStoredSettings();

  settings.reminders = {
    medicationReminders: document.getElementById('medicationToggle').checked,
    appointmentReminders: document.getElementById('appointmentToggle').checked,
    healthTips: document.getElementById('healthTipToggle').checked,
    appointmentLeadTime: document.getElementById('appointmentLeadTime').value
  };

  saveSettings(settings);
  showToast('Reminder settings saved successfully', 'success');
}

// ── Save Gemini Settings ────────────────────────────────────────────────────
function saveGeminiSettings() {
  const settings = getStoredSettings();

  settings.gemini = {
    messageStyle: document.getElementById('messageStyle').value,
    includePatientName: document.getElementById('includePatientName').checked,
    includeMedicationName: document.getElementById('includeMedicationName').checked
  };

  saveSettings(settings);
  showToast('AI settings saved successfully', 'success');
}

// ── Get Settings from Storage ───────────────────────────────────────────────
function getStoredSettings() {
  const stored = localStorage.getItem('carepulseSettings');
  return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultSettings));
}

// ── Save Settings to Storage ────────────────────────────────────────────────
function saveSettings(settings) {
  localStorage.setItem('carepulseSettings', JSON.stringify(settings));
}

// ── Attach Toggle Listeners ─────────────────────────────────────────────────
function attachToggleListeners() {
  const toggles = document.querySelectorAll('.toggle-switch input');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      // Visual feedback for toggle change
      this.parentElement.parentElement.classList.add('toggled');
    });
  });
}

// ── Reset Confirmation Modal ────────────────────────────────────────────────
function showResetConfirmation() {
  const modal = document.getElementById('confirmationModal');
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('confirmationModal');
  modal.classList.add('hidden');
}

function confirmReset() {
  // Clear settings from localStorage
  localStorage.removeItem('carepulseSettings');
  
  // Reload the page to restore defaults
  closeModal();
  showToast('All settings have been reset to defaults', 'success');
  
  setTimeout(() => {
    location.reload();
  }, 1500);
}

// ── Modal Click Outside Handler ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('confirmationModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});

// ── Helper Functions ────────────────────────────────────────────────────────
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
=======
// settings.js — CarePulse Settings
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  document.getElementById('myName').value  = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  document.getElementById('myEmail').value = currentUser.email || '';
  document.getElementById('myRole').value  = currentUser.role  || '';

  // Show admin section only for admins
  if (currentUser.role === 'ADMIN') {
    document.getElementById('adminSection').style.display = 'block';
    await loadUsers();
  }

  setupEventListeners();
});

async function loadUsers() {
  try {
    const data  = await listUsers();
    renderUsers(data.results || []);
  } catch (err) {
    console.error('Failed to load users:', err);
    document.getElementById('usersTableBody').innerHTML =
      '<tr><td colspan="6" class="table-empty-message" style="color:#dc3545">Failed to load users</td></tr>';
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty-message">No users found</td></tr>';
    return;
  }

  users.forEach(u => {
    const row        = document.createElement('tr');
    const isMe       = u.id === currentUser.id;
    const lastLogin  = u.lastLoginAt
      ? new Date(u.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
      : 'Never';

    row.innerHTML = `
      <td>${u.firstName} ${u.lastName} ${isMe ? '<span class="adherence-badge badge-green">You</span>' : ''}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${lastLogin}</td>
      <td><span class="adherence-badge ${u.isActive ? 'badge-green' : 'badge-red'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        ${!isMe ? `
          <button class="action-icon" onclick="toggleUserStatus('${u.id}', ${u.isActive})"
            title="${u.isActive ? 'Deactivate' : 'Activate'}">
            ${u.isActive ? '🔒' : '🔓'}
          </button>
        ` : '—'}
      </td>
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

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('addClinicianForm').style.display = 'block';
      btnAdd.style.display = 'none';
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      document.getElementById('addClinicianForm').style.display = 'none';
      document.getElementById('btnAddClinician').style.display  = 'inline-block';
      clearForm();
    });
  }

  if (btnCreate) {
    btnCreate.addEventListener('click', handleCreateClinician);
  }
}

async function handleCreateClinician() {
  const firstName = document.getElementById('newFirstName').value.trim();
  const lastName  = document.getElementById('newLastName').value.trim();
  const email     = document.getElementById('newEmail').value.trim();
  const password  = document.getElementById('newPassword').value;
  const role      = document.getElementById('newRole').value;

  if (!firstName || !lastName || !email || !password) {
    showToast('All fields are required', 'error');
    return;
  }

  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  const btnCreate = document.getElementById('btnCreateClinician');
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
    document.getElementById(id).value = '';
  });
  document.getElementById('newRole').value = 'CLINICIAN';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
>>>>>>> 24f8a8f430a48320d4e982f5eb932fdb328e0fef
}
