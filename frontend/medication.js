// ==========================================
// CarePulse - Screen 5: Medication & Reminder Setup
// ==========================================

let currentPatient = null;
let medications = [];
let generatedMessage = null;

// ==========================================
// Initialize Form
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Get hospital name from session storage
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    const hospitalName = userSession ? userSession.hospital : 'Hospital Name';
    
    document.getElementById('hospitalName').textContent = hospitalName;
    
    // Get patient data (from new patient registration or selected patient)
    const newPatientData = sessionStorage.getItem('newPatient');
    const selectedPatientData = sessionStorage.getItem('selectedPatient');
    
    currentPatient = newPatientData ? JSON.parse(newPatientData) : 
                     selectedPatientData ? JSON.parse(selectedPatientData) : null;
    
    if (currentPatient) {
        document.getElementById('patientSubtitle').textContent = 
            `Setting up: ${currentPatient.firstName} ${currentPatient.lastName}`;
        
        // Pre-fill language from patient profile
        if (currentPatient.language) {
            document.getElementById('language').value = currentPatient.language;
        }
        
        // Add first medication row
        addMedicationRow();
    }
    
    // Setup event listeners
    setupEventListeners();
});

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
    document.getElementById('btnAddMedication').addEventListener('click', (e) => {
        e.preventDefault();
        addMedicationRow();
    });
    
    document.getElementById('btnGenerate').addEventListener('click', (e) => {
        e.preventDefault();
        generatePreview();
    });
    
    document.getElementById('btnRegenerate').addEventListener('click', (e) => {
        e.preventDefault();
        generatePreview();
    });
    
    document.getElementById('btnSkipAppointment').addEventListener('click', (e) => {
        e.preventDefault();
        clearAppointmentFields();
    });
    
    document.getElementById('btnSave').addEventListener('click', (e) => {
        e.preventDefault();
        handleSave();
    });
    
    document.getElementById('btnCancel').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Cancel and return to Patient List?')) {
            window.location.href = 'patients.html';
        }
    });
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ==========================================
// Add Medication Row
// ==========================================
function addMedicationRow() {
    const container = document.getElementById('medicationContainer');
    const rowIndex = medications.length;
    
    const medicationRow = document.createElement('div');
    medicationRow.className = 'medication-row';
    medicationRow.id = `medication-${rowIndex}`;
    
    medicationRow.innerHTML = `
        <div class="medication-header">
            <h3>Medication ${rowIndex + 1}</h3>
            ${rowIndex > 0 ? `<button type="button" class="btn-remove-med" data-index="${rowIndex}">✕ Remove</button>` : ''}
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="drugName-${rowIndex}">Drug Name <span class="required">*</span></label>
                <input 
                    type="text" 
                    id="drugName-${rowIndex}" 
                    name="drugName" 
                    class="form-input drug-name"
                    placeholder="e.g. Lisinopril"
                    data-index="${rowIndex}"
                >
                <span class="error-message"></span>
            </div>
            <div class="form-group">
                <label for="dosage-${rowIndex}">Dosage <span class="required">*</span></label>
                <input 
                    type="text" 
                    id="dosage-${rowIndex}" 
                    name="dosage" 
                    class="form-input dosage"
                    placeholder="e.g. 5mg"
                    data-index="${rowIndex}"
                >
                <span class="error-message"></span>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="frequency-${rowIndex}">Frequency <span class="required">*</span></label>
                <select id="frequency-${rowIndex}" name="frequency" class="form-input frequency" data-index="${rowIndex}">
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                </select>
                <span class="error-message"></span>
            </div>
        </div>

        <div class="time-pickers-section" id="timePickers-${rowIndex}">
            <!-- Time pickers will be added based on frequency selection -->
        </div>
    `;
    
    container.appendChild(medicationRow);
    
    // Setup frequency change event
    const frequencySelect = medicationRow.querySelector('.frequency');
    frequencySelect.addEventListener('change', (e) => {
        updateTimePickersForRow(rowIndex, e.target.value);
    });
    
    // Setup remove button
    const removeBtn = medicationRow.querySelector('.btn-remove-med');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            removeMedicationRow(rowIndex);
        });
    }
    
    medications.push({
        index: rowIndex,
        drug: '',
        dosage: '',
        frequency: '',
        times: []
    });
}

// ==========================================
// Update Time Pickers
// ==========================================
function updateTimePickersForRow(rowIndex, frequency) {
    const timePickersContainer = document.getElementById(`timePickers-${rowIndex}`);
    timePickersContainer.innerHTML = '';
    
    if (!frequency) return;
    
    const frequencies = {
        'Once daily': 1,
        'Twice daily': 2,
        'Three times daily': 3
    };
    
    const count = frequencies[frequency];
    
    for (let i = 0; i < count; i++) {
        const label = count === 1 ? 'Time' : `Time ${i + 1}`;
        const timeInput = document.createElement('div');
        timeInput.className = 'form-group time-picker-group';
        timeInput.innerHTML = `
            <label for="time-${rowIndex}-${i}">${label} <span class="required">*</span></label>
            <input 
                type="time" 
                id="time-${rowIndex}-${i}" 
                class="form-input time-picker"
                data-med-index="${rowIndex}"
                data-time-index="${i}"
            >
            <span class="error-message"></span>
        `;
        timePickersContainer.appendChild(timeInput);
    }
}

// ==========================================
// Remove Medication Row
// ==========================================
function removeMedicationRow(rowIndex) {
    const row = document.getElementById(`medication-${rowIndex}`);
    if (row) {
        row.remove();
        medications = medications.filter(med => med.index !== rowIndex);
    }
}

// ==========================================
// Clear Appointment Fields
// ==========================================
function clearAppointmentFields() {
    document.getElementById('appointmentDate').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('department').value = '';
    document.getElementById('reminderThreeDays').checked = false;
    document.getElementById('reminderMorning').checked = false;
    
    showToast('Appointment setup skipped. You can add it later.');
}

// ==========================================
// Validate Medication Form
// ==========================================
function validateMedicationForm() {
    let isValid = true;
    
    document.querySelectorAll('.medication-row').forEach((row, idx) => {
        const drugInput = row.querySelector('.drug-name');
        const dosageInput = row.querySelector('.dosage');
        const frequencyInput = row.querySelector('.frequency');
        
        let rowValid = true;
        
        if (!drugInput.value.trim()) {
            drugInput.classList.add('field-error');
            rowValid = false;
        } else {
            drugInput.classList.remove('field-error');
        }
        
        if (!dosageInput.value.trim()) {
            dosageInput.classList.add('field-error');
            rowValid = false;
        } else {
            dosageInput.classList.remove('field-error');
        }
        
        if (!frequencyInput.value) {
            frequencyInput.classList.add('field-error');
            rowValid = false;
        } else {
            frequencyInput.classList.remove('field-error');
        }
        
        // Check time pickers
        const timePickers = row.querySelectorAll('.time-picker');
        timePickers.forEach(picker => {
            if (!picker.value) {
                picker.classList.add('field-error');
                rowValid = false;
            } else {
                picker.classList.remove('field-error');
            }
        });
        
        if (!rowValid) isValid = false;
    });
    
    return isValid;
}

// ==========================================
// Collect Medication Data
// ==========================================
function collectMedicationData() {
    const medicationData = [];
    
    document.querySelectorAll('.medication-row').forEach((row, idx) => {
        const drug = row.querySelector('.drug-name').value.trim();
        const dosage = row.querySelector('.dosage').value.trim();
        const frequency = row.querySelector('.frequency').value;
        
        const times = [];
        row.querySelectorAll('.time-picker').forEach(picker => {
            if (picker.value) {
                times.push(picker.value);
            }
        });
        
        if (drug && dosage && frequency && times.length > 0) {
            medicationData.push({
                drug,
                dosage,
                frequency,
                times
            });
        }
    });
    
    return medicationData;
}

// ==========================================
// Generate Preview with Gemini
// ==========================================
async function generatePreview() {
    if (!validateMedicationForm()) {
        showToast('Please fill in all medication details', 'error');
        return;
    }
    
    const medicationData = collectMedicationData()[0]; // Use first medication for preview
    if (!medicationData) {
        showToast('Please add at least one medication', 'error');
        return;
    }
    
    // Show loading state
    const placeholder = document.getElementById('previewPlaceholder');
    const message = document.getElementById('previewMessage');
    const loading = document.getElementById('previewLoading');
    
    placeholder.style.display = 'none';
    message.style.display = 'none';
    loading.style.display = 'flex';
    
    try {
        // Call Gemini API
        const response = await callGeminiAPI({
            patientName: currentPatient.firstName,
            disease: currentPatient.disease,
            drug: medicationData.drug,
            dosage: medicationData.dosage,
            time: medicationData.times[0],
            language: document.getElementById('language').value
        });
        
        generatedMessage = response;
        
        // Display the generated message
        message.innerHTML = `<em>"${response}"</em>`;
        loading.style.display = 'none';
        message.style.display = 'block';
        
        // Enable regenerate button
        document.getElementById('btnRegenerate').disabled = false;
        
        showToast('Preview generated successfully!');
    } catch (error) {
        console.error('Error generating preview:', error);
        loading.style.display = 'none';
        placeholder.style.display = 'block';
        placeholder.textContent = `Error generating preview: ${error.message}`;
        showToast('Failed to generate preview. Please try again.', 'error');
    }
}

// ==========================================
// Call Gemini API
// ==========================================
async function callGeminiAPI(patientContext) {
    // This function should call your backend Gemini API endpoint
    // For now, we'll create a realistic example that can be integrated with a backend
    
    const prompt = `Generate a brief, friendly SMS reminder for a patient taking medication.
    
Patient Name: ${patientContext.patientName}
Condition: ${patientContext.disease}
Medication: ${patientContext.drug} ${patientContext.dosage}
Time: ${patientContext.time}
Language: ${patientContext.language}

Create a warm, encouraging reminder message in ${patientContext.language} that:
- Reminds them to take their medication
- Is brief (max 140 characters for SMS)
- Includes a call-to-action (confirm/snooze)
- Is empathetic to their condition

Return ONLY the SMS message text, no other formatting.`;

    // TODO: Replace this with your actual Gemini API call
    // For demo, return a mock message
    // In production, call: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response based on language
    const mockResponses = {
        'English': `Hi ${patientContext.patientName}, it's time to take your ${patientContext.drug}. Your health matters to us. Please confirm when taken. Reply CONFIRM or SNOOZE.`,
        'Pidgin English': `My brother/sister ${patientContext.patientName}, time don reach take your ${patientContext.drug} o. Your health na priority. Reply CONFIRM or SNOOZE.`
    };
    
    return mockResponses[patientContext.language] || mockResponses['English'];
    
    // REAL IMPLEMENTATION (uncomment when ready):
    /*
    const response = await fetch('/api/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: prompt,
            model: 'gemini-pro'
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to generate reminder');
    }
    
    const data = await response.json();
    return data.message;
    */
}

// ==========================================
// Handle Save
// ==========================================
function handleSave() {
    if (!validateMedicationForm()) {
        showToast('Please fill in all medication details', 'error');
        return;
    }
    
    if (!generatedMessage) {
        showToast('Please generate a preview message first', 'error');
        return;
    }
    
    // Collect all data
    const medicationData = collectMedicationData();
    const appointmentData = {
        date: document.getElementById('appointmentDate').value || null,
        time: document.getElementById('appointmentTime').value || null,
        department: document.getElementById('department').value || null,
        reminders: {
            threeDaysBefore: document.getElementById('reminderThreeDays').checked,
            morningOf: document.getElementById('reminderMorning').checked
        }
    };
    
    // Update patient with medication setup
    if (currentPatient) {
        currentPatient.medications = medicationData;
        currentPatient.appointment = appointmentData;
        currentPatient.reminderMessage = generatedMessage;
        currentPatient.language = document.getElementById('language').value;
        currentPatient.adherence = 0; // Initialize adherence tracking
        
        // Update in mockPatients
        const patientIndex = mockPatients.findIndex(p => p.id === currentPatient.id);
        if (patientIndex !== -1) {
            mockPatients[patientIndex] = currentPatient;
        }
    }
    
    // Show success toast
    showToast(`✓ Medication setup complete for ${currentPatient.firstName}!`);
    
    // Redirect to patient list after delay
    setTimeout(() => {
        sessionStorage.removeItem('newPatient');
        sessionStorage.removeItem('selectedPatient');
        window.location.href = 'patients.html';
    }, 1500);
}

// ==========================================
// Show Toast Notification
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    // Update toast styling based on type
    toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    
    toast.classList.add('show');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ==========================================
// Handle Logout
// ==========================================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

console.log('Medication & Reminder Setup loaded');
