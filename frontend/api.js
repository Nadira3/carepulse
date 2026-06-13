// api.js — CarePulse API client

function getToken() {
  return window.emrAccessToken || sessionStorage.getItem('accessToken');
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!refreshRes.ok) {
      sessionStorage.clear();
      window.location.replace('/index.html');
      return null;
    }

    const { accessToken } = await refreshRes.json();
    sessionStorage.setItem('accessToken', accessToken);
    window.emrAccessToken = accessToken;

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'ngrok-skip-browser-warning': 'true',
        ...(options.headers || {}),
      },
      credentials: 'include',
    });
  }

  return res;
}

// Logout
window.emrLogout = async function () {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    sessionStorage.clear();
    window.location.replace('/index.html');
  }
};

// ── Patients ────────────────────────────────────────────────────────────────

async function listPatients({ page = 1, limit = 10, search = '', disease = '', adherence = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search)    params.set('search', search);
  if (disease)   params.set('disease', disease);
  if (adherence) params.set('adherence', adherence);

  const res = await apiFetch(`/api/patients?${params}`);
  if (!res) return { results: [], total: 0, page: 1, totalPages: 1 };
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load patients');
  return data;
}

async function searchPatients(query) {
  const res = await apiFetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
  if (!res) return [];
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Search failed');
  return data.results;
}

async function getPatient(uuid) {
  const res = await apiFetch(`/api/patients/${uuid}`);
  if (!res) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to get patient');
  return data;
}

async function createPatient(patientData) {
  const res = await apiFetch('/api/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
  if (!res) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create patient');
  return data;
}

// ── Encounters ───────────────────────────────────────────────────────────────

async function createEncounter(encounterData) {
  const res = await apiFetch('/api/encounters', {
    method: 'POST',
    body: JSON.stringify(encounterData),
  });
  if (!res) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create encounter');
  return data;
}

async function listEncounters({ patientId, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (patientId) params.set('patientId', patientId);
  const res = await apiFetch(`/api/encounters?${params}`);
  if (!res) return { results: [], total: 0 };
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load encounters');
  return data;
}

// ── Prescriptions ────────────────────────────────────────────────────────────

async function createPrescription(prescriptionData) {
  const res = await apiFetch('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify(prescriptionData),
  });
  if (!res) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create prescription');
  return data;
}

async function listPrescriptions({ patientId, encounterId, active, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (patientId)   params.set('patientId', patientId);
  if (encounterId) params.set('encounterId', encounterId);
  if (active !== undefined) params.set('active', active);
  const res = await apiFetch(`/api/prescriptions?${params}`);
  if (!res) return { results: [], total: 0 };
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load prescriptions');
  return data;
}

async function updatePrescriptionStatus(id, active) {
  const res = await apiFetch(`/api/prescriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
  if (!res) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update prescription');
  return data;
}

// ── Field mapping helpers ────────────────────────────────────────────────────
// Backend uses givenName/familyName/primaryDiagnosis — frontend uses name/disease

function normalisePatient(p) {
  return {
    ...p,
    name:            `${p.givenName} ${p.familyName}`,
    disease:         p.primaryDiagnosis        || '—',
    language:        p.preferredLanguage       || 'English',
    adherence:       p.adherence               ?? 0,
    lastReminder:    p.lastReminder            || null,
    nextAppointment: p.nextAppointmentDate      || null,
    appointmentLocation: p.nextAppointmentLocation || null,
  };
}

async function updatePatient(id, data) {
  const res = await apiFetch(`/api/patients/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
  if (!res) return null;
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update patient');
  return result;
}

async function updateAppointment(id, data) {
  const res = await apiFetch(`/api/patients/${id}/appointment`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
  if (!res) return null;
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update appointment');
  return result;
}

async function listUsers({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  const res    = await apiFetch(`/api/auth/users?${params}`);
  if (!res) return { results: [], total: 0 };
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load users');
  return data;
}

async function createClinician(data) {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body:   JSON.stringify(data),
  });
  if (!res) return null;
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to create clinician');
  return result;
}

async function updateUserStatus(id, isActive) {
  const res = await apiFetch(`/api/auth/users/${id}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ isActive }),
  });
  if (!res) return null;
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Failed to update user');
  return result;
}

// Expose all API functions globally for use across HTML pages
window.apiFetch                  = apiFetch;
window.listPatients              = listPatients;
window.searchPatients            = searchPatients;
window.getPatient                = getPatient;
window.createPatient             = createPatient;
window.createEncounter           = createEncounter;
window.listEncounters            = listEncounters;
window.createPrescription        = createPrescription;
window.listPrescriptions         = listPrescriptions;
window.updatePrescriptionStatus  = updatePrescriptionStatus;
window.normalisePatient          = normalisePatient;
window.updatePatient             = updatePatient;
window.updateAppointment         = updateAppointment;
window.listUsers                 = listUsers;
window.createClinician           = createClinician;
window.updateUserStatus          = updateUserStatus;
