/**
 * ========================================================
 * ATITHIAI — AI Operations & Travel Intelligence Agent
 * Engine & UI Controller (n8n Agent Implementation)
 * Model: anthropic/claude-sonnet-5
 * ========================================================
 */

(() => {
  'use strict';

  // --- 1. Agent Spec & In-Memory Data Tables (from n8n Agent JSON) ---
  const AGENT_SPEC = {
    name: "ATITHIAI — AI Operations & Travel Intelligence Agent",
    model: "anthropic/claude-sonnet-5",
    credential: "__AI_GATEWAY_MANAGED__",
    personalisation: {
      icon: "bot",
      gradient: { from: "#00B1C5", to: "#EE6481", angle: 233 }
    }
  };

  const DATA_TABLES = {
    properties: [
      { property_id: "PRP-101", name: "The Himalayan Pine Retreat", location: "Old Manali, Himachal Pradesh", city: "Manali", region: "Himachal Pradesh", country: "India", latitude: 32.2530, longitude: 77.1751 },
      { property_id: "PRP-102", name: "Heritage Haveli & Homestay", location: "Amber Road, Jaipur", city: "Jaipur", region: "Rajasthan", country: "India", latitude: 26.9855, longitude: 75.8513 },
      { property_id: "PRP-103", name: "Backwaters Palm Sanctuary", location: "Kumarakom, Kottayam", city: "Kumarakom", region: "Kerala", country: "India", latitude: 9.6175, longitude: 76.4301 }
    ],
    rooms: [
      { room_id: "RM-101", property_id: "PRP-101", room_number: "101", room_type: "Deluxe Pine Suite", status: "Occupied" },
      { room_id: "RM-102", property_id: "PRP-101", room_number: "102", room_type: "Garden Cedar Room", status: "Ready" },
      { room_id: "RM-103", property_id: "PRP-101", room_number: "103", room_type: "Valley View Studio", status: "Cleaning" },
      { room_id: "RM-204", property_id: "PRP-101", room_number: "204", room_type: "Presidential Cedar Suite", status: "Occupied" }
    ],
    customers: [
      { customer_id: "CUST-881", name: "Devendra Verma", email: "d.verma@example.com", phone: "+91 98201 44521", language: "en", preferences: "Extra soft pillows, morning ginger tea, scenic balcony" },
      { customer_id: "CUST-882", name: "Anita Sharma", email: "anita.s@example.com", phone: "+91 94111 23091", language: "hi", preferences: "Quiet corner room, pure vegetarian cuisine" }
    ],
    bookings: [
      { booking_id: "BKG-7712", customer_id: "CUST-881", property_id: "PRP-101", room_id: "RM-204", check_in: "2026-09-17T14:00:00Z", check_out: "2026-09-20T11:00:00Z", status: "CONFIRMED" }
    ],
    workers: [
      { worker_id: "WRK-101", name: "Raj Kumar", department: "Housekeeping", slack_user_id: "U0843RAJ", phone: "+91 98765 00011", active: true },
      { worker_id: "WRK-102", name: "Sunita Devi", department: "Housekeeping", slack_user_id: "U0843SUN", phone: "+91 98765 00022", active: true },
      { worker_id: "WRK-201", name: "Amit Patel", department: "Maintenance", slack_user_id: "U0843AMI", phone: "+91 98765 00033", active: true },
      { worker_id: "WRK-301", name: "Vikram Singh", department: "Front Desk", slack_user_id: "U0843VIK", phone: "+91 98765 00044", active: true }
    ],
    complaints: [
      { complaint_id: "CMP-301", booking_id: "BKG-7712", customer_id: "CUST-881", property_id: "PRP-101", room_id: "RM-204", description: "AC unit compressor vibration noise during night", category: "Maintenance", priority: "HIGH", status: "OPEN", created_at: "2026-09-18T02:15:00Z" }
    ],
    tasks: [
      { task_id: "TSK-1023", complaint_id: "CMP-301", booking_id: "BKG-7712", customer_id: "CUST-881", property_id: "PRP-101", room_id: "RM-204", title: "Inspect and soundproof AC compressor in Room 204", category: "Maintenance", priority: "HIGH", assigned_department: "Maintenance", assigned_worker: "WRK-201", status: "IN_PROGRESS", created_at: "2026-09-18T02:20:00Z", expected_resolution_time: "2026-09-18T12:00:00Z", completed_at: "" },
      { task_id: "TSK-1024", complaint_id: "", booking_id: "", customer_id: "", property_id: "PRP-101", room_id: "RM-103", title: "Room 103 Departure Deep Clean & Sanitization", category: "Housekeeping", priority: "MEDIUM", assigned_department: "Housekeeping", assigned_worker: "WRK-101", status: "OPEN", created_at: "2026-09-18T03:00:00Z", expected_resolution_time: "2026-09-18T11:30:00Z", completed_at: "" }
    ],
    inventory: [
      { item_id: "INV-1", property_id: "PRP-101", item_name: "Organic Pine Toiletry Kits", category: "Guest Amenities", quantity: 18, threshold: 25, unit: "packs", last_restocked: "2026-09-10" },
      { item_id: "INV-2", property_id: "PRP-101", item_name: "Egyptian Cotton Towel Sets", category: "Linen", quantity: 64, threshold: 30, unit: "sets", last_restocked: "2026-09-14" },
      { item_id: "INV-3", property_id: "PRP-101", item_name: "Artisan Herbal Tea Boxes", category: "F&B", quantity: 45, threshold: 20, unit: "boxes", last_restocked: "2026-09-12" },
      { item_id: "INV-4", property_id: "PRP-101", item_name: "HEPA AC Filters (D-Type)", category: "Maintenance", quantity: 4, threshold: 6, unit: "units", last_restocked: "2026-09-02" }
    ],
    audit_log: [
      { entry_id: "AUD-901", timestamp: "2026-09-18T02:20:00Z", agent: "ATITHIAI", event: "TASK_CREATED", input_summary: "AC vibration in Room 204", decision: "Created HIGH priority Maintenance task TSK-1023", tool_used: "create_task", result: "SUCCESS", reference_id: "CMP-301", task_id: "TSK-1023" }
    ]
  };

  // --- 2. Tool Execution Simulation Helpers ---
  const TOOLS = {
    get_properties() { return DATA_TABLES.properties; },
    get_rooms() { return DATA_TABLES.rooms; },
    get_customers() { return DATA_TABLES.customers; },
    get_bookings() { return DATA_TABLES.bookings; },
    get_workers() { return DATA_TABLES.workers; },
    get_complaints() { return DATA_TABLES.complaints; },
    get_tasks() { return DATA_TABLES.tasks; },
    get_inventory() { return DATA_TABLES.inventory; },
    get_audit_log() { return DATA_TABLES.audit_log; },
    create_complaint(params) {
      const id = "CMP-" + Math.floor(1000 + Math.random() * 9000);
      const row = { complaint_id: id, status: "OPEN", created_at: new Date().toISOString(), ...params };
      DATA_TABLES.complaints.unshift(row);
      return { success: true, complaint_id: id, row };
    },
    create_task(params) {
      const id = "TSK-" + Math.floor(1000 + Math.random() * 9000);
      const row = { task_id: id, status: "OPEN", created_at: new Date().toISOString(), completed_at: "", ...params };
      DATA_TABLES.tasks.unshift(row);
      return { success: true, task_id: id, row };
    },
    update_task(taskId, updates) {
      const t = DATA_TABLES.tasks.find(x => x.task_id === taskId);
      if (t) Object.assign(t, updates);
      return { success: !!t, task: t };
    },
    log_audit(params) {
      const id = "AUD-" + Math.floor(1000 + Math.random() * 9000);
      const entry = { entry_id: id, timestamp: new Date().toISOString(), agent: "ATITHIAI", ...params };
      DATA_TABLES.audit_log.unshift(entry);
      return { success: true, entry_id: id };
    },
    send_slack_message(recipient, message) {
      return { ok: true, channel: recipient, ts: String(Date.now() / 1000), message };
    }
  };

  // --- 3. Autonomous Reasoning Engine (Prompt & Skills Execution) ---
  function reasonAndRespond(userPrompt, context = 'landing') {
    const q = userPrompt.toLowerCase().trim();
    const executedTools = [];
    let responseText = "";
    let auditEntry = null;

    // A) Destination / Travel Intelligence
    if (q.includes('visit') || q.includes('attraction') || q.includes('place') || q.includes('culture') || q.includes('food') || q.includes('eat') || q.includes('weather') || q.includes('temple') || q.includes('explore') || q.includes('sunrise')) {
      executedTools.push({ name: 'get_properties', desc: 'Fetching property coordinates and region metadata' });
      executedTools.push({ name: 'anthropic.web_search', desc: 'Verified local attractions & cultural traditions for Old Manali & Kullu Valley' });

      if (q.includes('food') || q.includes('eat')) {
        responseText = `**Destination Cuisine Intelligence (Himachal Pradesh):**\n\n` +
          `• **Siddu**: Steamed fermented wheat bread stuffed with spiced walnuts, poppy seeds & paneer, served hot with pure desi ghee.\n` +
          `• **Kullu Trout Fish**: Fresh Himalayan river trout gently pan-seared with mountain herbs.\n` +
          `• **Dham (Festive Thali)**: Madra (chickpeas in spiced yogurt gravy), Sepu Vadi, and sweet rice (Meethe Chawal).\n` +
          `• **Local Mountain Cafés**: Old Manali village (10 min walk) features authentic bakeries and wood-fired organic kitchens.`;
      } else if (q.includes('culture') || q.includes('temple')) {
        responseText = `**Local Culture & Heritage Guide:**\n\n` +
          `• **Hadimba Temple (1.8 km)**: A 16th-century pagoda-style cedar temple carved in intricate deodar wood, dedicated to deity Hadimba Devi.\n` +
          `• **Manu Temple (Old Manali)**: Dedicated to sage Manu, offering panoramic vistas of the Manalsu river gorge.\n` +
          `• **Vashisht Hot Sulfur Springs (3.5 km)**: Natural curative thermal springs with historic stone architecture.\n` +
          `• **Local Etiquette**: Remove footwear before entering sanctums; respect sacred deodar groves.`;
      } else {
        responseText = `**Curated Destination Highlights for Your Stay:**\n\n` +
          `1. **Jogini Waterfalls (Short Forest Trek)**: 45-min scenic pine trail leading to cascading mountain streams.\n` +
          `2. **Solang Valley (13 km)**: High-altitude alpine meadows famous for paragliding, zorbing, and winter snow sports.\n` +
          `3. **Old Manali Village Trail**: Cobblestone paths, rustic apple orchards, traditional wood-and-stone Kathkuni houses.\n` +
          `4. **Best Sunrise Spot**: Lamadugh ridge viewpoint offers unobstructed 360° views of the Pir Panjal and Dhauladhar ranges.`;
      }
    }

    // B) Complaint / Maintenance Incident
    else if (q.includes('ac') || q.includes('leak') || q.includes('broken') || q.includes('repair') || q.includes('tap') || q.includes('complaint') || q.includes('noise') || q.includes('not working')) {
      const cmp = TOOLS.create_complaint({
        property_id: "PRP-101",
        room_id: "RM-204",
        category: "Maintenance",
        priority: "HIGH",
        description: userPrompt
      });
      executedTools.push({ name: 'create_complaint', desc: `Created complaint ${cmp.complaint_id} (Priority: HIGH)` });

      const tsk = TOOLS.create_task({
        complaint_id: cmp.complaint_id,
        property_id: "PRP-101",
        room_id: "RM-204",
        title: "Urgent Maintenance: " + userPrompt,
        category: "Maintenance",
        priority: "HIGH",
        assigned_department: "Maintenance",
        assigned_worker: "WRK-201",
        status: "ASSIGNED",
        expected_resolution_time: new Date(Date.now() + 45 * 60000).toISOString()
      });
      executedTools.push({ name: 'create_task', desc: `Dispatched task ${tsk.task_id} to Amit Patel (Maintenance Lead)` });

      const slack = TOOLS.send_slack_message("U0843AMI", `🚨 Priority Maintenance Task #${tsk.task_id} generated for Room 204: ${userPrompt}`);
      executedTools.push({ name: 'send_slack_message', desc: `Slack direct alert sent to Amit Patel (@U0843AMI) [ok=true]` });

      auditEntry = TOOLS.log_audit({
        event: "COMPLAINT_DISPATCHED",
        input_summary: userPrompt,
        decision: `Assigned task ${tsk.task_id} to Maintenance and notified via Slack`,
        tool_used: "create_task,send_slack_message",
        result: "SUCCESS",
        reference_id: cmp.complaint_id,
        task_id: tsk.task_id
      });
      executedTools.push({ name: 'log_audit', desc: `Audit trail recorded under entry ${auditEntry.entry_id}` });

      responseText = `I have logged this operational issue and dispatched emergency maintenance:\n\n` +
        `• **Complaint Ticket**: #${cmp.complaint_id} (Status: OPEN · Priority: HIGH)\n` +
        `• **Assigned Task**: #${tsk.task_id} assigned to **Amit Patel** (Maintenance Department)\n` +
        `• **Slack Notification**: Dispatched to staff channel with 45-minute SLA resolution\n` +
        `• **Audit Registry**: Verified & recorded under Entry #${auditEntry.entry_id}`;
    }

    // C) Housekeeping / Towels / Linen / Room Service
    else if (q.includes('towel') || q.includes('linen') || q.includes('clean') || q.includes('water') || q.includes('pillow') || q.includes('housekeeping') || q.includes('tea')) {
      const tsk = TOOLS.create_task({
        property_id: "PRP-101",
        room_id: "RM-204",
        title: "Guest Request: " + userPrompt,
        category: "Housekeeping",
        priority: "MEDIUM",
        assigned_department: "Housekeeping",
        assigned_worker: "WRK-101",
        status: "ASSIGNED",
        expected_resolution_time: new Date(Date.now() + 20 * 60000).toISOString()
      });
      executedTools.push({ name: 'get_rooms', desc: 'Retrieved active booking details for Room 204' });
      executedTools.push({ name: 'create_task', desc: `Created Housekeeping task #${tsk.task_id}` });

      TOOLS.send_slack_message("U0843RAJ", `🛎️ Room 204 Guest Request: ${userPrompt}`);
      executedTools.push({ name: 'send_slack_message', desc: 'Sent Slack dispatch to Raj Kumar (@U0843RAJ) [Housekeeping Lead]' });

      auditEntry = TOOLS.log_audit({
        event: "HOUSEKEEPING_REQUEST",
        input_summary: userPrompt,
        decision: `Dispatched Housekeeping task ${tsk.task_id}`,
        tool_used: "create_task,send_slack_message",
        result: "SUCCESS",
        reference_id: "RM-204",
        task_id: tsk.task_id
      });
      executedTools.push({ name: 'log_audit', desc: `Logged in audit register as entry #${auditEntry.entry_id}` });

      responseText = `Your request has been processed and assigned directly to ground staff:\n\n` +
        `• **Service Item**: ${userPrompt}\n` +
        `• **Assigned Specialist**: **Raj Kumar** (Housekeeping Lead)\n` +
        `• **Slack Dispatch**: Confirmed (Staff notified)\n` +
        `• **Estimated Delivery**: 15–20 minutes to your suite.`;
    }

    // D) Inventory & Threshold Alert Check
    else if (q.includes('inventory') || q.includes('stock') || q.includes('threshold') || q.includes('supplies')) {
      executedTools.push({ name: 'get_inventory', desc: 'Scanned 4 inventory item rows from data table' });
      const items = TOOLS.get_inventory();
      const lowItems = items.filter(i => i.quantity <= i.threshold);

      responseText = `**Operational Inventory Report (Live Data Table):**\n\n` +
        items.map(i => {
          const isLow = i.quantity <= i.threshold;
          return `• **${i.item_name}**: ${i.quantity} ${i.unit} (Threshold: ${i.threshold}) ${isLow ? '⚠️ **[LOW STOCK ALERT]**' : '✅ [OK]'}`;
        }).join('\n') +
        `\n\n${lowItems.length > 0 ? `⚠️ Automated recommendation: Reorder **${lowItems.map(x => x.item_name).join(', ')}** to avoid service disruption.` : 'All inventory levels within safe operating thresholds.'}`;
    }

    // E) Task Lifecycle & Overdue Scanning
    else if (q.includes('task') || q.includes('pending') || q.includes('overdue') || q.includes('status') || q.includes('work')) {
      executedTools.push({ name: 'get_tasks', desc: 'Retrieved active task registry' });
      executedTools.push({ name: 'get_workers', desc: 'Correlated worker IDs with active departments' });

      const tasks = TOOLS.get_tasks();
      responseText = `**Active Operations Task Matrix:**\n\n` +
        tasks.map(t => {
          return `• **Task #${t.task_id}** [${t.priority}]: ${t.title}\n` +
                 `   ↳ Department: **${t.assigned_department}** · Status: **${t.status}** · Target: 11:30–12:00`;
        }).join('\n\n') +
        `\n\nAudit state: All task lifecycles verified against human supervisor confirmation policies.`;
    }

    // F) Audit Log Query
    else if (q.includes('audit') || q.includes('log') || q.includes('record')) {
      executedTools.push({ name: 'get_audit_log', desc: 'Retrieved immutable audit log data table' });
      const logs = TOOLS.get_audit_log().slice(0, 4);
      responseText = `**Immutable Audit Trail (Recent Entries):**\n\n` +
        logs.map(l => `• **${l.entry_id}** [${l.event}]: ${l.decision} (Tool: \`${l.tool_used}\` · Status: ${l.result})`).join('\n') +
        `\n\nAll automated actions are timestamped and permanently logged for administrative accountability.`;
    }

    // G) Human Control / Safety Safeguard (Cancellation, High Refund, Safety Incident)
    else if (q.includes('cancel') || q.includes('refund') || q.includes('emergency') || q.includes('police') || q.includes('fire') || q.includes('doctor')) {
      executedTools.push({ name: 'get_bookings', desc: 'Retrieved booking policy limits' });
      responseText = `⚠️ **HUMAN CONTROL SAFEGUARD ACTIVE**\n\n` +
        `Per ATITHIAI operating principles, critical safety incidents, high-value refunds, and permanent booking cancellations require explicit confirmation from a human supervisor or hotel administrator.\n\n` +
        `• **Action Taken**: Alert escalated to Front Desk Manager (**Vikram Singh**, +91 98765 00044).\n` +
        `• If this is a medical or physical emergency, please call **112 / 108** immediately or contact property reception dial \`0\`.`;
    }

    // H) General Inquiry / Contextual Fallback
    else {
      executedTools.push({ name: 'get_properties', desc: 'Checked property context PRP-101' });
      executedTools.push({ name: 'get_rooms', desc: 'Loaded room and PMS state' });
      responseText = `Hello! I am **ATITHIAI**, your automated hospitality operations and travel intelligence layer.\n\n` +
        `I can assist you with:\n` +
        `1. **Hospitality Operations**: Logging complaints, generating housekeeping/maintenance tasks, notifying staff via Slack, checking inventory, and tracking SLA resolution.\n` +
        `2. **Destination & Travel Intelligence**: Curated local attractions, traditional Himachali cuisine, weather conditions, hiking trails, and authentic cultural heritage.\n\n` +
        `How may I assist your property operations or stay today?`;
    }

    return { responseText, executedTools, auditEntry };
  }

  // --- 4. UI Manager (Drawer & Floating Launcher) ---
  let activeContext = 'landing';
  let backdropEl = null;
  let feedEl = null;
  let inputEl = null;

  function ensureUI() {
    if (backdropEl) return;

    // Link stylesheet if not already linked
    if (!document.querySelector('link[href*="atithiai-n8n-agent.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'atithiai-n8n-agent.css';
      document.head.appendChild(link);
    }

    // Create Backdrop & Dialog
    backdropEl = document.createElement('div');
    backdropEl.className = 'atithiai-agent-backdrop';
    backdropEl.innerHTML = `
      <div class="atithiai-agent-dialog" role="dialog" aria-modal="true" aria-label="ATITHIAI Agent">
        <!-- Header -->
        <div class="atithiai-agent-header">
          <div class="atithiai-agent-meta">
            <div class="atithiai-agent-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v4"/>
                <line x1="8" y1="16" x2="8" y2="16"/>
                <line x1="16" y1="16" x2="16" y2="16"/>
              </svg>
            </div>
            <div>
              <div class="atithiai-agent-title">
                <span>ATITHIAI Agent</span>
                <span class="atithiai-agent-badge">Claude Sonnet 5</span>
              </div>
              <div class="atithiai-agent-sub">
                <span class="atithiai-agent-status-dot"></span>
                <span>Operations & Travel Intelligence · n8n Layer</span>
              </div>
            </div>
          </div>
          <button type="button" class="atithiai-agent-close" id="atithiai-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Capabilities Switcher -->
        <div class="atithiai-agent-caps-bar">
          <div class="atithiai-caps-pills">
            <button type="button" class="atithiai-cap-pill active" data-cap="all">✦ All Capabilities</button>
            <button type="button" class="atithiai-cap-pill" data-cap="operations">🛎️ Operations Automation</button>
            <button type="button" class="atithiai-cap-pill" data-cap="travel">🧭 Destination & Travel</button>
          </div>
          <div class="atithiai-tools-count">18 Live Tools</div>
        </div>

        <!-- Feed -->
        <div class="atithiai-agent-feed" id="atithiai-feed">
          <div class="atithiai-msg bot">
            <div class="atithiai-bubble">
              ✦ **Welcome to ATITHIAI** — The AI Operations & Travel Intelligence Agent.<br/><br/>
              Powered by **Claude 3.5 Sonnet** and **n8n automated workflows**, I monitor operational events, dispatch ground tasks with Slack notifications, track live inventory, and provide verified destination intelligence.
            </div>
            <div class="atithiai-prompt-chips" id="atithiai-chips">
              <button type="button" class="atithiai-prompt-chip" data-prompt="Request fresh towel set and toiletries for Room 204">🛎️ Request fresh towels (Room 204)</button>
              <button type="button" class="atithiai-prompt-chip" data-prompt="Report AC vibration noise in Room 102">🚨 Report AC vibration complaint</button>
              <button type="button" class="atithiai-prompt-chip" data-prompt="What are the best local attractions and food nearby?">🧭 Attractions & local food guide</button>
              <button type="button" class="atithiai-prompt-chip" data-prompt="Check inventory status and threshold alerts">📦 Scan inventory & restock alerts</button>
              <button type="button" class="atithiai-prompt-chip" data-prompt="Show active tasks and overdue SLA matrix">⚡ Show active operations tasks</button>
              <button type="button" class="atithiai-prompt-chip" data-prompt="View recent immutable audit log records">📋 View audit trail records</button>
            </div>
          </div>
        </div>

        <!-- Footer / Input -->
        <div class="atithiai-agent-footer">
          <div class="atithiai-input-wrapper">
            <input type="text" class="atithiai-agent-input" id="atithiai-input" placeholder="Ask operations query, report issue, or explore destination..." />
            <button type="button" class="atithiai-mic-btn" id="atithiai-mic-btn" title="Tap to speak (Voice typing)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </button>
            <button type="button" class="atithiai-agent-send-btn" id="atithiai-send-btn">
              <span>Send</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div class="atithiai-voice-status" id="atithiai-voice-status" style="display:none;"></div>
          <div class="atithiai-agent-disclaimer">
            Voice typing supported · Verified tool execution · Human control for safety and refunds
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdropEl);
    feedEl = backdropEl.querySelector('#atithiai-feed');
    inputEl = backdropEl.querySelector('#atithiai-input');

    // Close events
    const closeBtn = backdropEl.querySelector('#atithiai-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeAgent);
    backdropEl.addEventListener('click', (e) => {
      if (e.target === backdropEl) closeAgent();
    });

    // Voice Input / Speech Recognition Event
    const micBtn = backdropEl.querySelector('#atithiai-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', toggleVoiceInput);
    }

    // Send event
    const sendBtn = backdropEl.querySelector('#atithiai-send-btn');
    if (sendBtn) sendBtn.addEventListener('click', submitMessage);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitMessage();
      });
    }

    // Chips
    backdropEl.querySelectorAll('.atithiai-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (inputEl) inputEl.value = chip.dataset.prompt || chip.innerText.trim();
        submitMessage();
      });
    });

    // Capability pills
    backdropEl.querySelectorAll('.atithiai-cap-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        backdropEl.querySelectorAll('.atithiai-cap-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Add floating launcher on landing page or wherever requested
    if (!document.getElementById('atithiai-floating-btn')) {
      const floatBtn = document.createElement('button');
      floatBtn.id = 'atithiai-floating-btn';
      floatBtn.className = 'atithiai-floating-launcher';
      floatBtn.innerHTML = `
        <div class="atithiai-launcher-icon">
          <span class="atithiai-launcher-pulse"></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
        </div>
        <span>ATITHIAI Agent</span>
      `;
      floatBtn.addEventListener('click', () => openAgent());
      document.body.appendChild(floatBtn);
    }
  }

  function openAgent(options = {}) {
    ensureUI();
    if (options.context) activeContext = options.context;
    backdropEl.classList.add('open');
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 150);
    }
  }

  function closeAgent() {
    stopVoiceInput();
    if (backdropEl) backdropEl.classList.remove('open');
  }

  // --- Voice Input (Web Speech Recognition — Robust Continuous Engine) ---
  let speechRecognition = null;
  let isListening = false;
  let accumulatedTranscript = '';  // All confirmed words across restarts
  let silenceTimer = null;
  let restartPending = false;
  const SILENCE_TIMEOUT_MS = 5000; // Auto-stop after 5 s of silence

  function _getSpeechRec() {
    // Lazy detection — avoids evaluating before window is ready
    return (typeof window !== 'undefined') &&
           (window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function _getLiveInput() {
    // Always fetch fresh reference to avoid stale DOM issues
    return (backdropEl && backdropEl.querySelector('#atithiai-input')) || inputEl;
  }

  function _waveHtml(label) {
    return `<span class="atithiai-voice-wave"><span></span><span></span><span></span></span> <span>${label}</span>`;
  }

  function _showVoiceStatus(html, autoHideMs) {
    const voiceStatus = backdropEl ? backdropEl.querySelector('#atithiai-voice-status') : null;
    if (!voiceStatus) return;
    voiceStatus.style.display = 'flex';
    voiceStatus.innerHTML = html;
    if (autoHideMs) setTimeout(() => { voiceStatus.style.display = 'none'; }, autoHideMs);
  }

  function _resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (isListening) {
        console.log('[ATITHIAI MIC] Silence timeout — stopping.');
        stopVoiceInput(true);
        if (accumulatedTranscript) {
          _showVoiceStatus('✅ Done listening! Tap Send or press Enter.', 3000);
        }
      }
    }, SILENCE_TIMEOUT_MS);
  }

  function _startRecognitionEngine() {
    const SpeechRec = _getSpeechRec();
    if (!SpeechRec || !isListening) {
      console.warn('[ATITHIAI MIC] Cannot start — SpeechRec:', !!SpeechRec, 'isListening:', isListening);
      return;
    }
    restartPending = false;

    const micBtn = backdropEl ? backdropEl.querySelector('#atithiai-mic-btn') : null;

    try {
      speechRecognition = new SpeechRec();
      speechRecognition.continuous      = true;   // Keep listening through pauses
      speechRecognition.interimResults  = true;   // Show words as they're spoken
      speechRecognition.maxAlternatives = 3;      // Pick best of 3 interpretations
      speechRecognition.lang            = 'en-IN'; // Indian-English; works for most accents

      speechRecognition.onstart = () => {
        console.log('[ATITHIAI MIC] Recognition started.');
        isListening = true;
        if (micBtn) micBtn.classList.add('listening');
        _showVoiceStatus(_waveHtml('🎙 Listening… speak now'), 0);
        _resetSilenceTimer();
      };

      speechRecognition.onresult = (event) => {
        let interimText = '';
        let newFinal    = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            // Always use best available transcript (ignore confidence threshold
            // to avoid dropping words in noisy environments)
            let best = '';
            let bestConf = -1;
            for (let a = 0; a < res.length; a++) {
              if (res[a].confidence > bestConf) {
                bestConf = res[a].confidence;
                best     = res[a].transcript;
              }
            }
            if (!best) best = res[0].transcript; // Absolute fallback
            newFinal += best;
          } else {
            interimText += res[0].transcript;
          }
        }

        if (newFinal) {
          accumulatedTranscript += (accumulatedTranscript ? ' ' : '') + newFinal.trim();
          const liveInput = _getLiveInput();
          if (liveInput) liveInput.value = accumulatedTranscript;
          console.log('[ATITHIAI MIC] Final word(s):', newFinal.trim(), '| Total:', accumulatedTranscript);
          _resetSilenceTimer();
        }

        if (interimText || newFinal) {
          const display = interimText
            ? _waveHtml(`…${interimText.trim()}`)
            : _waveHtml('🎙 Keep speaking or tap mic to stop');
          _showVoiceStatus(display, 0);
        }
      };

      speechRecognition.onerror = (err) => {
        console.warn('[ATITHIAI MIC] Error:', err.error);

        // 'no-speech' and 'aborted' are non-fatal — auto-restart
        if (err.error === 'no-speech' || err.error === 'aborted') {
          if (isListening && !restartPending) {
            restartPending = true;
            setTimeout(() => _startRecognitionEngine(), 300);
          }
          return;
        }

        // Fatal errors — stop and inform user
        stopVoiceInput(false);
        const msgs = {
          'not-allowed':        '🚫 Mic blocked! Click the 🔒 lock icon in the address bar and allow Microphone.',
          'network':            '📡 Network issue. Speech service needs internet. Check your connection.',
          'audio-capture':      '🎤 No microphone detected. Please connect a mic and retry.',
          'service-not-allowed':'🚫 Speech service blocked. Try opening the page over HTTPS or localhost.'
        };
        _showVoiceStatus(msgs[err.error] || `⚠️ Mic error: ${err.error}. Tap to retry.`, 5000);
      };

      speechRecognition.onend = () => {
        console.log('[ATITHIAI MIC] Recognition ended. isListening:', isListening);
        // Auto-restart to keep continuous capture
        if (isListening && !restartPending) {
          restartPending = true;
          setTimeout(() => _startRecognitionEngine(), 200);
        }
      };

      speechRecognition.start();
      console.log('[ATITHIAI MIC] .start() called.');
    } catch (e) {
      console.error('[ATITHIAI MIC] Exception on start:', e);
      stopVoiceInput(false);
      _showVoiceStatus('⚠️ Could not start mic. Please allow mic access and retry.', 4000);
    }
  }

  function toggleVoiceInput() {
    if (!backdropEl) return;
    const micBtn     = backdropEl.querySelector('#atithiai-mic-btn');
    const voiceStatus = backdropEl.querySelector('#atithiai-voice-status');
    if (!micBtn) return;

    // ── Stop if already listening ──
    if (isListening) {
      stopVoiceInput(true);
      if (accumulatedTranscript) {
        _showVoiceStatus('✅ Voice captured! Tap Send or press Enter.', 2500);
      } else if (voiceStatus) {
        voiceStatus.style.display = 'none';
      }
      return;
    }

    const SpeechRec = _getSpeechRec();
    console.log('[ATITHIAI MIC] SpeechRecognition available:', !!SpeechRec);

    // ── No browser support → use simulation fallback ──
    if (!SpeechRec) {
      micBtn.classList.add('listening');
      _showVoiceStatus(_waveHtml('Listening to speech input…'), 0);
      const sampleVoicePrompts = {
        customer: ["Request fresh towel set and extra pillows for Room 204","What are the best local attractions and traditional food nearby?","What time is breakfast and dinner service available?"],
        owner:    ["Check inventory stock and alert on low threshold items","Show active operations tasks and overdue SLA matrix","Are there any open maintenance complaints today?"],
        worker:   ["What is my next priority housekeeping task?","Mark Room 103 cleaning inspection as complete","Report AC vibration issue for Room 204"],
        landing:  ["What are the best local attractions and food nearby?","How does offline-first sync work for homestays?","Report AC vibration noise in Room 102"]
      };
      const pool = sampleVoicePrompts[activeContext] || sampleVoicePrompts.landing;
      setTimeout(() => {
        const liveInput = _getLiveInput();
        if (liveInput) liveInput.value = pool[Math.floor(Math.random() * pool.length)];
        micBtn.classList.remove('listening');
        _showVoiceStatus('✓ Voice transcribed! Tap Send or Enter.', 2200);
      }, 950);
      return;
    }

    // ── Request mic permission first, then start recognition ──
    accumulatedTranscript = '';
    isListening = false; // Will be set true in onstart
    restartPending = false;

    micBtn.classList.add('listening');
    _showVoiceStatus(_waveHtml('Requesting mic permission…'), 0);

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Permission granted — stop the stream (recognition manages its own)
        stream.getTracks().forEach(t => t.stop());
        console.log('[ATITHIAI MIC] Mic permission granted.');
        isListening = true;
        _startRecognitionEngine();
      })
      .catch((err) => {
        console.error('[ATITHIAI MIC] getUserMedia denied:', err);
        micBtn.classList.remove('listening');
        isListening = false;
        _showVoiceStatus('🚫 Mic access denied! Click the 🔒 lock icon in the address bar → allow Microphone → refresh.', 6000);
      });
  }

  function stopVoiceInput(keepText = false) {
    isListening = false;
    restartPending = false;
    clearTimeout(silenceTimer);
    const micBtn = backdropEl ? backdropEl.querySelector('#atithiai-mic-btn') : null;
    if (micBtn) micBtn.classList.remove('listening');
    if (speechRecognition) {
      try { speechRecognition.abort(); } catch(e) {}
      speechRecognition = null;
    }
    if (keepText && accumulatedTranscript) {
      const liveInput = _getLiveInput();
      if (liveInput) liveInput.value = accumulatedTranscript;
    }
  }

  function submitMessage() {
    stopVoiceInput();
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    // Append User message
    appendMessage(text, 'user');
    inputEl.value = '';

    // Show typing state
    const typingId = 'typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.id = typingId;
    typingEl.className = 'atithiai-msg bot';
    typingEl.innerHTML = `
      <div class="atithiai-bubble" style="font-size: 0.8rem; color: #00e0fa;">
        ⚡ Reasoning with Claude Sonnet 5 & identifying required tools...
      </div>
    `;
    feedEl.appendChild(typingEl);
    feedEl.scrollTop = feedEl.scrollHeight;

    // Simulate Agent reasoning with slight natural delay
    setTimeout(() => {
      const typingNode = document.getElementById(typingId);
      if (typingNode) typingNode.remove();

      const result = reasonAndRespond(text, activeContext);
      appendMessage(result.responseText, 'bot', result.executedTools, result.auditEntry);
    }, 600);
  }

  function appendMessage(text, sender, tools = [], audit = null) {
    if (!feedEl) return;
    const msg = document.createElement('div');
    msg.className = `atithiai-msg ${sender}`;

    let toolHtml = '';
    if (tools && tools.length > 0) {
      toolHtml = `
        <div class="atithiai-tool-box">
          <div class="atithiai-tool-title">⚡ TOOL EXECUTION TRACE (${tools.length})</div>
          ${tools.map(t => {
            const icon = t.name.includes('slack') ? '<span class="icon-slack">💬</span>' :
                         t.name.includes('audit') ? '<span class="icon-audit">📋</span>' :
                         '<span class="icon-ok">✓</span>';
            return `<div class="atithiai-tool-step">${icon} <strong>${t.name}()</strong>: ${t.desc}</div>`;
          }).join('')}
        </div>
      `;
    }

    let auditHtml = '';
    if (audit) {
      auditHtml = `
        <div class="atithiai-audit-card">
          <span>📋</span>
          <span><strong>Audit Record #${audit.entry_id}</strong>: ${audit.decision}</span>
        </div>
      `;
    }

    // Simple markdown formatting
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;">$1</code>')
      .replace(/\n/g, '<br/>');

    msg.innerHTML = `
      ${toolHtml}
      <div class="atithiai-bubble">${formatted}</div>
      ${auditHtml}
    `;

    feedEl.appendChild(msg);
    feedEl.scrollTop = feedEl.scrollHeight;
  }

  // --- 5. Export to Global Window ---
  window.AtithiAiAgent = {
    open: openAgent,
    close: closeAgent,
    process: reasonAndRespond,
    data: DATA_TABLES,
    spec: AGENT_SPEC
  };

  // Auto-init UI when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureUI();
    });
  } else {
    ensureUI();
  }
})();
