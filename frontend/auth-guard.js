// auth-guard.js — MUST be first script on every protected page
const API_BASE = 'http://3.93.195.129:3000';

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
      headers: { Authorization: `Bearer ${accessToken}` },
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

  // Fetch full user profile and store in sessionStorage
  try {
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      sessionStorage.setItem('user', JSON.stringify(meData.user));
    }
  } catch {
    // non-fatal
  }

  document.addEventListener('DOMContentLoaded', () => {
    const hospitalEl = document.getElementById('hospitalName');
    if (hospitalEl) hospitalEl.textContent = 'ISTH Irrua';

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userNameEl = document.getElementById('userName');
    if (userNameEl && user.firstName) {
      userNameEl.textContent = `${user.firstName} ${user.lastName}`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => window.emrLogout());
  });

  document.documentElement.style.visibility = 'visible';
})();
