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
    if (!res.ok) throw new Error(data.message || 'Failed');

    document.getElementById('statTotalPatients').textContent =
      data.totalPatients ?? '—';
    document.getElementById('statAdherence').textContent =
      (data.adherence.rate !== null && data.adherence.rate !== undefined)
        ? data.adherence.rate + '%' : '—';
    document.getElementById('statAppointments').textContent = '—';
    document.getElementById('statMessages').textContent     = '—';

    populateAdherenceBar(
      data.adherence.green    || 0,
      data.adherence.amber    || 0,
      data.adherence.red      || 0,
      data.adherence.untracked || 0,
    );
  } catch (err) {
    console.error('Failed to load stats:', err);
    ['statTotalPatients','statAdherence','statAppointments','statMessages']
      .forEach(id => document.getElementById(id).textContent = '—');
  }
}

function populateAdherenceBar(green, amber, red, untracked = 0) {
  const total = green + amber + red + untracked || 1;
  document.getElementById('adSegmentGreen').style.width = (green / total * 100) + '%';
  document.getElementById('adSegmentAmber').style.width = (amber / total * 100) + '%';
  document.getElementById('adSegmentRed').style.width   = (red   / total * 100) + '%';
  document.getElementById('legendGreen').textContent    = `${green} On Track (≥80%)`;
  document.getElementById('legendAmber').textContent    = `${amber} At Risk (50-79%)`;
  document.getElementById('legendRed').textContent      =
    untracked > 0
      ? `${red} Non-Adherent (<50%) · ${untracked} Untracked`
      : `${red} Non-Adherent (<50%)`;
}

async function loadActivityFeed() {
  const feed = document.getElementById('activityFeed');
  feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">Loading activity…</div>';

  try {
    const data  = await listPrescriptions({ page: 1, limit: 10 });
    const items = data.results || [];

    feed.innerHTML = '';

    if (!items.length) {
      feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">No recent activity yet.</div>';
      return;
    }

    items.forEach(rx => {
      const item        = document.createElement('div');
      item.className    = 'activity-item';
      item.style.cursor = 'pointer';

      const patientName = rx.patient
        ? `${rx.patient.givenName} ${rx.patient.familyName}`
        : 'Unknown';

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
  if (!datetime) return 'Now';
  const diff  = Math.floor((Date.now() - new Date(datetime)) / 60000);
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
  document.getElementById('btnGenerateReminders').addEventListener('click', async () => {
    const btn = document.getElementById('btnGenerateReminders');
    btn.disabled    = true;
    btn.textContent = '⏳ Generating...';
    try {
      const res  = await apiFetch('/api/reminders/trigger', { method: 'POST' });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      alert(`✓ ${data.message}`);
    } catch (err) {
      alert(`Failed to generate reminders: ${err.message}`);
    } finally {
      btn.disabled    = false;
      btn.textContent = '🔔 Generate Reminders';
    }
  });
}
