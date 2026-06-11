# CarePulse — Frontend Integration Guide
**For:** Imahe Enoch (Frontend Developer)  
**Prepared by:** Precious Aitanun (Backend Developer)  
**Last updated:** June 11, 2026

---

## Overview

The backend is a Node.js/TypeScript REST API running on port 3000. All communication happens via HTTP — the frontend fetches data, the backend responds with JSON. Authentication uses JWT tokens stored in `sessionStorage` plus a `httpOnly` refresh cookie.

Everything you need to call the API is already in `frontend/api.js`. Do not duplicate API logic in your pages — call the functions that are already there.

---

## How the existing pages connect to the backend

Before building new pages, understand the pattern the existing pages follow:

### Pattern 1 — Page loads data on `DOMContentLoaded`

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await loadSomeData();
});

async function loadSomeData() {
  const res  = await apiFetch('/api/some-endpoint');
  if (!res) return; // apiFetch returns null if auth failed and redirected
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed');
  // populate the DOM with data
}
```

### Pattern 2 — Form submits to the backend

```javascript
async function handleSubmit() {
  const result = await createSomething({ field1: 'value', field2: 'value' });
  // result is the created object, or null if something went wrong
  showToast('Done!');
}
```

### Pattern 3 — Navigating between pages with data

```javascript
// Before navigating away, store the object the next page needs:
sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
window.location.href = 'next-page.html';

// On the next page, read it:
const patient = JSON.parse(sessionStorage.getItem('selectedPatient'));
```

---

## Script load order (critical)

Every protected HTML page MUST load scripts in this exact order:

```html
<script src="auth-guard.js"></script>   <!-- 1st: checks login, redirects if not authenticated -->
<script src="api.js"></script>          <!-- 2nd: defines all API functions -->
<script src="mockData.js"></script>     <!-- 3rd: empty stub, keep it -->
<script src="your-page.js"></script>    <!-- 4th: your page logic -->
```

The login page (`index.html`) is different — it loads `api.js` then `login.js`, no `auth-guard.js`.

**Do not change this order.** `auth-guard.js` runs immediately and blocks the page until auth is confirmed. `api.js` must come after it.

---

## Available API functions (from `api.js`)

All functions below are available globally on `window`. Call them directly in your JS files.

### `apiFetch(path, options)`
Raw authenticated fetch. Use this for any endpoint not covered by the helper functions below.
- Automatically attaches the JWT token
- Handles 401 by attempting a token refresh
- Returns a `Response` object or `null` if auth failed

```javascript
const res  = await apiFetch('/api/some/endpoint');
const data = await res.json();
```

---

### Patient functions

#### `listPatients(options)`
Returns a paginated list of patients from the database.

```javascript
const data = await listPatients({
  page:     1,        // default: 1
  limit:    10,       // default: 10
  search:   'Baba',  // searches givenName, familyName, identifier
  disease:  'Hypertension', // filters by primaryDiagnosis
});

// Returns:
{
  results: [ ...patients ],
  total: 50,
  page: 1,
  totalPages: 5
}
```

Each patient object looks like:
```javascript
{
  id:                 'uuid',
  openmrsUuid:        'uuid',
  identifier:         'ISTH-BJ-001',
  givenName:          'Baba',
  familyName:         'John',
  gender:             'M',          // 'M' or 'F'
  age:                61,
  phone:              '+2348150945468',
  occupation:         'Farmer',
  preferredLanguage:  'Pidgin English',
  primaryDiagnosis:   'Hypertension',
  secondaryCondition: null,
  clinicianName:      'Dr. Aitanun',
  ward:               'Cardiology',
  enrolmentDate:      '2026-06-11T00:00:00.000Z',
  consentGiven:       true,
  createdAt:          '...',
  updatedAt:          '...'
}
```

Use `normalisePatient(patient)` to add display-friendly fields:
```javascript
const p = normalisePatient(patient);
p.name    // 'Baba John'
p.disease // 'Hypertension' (alias for primaryDiagnosis)
p.language // 'Pidgin English' (alias for preferredLanguage)
```

---

#### `searchPatients(query)`
Searches OpenMRS directly for patients. Used for the search bar.

```javascript
const patients = await searchPatients('Baba');
// Returns array of OpenMRS patient objects (different shape from DB patients)
```

---

#### `getPatient(uuid)`
Gets a single patient from OpenMRS by UUID.

```javascript
const patient = await getPatient('606c2591-0bd9-44ce-9257-69b01fb1eb61');
```

---

#### `createPatient(data)`
Creates a patient in both OpenMRS and the local database.

```javascript
const patient = await createPatient({
  givenName:          'Ada',
  familyName:         'Obi',
  gender:             'F',           // must be 'M' or 'F'
  age:                45,
  phone:              '+2348100000000',
  occupation:         'Teacher',
  preferredLanguage:  'English',     // 'English' or 'Pidgin English'
  primaryDiagnosis:   'Diabetes Type 2',
  secondaryCondition: 'Asthma',      // optional
  clinicianName:      'Dr. Okafor',
  ward:               'Endocrinology',
  identifier:         'ISTH-AO-001', // must be unique
  enrolmentDate:      '2026-06-11',  // YYYY-MM-DD
  consentGiven:       true,
  occupation:         'Teacher',
});
// Returns the created patient object
```

---

### Encounter functions

#### `createEncounter(data)`
Creates a clinical encounter. Must exist before prescriptions can be created.

```javascript
const encounter = await createEncounter({
  patientId:     'patient-uuid',   // from patient.id (not openmrsUuid)
  type:          'OUTPATIENT',     // OUTPATIENT | INPATIENT | EMERGENCY | FOLLOW_UP | INITIAL
  encounterDate: '2026-06-11',     // YYYY-MM-DD
  clinicianName: 'Dr. Aitanun',
  location:      'Cardiology',     // optional
  notes:         'Follow-up visit' // optional
});
// Returns the created encounter object with patient nested inside
```

#### `listEncounters(options)`
```javascript
const data = await listEncounters({
  patientId: 'patient-uuid', // optional filter
  page:      1,
  limit:     10,
});
```

---

### Prescription functions

#### `createPrescription(data)`
Creates a prescription and automatically creates reminder schedules.

```javascript
const prescription = await createPrescription({
  patientId:      'patient-uuid',
  encounterId:    'encounter-uuid',  // REQUIRED — prescription must belong to an encounter
  drugName:       'Metformin',
  dose:           '500mg',
  frequency:      'Twice daily',     // human-readable label
  frequencyHours: 12,                // 24=once, 12=twice, 8=three times, 6=four times
  doseTimes:      ['08:00', '20:00'], // array of HH:MM strings, one per dose
  duration:       '90 days',
  instructions:   'Take with food',  // optional
  startDate:      '2026-06-11',      // YYYY-MM-DD
  endDate:        '2026-09-09',      // YYYY-MM-DD, optional
});
```

**Important:** `doseTimes` must have the same number of entries as implied by `frequencyHours`:
- 24 hours → 1 time
- 12 hours → 2 times
- 8 hours → 3 times
- 6 hours → 4 times

#### `listPrescriptions(options)`
```javascript
const data = await listPrescriptions({
  patientId:   'patient-uuid',    // optional
  encounterId: 'encounter-uuid',  // optional
  active:      true,              // optional — true or false
  page:        1,
  limit:       10,
});
```

#### `updatePrescriptionStatus(id, active)`
Activates or deactivates a prescription (also deactivates its reminder schedules).

```javascript
await updatePrescriptionStatus('prescription-uuid', false); // deactivate
await updatePrescriptionStatus('prescription-uuid', true);  // reactivate
```

---

### Reminder functions

Reminders are created and sent automatically by the worker. You don't create them from the frontend. You only read them.

To list reminders, use `apiFetch` directly (no helper function yet):

```javascript
const res  = await apiFetch('/api/reminders?page=1&limit=20&type=MEDICATION&status=SENT');
const data = await res.json();
// data.results = array of reminders
// data.total, data.page, data.totalPages
```

Each reminder looks like:
```javascript
{
  id:          'uuid',
  patientId:   'uuid',
  patient: {
    givenName:  'Baba',
    familyName: 'John',
    phone:      '+2348150945468'
  },
  type:        'MEDICATION',    // MEDICATION | APPOINTMENT | LIFESTYLE
  status:      'SENT',         // PENDING | SENT | FAILED | CANCELLED
  message:     'Baba, time to take...',
  scheduledAt: '2026-06-11T08:00:00.000Z',
  sentAt:      '2026-06-11T08:00:12.000Z',
  confirmedAt: '2026-06-11T08:15:33.000Z', // null if not confirmed
  failedAt:    null,
  channel:     'SMS',
  createdAt:   '...',
  updatedAt:   '...'
}
```

---

## Pages you need to build

### 1. `patient-profile.html` + `patient-profile.js`

**What it shows:** Full profile of a single patient — demographics, clinical details, active prescriptions, adherence score, and recent reminders.

**How to get the patient:** It's stored in sessionStorage by the patients list page.

```javascript
const patient = JSON.parse(sessionStorage.getItem('selectedPatient'));
// patient is already normalised — has .name, .disease, .language
```

**Data to load:**

```javascript
// Prescriptions for this patient
const rxData = await listPrescriptions({ patientId: patient.id, active: true });

// Reminders for this patient
const res      = await apiFetch(`/api/reminders?patientId=${patient.id}&limit=10`);
const remData  = await res.json();

// Adherence score — from the stats endpoint filtered by patient
// Currently: read from the prescriptions/reminders data directly
// Future: dedicated /api/patients/:id/adherence endpoint
```

**Sidebar link that opens this page:** The "👁 View" button in `patients.js` already does:
```javascript
sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
window.location.href = 'patient-profile.html';
```

---

### 2. `messages.html` + `messages.js`

**What it shows:** All sent SMS messages with delivery status. This is a filtered view of reminders — type ALL, status SENT or FAILED.

```javascript
// Load sent messages
const res  = await apiFetch('/api/reminders?status=SENT&limit=20&page=1');
const data = await res.json();
```

Display columns: Patient name, phone, message text (truncated), sent time, confirmed time, status.

---

### 3. `reports.html` + `reports.js`

**What it shows:** Adherence summary across all patients. Uses the stats endpoint.

```javascript
const res  = await apiFetch('/api/patients/stats');
const data = await res.json();

// data shape:
{
  totalPatients: 50,
  adherence: {
    green:     28,   // ≥80%
    amber:     14,   // 50-79%
    red:        8,   // <50%
    untracked:  0,   // no adherence record yet
    rate:      56    // % of tracked patients who are on track
  }
}
```

Also use `listPatients` with pagination to show a per-patient adherence table.

---

### 4. `settings.html` + `settings.js`

**What it shows:** Logged-in clinician's profile. Read from `sessionStorage`.

```javascript
const user = JSON.parse(sessionStorage.getItem('user') || '{}');
// user.firstName, user.lastName, user.email, user.role
```

For updating profile — there is no PUT /api/auth/profile endpoint yet. Build the UI and mark the save button as "coming soon" or open an issue.

---

## Sidebar component

Every page uses the same sidebar HTML. The only thing that changes is which `<a>` gets `class="nav-link active"`. Copy the sidebar from any existing page and update the active link.

```html
<aside class="sidebar">
  <nav class="sidebar-nav">
    <a href="dashboard.html" class="nav-link">
      <span class="nav-icon">📊</span>
      <span class="nav-label">Dashboard</span>
    </a>
    <a href="patients.html" class="nav-link">
      <span class="nav-icon">👥</span>
      <span class="nav-label">Patients</span>
    </a>
    <a href="add-patient.html" class="nav-link">
      <span class="nav-icon">➕</span>
      <span class="nav-label">Add Patient</span>
    </a>
    <a href="medication.html" class="nav-link">
      <span class="nav-icon">💊</span>
      <span class="nav-label">Medications</span>
    </a>
    <a href="reminders.html" class="nav-link">
      <span class="nav-icon">🔔</span>
      <span class="nav-label">Reminders</span>
    </a>
    <a href="messages.html" class="nav-link">
      <span class="nav-icon">💬</span>
      <span class="nav-label">Messages</span>
    </a>
    <a href="reports.html" class="nav-link">
      <span class="nav-icon">📈</span>
      <span class="nav-label">Reports</span>
    </a>
    <a href="settings.html" class="nav-link">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">Settings</span>
    </a>
  </nav>
</aside>
```

---

## Error handling pattern

Every API call should follow this pattern:

```javascript
try {
  const res = await apiFetch('/api/something');
  if (!res) return; // auth failed, already redirected
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  // use data
} catch (err) {
  console.error('Failed:', err);
  showToast(`Error: ${err.message}`, 'error');
}
```

---

## Toast notifications

All pages have a toast div. Show it like this:

```javascript
function showToast(message, type = 'success') {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent        = message;
  toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
```

---

## Common pitfalls

**1. Patient ID vs OpenMRS UUID**
- `patient.id` — our PostgreSQL UUID. Use this for all backend API calls.
- `patient.openmrsUuid` — OpenMRS identifier. Never send this to our API endpoints.

**2. Prescription requires an encounter**
You cannot create a prescription without an encounter ID. If you're building a page that lets the user add prescriptions outside of the medication setup flow, you must create an encounter first, then use its `id` for the prescription.

**3. Date format**
All dates to the API must be `YYYY-MM-DD`. The API returns ISO 8601 strings. Use `new Date(isoString).toLocaleDateString()` for display.

**4. Gender field**
The DB stores `'M'` or `'F'`. The frontend form collects `'Male'` or `'Female'`. The conversion is already handled in `add-patient.js`:
```javascript
gender: gender === 'Male' ? 'M' : 'F'
```

**5. sessionStorage is cleared on logout**
`window.emrLogout()` clears sessionStorage completely. Don't store anything in sessionStorage that isn't recoverable from the API.

---

## Quick reference — which page calls what

| Page | API calls |
|------|-----------|
| `dashboard.html` | `GET /api/patients/stats`, `GET /api/prescriptions` |
| `patients.html` | `GET /api/patients` |
| `add-patient.html` | `POST /api/patients` |
| `medication.html` | `POST /api/encounters`, `POST /api/prescriptions` |
| `reminders.html` | `GET /api/reminders` |
| `patient-profile.html` | `GET /api/prescriptions?patientId=`, `GET /api/reminders?patientId=` |
| `messages.html` | `GET /api/reminders?status=SENT` |
| `reports.html` | `GET /api/patients/stats`, `GET /api/patients` |
| `settings.html` | `sessionStorage` only (no API call needed) |

---

## Questions?

Contact Precious on the team WhatsApp. For bugs in the API, open an issue on GitHub and tag `@Nadira3`.
