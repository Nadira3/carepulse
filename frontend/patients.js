// ==========================================
// CarePulse - Screen 3: Patient Register
// ==========================================

let currentPage = 1;
const itemsPerPage = 10;
let filteredPatients = [];

// ==========================================
// Initialize Patient List
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Get hospital name from session storage
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    const hospitalName = userSession ? userSession.hospital : 'Hospital Name';
    
    document.getElementById('hospitalName').textContent = hospitalName;
    
    // Initialize with all patients
    filteredPatients = [...mockPatients];
    
    // Update count badge
    updatePatientCountBadge();
    
    // Render first page
    renderPatientTable();
    updatePagination();
    
    // Setup event listeners
    setupEventListeners();
});

// ==========================================
// Update Patient Count Badge
// ==========================================
function updatePatientCountBadge() {
    const count = filteredPatients.length;
    document.getElementById('patientCountBadge').textContent = `${count} Patient${count !== 1 ? 's' : ''}`;
}

// ==========================================
// Render Patient Table
// ==========================================
function renderPatientTable() {
    const tableBody = document.getElementById('patientTableBody');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, filteredPatients.length);
    const pagePatients = filteredPatients.slice(startIdx, endIdx);
    
    if (pagePatients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-empty-message">No patients found</td>
            </tr>
        `;
        return;
    }
    
    pagePatients.forEach(patient => {
        const row = createPatientRow(patient);
        tableBody.appendChild(row);
    });
    
    updatePaginationInfo();
}

// ==========================================
// Create Patient Row
// ==========================================
function createPatientRow(patient) {
    const row = document.createElement('tr');
    row.className = 'patient-row';
    row.style.cursor = 'pointer';
    
    // Get adherence status label
    const adherenceStatus = getAdherenceStatus(patient.adherence);
    
    // Mask phone number: +234-801-234-5001 -> +234-801-***-5001
    const maskedPhone = maskPhone(patient.phone);
    
    // Format dates
    const lastReminderDate = formatDateShort(patient.lastReminder);
    const nextAppointmentDate = formatDateShort(patient.nextAppointment);
    
    row.innerHTML = `
        <td class="table-name">${patient.name}</td>
        <td class="table-age">${patient.age}</td>
        <td class="table-disease">${patient.disease}</td>
        <td class="table-phone">${maskedPhone}</td>
        <td class="table-reminder">${lastReminderDate}</td>
        <td class="table-appointment">${nextAppointmentDate}</td>
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
    
    // Add click listener for View button
    const viewBtn = row.querySelector('.view-icon');
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
            window.location.href = 'patient-profile.html';
        });
    }
    
    // Add click listener for Edit button
    const editBtn = row.querySelector('.edit-icon');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
            window.location.href = 'edit-patient.html';
        });
    }
    
    // Make row clickable for view
    row.addEventListener('click', () => {
        sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
        window.location.href = 'patient-profile.html';
    });
    
    return row;
}

// ==========================================
// Get Adherence Status
// ==========================================
function getAdherenceStatus(adherence) {
    if (adherence >= 80) {
        return { label: 'On Track', class: 'badge-green' };
    } else if (adherence >= 50) {
        return { label: 'At Risk', class: 'badge-amber' };
    } else {
        return { label: 'Non-Adherent', class: 'badge-red' };
    }
}

// ==========================================
// Mask Phone Number
// ==========================================
function maskPhone(phone) {
    // +234-801-234-5001 -> +234-801-****-5001
    const parts = phone.split('-');
    if (parts.length >= 3) {
        return `${parts[0]}-${parts[1]}-****-${parts[3]}`;
    }
    return phone;
}

// ==========================================
// Format Date (Short)
// ==========================================
function formatDateShort(datetime) {
    const date = new Date(datetime);
    return date.toLocaleDateString('en-GB', { 
        year: '2-digit', 
        month: 'short', 
        day: 'numeric' 
    });
}

// ==========================================
// Update Pagination Info
// ==========================================
function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    
    if (filteredPatients.length === 0) {
        document.getElementById('paginationInfo').textContent = 'No results';
        return;
    }
    
    const startIdx = (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(currentPage * itemsPerPage, filteredPatients.length);
    
    document.getElementById('paginationInfo').textContent = `Showing ${startIdx}–${endIdx} of ${filteredPatients.length}`;
    document.getElementById('pageIndicator').textContent = `Page ${currentPage} of ${totalPages}`;
}

// ==========================================
// Update Pagination Buttons
// ==========================================
function updatePagination() {
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
    const prevBtn = document.getElementById('btnPrev');
    const nextBtn = document.getElementById('btnNext');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// ==========================================
// Apply Filters
// ==========================================
function applyFilters() {
    const diseaseFilter = document.getElementById('filterDisease').value;
    const adherenceFilter = document.getElementById('filterAdherence').value;
    const searchText = document.getElementById('searchPatient').value.toLowerCase();
    
    filteredPatients = mockPatients.filter(patient => {
        // Disease filter
        if (diseaseFilter && patient.disease !== diseaseFilter) {
            return false;
        }
        
        // Adherence filter
        if (adherenceFilter) {
            const adherenceStatus = getAdherenceStatus(patient.adherence).label;
            if (adherenceStatus !== adherenceFilter) {
                return false;
            }
        }
        
        // Search filter
        if (searchText && !patient.name.toLowerCase().includes(searchText)) {
            return false;
        }
        
        return true;
    });
    
    // Reset to page 1
    currentPage = 1;
    
    // Update UI
    updatePatientCountBadge();
    renderPatientTable();
    updatePagination();
}

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
    // Filter dropdowns
    document.getElementById('filterDisease').addEventListener('change', applyFilters);
    document.getElementById('filterAdherence').addEventListener('change', applyFilters);
    
    // Search input (with debounce)
    let searchTimeout;
    document.getElementById('searchPatient').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });
    
    // Reset filters button
    document.getElementById('btnReset').addEventListener('click', () => {
        document.getElementById('filterDisease').value = '';
        document.getElementById('filterAdherence').value = '';
        document.getElementById('searchPatient').value = '';
        applyFilters();
    });
    
    // Pagination buttons
    document.getElementById('btnPrev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPatientTable();
            updatePagination();
            window.scrollTo(0, 0);
        }
    });
    
    document.getElementById('btnNext').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
            currentPage++;
            renderPatientTable();
            updatePagination();
            window.scrollTo(0, 0);
        }
    });
    
    // Add Patient button
    document.getElementById('btnAddPatient').addEventListener('click', () => {
        window.location.href = 'add-patient.html';
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });
    
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

console.log('Patient Register loaded');
