// ==========================================
// CarePulse - Screen 4: Add Patient
// ==========================================

let currentFormStep = 1;
const totalSteps = 3;

// ==========================================
// Initialize Form
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Get hospital name from session storage
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    const hospitalName = userSession ? userSession.hospital : 'Hospital Name';
    
    document.getElementById('hospitalName').textContent = hospitalName;
    
    // Set enrolment date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('enrolmentDate').value = today;
    
    // Setup event listeners
    setupEventListeners();
});

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
    document.getElementById('btnNext').addEventListener('click', handleNextStep);
    document.getElementById('btnBack').addEventListener('click', handleBackStep);
    document.getElementById('btnSubmit').addEventListener('click', handleSubmitForm);
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
// Handle Next Step
// ==========================================
function handleNextStep() {
    if (!validateCurrentStep()) {
        return;
    }
    
    if (currentFormStep < totalSteps) {
        currentFormStep++;
        updateFormDisplay();
    }
}

// ==========================================
// Handle Back Step
// ==========================================
function handleBackStep() {
    if (currentFormStep > 1) {
        clearStepErrors(currentFormStep);
        currentFormStep--;
        updateFormDisplay();
    }
}

// ==========================================
// Validate Current Step
// ==========================================
function validateCurrentStep() {
    clearStepErrors(currentFormStep);
    
    let isValid = true;
    
    if (currentFormStep === 1) {
        // Personal Details validation
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked');
        const phone = document.getElementById('phone').value.trim();
        const language = document.getElementById('language').value.trim();
        
        if (!firstName) {
            setFieldError('firstName', 'First name is required');
            isValid = false;
        }
        if (!lastName) {
            setFieldError('lastName', 'Last name is required');
            isValid = false;
        }
        if (!age) {
            setFieldError('age', 'Age is required');
            isValid = false;
        } else if (age < 1 || age > 150) {
            setFieldError('age', 'Age must be between 1 and 150');
            isValid = false;
        }
        if (!gender) {
            setFieldError('gender', 'Gender is required');
            isValid = false;
        }
        if (!phone) {
            setFieldError('phone', 'Phone number is required');
            isValid = false;
        }
        if (!language) {
            setFieldError('language', 'Preferred language is required');
            isValid = false;
        }
    } else if (currentFormStep === 2) {
        // Clinical Details validation
        const diagnosis = document.getElementById('diagnosis').value.trim();
        const clinician = document.getElementById('clinician').value.trim();
        const ward = document.getElementById('ward').value.trim();
        
        if (!diagnosis) {
            setFieldError('diagnosis', 'Primary diagnosis is required');
            isValid = false;
        }
        if (!clinician) {
            setFieldError('clinician', 'Treating clinician name is required');
            isValid = false;
        }
        if (!ward) {
            setFieldError('ward', 'Ward / Clinic is required');
            isValid = false;
        }
    } else if (currentFormStep === 3) {
        // Enrolment validation
        const enrolmentDate = document.getElementById('enrolmentDate').value.trim();
        const consent = document.getElementById('consent').checked;
        
        if (!enrolmentDate) {
            setFieldError('enrolmentDate', 'Enrolment date is required');
            isValid = false;
        }
        if (!consent) {
            setFieldError('consent', 'Patient consent is required');
            isValid = false;
        }
    }
    
    return isValid;
}

// ==========================================
// Set Field Error
// ==========================================
function setFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('field-error');
    }
}

// ==========================================
// Clear Step Errors
// ==========================================
function clearStepErrors(step) {
    const stepElement = document.getElementById(`step${step}`);
    const errorMessages = stepElement.querySelectorAll('.error-message');
    const inputFields = stepElement.querySelectorAll('.form-input, .radio-group input, .checkbox-input');
    
    errorMessages.forEach(msg => msg.textContent = '');
    inputFields.forEach(field => field.classList.remove('field-error'));
}

// ==========================================
// Update Form Display
// ==========================================
function updateFormDisplay() {
    // Hide all steps
    for (let i = 1; i <= totalSteps; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active');
    }
    
    // Show current step
    document.getElementById(`step${currentFormStep}`).classList.add('active');
    
    // Update progress indicator
    updateProgressIndicator();
    
    // Update button visibility
    updateButtonVisibility();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// ==========================================
// Update Progress Indicator
// ==========================================
function updateProgressIndicator() {
    // Remove active class from all steps
    for (let i = 1; i <= totalSteps; i++) {
        const indicator = document.getElementById(`stepIndicator${i}`);
        indicator.classList.remove('active', 'completed');
        
        if (i < currentFormStep) {
            indicator.classList.add('completed');
        } else if (i === currentFormStep) {
            indicator.classList.add('active');
        }
    }
    
    document.getElementById('currentStep').textContent = currentFormStep;
}

// ==========================================
// Update Button Visibility
// ==========================================
function updateButtonVisibility() {
    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');
    
    // Back button enabled on step 2 and 3
    btnBack.disabled = currentFormStep === 1;
    
    if (currentFormStep === totalSteps) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-block';
    } else {
        btnNext.style.display = 'inline-block';
        btnSubmit.style.display = 'none';
    }
}

// ==========================================
// Handle Form Submit
// ==========================================
function handleSubmitForm() {
    if (!validateCurrentStep()) {
        return;
    }
    
    // Collect form data
    const formData = {
        id: mockPatients.length + 1,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        name: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
        age: parseInt(document.getElementById('age').value),
        gender: document.querySelector('input[name="gender"]:checked').value,
        phone: document.getElementById('phone').value.trim(),
        language: document.getElementById('language').value.trim(),
        diagnosis: document.getElementById('diagnosis').value.trim(),
        disease: document.getElementById('diagnosis').value.trim(), // For compatibility
        secondary: document.getElementById('secondary').value.trim() || null,
        clinician: document.getElementById('clinician').value.trim(),
        ward: document.getElementById('ward').value.trim(),
        enrolmentDate: document.getElementById('enrolmentDate').value,
        consent: document.getElementById('consent').checked,
        // Default values
        adherence: 0, // To be set after medication setup
        lastReminder: null,
        nextAppointment: null,
        medication: null,
        dosage: null,
        email: null,
        status: 'active'
    };
    
    // Add to mockPatients
    mockPatients.push(formData);
    
    // Store new patient in sessionStorage for next screen
    sessionStorage.setItem('newPatient', JSON.stringify(formData));
    
    // Show success toast
    showToast(`Patient ${formData.name} registered successfully. Now set up their medication schedule.`);
    
    // Redirect to medication setup (Screen 5) after a short delay
    setTimeout(() => {
        window.location.href = 'medication.html';
    }, 1500);
}

// ==========================================
// Show Toast Notification
// ==========================================
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
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

console.log('Add Patient form loaded');
