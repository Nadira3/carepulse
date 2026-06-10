// ==========================================
// CarePulse - Screen 1: Login
// ==========================================

const loginForm = document.getElementById('loginForm');
const hospitalNameInput = document.getElementById('hospitalName');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const hospitalError = document.getElementById('hospitalError');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const formError = document.getElementById('formError');

// ==========================================
// Show/Hide Password Toggle
// ==========================================
togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? '👁‍🗨' : '👁';
});

// ==========================================
// Form Validation & Submission
// ==========================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear previous error messages
    clearErrors();
    
    // Get input values
    const hospitalName = hospitalNameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validate all fields are filled
    let isValid = true;
    
    if (!hospitalName) {
        hospitalError.textContent = 'Hospital name required';
        isValid = false;
    }
    
    if (!username) {
        usernameError.textContent = 'Username required';
        isValid = false;
    }
    
    if (!password) {
        passwordError.textContent = 'Password required';
        isValid = false;
    }
    
    // If any field is empty, show general error
    if (!isValid) {
        formError.textContent = 'Please fill all fields';
        return;
    }
    
    // ==========================================
    // Mock Credential Validation
    // ==========================================
    // Demo credentials for testing
    const validCredentials = [
        { username: 'doctor1', password: 'password123', hospital: 'ISTH Irrua' },
        { username: 'nurse1', password: 'password123', hospital: 'ISTH Irrua' },
        { username: 'admin', password: 'admin123', hospital: 'ISTH Irrua' },
    ];
    
    const isValidCredential = validCredentials.some(
        cred => cred.username === username && cred.password === password
    );
    
    if (!isValidCredential) {
        formError.textContent = 'Invalid username or password';
        return;
    }
    
    // ==========================================
    // Login Success - Route to Dashboard
    // ==========================================
    console.log(`Login successful for ${username}`);
    
    // Store session info (for now, in sessionStorage)
    sessionStorage.setItem('user', JSON.stringify({
        username: username,
        hospital: hospitalName,
        loginTime: new Date().toISOString()
    }));
    
    // Route to dashboard (Screen 2)
    window.location.href = 'dashboard.html';
});

// ==========================================
// Clear Error Messages
// ==========================================
function clearErrors() {
    hospitalError.textContent = '';
    usernameError.textContent = '';
    passwordError.textContent = '';
    formError.textContent = '';
}

// Clear field errors on input
hospitalNameInput.addEventListener('input', () => {
    if (hospitalNameInput.value.trim()) {
        hospitalError.textContent = '';
    }
});

usernameInput.addEventListener('input', () => {
    if (usernameInput.value.trim()) {
        usernameError.textContent = '';
    }
});

passwordInput.addEventListener('input', () => {
    if (passwordInput.value.trim()) {
        passwordError.textContent = '';
    }
});

console.log('CarePulse - Screen 1 (Login) loaded');