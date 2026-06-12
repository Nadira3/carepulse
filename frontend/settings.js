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
}
