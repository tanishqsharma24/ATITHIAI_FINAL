
window.__WORKER_FRAMES__ = [];

/* ========================================================
   ATITHIAI - Worker Dashboard JavaScript Engine
   Full Role Management, Task Lifecycle, Interactive Checklists,
   Maintenance Tickets, Front Desk Wizard, Offline Sync & AI Copilot
   ======================================================== */

(() => {
  'use strict';

  function initCanvasAnimation() {
    // Background gate animation canvas removed
  }


  // State Management
  const STATE = {
    currentRole: 'housekeeping', // 'housekeeping' | 'maintenance' | 'frontdesk'
    isOnline: true,
    syncStatus: 'synced', // 'synced' | 'pending' | 'syncing'
    lastSyncTime: '10:42 AM',
    localChangesCount: 0,
    uploadedCount: 12,
    activeTaskFilter: 'all',
    
    // Worker Profile
    worker: {
      name: 'Raj Kumar',
      roleTitles: {
        housekeeping: 'Housekeeping Lead',
        maintenance: 'Maintenance Specialist',
        frontdesk: 'Front Desk Associate'
      },
      shift: 'Morning Shift · 08:00 - 17:00',
      breakTime: '13:00 - 13:45'
    },

    // KPI Metrics per Role
    kpis: {
      housekeeping: { tasks: 8, pending: 3, completed: 5, highPriority: 2 },
      maintenance: { tasks: 7, pending: 2, completed: 5, highPriority: 2 },
      frontdesk: { tasks: 9, pending: 2, completed: 7, highPriority: 1 }
    },

    // AI Priority Recommendations per Role
    aiPriorities: {
      housekeeping: {
        recommendation: "Room 204 requires urgent departure refresh before guest arrival at 14:00. Room 102 is currently scheduled for mid-day cleaning.",
        actionLabel: "Start Room 204",
        actionTarget: "hk-102"
      },
      maintenance: {
        recommendation: "Ticket #M1023 (Room 204 AC Compressor) is critical. Water leakage in Room 102 needs immediate valve check before cleaning begins.",
        actionLabel: "Inspect Room 204 AC",
        actionTarget: "maint-204"
      },
      frontdesk: {
        recommendation: "Guest Sophie Laurent (Room 305) is arriving in 35 mins. Foreign Guest Passport & Form C verification workflow is required.",
        actionLabel: "Review Foreign Guest Alert",
        actionTarget: "fd-305"
      }
    },

    // Today's Work Tasks
    tasks: [
      {
        id: 'task-1',
        title: 'Room 204 Deep Cleaning & Sanitization',
        location: 'Room 204',
        role: 'housekeeping',
        priority: 'high',
        due: '11:00 AM',
        status: 'in-progress',
        statusLabel: 'In Progress',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-2',
        title: 'Room 102 Cleaning & Linen Replacement',
        location: 'Room 102',
        role: 'housekeeping',
        priority: 'high',
        due: '11:30 AM',
        status: 'pending',
        statusLabel: 'Pending',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-3',
        title: 'Room 103 Refresh & Towel Restock',
        location: 'Room 103',
        role: 'housekeeping',
        priority: 'normal',
        due: '12:30 PM',
        status: 'pending',
        statusLabel: 'Pending',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-4',
        title: 'Room 105 Guest Departure Deep Turn',
        location: 'Room 105',
        role: 'housekeeping',
        priority: 'normal',
        due: '01:00 PM',
        status: 'pending',
        statusLabel: 'Pending',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-5',
        title: 'Corridor 2F Linen Cart Restock',
        location: 'Floor 2',
        role: 'housekeeping',
        priority: 'low',
        due: '02:30 PM',
        status: 'completed',
        statusLabel: 'Completed',
        assignedTo: 'Raj Kumar'
      },
      // Maintenance Tasks
      {
        id: 'task-6',
        title: 'AC Airflow & Thermostat Calibration (Ticket #M1023)',
        location: 'Room 204',
        role: 'maintenance',
        priority: 'high',
        due: '11:15 AM',
        status: 'in-progress',
        statusLabel: 'In Progress',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-7',
        title: 'Bathroom Sink Water Pressure & Trap Leakage',
        location: 'Room 102',
        role: 'maintenance',
        priority: 'high',
        due: '11:45 AM',
        status: 'pending',
        statusLabel: 'Critical Pending',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-8',
        title: 'Corridor Smart Lock Battery Replacement (3 Doors)',
        location: 'Floor 1 Wing B',
        role: 'maintenance',
        priority: 'normal',
        due: '03:00 PM',
        status: 'completed',
        statusLabel: 'Completed',
        assignedTo: 'Raj Kumar'
      },
      // Front Desk Tasks
      {
        id: 'task-9',
        title: 'VIP Early Check-in Preparation (Alex Morgan)',
        location: 'Room 201',
        role: 'frontdesk',
        priority: 'high',
        due: '01:30 PM',
        status: 'in-progress',
        statusLabel: 'In Progress',
        assignedTo: 'Raj Kumar'
      },
      {
        id: 'task-10',
        title: 'Foreign Guest Verification & Checklist (Sophie Laurent)',
        location: 'Room 305',
        role: 'frontdesk',
        priority: 'high',
        due: '02:00 PM',
        status: 'pending',
        statusLabel: 'Action Required',
        assignedTo: 'Raj Kumar'
      }
    ],

    // Housekeeping Checklist Data
    housekeepingChecklists: {
      '102': [
        { id: 'c1', name: 'Bed & Fresh Linen Fitted', done: true },
        { id: 'c2', name: 'Bathroom Sanitization & Glass Clean', done: true },
        { id: 'c3', name: 'Plush Towel Sets Restocked', done: true },
        { id: 'c4', name: 'Hardwood Floor Swept & Mopped', done: true },
        { id: 'c5', name: 'Dusting of Surfaces & Electronics', done: true },
        { id: 'c6', name: 'Signature Amenities & Kettle Bar', done: true },
        { id: 'c7', name: 'Final Room Inspection & Aroma Mist', done: false }
      ],
      '103': [
        { id: 'c1', name: 'Bed & Fresh Linen Fitted', done: true },
        { id: 'c2', name: 'Bathroom Sanitization & Glass Clean', done: true },
        { id: 'c3', name: 'Plush Towel Sets Restocked', done: false },
        { id: 'c4', name: 'Hardwood Floor Swept & Mopped', done: false },
        { id: 'c5', name: 'Dusting of Surfaces & Electronics', done: false },
        { id: 'c6', name: 'Signature Amenities & Kettle Bar', done: false },
        { id: 'c7', name: 'Final Room Inspection & Aroma Mist', done: false }
      ],
      '105': [
        { id: 'c1', name: 'Bed & Fresh Linen Fitted', done: false },
        { id: 'c2', name: 'Bathroom Sanitization & Glass Clean', done: false },
        { id: 'c3', name: 'Plush Towel Sets Restocked', done: false },
        { id: 'c4', name: 'Hardwood Floor Swept & Mopped', done: false },
        { id: 'c5', name: 'Dusting of Surfaces & Electronics', done: false },
        { id: 'c6', name: 'Signature Amenities & Kettle Bar', done: false },
        { id: 'c7', name: 'Final Room Inspection & Aroma Mist', done: false }
      ]
    },

    // Maintenance Tickets
    maintenanceTickets: [
      {
        id: 'M1023',
        room: 'Room 204',
        title: 'AC not cooling / Fan vibration noise',
        priority: 'High',
        status: 'In Progress',
        assigned: 'Raj Kumar',
        reportedAt: '09:15 AM',
        notes: 'Compressor inspected. Filter replaced. Thermostat recalibrated. Verifying cooling temp.'
      },
      {
        id: 'M1024',
        room: 'Room 102',
        title: 'Bathroom pipe joint slow water seepage',
        priority: 'High',
        status: 'Open',
        assigned: 'Raj Kumar',
        reportedAt: '10:05 AM',
        notes: 'Main supply shutoff inspected. O-ring replacement kit required.'
      },
      {
        id: 'M1025',
        room: 'Room 301',
        title: 'Keycard reader green light intermittent',
        priority: 'Normal',
        status: 'Resolved',
        assigned: 'Raj Kumar',
        reportedAt: 'Yesterday',
        notes: 'Lithium battery cell replaced. Re-paired with PMS controller.'
      }
    ],

    // Front Desk Arrivals & Check-in
    frontDeskArrivals: [
      {
        id: 'arr-1',
        guest: 'Alex Morgan',
        room: '201 (Deluxe Suite)',
        eta: '14:00 (Today)',
        status: 'Ready for Check-in',
        isForeign: false,
        nights: 3,
        step: 4
      },
      {
        id: 'arr-2',
        guest: 'Sophie Laurent',
        room: '305 (Panoramic View)',
        eta: '14:45 (Today)',
        status: 'Foreign Guest Verification Pending',
        isForeign: true,
        nights: 5,
        step: 2
      },
      {
        id: 'arr-3',
        guest: 'David Chen',
        room: '104 (Garden Studio)',
        eta: '16:00 (Today)',
        status: 'Assigned',
        isForeign: false,
        nights: 2,
        step: 1
      }
    ],

    // Live Room Statuses
    rooms: [
      { num: '101', state: 'ready', label: 'READY' },
      { num: '102', state: 'cleaning', label: 'CLEANING' },
      { num: '103', state: 'maintenance', label: 'MAINTENANCE' },
      { num: '104', state: 'occupied', label: 'OCCUPIED' },
      { num: '105', state: 'departure', label: 'DEPARTURE' },
      { num: '106', state: 'ready', label: 'READY' },
      { num: '107', state: 'occupied', label: 'OCCUPIED' },
      { num: '108', state: 'ready', label: 'READY' },
      { num: '201', state: 'ready', label: 'READY' },
      { num: '202', state: 'occupied', label: 'OCCUPIED' },
      { num: '203', state: 'occupied', label: 'OCCUPIED' },
      { num: '204', state: 'maintenance', label: 'MAINTENANCE' },
      { num: '205', state: 'ready', label: 'READY' },
      { num: '206', state: 'cleaning', label: 'CLEANING' },
      { num: '301', state: 'ready', label: 'READY' },
      { num: '302', state: 'occupied', label: 'OCCUPIED' },
      { num: '304', state: 'ready', label: 'READY' },
      { num: '305', state: 'ready', label: 'READY' }
    ]
  };

  // DOM Elements Cache
  const DOM = {
    roleBtns: document.querySelectorAll('.role-pill-btn'),
    workerRoleTag: document.getElementById('worker-role-display'),
    workerNameDisplay: document.getElementById('worker-name-display'),
    shiftDisplay: document.getElementById('shift-display'),
    
    // KPI Counters
    kpiTasksVal: document.getElementById('kpi-tasks-val'),
    kpiPendingVal: document.getElementById('kpi-pending-val'),
    kpiCompletedVal: document.getElementById('kpi-completed-val'),
    kpiHighPriorityVal: document.getElementById('kpi-priority-val'),

    // AI Priority
    aiPriorityDesc: document.getElementById('ai-priority-desc'),
    btnAskAiPriority: document.getElementById('btn-ask-ai-priority'),

    // Modules
    moduleHousekeeping: document.getElementById('module-housekeeping'),
    moduleMaintenance: document.getElementById('module-maintenance'),
    moduleFrontDesk: document.getElementById('module-frontdesk'),

    // Tasks
    taskStreamContainer: document.getElementById('task-stream-container'),
    taskFilterBtns: document.querySelectorAll('.task-filter-btn'),

    // Room Status
    roomGridContainer: document.getElementById('room-grid-container'),

    // Sync Center
    syncBadge: document.getElementById('sync-status-badge'),
    syncBadgeText: document.getElementById('sync-status-text'),
    btnSyncNow: document.getElementById('btn-sync-now'),
    btnToggleOffline: document.getElementById('btn-toggle-offline'),
    syncLocalCount: document.getElementById('sync-local-count'),
    syncUploadedCount: document.getElementById('sync-uploaded-count'),
    syncLastTime: document.getElementById('sync-last-time'),

    // AI Drawer
    aiDrawerOverlay: document.getElementById('ai-drawer-overlay'),
    btnOpenAiDrawer: document.querySelectorAll('.open-ai-drawer-btn'),
    btnCloseAiDrawer: document.getElementById('btn-close-ai-drawer'),
    aiChatFeed: document.getElementById('ai-chat-feed'),
    aiInputField: document.getElementById('ai-input-field'),
    btnSendAi: document.getElementById('btn-send-ai'),
    aiPromptChips: document.querySelectorAll('.ai-prompt-chip'),

    // Check-in Modal
    checkinModalOverlay: document.getElementById('checkin-modal-overlay'),
    btnCloseCheckin: document.getElementById('btn-close-checkin'),
    btnNextStepCheckin: document.getElementById('btn-next-step-checkin'),
    checkinGuestName: document.getElementById('checkin-guest-name'),
    checkinRoomNum: document.getElementById('checkin-room-num'),

    // Housekeeping Checklist Modal
    hkModalOverlay: document.getElementById('hk-modal-overlay'),
    btnCloseHkModal: document.getElementById('btn-close-hk-modal'),
    hkModalRoomNum: document.getElementById('hk-modal-room-num'),
    hkChecklistContainer: document.getElementById('hk-checklist-container'),
    btnCompleteHkCleaning: document.getElementById('btn-complete-hk-cleaning'),

    // Maintenance Ticket Modal
    maintModalOverlay: document.getElementById('maint-modal-overlay'),
    btnCloseMaintModal: document.getElementById('btn-close-maint-modal'),
    maintTicketId: document.getElementById('maint-modal-ticket-id'),
    maintIssueTitle: document.getElementById('maint-modal-title'),
    maintNotesInput: document.getElementById('maint-modal-notes'),
    btnResolveTicket: document.getElementById('btn-resolve-ticket'),

    // Profile Modal
    profileModalOverlay: document.getElementById('profile-modal-overlay'),
    btnOpenProfile: document.getElementById('btn-open-profile'),
    btnCloseProfile: document.getElementById('btn-close-profile'),

    // Toast
    toastContainer: document.getElementById('toast-container'),

    // Mobile Navigation
    mobileNavItems: document.querySelectorAll('.mobile-nav-item')
  };

  /* ========================================================
     Toast Notifications Helper
     ======================================================== */
  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    
    let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* ========================================================
     Role Switcher Logic
     ======================================================== */
  function setRole(roleName) {
    if (!['housekeeping', 'maintenance', 'frontdesk'].includes(roleName)) return;
    STATE.currentRole = roleName;

    // Update active pill styling
    DOM.roleBtns.forEach(btn => {
      if (btn.dataset.role === roleName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update worker header metadata
    if (DOM.workerRoleTag) {
      DOM.workerRoleTag.textContent = STATE.worker.roleTitles[roleName];
    }

    // Update KPIs
    const kpiData = STATE.kpis[roleName];
    if (DOM.kpiTasksVal) DOM.kpiTasksVal.textContent = kpiData.tasks;
    if (DOM.kpiPendingVal) DOM.kpiPendingVal.textContent = kpiData.pending;
    if (DOM.kpiCompletedVal) DOM.kpiCompletedVal.textContent = kpiData.completed;
    if (DOM.kpiHighPriorityVal) DOM.kpiHighPriorityVal.textContent = kpiData.highPriority;

    // Update AI Priority Card
    const aiData = STATE.aiPriorities[roleName];
    if (DOM.aiPriorityDesc) {
      DOM.aiPriorityDesc.textContent = aiData.recommendation;
    }

    // Toggle Role-Specific Operation Modules
    if (DOM.moduleHousekeeping) {
      DOM.moduleHousekeeping.classList.toggle('hidden', roleName !== 'housekeeping');
    }
    if (DOM.moduleMaintenance) {
      DOM.moduleMaintenance.classList.toggle('hidden', roleName !== 'maintenance');
    }
    if (DOM.moduleFrontDesk) {
      DOM.moduleFrontDesk.classList.toggle('hidden', roleName !== 'frontdesk');
    }

    // Re-render Task Stream
    renderTasks();

    showToast(`Switched workspace to ${STATE.worker.roleTitles[roleName]}`, 'info');
  }

  /* ========================================================
     Tasks Stream Rendering & Lifecycle
     ======================================================== */
  function renderTasks() {
    if (!DOM.taskStreamContainer) return;
    DOM.taskStreamContainer.innerHTML = '';

    const filtered = STATE.tasks.filter(task => {
      // Filter by current active role
      if (task.role !== STATE.currentRole) return false;

      // Filter by tab
      if (STATE.activeTaskFilter === 'high-priority') return task.priority === 'high';
      if (STATE.activeTaskFilter === 'in-progress') return task.status === 'in-progress';
      if (STATE.activeTaskFilter === 'completed') return task.status === 'completed';
      return true;
    });

    if (filtered.length === 0) {
      DOM.taskStreamContainer.innerHTML = `
        <div class="glass-card" style="padding: 2.5rem; text-align: center; color: var(--color-white-muted);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.5rem; opacity: 0.6;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <p style="font-weight: 600; color: #fff;">All filtered tasks complete!</p>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">No tasks found matching current filter.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(task => {
      const card = document.createElement('div');
      card.className = 'glass-card task-card';

      const priorityClass = task.priority === 'high' ? 'task-priority-high' : task.priority === 'normal' ? 'task-priority-normal' : 'task-priority-low';
      const statusClass = task.status === 'in-progress' ? 'in-progress' : task.status === 'completed' ? 'completed' : 'pending';

      card.innerHTML = `
        <div class="task-priority-indicator ${priorityClass}"></div>
        <div class="task-main-info">
          <div class="task-title-row">
            <span class="task-name">${task.title}</span>
            <span class="badge-location">${task.location}</span>
            <span class="badge-priority ${task.priority}">${task.priority}</span>
          </div>
          <div class="task-meta-row">
            <span class="task-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Due: ${task.due}
            </span>
            <span class="task-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${task.assignedTo}
            </span>
            <span class="task-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Verification: Auto
            </span>
          </div>
        </div>
        <div>
          <span class="task-status-chip ${statusClass}">${task.statusLabel}</span>
        </div>
        <div class="task-actions">
          ${task.status === 'completed' ? `
            <button class="btn-task-action" data-action="reopen" data-id="${task.id}">Reopen</button>
          ` : `
            <button class="btn-task-action primary" data-action="action" data-id="${task.id}">
              ${task.status === 'in-progress' ? 'Complete' : 'Start Task'}
            </button>
          `}
          <button class="btn-task-action" data-action="details" data-id="${task.id}" aria-label="Details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      `;

      // Event listener for actions
      const actionBtn = card.querySelector('[data-action="action"]');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => handleTaskAction(task));
      }
      const reopenBtn = card.querySelector('[data-action="reopen"]');
      if (reopenBtn) {
        reopenBtn.addEventListener('click', () => {
          task.status = 'in-progress';
          task.statusLabel = 'In Progress';
          renderTasks();
          recordLocalChange(`Reopened task ${task.title}`);
        });
      }

      DOM.taskStreamContainer.appendChild(card);
    });
  }

  function handleTaskAction(task) {
    if (task.status === 'pending') {
      task.status = 'in-progress';
      task.statusLabel = 'In Progress';
      showToast(`Started work on ${task.location}`, 'info');
    } else if (task.status === 'in-progress') {
      task.status = 'completed';
      task.statusLabel = 'Completed';
      showToast(`Completed ${task.title}! Marked for verification.`, 'success');
    }
    renderTasks();
    recordLocalChange(`Updated status of ${task.title} to ${task.status}`);
  }

  /* ========================================================
     Housekeeping 7-Point Interactive Checklist Modal
     ======================================================== */
  let activeHkRoom = '102';

  function openHkModal(roomNum) {
    activeHkRoom = roomNum;
    if (DOM.hkModalRoomNum) DOM.hkModalRoomNum.textContent = `Room ${roomNum}`;
    renderHkChecklist();
    if (DOM.hkModalOverlay) DOM.hkModalOverlay.classList.add('open');
  }

  function renderHkChecklist() {
    if (!DOM.hkChecklistContainer) return;
    const items = STATE.housekeepingChecklists[activeHkRoom] || [];
    DOM.hkChecklistContainer.innerHTML = '';

    let completedCount = 0;

    items.forEach((item, index) => {
      if (item.done) completedCount++;

      const row = document.createElement('div');
      row.className = `check-item-row ${item.done ? 'checked' : ''}`;
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <div class="check-custom-box">
            ${item.done ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          <div>
            <span style="font-size: 0.92rem; font-weight: 500; color: #fff;">${item.name}</span>
            <p style="font-size: 0.72rem; color: var(--color-white-subtle);">Step ${index + 1} of 7 · Required checkpoint</p>
          </div>
        </div>
        <span style="font-size: 0.75rem; color: ${item.done ? 'var(--color-brand-emerald)' : 'var(--color-white-subtle)'};">
          ${item.done ? 'Done' : 'Tap to mark'}
        </span>
      `;

      row.addEventListener('click', () => {
        item.done = !item.done;
        renderHkChecklist();
        recordLocalChange(`Checklist item ${item.name} for Room ${activeHkRoom} set to ${item.done}`);
      });

      DOM.hkChecklistContainer.appendChild(row);
    });

    if (DOM.btnCompleteHkCleaning) {
      if (completedCount === items.length) {
        DOM.btnCompleteHkCleaning.disabled = false;
        DOM.btnCompleteHkCleaning.innerHTML = `✓ Complete Cleaning (${completedCount}/${items.length})`;
      } else {
        DOM.btnCompleteHkCleaning.disabled = false;
        DOM.btnCompleteHkCleaning.innerHTML = `Mark Complete (${completedCount}/${items.length})`;
      }
    }
  }

  /* ========================================================
     Maintenance Ticket Details Modal
     ======================================================== */
  let activeTicketId = 'M1023';

  function openMaintModal(ticketId) {
    activeTicketId = ticketId;
    const ticket = STATE.maintenanceTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (DOM.maintTicketId) DOM.maintTicketId.textContent = `Ticket #${ticket.id} · ${ticket.room}`;
    if (DOM.maintIssueTitle) DOM.maintIssueTitle.textContent = ticket.title;
    if (DOM.maintNotesInput) DOM.maintNotesInput.value = ticket.notes;

    if (DOM.maintModalOverlay) DOM.maintModalOverlay.classList.add('open');
  }

  /* ========================================================
     Front Desk 6-Step Check-in Flow Modal
     ======================================================== */
  let currentCheckinStep = 1;
  const TOTAL_CHECKIN_STEPS = 6;
  const STEP_TITLES = [
    'Booking Confirmation',
    'Guest Contact Details',
    'Identity Verification (ID / Passport)',
    'Room Key & RFID Assignment',
    'Payment & Security Pre-Auth',
    'Check-in Complete & Welcome Sent'
  ];

  function openCheckinModal(guestName, roomNum) {
    currentCheckinStep = 1;
    if (DOM.checkinGuestName) DOM.checkinGuestName.textContent = guestName;
    if (DOM.checkinRoomNum) DOM.checkinRoomNum.textContent = roomNum;
    updateCheckinStepUI();
    if (DOM.checkinModalOverlay) DOM.checkinModalOverlay.classList.add('open');
  }

  function updateCheckinStepUI() {
    const stepTitleElem = document.getElementById('checkin-current-step-title');
    const stepBodyElem = document.getElementById('checkin-step-content');
    if (stepTitleElem) stepTitleElem.textContent = `Step ${currentCheckinStep} of ${TOTAL_CHECKIN_STEPS}: ${STEP_TITLES[currentCheckinStep - 1]}`;

    // Stepper node highlights
    for (let i = 1; i <= TOTAL_CHECKIN_STEPS; i++) {
      const node = document.getElementById(`step-node-${i}`);
      if (node) {
        node.className = `step-node ${i === currentCheckinStep ? 'active' : i < currentCheckinStep ? 'done' : ''}`;
      }
    }

    if (stepBodyElem) {
      if (currentCheckinStep === 1) {
        stepBodyElem.innerHTML = `
          <div style="background: rgba(255,255,255,0.04); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-glass-subtle);">
            <p style="font-size: 0.85rem; color: #fff;"><strong>Reservation ID:</strong> #AT-98421</p>
            <p style="font-size: 0.85rem; color: var(--color-white-muted);"><strong>Dates:</strong> Sep 04 – Sep 07 (3 Nights)</p>
            <p style="font-size: 0.85rem; color: var(--color-white-muted);"><strong>Room Category:</strong> Deluxe King Panoramic Suite</p>
            <p style="font-size: 0.85rem; color: var(--color-brand-emerald);">✓ Booking Guaranteed (Prepaid)</p>
          </div>
        `;
      } else if (currentCheckinStep === 2) {
        stepBodyElem.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-input-group">
              <label class="form-label">Guest Full Name</label>
              <input type="text" class="form-input" value="Alex Morgan" />
            </div>
            <div class="form-input-group">
              <label class="form-label">Phone / WhatsApp</label>
              <input type="text" class="form-input" value="+1 (555) 349-2910" />
            </div>
          </div>
        `;
      } else if (currentCheckinStep === 3) {
        stepBodyElem.innerHTML = `
          <div style="background: rgba(0, 102, 255, 0.08); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(0, 102, 255, 0.3);">
            <p style="font-size: 0.9rem; font-weight: 600; color: #fff; margin-bottom: 0.4rem;">Digital Identity Verification</p>
            <p style="font-size: 0.82rem; color: var(--color-white-muted); margin-bottom: 0.85rem;">Scanned Government Photo ID via AtithiAI OCR Engine.</p>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn-primary-blue" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">Verify OCR Match</button>
              <button class="btn-secondary-glass" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">Capture Photo</button>
            </div>
          </div>
        `;
      } else if (currentCheckinStep === 4) {
        stepBodyElem.innerHTML = `
          <div style="background: rgba(255,255,255,0.04); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-glass-subtle); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="font-size: 0.9rem; font-weight: 600; color: #fff;">Assign Smart Key / Mobile NFC</p>
              <p style="font-size: 0.78rem; color: var(--color-white-muted);">Hold RFID keycard against reader or send digital WhatsApp key</p>
            </div>
            <button class="btn-primary-blue" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">Program Key</button>
          </div>
        `;
      } else if (currentCheckinStep === 5) {
        stepBodyElem.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
              <span style="color: var(--color-white-muted);">Room Charges:</span>
              <span style="color: #fff; font-weight: 600;">$480.00 (Paid)</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
              <span style="color: var(--color-white-muted);">Security Incidental Deposit:</span>
              <span style="color: #fff; font-weight: 600;">$100.00 (Hold Authorized)</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--color-brand-emerald); margin-top: 0.5rem;">✓ Card Pre-Authorization Successful</p>
          </div>
        `;
      } else if (currentCheckinStep === 6) {
        stepBodyElem.innerHTML = `
          <div style="text-align: center; padding: 1.5rem 0;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background: var(--color-brand-emerald-subtle); color: var(--color-brand-emerald); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem;">Check-in Complete!</h3>
            <p style="font-size: 0.88rem; color: var(--color-white-muted);">Room 201 has been marked Occupied. Welcome message dispatched.</p>
          </div>
        `;
      }
    }

    if (DOM.btnNextStepCheckin) {
      if (currentCheckinStep === TOTAL_CHECKIN_STEPS) {
        DOM.btnNextStepCheckin.textContent = 'Finish Check-in';
      } else {
        DOM.btnNextStepCheckin.textContent = 'Proceed to Next Step →';
      }
    }
  }

  /* ========================================================
     Live Room Status Grid & Interactive Quick Updates
     ======================================================== */
  function renderRoomStatusGrid() {
    if (!DOM.roomGridContainer) return;
    DOM.roomGridContainer.innerHTML = '';

    STATE.rooms.forEach(room => {
      const chip = document.createElement('div');
      chip.className = `glass-card room-chip-card state-${room.state}`;
      chip.innerHTML = `
        <span class="room-chip-num">${room.num}</span>
        <span class="room-chip-state">${room.label}</span>
      `;

      chip.addEventListener('click', () => {
        cycleRoomState(room);
      });

      DOM.roomGridContainer.appendChild(chip);
    });
  }

  function cycleRoomState(room) {
    const sequence = ['ready', 'occupied', 'cleaning', 'maintenance', 'departure'];
    const labels = {
      ready: 'READY',
      occupied: 'OCCUPIED',
      cleaning: 'CLEANING',
      maintenance: 'MAINTENANCE',
      departure: 'DEPARTURE'
    };

    const nextIndex = (sequence.indexOf(room.state) + 1) % sequence.length;
    room.state = sequence[nextIndex];
    room.label = labels[room.state];

    renderRoomStatusGrid();
    showToast(`Room ${room.num} updated to ${room.label}`, 'info');
    recordLocalChange(`Room ${room.num} state updated to ${room.label}`);
  }

  /* ========================================================
     Offline-First & Local Storage Sync Engine
     ======================================================== */
  function recordLocalChange(actionDesc) {
    STATE.localChangesCount++;
    STATE.syncStatus = 'pending';
    updateSyncUI();

    try {
      localStorage.setItem('atithi_worker_state', JSON.stringify({
        lastUpdate: new Date().toISOString(),
        tasks: STATE.tasks,
        rooms: STATE.rooms
      }));
    } catch (e) {
      console.warn('Storage quota', e);
    }
  }

  function updateSyncUI() {
    if (DOM.syncLocalCount) DOM.syncLocalCount.textContent = STATE.localChangesCount;
    if (DOM.syncUploadedCount) DOM.syncUploadedCount.textContent = STATE.uploadedCount;
    if (DOM.syncLastTime) DOM.syncLastTime.textContent = STATE.lastSyncTime;

    if (DOM.syncBadge) {
      if (!STATE.isOnline) {
        DOM.syncBadge.className = 'sync-status-badge offline-mode';
        if (DOM.syncBadgeText) DOM.syncBadgeText.textContent = 'Offline — Saved Locally';
      } else if (STATE.syncStatus === 'syncing') {
        DOM.syncBadge.className = 'sync-status-badge syncing-mode';
        if (DOM.syncBadgeText) DOM.syncBadgeText.textContent = 'Syncing changes...';
      } else {
        DOM.syncBadge.className = 'sync-status-badge';
        if (DOM.syncBadgeText) DOM.syncBadgeText.textContent = STATE.localChangesCount > 0 ? `${STATE.localChangesCount} Local Changes` : 'Online — All Synced';
      }
    }
  }

  function triggerSync() {
    if (!STATE.isOnline) {
      showToast('Cannot sync while Offline. Please switch to Online mode first.', 'warning');
      return;
    }

    STATE.syncStatus = 'syncing';
    updateSyncUI();
    showToast('Sync Engine active: Uploading cached local transactions to Cloud PMS...', 'info');

    setTimeout(() => {
      STATE.uploadedCount += STATE.localChangesCount;
      STATE.localChangesCount = 0;
      STATE.syncStatus = 'synced';
      STATE.lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updateSyncUI();
      showToast('✓ Sync Complete: All changes securely stored on server.', 'success');
    }, 1200);
  }

  function toggleOfflineSimulation() {
    STATE.isOnline = !STATE.isOnline;
    if (DOM.btnToggleOffline) {
      DOM.btnToggleOffline.textContent = STATE.isOnline ? 'Simulate Offline' : 'Go Online';
    }
    updateSyncUI();
    showToast(STATE.isOnline ? 'Connected to property network.' : 'Switched to Offline-First mode.', STATE.isOnline ? 'success' : 'warning');
  }

  /* ========================================================
     Worker AI Assistant Drawer (Section 14) - ATITHIAI Agent
     ======================================================== */
  function openAiDrawer(prefillQuery = '') {
    if (window.AtithiAiAgent) {
      window.AtithiAiAgent.open({ context: 'worker' });
      if (prefillQuery) {
        const inp = document.getElementById('atithiai-input');
        if (inp) {
          inp.value = prefillQuery;
          document.getElementById('atithiai-send-btn')?.click();
        }
      }
      return;
    }
    if (DOM.aiDrawerOverlay) DOM.aiDrawerOverlay.classList.add('open');
    if (prefillQuery && DOM.aiInputField) {
      DOM.aiInputField.value = prefillQuery;
      handleAiSubmit(prefillQuery);
    }
  }

  function closeAiDrawer() {
    if (window.AtithiAiAgent) window.AtithiAiAgent.close();
    if (DOM.aiDrawerOverlay) DOM.aiDrawerOverlay.classList.remove('open');
  }

  function handleAiSubmit(customPrompt = '') {
    const query = customPrompt || (DOM.aiInputField ? DOM.aiInputField.value.trim() : '');
    if (!query) return;

    if (window.AtithiAiAgent) {
      window.AtithiAiAgent.open({ context: 'worker' });
      const inp = document.getElementById('atithiai-input');
      if (inp) {
        inp.value = query;
        document.getElementById('atithiai-send-btn')?.click();
      }
      return;
    }

    // Append User Message
    appendAiMessage(query, 'user');
    if (DOM.aiInputField) DOM.aiInputField.value = '';

    // Show simulated thinking
    setTimeout(() => {
      let botResponse = '';
      const lower = query.toLowerCase();

      if (lower.includes('next') || lower.includes('what should i do')) {
        botResponse = `✦ **Next Recommended Action**: Room 204 requires immediate departure inspection before 11:30 AM arrival. I have opened the 7-point checklist for you.`;
      } else if (lower.includes('pending') || lower.includes('show my tasks')) {
        botResponse = `You have **3 pending tasks** for today. Highest priority is **Room 204** (Deep Cleaning) followed by **Room 102** (Linen replacement).`;
      } else if (lower.includes('room 204') || lower.includes('blocked')) {
        botResponse = `Room 204 has Ticket #M1023 (AC Vibration) marked In-Progress. Guest check-in is scheduled for 14:00. Priority is High.`;
      } else if (lower.includes('maintenance') || lower.includes('report')) {
        botResponse = `Maintenance ticket draft created for your active location. Please attach work notes or tap "Submit Maintenance Ticket".`;
      } else {
        botResponse = `Understood. Analyzing property status for ${STATE.worker.roleTitles[STATE.currentRole]}... All systems operational. Your next due checkpoint is at 11:30 AM.`;
      }

      appendAiMessage(botResponse, 'bot');
    }, 600);
  }

  function appendAiMessage(text, sender) {
    if (!DOM.aiChatFeed) return;
    const msg = document.createElement('div');
    msg.className = `ai-msg ${sender}`;
    msg.innerHTML = text.replace(/\n/g, '<br/>');
    DOM.aiChatFeed.appendChild(msg);
    DOM.aiChatFeed.scrollTop = DOM.aiChatFeed.scrollHeight;
  }

  /* ========================================================
     Event Listeners & Initialization
     ======================================================== */
  function bindEvents() {
    // Role switcher pills
    DOM.roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setRole(btn.dataset.role);
      });
    });

    // Task Filter tabs
    DOM.taskFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.taskFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.activeTaskFilter = btn.dataset.filter;
        renderTasks();
      });
    });

    // AI Priority Trigger
    if (DOM.btnAskAiPriority) {
      DOM.btnAskAiPriority.addEventListener('click', () => {
        const aiInfo = STATE.aiPriorities[STATE.currentRole];
        openAiDrawer(`How should I handle: ${aiInfo.recommendation}`);
      });
    }

    // Sync Engine Controls
    if (DOM.btnSyncNow) DOM.btnSyncNow.addEventListener('click', triggerSync);
    if (DOM.syncBadge) DOM.syncBadge.addEventListener('click', triggerSync);
    if (DOM.btnToggleOffline) DOM.btnToggleOffline.addEventListener('click', toggleOfflineSimulation);

    // AI Drawer
    DOM.btnOpenAiDrawer.forEach(btn => {
      btn.addEventListener('click', () => openAiDrawer());
    });
    if (DOM.btnCloseAiDrawer) DOM.btnCloseAiDrawer.addEventListener('click', closeAiDrawer);
    if (DOM.aiDrawerOverlay) {
      DOM.aiDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.aiDrawerOverlay) closeAiDrawer();
      });
    }
    if (DOM.btnSendAi) DOM.btnSendAi.addEventListener('click', () => handleAiSubmit());
    if (DOM.aiInputField) {
      DOM.aiInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAiSubmit();
      });
    }
    DOM.aiPromptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        handleAiSubmit(chip.dataset.prompt || chip.innerText.trim());
      });
    });

    // Check-in Modal Events
    document.querySelectorAll('[data-action="open-checkin"]').forEach(btn => {
      btn.addEventListener('click', () => {
        openCheckinModal(btn.dataset.guest || 'Guest', btn.dataset.room || 'Room');
      });
    });
    if (DOM.btnCloseCheckin) {
      DOM.btnCloseCheckin.addEventListener('click', () => {
        if (DOM.checkinModalOverlay) DOM.checkinModalOverlay.classList.remove('open');
      });
    }
    if (DOM.btnNextStepCheckin) {
      DOM.btnNextStepCheckin.addEventListener('click', () => {
        if (currentCheckinStep < TOTAL_CHECKIN_STEPS) {
          currentCheckinStep++;
          updateCheckinStepUI();
        } else {
          if (DOM.checkinModalOverlay) DOM.checkinModalOverlay.classList.remove('open');
          showToast('Guest check-in complete and recorded in PMS.', 'success');
          recordLocalChange('Guest check-in finalized');
        }
      });
    }

    // Housekeeping Modal Events
    document.querySelectorAll('[data-action="open-hk"]').forEach(btn => {
      btn.addEventListener('click', () => {
        openHkModal(btn.dataset.room || '102');
      });
    });
    if (DOM.btnCloseHkModal) {
      DOM.btnCloseHkModal.addEventListener('click', () => {
        if (DOM.hkModalOverlay) DOM.hkModalOverlay.classList.remove('open');
      });
    }
    if (DOM.btnCompleteHkCleaning) {
      DOM.btnCompleteHkCleaning.addEventListener('click', () => {
        if (DOM.hkModalOverlay) DOM.hkModalOverlay.classList.remove('open');
        showToast(`Room ${activeHkRoom} cleaning completed and ready for inspection!`, 'success');
        
        // Update room status
        const roomObj = STATE.rooms.find(r => r.num === activeHkRoom);
        if (roomObj) {
          roomObj.state = 'ready';
          roomObj.label = 'READY';
          renderRoomStatusGrid();
        }
        recordLocalChange(`Room ${activeHkRoom} marked Ready after full checklist submission`);
      });
    }

    // Maintenance Modal Events
    document.querySelectorAll('[data-action="open-maint"]').forEach(btn => {
      btn.addEventListener('click', () => {
        openMaintModal(btn.dataset.ticket || 'M1023');
      });
    });
    if (DOM.btnCloseMaintModal) {
      DOM.btnCloseMaintModal.addEventListener('click', () => {
        if (DOM.maintModalOverlay) DOM.maintModalOverlay.classList.remove('open');
      });
    }
    if (DOM.btnResolveTicket) {
      DOM.btnResolveTicket.addEventListener('click', () => {
        if (DOM.maintModalOverlay) DOM.maintModalOverlay.classList.remove('open');
        showToast(`Ticket #${activeTicketId} marked Resolved and sent for verification.`, 'success');
        recordLocalChange(`Ticket #${activeTicketId} marked Resolved`);
      });
    }

    // Profile Modal
    if (DOM.btnOpenProfile) {
      DOM.btnOpenProfile.addEventListener('click', () => {
        if (DOM.profileModalOverlay) DOM.profileModalOverlay.classList.add('open');
      });
    }
    if (DOM.btnCloseProfile) {
      DOM.btnCloseProfile.addEventListener('click', () => {
        if (DOM.profileModalOverlay) DOM.profileModalOverlay.classList.remove('open');
      });
    }

    // Mobile Navigation Bottom Bar
    DOM.mobileNavItems.forEach(item => {
      item.addEventListener('click', () => {
        DOM.mobileNavItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const target = item.dataset.target;
        if (target === 'ai') {
          openAiDrawer();
        } else if (target === 'tasks') {
          const taskSection = document.getElementById('section-todays-work');
          if (taskSection) taskSection.scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'alerts') {
          const alertSection = document.getElementById('section-notifications');
          if (alertSection) alertSection.scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (target === 'more') {
          if (DOM.profileModalOverlay) DOM.profileModalOverlay.classList.add('open');
        }
      });
    });
  }

  // Startup Init
  document.addEventListener('DOMContentLoaded', () => {
    initCanvasAnimation();

    // Check active session from login portal
    try {
      const rawUser = localStorage.getItem('atithi_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.name) {
          STATE.worker.name = u.name;
          if (DOM.workerNameDisplay) DOM.workerNameDisplay.textContent = u.name;
          const avatarImg = document.querySelector('.worker-avatar-img');
          if (avatarImg) {
            const parts = u.name.split(' ');
            const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : u.name.slice(0, 2);
            avatarImg.textContent = initials.toUpperCase();
          }
        }
      }
    } catch (e) {
      console.warn('Could not read session:', e);
    }

    bindEvents();
    setRole('housekeeping');
    renderRoomStatusGrid();
    updateSyncUI();
  });
})();

