// edit-patient.js — CarePulse Edit Patient
let currentPatient = null;

document.addEventListener('DOMContentLoaded', () => {
  currentPatient = JSON.parse(sessionStorage.getItem('selectedPatient') || 'null');

  if (!currentPatient) {
    window.location.href = 'patients.html';
    return;
  }

  const name = currentPatient.name ||
    `${currentPatient.givenName || ''} ${currentPatient.familyName || ''}`.trim();
  document.getElementById('patientSubtitle').textContent = `Editing: ${name}`;

  // Pre-fill form with current values
  document.getElementById('primaryDiagnosis').value    = currentPatient.primaryDiagnosis  || currentPatient.disease || '';
  document.getElementById('secondaryCondition').value  = currentPatient.secondaryCondition || '';
  document.getElementById('clinicianName').value        = currentPatient.clinicianName      || '';
  document.getElementById('ward').value                 = currentPatient.ward               || '';
  document.getElementById('phone').value                = currentPatient.phone              || '';
  document.getElementById('preferredLanguage').value    = currentPatient.preferredLanguage  || currentPatient.language || 'English';
  document.getElementById('preferredChannel').value     = currentPatient.preferredChannel   || 'SMS';

  // Appointment fields
  if (currentPatient.nextAppointmentDate) {
    document.getElementById('nextAppointmentDate').value =
      new Date(currentPatient.nextAppointmentDate).toISOString().split('T')[0];
  }
  document.getElementById('nextAppointmentLocation').value =
    currentPatient.nextAppointmentLocation || '';
  document.getElementById('apptReminderThreeDays').checked =
    currentPatient.apptReminderThreeDays !== false;
  document.getElementById('apptReminderMorning').checked =
    currentPatient.apptReminderMorning !== false;

  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btnCancel').addEventListener('click', () => {
    window.location.href = 'patients.html';
  });

  document.getElementById('btnSave').addEventListener('click', handleSave);
}

async function handleSave() {
  const btnSave = document.getElementById('btnSave');
  btnSave.disabled    = true;
  btnSave.textContent = 'Saving…';

  try {
    // Update clinical details
    const clinicalPayload = {
      primaryDiagnosis:   document.getElementById('primaryDiagnosis').value,
      secondaryCondition: document.getElementById('secondaryCondition').value || undefined,
      clinicianName:      document.getElementById('clinicianName').value,
      ward:               document.getElementById('ward').value,
      phone:              document.getElementById('phone').value,
      preferredLanguage:  document.getElementById('preferredLanguage').value,
      preferredChannel:   document.getElementById('preferredChannel').value,
    };

    const res = await apiFetch(`/api/patients/${currentPatient.id}`, {
      method: 'PATCH',
      body:   JSON.stringify(clinicalPayload),
    });

    if (!res || !res.ok) {
      const err = res ? await res.json() : {};
      throw new Error(err.message || 'Failed to update patient');
    }

    // Update appointment if date is set
    const apptDate = document.getElementById('nextAppointmentDate').value;
    const apptLocation = document.getElementById('nextAppointmentLocation').value;

    if (apptDate && apptLocation) {
      const apptRes = await apiFetch(`/api/patients/${currentPatient.id}/appointment`, {
        method: 'PATCH',
        body:   JSON.stringify({
          nextAppointmentDate:     apptDate,
          nextAppointmentLocation: apptLocation,
          apptReminderThreeDays:   document.getElementById('apptReminderThreeDays').checked,
          apptReminderMorning:     document.getElementById('apptReminderMorning').checked,
        }),
      });

      if (!apptRes || !apptRes.ok) {
        const err = apptRes ? await apptRes.json() : {};
        throw new Error(err.message || 'Failed to update appointment');
      }
    }

    showToast('Patient updated successfully!');
    setTimeout(() => window.location.href = 'patients.html', 1500);

  } catch (err) {
    console.error('Update failed:', err);
    showToast(`Failed: ${err.message}`, 'error');
    btnSave.disabled    = false;
    btnSave.textContent = '✓ Save Changes';
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
