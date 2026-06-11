// patients.js — CarePulse Patient Register
let currentPage = 1;
const itemsPerPage = 10;
let totalPatients  = 0;
let totalPages     = 1;

// Active filter state
let activeFilters = { disease: '', adherence: '', search: '' };
let searchTimeout;

document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const hospitalEl = document.getElementById('hospitalName');
  if (hospitalEl) hospitalEl.textContent = 'ISTH Irrua';

  setupEventListeners();
  await loadPatients();
});

async function loadPatients() {
  setTableLoading(true);
  try {
    const data = await listPatients({
      page:      currentPage,
      limit:     itemsPerPage,
      search:    activeFilters.search,
      disease:   activeFilters.disease,
      adherence: activeFilters.adherence,
    });

    // listPatients returns raw DB rows — normalise field names
    const patients = (data.results || []).map(normalisePatient);
    totalPatients  = data.total      || 0;
    totalPages     = data.totalPages || 1;

    updatePatientCountBadge(totalPatients);
    renderPatientTable(patients);
    updatePagination();
  } catch (err) {
    console.error('Failed to load patients:', err);
    showTableError('Failed to load patients. Please refresh.');
  } finally {
    setTableLoading(false);
  }
}

function setTableLoading(loading) {
  const tableBody = document.getElementById('patientTableBody');
  if (loading) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty-message">Loading patients…</td>
      </tr>`;
  }
}

function showTableError(message) {
  document.getElementById('patientTableBody').innerHTML = `
    <tr>
      <td colspan="8" class="table-empty-message" style="color:var(--color-danger,#dc3545)">${message}</td>
    </tr>`;
}

function updatePatientCountBadge(count) {
  document.getElementById('patientCountBadge').textContent =
    `${count} Patient${count !== 1 ? 's' : ''}`;
}

function renderPatientTable(patients) {
  const tableBody = document.getElementById('patientTableBody');
  tableBody.innerHTML = '';

  if (!patients.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty-message">No patients found</td>
      </tr>`;
    updatePaginationInfo(0);
    return;
  }

  patients.forEach(patient => tableBody.appendChild(createPatientRow(patient)));
  updatePaginationInfo(patients.length);
}

function createPatientRow(patient) {
  const row = document.createElement('tr');
  row.className = 'patient-row';
  row.style.cursor = 'pointer';

  const adherenceStatus  = getAdherenceStatus(patient.adherence);
  const maskedPhone      = maskPhone(patient.phone || '');
  const lastReminderDate = patient.lastReminder    ? formatDateShort(patient.lastReminder)    : '—';
  const nextApptDate     = patient.nextAppointment ? formatDateShort(patient.nextAppointment) : '—';

  row.innerHTML = `
    <td class="table-name">${patient.name}</td>
    <td class="table-age">${patient.age || '—'}</td>
    <td class="table-disease">${patient.disease}</td>
    <td class="table-phone">${maskedPhone}</td>
    <td class="table-reminder">${lastReminderDate}</td>
    <td class="table-appointment">${nextApptDate}</td>
    <td class="table-adherence">
      <span class="adherence-badge ${adherenceStatus.class}">
        ${adherenceStatus.label}
      </span>
    </td>
    <td class="table-actions">
      <button class="action-icon edit-icon" title="Edit Patient">✏️</button>
      <button class="action-icon view-icon" title="View Details">👁</button>
    </td>
  `;

  row.querySelector('.view-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
    window.location.href = 'patient-profile.html';
  });

  row.querySelector('.edit-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
    window.location.href = 'edit-patient.html';
  });

  row.addEventListener('click', () => {
    sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
    window.location.href = 'patient-profile.html';
  });

  return row;
}

function getAdherenceStatus(adherence) {
  if (adherence >= 80) return { label: 'On Track',      class: 'badge-green' };
  if (adherence >= 50) return { label: 'At Risk',       class: 'badge-amber' };
  return                      { label: 'Non-Adherent',  class: 'badge-red'   };
}

function maskPhone(phone) {
  const parts = phone.split('-');
  if (parts.length >= 4) return `${parts[0]}-${parts[1]}-****-${parts[3]}`;
  return phone;
}

function formatDateShort(datetime) {
  return new Date(datetime).toLocaleDateString('en-GB', {
    year: '2-digit', month: 'short', day: 'numeric',
  });
}

function updatePaginationInfo(count) {
  if (!totalPatients) {
    document.getElementById('paginationInfo').textContent = 'No results';
    return;
  }
  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx   = Math.min(startIdx + count - 1, totalPatients);
  document.getElementById('paginationInfo').textContent =
    `Showing ${startIdx}–${endIdx} of ${totalPatients}`;
  document.getElementById('pageIndicator').textContent =
    `Page ${currentPage} of ${totalPages}`;
}

function updatePagination() {
  document.getElementById('btnPrev').disabled = currentPage <= 1;
  document.getElementById('btnNext').disabled = currentPage >= totalPages;
  updatePaginationInfo(Math.min(itemsPerPage, totalPatients));
}

function setupEventListeners() {
  document.getElementById('filterDisease').addEventListener('change', () => {
    activeFilters.disease = document.getElementById('filterDisease').value;
    currentPage = 1;
    loadPatients();
  });

  document.getElementById('filterAdherence').addEventListener('change', () => {
    activeFilters.adherence = document.getElementById('filterAdherence').value;
    currentPage = 1;
    loadPatients();
  });

  document.getElementById('searchPatient').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      activeFilters.search = document.getElementById('searchPatient').value.trim();
      currentPage = 1;
      loadPatients();
    }, 300);
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('filterDisease').value   = '';
    document.getElementById('filterAdherence').value = '';
    document.getElementById('searchPatient').value   = '';
    activeFilters = { disease: '', adherence: '', search: '' };
    currentPage   = 1;
    loadPatients();
  });

  document.getElementById('btnPrev').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadPatients(); window.scrollTo(0, 0); }
  });

  document.getElementById('btnNext').addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; loadPatients(); window.scrollTo(0, 0); }
  });

  document.getElementById('btnAddPatient').addEventListener('click', () => {
    window.location.href = 'add-patient.html';
  });
}
