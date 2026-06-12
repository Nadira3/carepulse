// auth-guard.js — MUST be first script on every protected page
const API_BASE = 'https://poker-imposing-jogging.ngrok-free.dev';

(async function guardPage() {
  document.documentElement.style.visibility = 'hidden';

  let accessToken = sessionStorage.getItem('accessToken');

  async function tryRefresh() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      sessionStorage.setItem('accessToken', data.accessToken);
      accessToken = data.accessToken;
      window.emrAccessToken = accessToken;
      return true;
    } catch {
      return false;
    }
  }

  if (!accessToken) {
    const restored = await tryRefresh();
    if (!restored) {
      window.location.replace('/index.html');
      return;
    }
  } else {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
    });
    if (!res.ok) {
      const restored = await tryRefresh();
      if (!restored) {
        sessionStorage.clear();
        window.location.replace('/index.html');
        return;
      }
    }
  }

  // Auth confirmed
  window.emrAccessToken = accessToken;

  // Fetch full user profile
  try {
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      sessionStorage.setItem('user', JSON.stringify(meData.user));
    }
  } catch {
    // non-fatal
  }

  // By the time async auth completes, DOM is already loaded
  // Use readyState check instead of DOMContentLoaded
  function attachUIHandlers() {
    const hospitalEl = document.getElementById('hospitalName');
    if (hospitalEl) hospitalEl.textContent = '';

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userNameEl = document.getElementById('userName');
    if (userNameEl && user.firstName) {
      userNameEl.textContent = `${user.firstName} ${user.lastName}`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        logoutBtn.disabled = true;
        try {
          await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch (_) {
          // ignore network errors on logout
        } finally {
          sessionStorage.clear();
          window.location.replace('/index.html');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachUIHandlers);
  } else {
    attachUIHandlers();
  }

  document.documentElement.style.visibility = 'visible';
})();
