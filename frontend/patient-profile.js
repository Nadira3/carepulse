// patient-profile.js — CarePulse Patient Profile
document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const hospitalEl = document.getElementById('hospitalName');
  if (hospitalEl) hospitalEl.textContent = user.hospitalName || 'ISTH Irrua';

  setupEventListeners();
  loadPatientProfile();
});

function loadPatientProfile() {
  const profileContainer = document.getElementById('profileContainer');
  const profileLoading = document.getElementById('profileLoading');
  const profileError = document.getElementById('profileError');

  try {
    const selectedPatientStr = sessionStorage.getItem('selectedPatient');
    if (!selectedPatientStr) {
      showError();
      return;
    }

    const patient = JSON.parse(selectedPatientStr);
    profileLoading.style.display = 'none';
    profileError.style.display = 'none';
    profileContainer.style.display = 'block';

    populateProfile(patient);
  } catch (err) {
    console.error('Failed to load patient profile:', err);
    showError();
  }
}

function populateProfile(patient) {
  // Patient header info
  document.getElementById('patientName').textContent = patient.name || '—';
  document.getElementById('patientId').textContent = `ID: ${patient.id || '—'}`;
  document.getElementById('patientPhone').textContent = `Phone: ${patient.phone || '—'}`;
  document.getElementById('patientAge').textContent = patient.age || '—';
  document.getElementById('patientDisease').textContent = patient.disease || '—';
  document.getElementById('patientGroup').textContent = patient.group === 'CarePulse' ? '✓ CarePulse' : '○ Control';
  
  // Adherence badge and rate
  const adherenceRate = patient.adherenceRate || 0;
  const badge = getAdherenceBadge(adherenceRate);
  document.getElementById('adherenceBadgeLarge').textContent = badge.label;
  document.getElementById('adherenceBadgeLarge').className = `badge-large ${badge.class}`;
  document.getElementById('adherenceRate').textContent = adherenceRate + '%';

  // SMS and response stats
  document.getElementById('responseRate').textContent = (patient.responseRate || 0) + '%';
  document.getElementById('smsStatus').textContent = patient.smsStatus || 'N/A';
  document.getElementById('smsStatus').className = 
    patient.smsStatus === 'Delivered' ? 'stat-number badge-delivered' : 
    patient.smsStatus === 'Failed' ? 'stat-number badge-failed' : 
    'stat-number badge-neutral';

  // Calculate total SMS (estimate based on response rate and delivered status)
  const estimatedSMS = patient.group === 'CarePulse' ? Math.round(100 * 3 * (patient.responseRate / 100)) : 0;
  document.getElementById('totalSMS').textContent = estimatedSMS || '—';

  // Adherence trend (3-month progression)
  const mo1 = patient.mo1Adherence || 0;
  const mo2 = patient.mo2Adherence || 0;
  const mo3 = patient.mo3Adherence || 0;

  document.getElementById('trendMo1').style.width = mo1 + '%';
  document.getElementById('trendMo1Label').textContent = mo1 + '%';

  document.getElementById('trendMo2').style.width = mo2 + '%';
  document.getElementById('trendMo2Label').textContent = mo2 + '%';

  document.getElementById('trendMo3').style.width = mo3 + '%';
  document.getElementById('trendMo3Label').textContent = mo3 + '%';

  // Trend summary
  const trend = mo3 - mo1;
  let trendText = '';
  if (trend > 0) {
    trendText = `📈 Improving: +${trend}% over 3 months`;
  } else if (trend < 0) {
    trendText = `📉 Declining: ${trend}% over 3 months`;
  } else {
    trendText = `➡️ Stable: No change over 3 months`;
  }
  document.getElementById('trendSummary').textContent = trendText;

  // Missed appointments
  const missedAppointments = patient.missedAppointments || { mo1: 0, mo2: 0, mo3: 0 };
  document.getElementById('missedMo1').textContent = missedAppointments.mo1 || '0';
  document.getElementById('missedMo2').textContent = missedAppointments.mo2 || '0';
  document.getElementById('missedMo3').textContent = missedAppointments.mo3 || '0';

  // Store patient for edit/medication views
  sessionStorage.setItem('currentPatient', JSON.stringify(patient));
}

function getAdherenceBadge(adherence) {
  if (adherence >= 80) return { label: 'On Track',      class: 'badge-green' };
  if (adherence >= 50) return { label: 'At Risk',       class: 'badge-amber' };
  return                      { label: 'Non-Adherent',  class: 'badge-red'   };
}

function showError() {
  document.getElementById('profileContainer').style.display = 'none';
  document.getElementById('profileLoading').style.display = 'none';
  document.getElementById('profileError').style.display = 'block';
}

function setupEventListeners() {
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'patients.html';
  });

  document.getElementById('errorBackBtn').addEventListener('click', () => {
    window.location.href = 'patients.html';
  });

  document.getElementById('editPatientBtn').addEventListener('click', () => {
    window.location.href = 'edit-patient.html';
  });

  document.getElementById('viewMedicationsBtn').addEventListener('click', () => {
    window.location.href = 'medication.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });
}
