// app.js - Main frontend logic for Logistics PWA

const API = '/api/api.php';
let csrfToken = null;
let currentUser = null;

// ============== API HELPER FUNCTIONS ==============

async function apiCall(action, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };

  if (method !== 'GET' && csrfToken) {
    options.headers['X-CSRF-Token'] = csrfToken;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API}?action=${action}`, options);

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error('Server error: Expected JSON response');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  if (data.csrf_token) {
    csrfToken = data.csrf_token;
  }

  return data;
}

async function fetchCSRFToken() {
  try {
    const response = await fetch('/api/api.php?action=me', {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.csrf_token) {
      csrfToken = data.csrf_token;
      localStorage.setItem('csrfToken', data.csrf_token);
    }
  } catch (error) {
    console.log('Could not fetch CSRF token');
  }
}

// ============== AUTHENTICATION ==============

async function login(username, password) {
  const data = await apiCall('login', 'POST', { username, password });
  currentUser = data.user;
  csrfToken = data.csrf_token;
  return data;
}

async function logout() {
  try {
    await apiCall('logout', 'POST');
  } catch (error) {
    console.error('Logout error:', error);
  }

  localStorage.removeItem('loggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
  localStorage.removeItem('csrfToken');
  currentUser = null;
  csrfToken = null;

  window.location.href = '/public/';
}

// ============== NAVIGATION & UI ==============

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('mobile-hidden');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('mobile-hidden');
}

function showView(viewName) {
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });

  const viewElement = document.getElementById(`view-${viewName}`);
  if (viewElement) {
    viewElement.classList.add('active');
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`[data-view="${viewName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  const titles = {
    'dashboard': 'Dashboard',
    'admin': 'User Management',
    'clients': 'Clients',
    'client-hub': 'Client Area',
    'waybills': 'Waybills'
  };
  document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';

  if (window.innerWidth <= 768) {
    closeMobileSidebar();
  }

  loadViewData(viewName);
}

// ============== THEME MANAGER ==============

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const isDark = savedTheme === 'dark';

  if (isDark) {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  }

  // Use a slight delay to ensure DOM is ready for icon lookup if needed
  setTimeout(() => updateThemeIcons(isDark), 10);

  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  document.body.classList.toggle('dark-mode', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
  const sun = document.querySelector('.sun-icon');
  const moon = document.querySelector('.moon-icon');
  if (sun && moon) {
    sun.style.display = isDark ? 'block' : 'none';
    moon.style.display = isDark ? 'none' : 'block';
  }
}

function loadViewData(viewName) {
  switch (viewName) {
    case 'dashboard':
      loadStats();
      loadWaybills();
      break;
    case 'admin':
      loadUsers();
      break;
    case 'clients':
      loadClients();
      break;
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="spinner"></div>';
  }
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '';
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hrs ago`;
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ============== PROFILE PICTURE UPLOAD ==============

async function uploadProfilePicture(file) {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/api.php?action=upload-avatar', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': csrfToken
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Profile picture updated successfully', 'success');

      const avatarImg = document.createElement('img');
      avatarImg.src = data.avatar_url + '?t=' + Date.now();
      avatarImg.alt = 'Profile';

      const avatarDiv = document.getElementById('userAvatar');
      avatarDiv.innerHTML = '';
      avatarDiv.appendChild(avatarImg);

      const overlay = document.createElement('div');
      overlay.className = 'avatar-upload-overlay';
      overlay.textContent = 'Upload Photo';
      avatarDiv.appendChild(overlay);

    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    showToast('Failed to upload profile picture: ' + error.message, 'error');
  }
}

async function loadProfilePicture() {
  try {
    const response = await fetch('/api/api.php?action=get-avatar', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.avatar_url) {
      const avatarImg = document.createElement('img');
      avatarImg.src = data.avatar_url + '?t=' + Date.now();
      avatarImg.alt = 'Profile';

      const avatarDiv = document.getElementById('userAvatar');
      avatarDiv.innerHTML = '';
      avatarDiv.appendChild(avatarImg);

      const overlay = document.createElement('div');
      overlay.className = 'avatar-upload-overlay';
      overlay.textContent = 'Upload Photo';
      avatarDiv.appendChild(overlay);
    }
  } catch (error) {
    console.log('No profile picture set');
  }
}

// ============== DASHBOARD STATS ==============

async function loadStats() {
  try {
    const data = await apiCall('stats');
    renderStats(data.stats);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

function renderStats(stats) {
  document.getElementById('statPending').textContent = stats.pending || 0;
  document.getElementById('statOnRoad').textContent = stats.on_road || 0;
  document.getElementById('statArrived').textContent = stats.arrived || 0;
}

// ============== WAYBILLS ==============

async function loadWaybills(status = '') {
  try {
    showLoading('waybillsList');
    const data = await apiCall(`waybills${status ? `&status=${status}` : ''}`);
    renderWaybills(data.waybills);
  } catch (error) {
    showToast('Failed to load waybills: ' + error.message, 'error');
    hideLoading('waybillsList');
  }
}

function renderWaybills(waybills) {
  const container = document.getElementById('waybillsList');

  if (!waybills || waybills.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No waybills found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = waybills.map(wb => {
    const statusBadge = {
      'pending': 'badge-warning',
      'on_road': 'badge-primary',
      'arrived': 'badge-success',
      'delivered': 'badge-success'
    };

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(wb.waybill_number)}</h3>
            <span class="badge ${statusBadge[wb.status] || 'badge-warning'}">${wb.status.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
        
        <div class="text-muted mb-2">
          <div class="mb-1"><strong>Client:</strong> ${escapeHtml(wb.client_name)} (${escapeHtml(wb.client_phone)})</div>
          <div class="mb-1"><strong>From:</strong> ${escapeHtml(wb.origin)} → <strong>To:</strong> ${escapeHtml(wb.destination)}</div>
          ${wb.cargo_description ? `<div class="mb-1"><strong>Cargo:</strong> ${escapeHtml(wb.cargo_description)}</div>` : ''}
          ${wb.truck_number ? `<div class="mb-1"><strong>Truck:</strong> ${escapeHtml(wb.truck_number)}</div>` : ''}
        </div>
        
        <div class="text-muted" style="font-size: 0.75rem;">
          Created: ${formatDate(wb.created_at)}
        </div>
      </div>
    `;
  }).join('');
}

async function createWaybill(waybillData) {
  try {
    const data = await apiCall('waybills', 'POST', waybillData);
    showToast(`Waybill ${data.waybill_number} created. Receipt SMS sent!`, 'success');
    return data;
  } catch (error) {
    showToast('Failed to create waybill: ' + error.message, 'error');
    throw error;
  }
}

function resetCargoForm() {
  document.getElementById('cargoForm').reset();
  document.getElementById('clientName').focus();
}

// ============== WAYBILL STATUS FILTERING ==============

let currentWaybillFilter = '';

async function filterWaybills(status) {
  currentWaybillFilter = status;

  try {
    showLoading('waybillsList');
    const data = await apiCall(`waybills${status ? `&status=${status}` : ''}`);
    renderWaybills(data.waybills, status);
  } catch (error) {
    showToast('Failed to load waybills: ' + error.message, 'error');
    hideLoading('waybillsList');
  }
}

// ============== UPDATED RENDER WAYBILLS WITH ACTION BUTTONS ==============

function renderWaybills(waybills, filterStatus = '') {
  const container = document.getElementById('waybillsList');

  if (!waybills || waybills.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No waybills found</p>
      </div>
    `;
    return;
  }

  let filterButtonsHTML = `
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      <button class="btn ${filterStatus === '' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="filterWaybills('')">All</button>
      <button class="btn ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="filterWaybills('pending')">Pending</button>
      <button class="btn ${filterStatus === 'on_road' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="filterWaybills('on_road')">On Road</button>
      <button class="btn ${filterStatus === 'arrived' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="filterWaybills('arrived')">Arrived</button>
    </div>
  `;

  const waybillsHTML = waybills.map(wb => {
    const statusBadge = {
      'pending': 'badge-warning',
      'on_road': 'badge-primary',
      'arrived': 'badge-success',
      'delivered': 'badge-success'
    };

    let actionButtons = '';

    if (wb.status === 'pending') {
      actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="sendDepartedSMS(${wb.id}, '${escapeHtml(wb.client_name)}')">
          Depart
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteWaybill(${wb.id}, '${escapeHtml(wb.waybill_number)}')">
          Delete
        </button>
      `;
    } else if (wb.status === 'on_road') {
      actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="sendOnRoadSMS(${wb.id}, '${escapeHtml(wb.client_name)}')">
          On Road
        </button>
        <button class="btn btn-success btn-sm" onclick="sendArrivedSMS(${wb.id}, '${escapeHtml(wb.client_name)}')">
          Arrived
        </button>
      `;
    } else {
      actionButtons = `
        <span class="badge badge-success" style="padding: 0.5rem;">Delivery Complete</span>
        <button class="btn btn-danger btn-sm" onclick="deleteWaybill(${wb.id}, '${escapeHtml(wb.waybill_number)}')">
          Delete
        </button>
      `;
    }

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(wb.waybill_number)}</h3>
            <span class="badge ${statusBadge[wb.status] || 'badge-warning'}">${wb.status.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
        
        <div class="text-muted mb-2">
          <div class="mb-1"><strong>Client:</strong> ${escapeHtml(wb.client_name)} (${escapeHtml(wb.client_phone)})</div>
          <div class="mb-1"><strong>From:</strong> ${escapeHtml(wb.origin)} - <strong>To:</strong> ${escapeHtml(wb.destination)}</div>
          ${wb.cargo_description ? `<div class="mb-1"><strong>Cargo:</strong> ${escapeHtml(wb.cargo_description)}</div>` : ''}
          ${wb.weight ? `<div class="mb-1"><strong>Weight:</strong> ${wb.weight} kg</div>` : ''}
        </div>
        
        <div class="text-muted" style="font-size: 0.75rem; margin-bottom: 1rem;">
          Created: ${formatDate(wb.created_at)}
        </div>
        
        <div class="flex gap-1" style="flex-wrap: wrap;">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = filterButtonsHTML + waybillsHTML;
}



// ============== DELETE WAYBILL ==============

async function deleteWaybill(waybillId, waybillNumber) {
  if (!confirm(`Are you sure you want to delete Waybill ${waybillNumber}?\n\nThis will also delete all SMS logs associated with it.`)) {
    return;
  }

  try {
    const result = await apiCall('waybills', 'DELETE', {
      id: waybillId
    });

    showToast(`Waybill ${waybillNumber} deleted`, 'success');
    loadStats(); // Refresh stats

    // Refresh list if dashboard is active (or filter is active)
    if (document.getElementById('waybillsList')) {
      filterWaybills(currentWaybillFilter);
    }

    // Also refresh client hub list if active
    if (currentHubClientId) {
      switchClientTab('active');
    }

  } catch (error) {
    showToast('Failed to delete waybill: ' + error.message, 'error');
  }
}

// ============== SEND DEPARTED SMS ==============

async function sendDepartedSMS(waybillId, clientName) {
  if (!confirm(`Send "Departed" SMS to ${clientName}?`)) {
    return;
  }

  try {
    const result = await apiCall('waybills/send-departed', 'POST', {
      waybill_id: waybillId
    });

    showToast(`Departure SMS sent to ${clientName}`, 'success');

    filterWaybills(currentWaybillFilter);
    loadStats();

  } catch (error) {
    showToast('Failed to send departure SMS: ' + error.message, 'error');
  }
}

// ============== SEND ON-ROAD SMS ==============

async function sendOnRoadSMS(waybillId, clientName) {
  const regionName = prompt('Enter current region/location (e.g., Iringa, Mbeya):');

  if (regionName === null) return;

  if (!regionName.trim()) {
    showToast('Region name cannot be empty', 'error');
    return;
  }

  try {
    const result = await apiCall('waybills/send-onroad', 'POST', {
      waybill_id: waybillId,
      region_name: regionName.trim()
    });

    showToast(`On-Road SMS sent to ${clientName} (${regionName})`, 'success');

    filterWaybills(currentWaybillFilter);

  } catch (error) {
    showToast('Failed to send on-road SMS: ' + error.message, 'error');
  }
}

// ============== SEND ARRIVAL SMS ==============

async function sendArrivedSMS(waybillId, clientName) {
  if (!confirm(`Send "Arrived" SMS to ${clientName}?`)) {
    return;
  }

  try {
    const result = await apiCall('waybills/send-arrived', 'POST', {
      waybill_id: waybillId
    });

    showToast(`Arrival SMS sent to ${clientName}`, 'success');

    filterWaybills(currentWaybillFilter);
    loadStats();

  } catch (error) {
    showToast('Failed to send arrival SMS: ' + error.message, 'error');
  }
}

// ============== CLIENT MANAGEMENT ==============

async function loadClients(search = '') {
  try {
    showLoading('clientsList');
    const data = await apiCall(`clients${search ? `&search=${search}` : ''}`);
    renderClients(data.clients);
  } catch (error) {
    showToast('Failed to load clients: ' + error.message, 'error');
    hideLoading('clientsList');
  }
}

function renderClients(clients) {
  const container = document.getElementById('clientsList');

  if (!clients || clients.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No clients found.</p></div>`;
    return;
  }

  container.innerHTML = `<div class="grid-2">` + clients.map(client => `
    <div class="card clickable" onclick="openClientHub(${client.id})" style="cursor: pointer; transition: transform 0.2s;">
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(client.full_name)}</h3>
            <span class="badge badge-primary">Client</span>
        </div>
        <div class="text-muted">
             <div><span class="nav-icon" style="display:inline-block; width:16px; margin-right:4px;">📞</span> ${escapeHtml(client.phone)}</div>
             <div style="font-size: 0.8rem; margin-top: 0.5rem;">Joined: ${formatDate(client.created_at)}</div>
        </div>
    </div>
  `).join('') + `</div>`;
}

let currentHubClientId = null;

async function openClientHub(clientId) {
  currentHubClientId = clientId;
  showView('client-hub');

  // Load Client Details
  try {
    const data = await apiCall(`clients&id=${clientId}`);
    const client = data.client;

    if (client) {
      renderClientProfile(client);
      document.getElementById('newWbClientName').textContent = client.full_name;
      document.getElementById('wbClientId').value = client.id;

      const wbClientNameInput = document.getElementById('wbClientName');
      wbClientNameInput.value = client.full_name;
      wbClientNameInput.readOnly = true;

      const wbClientPhoneInput = document.getElementById('wbClientPhone');
      wbClientPhoneInput.value = formatPhoneNumber(client.phone);
      wbClientPhoneInput.readOnly = true;
    } else {
      throw new Error('Client not found');
    }

    switchClientTab('active');
  } catch (e) {
    showToast('Error loading client: ' + e.message, 'error');
  }
}

function renderClientProfile(client) {
  document.getElementById('clientProfileCard').innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <h2 style="font-size: 1.5rem; font-weight: 700;">${escapeHtml(client.full_name)}</h2>
                <div class="text-muted" style="font-size: 1.1rem;">${escapeHtml(client.phone)}</div>
                <div class="text-muted" style="font-size: 0.8rem;">Joined ${formatDate(client.created_at)}</div>
            </div>
            <div class="flex gap-2">
                 <button class="btn btn-secondary" onclick="editClient(${client.id})">Edit Details</button>
                 <button class="btn btn-danger" onclick="deleteClient(${client.id})">Delete</button>
            </div>
        </div>
    `;
}

function switchClientTab(tabName) {
  // Hide all
  document.querySelectorAll('.client-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  // Show active
  document.getElementById(`client-tab-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Load data
  if (tabName === 'active' || tabName === 'history') {
    loadClientWaybills(currentHubClientId, tabName);
  } else if (tabName === 'sms') {
    loadClientSMS(currentHubClientId);
  }
}

async function loadClientWaybills(clientId, tab) {
  const container = document.getElementById(`client-tab-${tab}`);
  showLoading(`client-tab-${tab}`);

  try {
    const data = await apiCall(`clients/waybills&id=${clientId}`);
    const waybills = data.waybills;

    let filtered = waybills;
    if (tab === 'active') {
      filtered = waybills.filter(w => w.status !== 'arrived' && w.status !== 'delivered');
      if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">No active shipments. <button class="btn-link" onclick="switchClientTab('create')">Create New</button></div>`;
        return;
      }
    } else {
      filtered = waybills.filter(w => w.status === 'arrived' || w.status === 'delivered');
      if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">No history found.</div>`;
        return;
      }
    }

    container.innerHTML = filtered.map(wb => renderWaybillCard(wb, true)).join('');

  } catch (e) {
    container.innerHTML = `<div class="text-danger">Failed to load waybills.</div>`;
  }
}

async function loadClientSMS(clientId) {
  const container = document.getElementById(`client-tab-sms`);
  showLoading(`client-tab-sms`);
  try {
    const data = await apiCall(`clients/sms-logs&id=${clientId}`);
    renderSMSLogsToContainer(data.sms_logs, container);
  } catch (e) {
    container.innerHTML = `<div class="text-danger">Failed to load SMS logs.</div>`;
  }
}

function renderSMSLogsToContainer(logs, container) {
  if (!logs || logs.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No SMS messages found</p></div>`;
    return;
  }

  container.innerHTML = logs.map(log => {
    const templateBadge = {
      'receipt': 'badge-success',
      'departed': 'badge-primary',
      'on_transit': 'badge-warning',
      'arrived': 'badge-success'
    };

    // Status Logic
    let statusColor = log.status === 'sent' ? 'var(--success)' : log.status === 'failed' ? 'var(--danger)' : 'var(--warning)';
    let statusText = log.status.charAt(0).toUpperCase() + log.status.slice(1);

    let statusDisplay = `<span style="color: ${statusColor}; font-weight: 600;">Status: ${statusText}</span>`;

    if (log.message_id && (log.status === 'sent' || log.status === 'queued')) {
      statusDisplay += ` <button class="btn-link" onclick="checkSMSStatus(${log.id})" style="padding: 0; margin-left: 8px; font-size: 0.85rem;" title="Check Delivery Status">↻ Check Status</button>`;
    }

    return `
      <div class="card" style="padding: 0.75rem;">
        <div class="flex justify-between mb-2">
             <div>
                <span class="badge ${templateBadge[log.template_key] || 'badge-primary'}">${log.template_key.replace('_', ' ').toUpperCase()}</span>
                <small class="text-muted ml-2">${formatDateTime(log.created_at)}</small>
             </div>
             <button class="btn-sm btn-danger" onclick="deleteSMSLog(${log.id})" style="padding: 2px 6px; font-size: 0.7rem; border: none; border-radius: 4px;" title="Delete Log Entry">Delete</button>
        </div>
        <div class="mb-2" style="font-size: 0.95rem;">${escapeHtml(log.message_text)}</div>
        <div style="font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 0.5rem; margin-top: 0.5rem;">
            ${statusDisplay}
        </div>
      </div>
    `;
  }).join('');
}

window.checkSMSStatus = async function (logId) {
  try {
    const data = await apiCall('sms/check-status', 'POST', { log_id: logId });

    if (data.success) {
      const msg = data.raw_status ? `Status: ${data.raw_status}` : 'Status checked';
      showToast(msg, 'success');
      loadClientSMS(currentHubClientId); // Refresh UI
    } else {
      showToast('Check failed: ' + (data.error || 'Unknown'), 'error');
    }
  } catch (e) {
    showToast('Error checking status: ' + e.message, 'error');
  }
};

window.deleteSMSLog = async function (logId) {
  if (!confirm('Are you sure you want to delete this SMS log entry?')) return;

  try {
    await apiCall('sms-logs', 'DELETE', { id: logId });
    showToast('SMS log deleted', 'success');
    loadClientSMS(currentHubClientId);
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  }
};

function renderWaybillCard(wb, minimalist = false) {
  const statusBadge = {
    'pending': 'badge-warning',
    'on_road': 'badge-primary',
    'arrived': 'badge-success',
    'delivered': 'badge-success'
  };

  let actionButtons = '';
  if (wb.status === 'pending') {
    actionButtons = `<button class="btn btn-primary btn-sm" onclick="sendDepartedSMS(${wb.id}, '${escapeHtml(wb.client_name)}')">Depart</button>`;
  } else if (wb.status === 'on_road') {
    actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="sendOnRoadSMS(${wb.id}, '${escapeHtml(wb.client_name)}')">Update Loc</button>
        <button class="btn btn-success btn-sm" onclick="sendArrivedSMS(${wb.id}, '${escapeHtml(wb.client_name)}')">Arrived</button>
      `;
  }

  return `
      <div class="card">
        <div class="card-header">
           <strong>${escapeHtml(wb.waybill_number)}</strong>
           <span class="badge ${statusBadge[wb.status]}">${wb.status.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="text-muted mb-2">
            ${escapeHtml(wb.origin)} ➝ ${escapeHtml(wb.destination)} <br>
            ${wb.cargo_description ? escapeHtml(wb.cargo_description) : ''}
        </div>
        <div class="flex gap-1">${actionButtons}</div>
      </div>
    `;
}

// Client Form Handlers
function openClientModal() {
  document.getElementById('clientForm').reset();
  document.getElementById('clientId').value = '';
  document.getElementById('clientModalTitle').textContent = 'Register New Client';
  document.getElementById('submitClientBtn').textContent = 'Register Client';
  openModal('clientModal');
}

function closeClientModal() {
  closeModal('clientModal');
}

// Client Actions
window.editClient = function (clientId) {
  // Open client modal but populate it
  document.getElementById('clientForm').reset();
  document.getElementById('clientModalTitle').textContent = 'Edit Client';
  document.getElementById('clientId').value = clientId; // Need to ensure form handles update if ID present
  document.getElementById('submitClientBtn').textContent = 'Update Client';

  // We already have client data in memory ideally, but let's fetch or use global ID
  // Simpler: Fetch specific client again to be safe
  apiCall(`clients&id=${clientId}`).then(data => {
    if (data.client) {
      document.getElementById('clientFullName').value = data.client.full_name;
      document.getElementById('clientPhoneNumber').value = formatPhoneNumber(data.client.phone);
      openModal('clientModal');
    }
  });
};

window.deleteClient = async function (clientId) {
  if (!confirm('Are you sure you want to delete this client? ALL history regarding this client will be deleted.')) return;

  try {
    await apiCall('clients', 'DELETE', { id: clientId });
    showToast('Client deleted successfully', 'success');
    showView('clients'); // Go back to list
  } catch (e) {
    showToast('Failed to delete: ' + e.message, 'error');
  }
};

// Update Client Form Submit Handler to handle Edit
document.getElementById('clientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientFullName').value.trim();
  const phoneInput = document.getElementById('clientPhoneNumber').value.replace(/\s/g, '');

  if (!name || !phoneInput) {
    showToast('Name and phone are required', 'error');
    return;
  }

  // Basic check (Backend does strict normalization)
  if (!/^(255\d{9}|0\d{9}|\d{9})$/.test(phoneInput)) {
    showToast('Invalid phone format. Must be 9-12 digits (e.g. 747 235 612)', 'error');
    return;
  }

  try {
    if (id) {
      await apiCall('clients', 'PUT', { id: id, full_name: name, phone: phoneInput });
      showToast('Client updated successfully', 'success');
      if (currentHubClientId == id) openClientHub(id);
    } else {
      await apiCall('clients', 'POST', { full_name: name, phone: phoneInput });
      showToast('Client registered successfully', 'success');
    }
    closeClientModal();
    loadClients();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

document.getElementById('clientCargoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    client_id: document.getElementById('wbClientId').value,
    client_name: document.getElementById('wbClientName').value,
    client_phone: document.getElementById('wbClientPhone').value.replace(/\s/g, ''),
    origin: document.getElementById('wbOrigin').value,
    destination: document.getElementById('wbDestination').value,
    cargo_description: document.getElementById('wbCargoDescription').value
  };

  try {
    await createWaybill(data);
    document.getElementById('clientCargoForm').reset();
    switchClientTab('active'); // Remain in client area and show active waybills
  } catch (e) {
    // Error handled in createWaybill
  }
});


async function loadUsers(searchTerm = '') {
  try {
    showLoading('usersList');
    const data = await apiCall(`users${searchTerm ? `&search=${searchTerm}` : ''}`);
    renderUsers(data.users);
  } catch (error) {
    showToast('Failed to load users: ' + error.message, 'error');
    hideLoading('usersList');
  }
}

function renderUsers(users) {
  const container = document.getElementById('usersList');

  if (!users || users.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No users found</p></div>`;
    return;
  }

  // Get current logged-in user to prevent self-deletion
  const currentUsername = localStorage.getItem('username');

  container.innerHTML = users.map(user => {
    const isLocked = user.lockout_until && new Date(user.lockout_until) > new Date();
    const statusClass = user.active && !isLocked ? 'status-active' : 'status-inactive';
    const isCurrentUser = user.username === currentUsername;

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(user.full_name)}</h3>
            <span class="badge badge-${user.role === 'admin' ? 'warning' : 'primary'}">${user.role.toUpperCase()}</span>
          </div>
          <span class="status-dot ${statusClass}"></span>
        </div>
        
        <div class="text-muted mb-2">
          <div class="mb-1"><strong>Username:</strong> ${escapeHtml(user.username)}</div>
          ${user.phone ? `<div class="mb-1"><strong>Phone:</strong> ${escapeHtml(user.phone)}</div>` : ''}
          <div class="mb-1"><strong>Last login:</strong> ${formatDate(user.last_login)}</div>
          <div class="mb-1"><strong>Failed attempts:</strong> ${user.failed_attempts}</div>
          ${isLocked ? `<div class="mb-1" style="color: var(--danger);"><strong>Locked until:</strong> ${formatDateTime(user.lockout_until)}</div>` : ''}
        </div>
        
        <div class="flex gap-1 mt-2" style="flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" onclick="editUser(${user.id})">Edit</button>
          <button class="btn btn-secondary btn-sm" onclick="resetPassword(${user.id}, '${escapeHtml(user.full_name)}')">Reset Password</button>
          ${user.active ?
        `<button class="btn btn-danger btn-sm" onclick="toggleUserStatus(${user.id}, false)">Deactivate</button>` :
        `<button class="btn btn-primary btn-sm" onclick="toggleUserStatus(${user.id}, true)">Activate</button>`
      }
          ${!isCurrentUser ?
        `<button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">Delete</button>` :
        ''
      }
        </div>
      </div>
    `;
  }).join('');
}

async function createUser(userData) {
  try {
    const data = await apiCall('users', 'POST', userData);
    showToast('User created successfully', 'success');
    return data;
  } catch (error) {
    showToast('Failed to create user: ' + error.message, 'error');
    throw error;
  }
}

async function updateUser(userId, userData) {
  try {
    await apiCall('users', 'PUT', { id: userId, ...userData });
    showToast('User updated successfully', 'success');
  } catch (error) {
    showToast('Failed to update user: ' + error.message, 'error');
    throw error;
  }
}

async function resetPassword(userId, userName) {
  const newPassword = prompt(`Enter new password for ${userName} (minimum 8 characters):`);

  if (!newPassword) return;

  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  try {
    await apiCall('users/reset-password', 'POST', { user_id: userId, new_password: newPassword });
    showToast('Password reset successfully', 'success');
    loadUsers();
  } catch (error) {
    showToast('Failed to reset password: ' + error.message, 'error');
  }
}

async function toggleUserStatus(userId, active) {
  try {
    await apiCall('users', 'PUT', { id: userId, active });
    showToast(`User ${active ? 'activated' : 'deactivated'} successfully`, 'success');
    loadUsers();
  } catch (error) {
    showToast('Failed to update user: ' + error.message, 'error');
  }
}

async function deleteUser(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await apiCall('users/delete', 'DELETE', { user_id: userId });
    showToast(`User "${username}" deleted successfully`, 'success');
    loadUsers();
  } catch (error) {
    showToast('Failed to delete user: ' + error.message, 'error');
  }
}

// ============== FORM HANDLERS ==============

let isEditMode = false;
let isActiveState = true;

function toggleActive() {
  const toggle = document.getElementById('activeToggle');
  isActiveState = !isActiveState;
  if (isActiveState) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

function openCreateModal() {
  isEditMode = false;
  document.getElementById('modalTitle').textContent = 'Create New User';
  document.getElementById('userId').value = '';
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('password').required = true;
  document.getElementById('submitUserBtn').textContent = 'Create User';
  document.getElementById('userForm').reset();
  document.getElementById('username').disabled = false;
  isActiveState = true;
  document.getElementById('activeToggle').classList.add('active');
  openModal('userModal');
}

function closeUserModal() {
  closeModal('userModal');
  document.getElementById('userForm').reset();
  isEditMode = false;
}

window.editUser = async function (userId) {
  try {
    const data = await apiCall('users');
    const user = data.users.find(u => u.id === userId);

    if (!user) {
      showToast('User not found', 'error');
      return;
    }

    isEditMode = true;
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('username').disabled = true;
    document.getElementById('fullName').value = user.full_name;
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('role').value = user.role;
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('password').required = false;

    isActiveState = user.active;
    if (user.active) {
      document.getElementById('activeToggle').classList.add('active');
    } else {
      document.getElementById('activeToggle').classList.remove('active');
    }

    document.getElementById('submitUserBtn').textContent = 'Update User';
    openModal('userModal');

  } catch (error) {
    showToast('Failed to load user data', 'error');
  }
};

function setupAvatarUpload() {
  const avatarInput = document.getElementById('avatarInput');
  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          showToast('File size must be less than 2MB', 'error');
          return;
        }
        if (!file.type.startsWith('image/')) {
          showToast('Please select an image file', 'error');
          return;
        }
        uploadProfilePicture(file);
      }
    });
  }
}

function setupCargoForm() {
  const cargoForm = document.getElementById('cargoForm');
  if (!cargoForm) return;

  cargoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitCargoBtn');
    const waybillData = {
      client_name: document.getElementById('clientName').value.trim(),
      client_phone: document.getElementById('clientPhone').value.replace(/\s/g, ''),
      origin: document.getElementById('origin').value.trim(),
      destination: document.getElementById('destination').value.trim(),
      cargo_description: document.getElementById('cargoDescription').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
      const result = await createWaybill(waybillData);
      resetCargoForm();
      showView('dashboard');
    } catch (error) {
      // Error handled in createWaybill
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Waybill';
    }
  });
}

function setupUserForm() {
  const form = document.getElementById('userForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitUserBtn');
    const userData = {
      username: document.getElementById('username').value.trim(),
      full_name: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      role: document.getElementById('role').value,
      active: isActiveState
    };

    // Phone Validation
    if (userData.phone) {
      const cleanPhone = userData.phone.replace(/\s/g, '');
      // Accepted: 255XXXXXXXXX (12), 0XXXXXXXXX (10), XXXXXXXXX (9)
      if (!/^(255\d{9}|0\d{9}|\d{9})$/.test(cleanPhone)) {
        showToast('Invalid phone number. Must be 9-12 digits (e.g. 747 235 612)', 'error');
        return;
      }
    }

    if (!isEditMode) {
      userData.password = document.getElementById('password').value;
      if (userData.password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = isEditMode ? 'Updating...' : 'Creating...';

    try {
      if (isEditMode) {
        const userId = document.getElementById('userId').value;
        await updateUser(userId, userData);
      } else {
        await createUser(userData);
      }
      closeUserModal();
      loadUsers();
    } catch (error) {
      // Error handled in createUser/updateUser
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isEditMode ? 'Update User' : 'Create User';
    }
  });
}

function setupSMSSearch() {
  // Global search for clients/waybills in their respective views

  const clientSearchInput = document.getElementById('clientSearchInput');
  if (clientSearchInput) {
    let searchTimeout;
    clientSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadClients(e.target.value);
      }, 300);
    });
  }

  const waybillSearchInput = document.getElementById('waybillSearchInput');
  if (waybillSearchInput) {
    let searchTimeout;
    waybillSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadWaybills(); // The global waybills search logic might need update, but let's keep it simple
      }, 300);
    });
  }

  const userSearchInput = document.getElementById('searchInput');
  if (userSearchInput) {
    let searchTimeout;
    userSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadUsers(e.target.value);
      }, 300);
    });
  }
}

// ============== INITIALIZATION ==============

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const loggedIn = localStorage.getItem('loggedIn');
  const username = localStorage.getItem('username');
  const userRole = localStorage.getItem('userRole');
  csrfToken = localStorage.getItem('csrfToken');

  if (loggedIn !== 'yes') {
    window.location.href = '/public/';
    return;
  }

  fetchCSRFToken();

  document.getElementById('userName').textContent = localStorage.getItem('fullName') || 'User';
  document.getElementById('userRole').textContent = userRole || 'Clerk';

  const initial = (localStorage.getItem('fullName') || 'U').charAt(0).toUpperCase();
  document.getElementById('avatarInitial').textContent = initial;

  if (userRole === 'admin') {
    document.getElementById('adminNavItem').style.display = 'block';
  }

  // Load profile picture if exists
  loadProfilePicture();

  // Setup forms
  setupCargoForm();
  setupUserForm();
  setupAvatarUpload();
  setupPhoneInputs();
  setupSMSSearch();
  setupAutocomplete();

  // Load initial view
  showView('dashboard');

  // Auto-refresh dashboard every 60 seconds
  setInterval(() => {
    const activeView = document.querySelector('.view-section.active');
    if (activeView && activeView.id === 'view-dashboard') {
      loadStats();
      loadWaybills();
    }
  }, 60000);
});

// ============== UTILITIES & HARDENING ==============

function formatPhoneNumber(value) {
  if (!value) return '';
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  let localPart = '';
  let prefix = '';

  if (digits.startsWith('255')) {
    prefix = '255 ';
    localPart = digits.slice(3, 12);
  } else if (digits.startsWith('0')) {
    prefix = '0';
    localPart = digits.slice(1, 10);
  } else {
    localPart = digits.slice(0, 9);
  }

  const match = localPart.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
  if (!match) return value;

  return (prefix + match[1] + (match[2] ? ' ' + match[2] : '') + (match[3] ? ' ' + match[3] : '')).trim();
}

function setupPhoneInputs() {
  const phoneInputs = [
    'clientPhoneNumber',
    'phone',
    'wbClientPhone',
    'clientPhone'
  ];

  phoneInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        const originalLength = e.target.value.length;

        const formatted = formatPhoneNumber(e.target.value);
        e.target.value = formatted;

        // Adjust cursor position if not at the end
        if (cursorPosition < originalLength) {
          const diff = formatted.length - originalLength;
          e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }
      });
    }
  });
}

// ============== SMART AUTOCOMPLETE (High Contrast) ==============

function setupAutocomplete() {
  const regions = [
    'Dar es Salaam',
    'Dodoma',
    'Mwanza',
    'Kahama',
    'Shinyanga',
    'Singida',
    'Nzega'
  ];

  const inputs = [
    { id: 'wbDestination', container: 'destContainer' }
  ];

  inputs.forEach(item => {
    const input = document.getElementById(item.id);
    const container = document.getElementById(item.container);
    if (!input || !container) return;

    // Show suggestions on focus
    input.addEventListener('focus', () => {
      container.classList.add('active');
      showSuggestions(input, container, regions);
    });

    // Handle icon click if exists
    const icon = container.querySelector('.dropdown-icon');
    if (icon) {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyActive = container.classList.contains('active');
        if (isCurrentlyActive) {
          hideSuggestions(container);
        } else {
          input.focus();
        }
      });
    }

    // Handle typing (filter)
    input.addEventListener('input', () => {
      const filtered = regions.filter(r => r.toLowerCase().includes(input.value.toLowerCase()));
      showSuggestions(input, container, filtered);
    });

    // Hide on click elsewhere
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        hideSuggestions(container);
      }
    });
  });
}

function showSuggestions(input, container, options) {
  hideSuggestions(container); // Clear existing
  if (options.length === 0) return;

  const list = document.createElement('div');
  list.className = 'autocomplete-list shadow-lg';

  options.forEach(opt => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.textContent = opt;
    item.addEventListener('click', () => {
      input.value = opt;
      hideSuggestions(container);
      // Ensure focus remains for professional feel
      input.focus();
    });
    list.appendChild(item);
  });

  container.appendChild(list);
}

function hideSuggestions(container) {
  container.classList.remove('active');
  const list = container.querySelector('.autocomplete-list');
  if (list) list.remove();
}
