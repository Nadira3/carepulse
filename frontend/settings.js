// settings.js — CarePulse Settings
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  document.getElementById('myName').value  = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  document.getElementById('myEmail').value = currentUser.email || '';
  document.getElementById('myRole').value  = currentUser.role  || '';

  // Show admin section only for admins
  if (currentUser.role === 'ADMIN') {
    document.getElementById('adminSection').style.display = 'block';
    await loadUsers();
  }

  setupEventListeners();
});

async function loadUsers() {
  try {
    const data  = await listUsers();
    renderUsers(data.results || []);
  } catch (err) {
    console.error('Failed to load users:', err);
    document.getElementById('usersTableBody').innerHTML =
      '<tr><td colspan="6" class="table-empty-message" style="color:#dc3545">Failed to load users</td></tr>';
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty-message">No users found</td></tr>';
    return;
  }

  users.forEach(u => {
    const row        = document.createElement('tr');
    const isMe       = u.id === currentUser.id;
    const lastLogin  = u.lastLoginAt
      ? new Date(u.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
      : 'Never';

    row.innerHTML = `
      <td>${u.firstName} ${u.lastName} ${isMe ? '<span class="adherence-badge badge-green">You</span>' : ''}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${lastLogin}</td>
      <td><span class="adherence-badge ${u.isActive ? 'badge-green' : 'badge-red'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        ${!isMe ? `
          <button class="action-icon" onclick="toggleUserStatus('${u.id}', ${u.isActive})"
            title="${u.isActive ? 'Deactivate' : 'Activate'}">
            ${u.isActive ? '🔒' : '🔓'}
          </button>
        ` : '—'}
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function toggleUserStatus(id, currentlyActive) {
  try {
    await updateUserStatus(id, !currentlyActive);
    showToast(`User ${currentlyActive ? 'deactivated' : 'activated'} successfully`);
    await loadUsers();
  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  }
}

function setupEventListeners() {
  const btnAdd    = document.getElementById('btnAddClinician');
  const btnCancel = document.getElementById('btnCancelAdd');
  const btnCreate = document.getElementById('btnCreateClinician');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('addClinicianForm').style.display = 'block';
      btnAdd.style.display = 'none';
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      document.getElementById('addClinicianForm').style.display = 'none';
      document.getElementById('btnAddClinician').style.display  = 'inline-block';
      clearForm();
    });
  }

  if (btnCreate) {
    btnCreate.addEventListener('click', handleCreateClinician);
  }
}

async function handleCreateClinician() {
  const firstName = document.getElementById('newFirstName').value.trim();
  const lastName  = document.getElementById('newLastName').value.trim();
  const email     = document.getElementById('newEmail').value.trim();
  const password  = document.getElementById('newPassword').value;
  const role      = document.getElementById('newRole').value;

  if (!firstName || !lastName || !email || !password) {
    showToast('All fields are required', 'error');
    return;
  }

  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  const btnCreate = document.getElementById('btnCreateClinician');
  btnCreate.disabled    = true;
  btnCreate.textContent = 'Creating…';

  try {
    await createClinician({ firstName, lastName, email, password, role });
    showToast(`${role === 'ADMIN' ? 'Admin' : 'Clinician'} account created successfully`);
    document.getElementById('addClinicianForm').style.display = 'none';
    document.getElementById('btnAddClinician').style.display  = 'inline-block';
    clearForm();
    await loadUsers();
  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  } finally {
    btnCreate.disabled    = false;
    btnCreate.textContent = '✓ Create Account';
  }
}

function clearForm() {
  ['newFirstName','newLastName','newEmail','newPassword'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('newRole').value = 'CLINICIAN';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
