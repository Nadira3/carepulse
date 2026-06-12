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
    // Try API first
    const data = await listPatients({
      page:      currentPage,
      limit:     itemsPerPage,
      search:    activeFilters.search,
      disease:   activeFilters.disease,
      adherence: activeFilters.adherence,
    });

    const patients = (data.results || []).map(normalisePatient);
    totalPatients  = data.total      || 0;
    totalPages     = data.totalPages || 1;

    updatePatientCountBadge(totalPatients);
    renderPatientTable(patients);
    updatePagination();
    setTableLoading(false);
    return;
  } catch (err) {
    console.error('API unavailable, using Joshua\'s mock data:', err);
  }

  // Fallback to Joshua's mock data
  if (typeof mockPatients !== 'undefined') {
    try {
      // Apply filters to mock data
      let filteredPatients = [...mockPatients];

      if (activeFilters.search) {
        const search = activeFilters.search.toLowerCase();
        filteredPatients = filteredPatients.filter(p => 
          p.name.toLowerCase().includes(search) || 
          p.id.toLowerCase().includes(search)
        );
      }

      if (activeFilters.disease && activeFilters.disease !== 'All') {
        filteredPatients = filteredPatients.filter(p => {
          const disease = p.disease === 'Hypertension & Diabetes' ? 'Both' : p.disease;
          return disease === activeFilters.disease;
        });
      }

      if (activeFilters.adherence && activeFilters.adherence !== 'All') {
        filteredPatients = filteredPatients.filter(p => {
          const status = p.adherenceRate >= 80 ? 'On Track' : 
                        p.adherenceRate >= 50 ? 'At Risk' : 'Non-Adherent';
          return status === activeFilters.adherence;
        });
      }

      totalPatients = filteredPatients.length;
      totalPages = Math.ceil(totalPatients / itemsPerPage);

      // Paginate
      const startIdx = (currentPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const pagePatients = filteredPatients.slice(startIdx, endIdx);

      updatePatientCountBadge(totalPatients);
      renderPatientTable(pagePatients);
      updatePagination();
    } catch (e) {
      console.error('Failed with mock data:', e);
      showTableError('Failed to load patients. Please try again.');
    }
  } else {
    showTableError('Failed to load patients. Please refresh the page.');
  }
  
  setTableLoading(false);
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

  const adherenceStatus  = getAdherenceStatus(patient.adherenceRate);
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
  if (!phone) return '—';
  // Remove any non-digit characters except leading +
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: show first 4 digits, then ****, then last 4 digits
  if (cleaned.length >= 8) {
    const first = cleaned.substring(0, 4);
    const last = cleaned.substring(cleaned.length - 4);
    return `${first}****${last}`;
  }
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
