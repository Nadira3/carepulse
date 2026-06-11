// medication.js — CarePulse Medication & Reminder Setup
let currentPatient  = null;
let medications     = [];
let generatedMessage = null;

document.addEventListener('DOMContentLoaded', () => {
  const newPatientData      = sessionStorage.getItem('newPatient');
  const selectedPatientData = sessionStorage.getItem('selectedPatient');

  currentPatient = newPatientData      ? JSON.parse(newPatientData)      :
                   selectedPatientData ? JSON.parse(selectedPatientData) : null;

  if (!currentPatient) {
    window.location.href = 'patients.html';
    return;
  }

  // Use normalised name fields
  const displayName = currentPatient.name ||
    `${currentPatient.givenName || ''} ${currentPatient.familyName || ''}`.trim();

  document.getElementById('patientSubtitle').textContent = `Setting up: ${displayName}`;

  if (currentPatient.language || currentPatient.preferredLanguage) {
    document.getElementById('language').value =
      currentPatient.language || currentPatient.preferredLanguage;
  }

  addMedicationRow();
  setupEventListeners();
});

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
}

function addMedicationRow() {
  const container = document.getElementById('medicationContainer');
  const rowIndex  = medications.length;

  const row = document.createElement('div');
  row.className = 'medication-row';
  row.id        = `medication-${rowIndex}`;

  row.innerHTML = `
    <div class="medication-header">
      <h3>Medication ${rowIndex + 1}</h3>
      ${rowIndex > 0 ? `<button type="button" class="btn-remove-med" data-index="${rowIndex}">✕ Remove</button>` : ''}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="drugName-${rowIndex}">Drug Name <span class="required">*</span></label>
        <input type="text" id="drugName-${rowIndex}" class="form-input drug-name"
               placeholder="e.g. Lisinopril" data-index="${rowIndex}">
        <span class="error-message"></span>
      </div>
      <div class="form-group">
        <label for="dosage-${rowIndex}">Dosage <span class="required">*</span></label>
        <input type="text" id="dosage-${rowIndex}" class="form-input dosage"
               placeholder="e.g. 5mg" data-index="${rowIndex}">
        <span class="error-message"></span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="frequency-${rowIndex}">Frequency <span class="required">*</span></label>
        <select id="frequency-${rowIndex}" class="form-input frequency" data-index="${rowIndex}">
          <option value="">Select frequency</option>
          <option value="Once daily">Once daily (24 hourly)</option>
          <option value="Twice daily">Twice daily (12 hourly)</option>
          <option value="Three times daily">Three times daily (8 hourly)</option>
          <option value="Four times daily">Four times daily (6 hourly)</option>
        </select>
        <span class="error-message"></span>
      </div>
      <div class="form-group">
        <label for="duration-${rowIndex}">Duration <span class="required">*</span></label>
        <input type="text" id="duration-${rowIndex}" class="form-input duration"
               placeholder="e.g. 30 days" data-index="${rowIndex}">
        <span class="error-message"></span>
      </div>
    </div>
    <div class="time-pickers-section" id="timePickers-${rowIndex}"></div>
  `;

  container.appendChild(row);

  row.querySelector('.frequency').addEventListener('change', (e) => {
    updateTimePickersForRow(rowIndex, e.target.value);
  });

  const removeBtn = row.querySelector('.btn-remove-med');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      row.remove();
      medications = medications.filter(m => m.index !== rowIndex);
    });
  }

  medications.push({ index: rowIndex, drug: '', dosage: '', frequency: '', duration: '', times: [] });
}

function updateTimePickersForRow(rowIndex, frequency) {
  const container = document.getElementById(`timePickers-${rowIndex}`);
  container.innerHTML = '';
  if (!frequency) return;

  const counts = {
    'Once daily':        1,
    'Twice daily':       2,
    'Three times daily': 3,
    'Four times daily':  4,
  };
  const count  = counts[frequency] || 0;

  for (let i = 0; i < count; i++) {
    const label = count === 1 ? 'Time' : `Time ${i + 1}`;
    const div   = document.createElement('div');
    div.className = 'form-group time-picker-group';
    div.innerHTML = `
      <label for="time-${rowIndex}-${i}">${label} <span class="required">*</span></label>
      <input type="time" id="time-${rowIndex}-${i}" class="form-input time-picker"
             data-med-index="${rowIndex}" data-time-index="${i}">
      <span class="error-message"></span>
    `;
    container.appendChild(div);
  }
}

function clearAppointmentFields() {
  document.getElementById('appointmentDate').value  = '';
  document.getElementById('appointmentTime').value  = '';
  document.getElementById('department').value       = '';
  document.getElementById('reminderThreeDays').checked = false;
  document.getElementById('reminderMorning').checked   = false;
  showToast('Appointment setup skipped. You can add it later.');
}

function validateMedicationForm() {
  let isValid = true;
  document.querySelectorAll('.medication-row').forEach(row => {
    const drug      = row.querySelector('.drug-name');
    const dosage    = row.querySelector('.dosage');
    const frequency = row.querySelector('.frequency');
    const duration  = row.querySelector('.duration');

    [drug, dosage, frequency, duration].forEach(el => {
      if (!el) return;
      if (!el.value.trim()) {
        el.classList.add('field-error');
        isValid = false;
      } else {
        el.classList.remove('field-error');
      }
    });

    row.querySelectorAll('.time-picker').forEach(picker => {
      if (!picker.value) { picker.classList.add('field-error'); isValid = false; }
      else picker.classList.remove('field-error');
    });
  });
  return isValid;
}

function collectMedicationData() {
  const data = [];
  document.querySelectorAll('.medication-row').forEach(row => {
    const drug      = row.querySelector('.drug-name')?.value.trim();
    const dosage    = row.querySelector('.dosage')?.value.trim();
    const frequency = row.querySelector('.frequency')?.value;
    const duration  = row.querySelector('.duration')?.value.trim();
    const times     = [...row.querySelectorAll('.time-picker')]
                        .map(p => p.value).filter(Boolean);

    if (drug && dosage && frequency && duration) {
      data.push({ drug, dosage, frequency, duration, times });
    }
  });
  return data;
}

async function generatePreview() {
  if (!validateMedicationForm()) {
    showToast('Please fill in all medication details first', 'error');
    return;
  }

  const medData = collectMedicationData()[0];
  if (!medData) { showToast('Please add at least one medication', 'error'); return; }

  document.getElementById('previewPlaceholder').style.display = 'none';
  document.getElementById('previewMessage').style.display     = 'none';
  document.getElementById('previewLoading').style.display     = 'flex';

  try {
    const language = document.getElementById('language').value;
    const name     = currentPatient.name ||
      `${currentPatient.givenName || ''}`.trim() || 'Patient';

    // Gemini integration point — using contextual mock for now
    await new Promise(resolve => setTimeout(resolve, 1200));
    const messages = {
      'English':        `Hi ${name}, time to take your ${medData.drug} ${medData.dosage}. Your health matters. Reply CONFIRM or SNOOZE.`,
      'Pidgin English': `${name}, time don reach take your ${medData.drug} ${medData.dosage} o. Reply CONFIRM or SNOOZE.`,
    };
    generatedMessage = messages[language] || messages['English'];

    document.getElementById('previewLoading').style.display       = 'none';
    document.getElementById('previewMessage').style.display       = 'block';
    document.getElementById('previewMessage').innerHTML           = `<em>"${generatedMessage}"</em>`;
    document.getElementById('btnRegenerate').disabled             = false;

    showToast('Preview generated!');
  } catch (err) {
    document.getElementById('previewLoading').style.display    = 'none';
    document.getElementById('previewPlaceholder').style.display = 'block';
    document.getElementById('previewPlaceholder').textContent   = 'Error generating preview.';
    showToast('Failed to generate preview.', 'error');
  }
}

async function handleSave() {
  if (!validateMedicationForm()) {
    showToast('Please fill in all medication details', 'error');
    return;
  }
  if (!generatedMessage) {
    showToast('Please generate a preview message first', 'error');
    return;
  }

  const btnSave = document.getElementById('btnSave');
  btnSave.disabled    = true;
  btnSave.textContent = 'Saving…';

  try {
    const medData    = collectMedicationData();
    const today      = new Date().toISOString().split('T')[0];
    const clinician  = currentPatient.clinicianName || 'Clinician';
    const ward       = currentPatient.ward          || 'General';

    // Step 1 — create encounter for this medication setup session
    const encounter = await createEncounter({
      patientId:     currentPatient.id,
      type:          'OUTPATIENT',
      encounterDate: today,
      clinicianName: clinician,
      location:      ward,
      notes:         `Medication setup: ${medData.map(m => m.drug).join(', ')}`,
    });

    // Step 2 — create one prescription per medication row
    const frequencyMap = {
      'Once daily':        { hours: 24 },
      'Twice daily':       { hours: 12 },
      'Three times daily': { hours: 8  },
      'Four times daily':  { hours: 6  },
    };

    await Promise.all(medData.map(med => {
      const freqConfig = frequencyMap[med.frequency] || { hours: 24 };
      const doseTimes  = med.times.length > 0 ? med.times : ['08:00'];
      return createPrescription({
        patientId:      currentPatient.id,
        encounterId:    encounter.id,
        drugName:       med.drug,
        dose:           med.dosage,
        frequency:      med.frequency,
        frequencyHours: freqConfig.hours,
        doseTimes,
        duration:       med.duration,
        startDate:      today,
      });
    }));

    showToast(`✓ Medications saved for ${currentPatient.name || currentPatient.givenName}!`);

    setTimeout(() => {
      sessionStorage.removeItem('newPatient');
      sessionStorage.removeItem('selectedPatient');
      window.location.href = 'patients.html';
    }, 1500);

  } catch (err) {
    console.error('Save failed:', err);
    showToast(`Failed to save: ${err.message}`, 'error');
    btnSave.disabled    = false;
    btnSave.textContent = '✓ Approve & Save';
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
