// dashboard.js — CarePulse Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await Promise.all([loadStats(), loadActivityFeed()]);
});

async function loadStats() {
  try {
    // Try API first
    const res = await apiFetch('/api/patients/stats');
    if (res) {
      const data = await res.json();
      document.getElementById('statTotalPatients').textContent = data.totalPatients ?? '—';
      document.getElementById('statAdherence').textContent = data.adherence.rate !== undefined ? data.adherence.rate + '%' : '—';
      document.getElementById('statAppointments').textContent = data.appointments ?? '—';
      document.getElementById('statMessages').textContent = data.messages ?? '—';
      populateAdherenceBar(data.adherence.green, data.adherence.amber, data.adherence.red);
      return;
    }
  } catch (err) {
    console.error('API unavailable, keeping HTML values:', err);
  }

  // Keep the values written directly in the HTML (no fallback calculation)
  // The HTML stat-number class values are what the team leader wants to display
}

function populateAdherenceBar(green, amber, red, untracked = 0) {
  const total = green + amber + red + untracked || 1;
  document.getElementById('adSegmentGreen').style.width = (green / total * 100) + '%';
  document.getElementById('adSegmentAmber').style.width = (amber / total * 100) + '%';
  document.getElementById('adSegmentRed').style.width = (red / total * 100) + '%';
  document.getElementById('legendGreen').textContent = `${green} On Track (≥80%)`;
  document.getElementById('legendAmber').textContent = `${amber} At Risk (50-79%)`;
  document.getElementById('legendRed').textContent = `${red} Non-Adherent (<50%)`;
  const legendRed = document.getElementById('legendRed');
  if (untracked > 0) {
    legendRed.textContent = `${red} Red (<50%) · ${untracked} Untracked`;
  }
}

async function loadActivityFeed() {
  const feed = document.getElementById('activityFeed');
  feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">Loading activity…</div>';

  try {
    // Try API first
    const data = await listPrescriptions({ page: 1, limit: 10 });
    const items = data.results || [];
    if (items.length > 0) {
      renderActivityFeed(feed, items);
      return;
    }
  } catch (err) {
    console.error('API unavailable, using mock activity:', err);
  }

  // Fallback to mock activity data
  if (typeof recentActivity !== 'undefined') {
    renderActivityFeed(feed, recentActivity);
  } else {
    feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">No recent activity yet.</div>';
  }
}

function renderActivityFeed(feed, items) {
  feed.innerHTML = '';
  
  if (!items || items.length === 0) {
    feed.innerHTML = '<div style="color:var(--color-text-secondary,#666);padding:1rem">No recent activity yet.</div>';
    return;
  }

  items.forEach(item => {
    const activityEl = document.createElement('div');
    activityEl.className = 'activity-item';
    activityEl.style.cursor = 'pointer';

    // Handle both API and mock data formats
    const isApiData = item.patient && item.drugName;
    const patientName = isApiData 
      ? `${item.patient.givenName} ${item.patient.familyName}` 
      : item.patient;
    const message = isApiData 
      ? `${item.drugName} ${item.dose} — ${item.frequency}` 
      : item.message;
    const status = isApiData 
      ? (item.active ? 'Delivered' : 'Failed') 
      : (item.icon || '');
    const time = isApiData 
      ? formatTime(item.createdAt) 
      : item.time;

    activityEl.innerHTML = `
      <div class="activity-type-icon">${item.icon || '💊'}</div>
      <div class="activity-content">
        <div class="activity-header">
          <span class="activity-patient">${patientName}</span>
          <span class="activity-type">${item.type || 'Activity'}</span>
        </div>
        <div class="activity-message">${message}</div>
        <div class="activity-footer">
          <span class="activity-time">${time}</span>
          <span class="activity-status ${isApiData && item.active ? 'delivered' : 'pending'}">
            ${status}
          </span>
        </div>
      </div>
    `;

    activityEl.addEventListener('click', () => {
      if (isApiData && item.patient) {
        sessionStorage.setItem('selectedPatient', JSON.stringify(normalisePatient(item.patient)));
        window.location.href = 'patient-profile.html';
      }
    });

    feed.appendChild(activityEl);
  });
}

function formatTime(timestamp) {
  if (!timestamp) return 'Now';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
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
