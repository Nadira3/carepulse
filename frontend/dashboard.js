// dashboard.js — CarePulse Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await Promise.all([loadStats(), loadActivityFeed()]);
});

async function loadStats() {
  try {
    const res  = await apiFetch('/api/patients/stats');
    if (!res) return;
    const data = await res.json();

    document.getElementById('statTotalPatients').textContent = data.totalPatients ?? '—';
    document.getElementById('statAdherence').textContent     =
      data.adherence.rate !== undefined ? data.adherence.rate + '%' : '—';

    document.getElementById('statAppointments').textContent = '—';
    document.getElementById('statMessages').textContent     = '—';

    populateAdherenceBar(
      data.adherence.green,
      data.adherence.amber,
      data.adherence.red,
    );
  } catch (err) {
    console.error('Failed to load stats:', err);
    ['statTotalPatients','statAdherence','statAppointments','statMessages']
      .forEach(id => document.getElementById(id).textContent = '—');
  }
}

function populateAdherenceBar(green, amber, red) {
  const total = green + amber + red || 1;
  document.getElementById('adSegmentGreen').style.width = (green / total * 100) + '%';
  document.getElementById('adSegmentAmber').style.width = (amber / total * 100) + '%';
  document.getElementById('adSegmentRed').style.width   = (red   / total * 100) + '%';
  document.getElementById('legendGreen').textContent = `${green} Green (≥80%)`;
  document.getElementById('legendAmber').textContent = `${amber} Amber (50-79%)`;
  document.getElementById('legendRed').textContent   = `${red} Red (<50%)`;
}

async function loadActivityFeed() {
  const feed = document.getElementById('activityFeed');
  feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">Loading activity…</div>';

  try {
    // Activity feed comes from prescriptions until reminder module ships in Phase 4b
    const data = await listPrescriptions({ page: 1, limit: 10 });
    const items = data.results || [];

    feed.innerHTML = '';

    if (!items.length) {
      feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">No recent activity yet.</div>';
      return;
    }

    items.forEach(rx => {
      const item       = document.createElement('div');
      item.className   = 'activity-item';
      item.style.cursor = 'pointer';

      const patientName = rx.patient
        ? `${rx.patient.givenName} ${rx.patient.familyName}`
        : 'Unknown patient';

      item.innerHTML = `
        <div class="activity-type-icon">💊</div>
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-patient">${patientName}</span>
            <span class="activity-type">Prescription</span>
          </div>
          <div class="activity-message">${rx.drugName} ${rx.dose} — ${rx.frequency}</div>
          <div class="activity-footer">
            <span class="activity-time">${formatTime(rx.createdAt)}</span>
            <span class="activity-status ${rx.active ? 'delivered' : 'failed'}">
              ${rx.active ? '✓ Active' : '✗ Inactive'}
            </span>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        if (rx.patient) {
          sessionStorage.setItem('selectedPatient', JSON.stringify(normalisePatient(rx.patient)));
          window.location.href = 'patient-profile.html';
        }
      });

      feed.appendChild(item);
    });
  } catch (err) {
    console.error('Failed to load activity feed:', err);
    feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">Could not load activity.</div>';
  }
}

function formatTime(datetime) {
  const diff = Math.floor((Date.now() - new Date(datetime)) / 60000);
  if (diff < 1)   return 'Just now';
  if (diff < 60)  return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function setupEventListeners() {
  document.getElementById('btnAddPatient').addEventListener('click', () => {
    window.location.href = 'add-patient.html';
  });
  document.getElementById('btnViewPatients').addEventListener('click', () => {
    window.location.href = 'patients.html';
  });
  document.getElementById('btnGenerateReminders').addEventListener('click', () => {
    alert('Reminder scheduling coming in Phase 4b.');
  });
}
