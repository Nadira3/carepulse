// add-patient.js — CarePulse Register New Patient
let currentFormStep = 1;
const totalSteps = 3;

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('enrolmentDate').value = today;
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btnNext').addEventListener('click', handleNextStep);
  document.getElementById('btnBack').addEventListener('click', handleBackStep);
  document.getElementById('btnSubmit').addEventListener('click', handleSubmitForm);
}

function handleNextStep() {
  if (validateCurrentStep()) {
    currentFormStep++;
    updateFormDisplay();
  }
}

function handleBackStep() {
  if (currentFormStep > 1) {
    clearStepErrors(currentFormStep);
    currentFormStep--;
    updateFormDisplay();
  }
}

function validateCurrentStep() {
  clearStepErrors(currentFormStep);
  let isValid = true;

  if (currentFormStep === 1) {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const age       = document.getElementById('age').value.trim();
    const gender    = document.querySelector('input[name="gender"]:checked');
    const phone     = document.getElementById('phone').value.trim();
    const language  = document.getElementById('language').value.trim();

    if (!firstName) { setFieldError('firstName', 'First name is required');      isValid = false; }
    if (!lastName)  { setFieldError('lastName',  'Last name is required');       isValid = false; }
    if (!age)       { setFieldError('age',        'Age is required');             isValid = false; }
    else if (age < 1 || age > 150) { setFieldError('age', 'Age must be 1–150'); isValid = false; }
    if (!gender)    { setFieldError('gender',    'Gender is required');           isValid = false; }
    if (!phone)     { setFieldError('phone',     'Phone number is required');     isValid = false; }
    if (!language)  { setFieldError('language',  'Preferred language is required'); isValid = false; }
  }

  if (currentFormStep === 2) {
    const diagnosis = document.getElementById('diagnosis').value.trim();
    const clinician = document.getElementById('clinician').value.trim();
    const ward      = document.getElementById('ward').value.trim();

    if (!diagnosis) { setFieldError('diagnosis', 'Primary diagnosis is required');      isValid = false; }
    if (!clinician) { setFieldError('clinician', 'Treating clinician name is required'); isValid = false; }
    if (!ward)      { setFieldError('ward',      'Ward / Clinic is required');           isValid = false; }
  }

  if (currentFormStep === 3) {
    const enrolmentDate = document.getElementById('enrolmentDate').value.trim();
    const consent       = document.getElementById('consent').checked;

    if (!enrolmentDate) { setFieldError('enrolmentDate', 'Enrolment date is required'); isValid = false; }
    if (!consent)       { setFieldError('consent',       'Patient consent is required'); isValid = false; }
  }

  return isValid;
}

function setFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) errorEl.textContent = message;
  const field = document.getElementById(fieldId);
  if (field) field.classList.add('field-error');
}

function clearStepErrors(step) {
  const stepEl = document.getElementById(`step${step}`);
  stepEl.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  stepEl.querySelectorAll('.form-input, .radio-group input, .checkbox-input')
        .forEach(el => el.classList.remove('field-error'));
}

function updateFormDisplay() {
  for (let i = 1; i <= totalSteps; i++) {
    document.getElementById(`step${i}`).classList.remove('active');
  }
  document.getElementById(`step${currentFormStep}`).classList.add('active');
  updateProgressIndicator();
  updateButtonVisibility();
  window.scrollTo(0, 0);
}

function updateProgressIndicator() {
  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById(`stepIndicator${i}`);
    indicator.classList.remove('active', 'completed');
    if (i < currentFormStep)      indicator.classList.add('completed');
    else if (i === currentFormStep) indicator.classList.add('active');
  }
  document.getElementById('currentStep').textContent = currentFormStep;
}

function updateButtonVisibility() {
  document.getElementById('btnBack').disabled = currentFormStep === 1;
  if (currentFormStep === totalSteps) {
    document.getElementById('btnNext').style.display   = 'none';
    document.getElementById('btnSubmit').style.display = 'inline-block';
  } else {
    document.getElementById('btnNext').style.display   = 'inline-block';
    document.getElementById('btnSubmit').style.display = 'none';
  }
}

async function handleSubmitForm() {
  if (!validateCurrentStep()) return;

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.disabled    = true;
  btnSubmit.textContent = 'Registering…';

  // Map frontend field names → backend schema
  const gender    = document.querySelector('input[name="gender"]:checked').value;
  const givenName = document.getElementById('firstName').value.trim();
  const familyName = document.getElementById('lastName').value.trim();

  // Generate a unique identifier: initials + timestamp
  const identifier = `ISTH-${givenName[0]}${familyName[0]}-${Date.now()}`.toUpperCase();

  const payload = {
    givenName,
    familyName,
    gender:             gender === 'Male'   ? 'M' : 'F',
    age:                parseInt(document.getElementById('age').value),
    phone:              document.getElementById('phone').value.trim(),
    preferredLanguage:  document.getElementById('language').value,
    preferredChannel:   document.getElementById('preferredChannel').value,
    primaryDiagnosis:   document.getElementById('diagnosis').value.trim(),
    secondaryCondition: document.getElementById('secondary').value.trim() || undefined,
    clinicianName:      document.getElementById('clinician').value.trim(),
    ward:               document.getElementById('ward').value.trim(),
    identifier,
    enrolmentDate:      document.getElementById('enrolmentDate').value,
    consentGiven:       document.getElementById('consent').checked,
    occupation:         'Not specified',
  };

  try {
    const patient = await createPatient(payload);

    // Store for medication setup — use normalised shape
    sessionStorage.setItem('newPatient', JSON.stringify(normalisePatient(patient)));

    showToast(`Patient ${givenName} ${familyName} registered. Setting up medications…`);

    setTimeout(() => {
      window.location.href = 'medication.html';
    }, 1500);
  } catch (err) {
    console.error('Registration failed:', err);
    showToast(`Registration failed: ${err.message}`, 'error');
    btnSubmit.disabled    = false;
    btnSubmit.textContent = '✓ Register Patient';
  }
}

function showToast(message, type = 'success') {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent         = message;
  toast.style.backgroundColor  = type === 'error' ? '#dc3545' : '#28a745';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
