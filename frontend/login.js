// login.js
const API_BASE = 'https://poker-imposing-jogging.ngrok-free.dev';

// If already have a valid session, skip login
(async function checkAlreadyLoggedIn() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem('accessToken', data.accessToken);
      window.location.replace('/dashboard.html');
    }
  } catch {
    // not logged in — stay here
  }
})();

// Wire up the login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl  = document.getElementById('formError');
  const btn      = document.querySelector('.login-button');

  // Clear previous errors
  errorEl.textContent = '';
  document.getElementById('emailError').textContent = '';
  document.getElementById('passwordError').textContent = '';

  // Basic client-side validation
  let valid = true;
  if (!email) {
    document.getElementById('emailError').textContent = 'Email is required';
    valid = false;
  }
  if (!password) {
    document.getElementById('passwordError').textContent = 'Password is required';
    valid = false;
  }
  if (!valid) return;

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Invalid email or password');
    }

    // Store access token and user info
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('user', JSON.stringify(data.user));

    window.location.replace('/dashboard.html');
  } catch (err) {
    errorEl.textContent = err.message;
    btn.disabled = false;
    btn.textContent = 'LOGIN';
  }
});

// Password toggle
document.getElementById('togglePassword')?.addEventListener('click', () => {
  const input = document.getElementById('password');
  const icon  = document.querySelector('.toggle-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁';
  }
});
