/**
 * ATITHIAI - Multi-Role Authentication & Registration Logic
 */

(function () {
  'use strict';

  // Role Configuration
  const ROLES = {
    owner: {
      id: 'owner',
      label: 'Property Owner',
      icon: '🏨',
      dashboard: 'Owner_Dashboard2.html',
      demoEmail: 'owner@atithiai.com',
      demoPassword: 'password123',
    },
    worker: {
      id: 'worker',
      label: 'Operations Worker',
      icon: '🛎️',
      dashboard: 'worker_Dashboard_2.html',
      demoEmail: 'worker@atithiai.com',
      demoPassword: 'password123',
    },
    customer: {
      id: 'customer',
      label: 'Guest / Traveler',
      icon: '🧳',
      dashboard: 'Customer_Dashboard1.html',
      demoEmail: 'guest@atithiai.com',
      demoPassword: 'password123',
    },
  };

  // State
  let currentRole = 'owner';
  let currentTab = 'signin'; // 'signin' or 'signup'

  // DOM Elements
  const roleSelectionView = document.getElementById('role-selection-view');
  const authFormView = document.getElementById('auth-form-view');
  const currentRoleIcon = document.getElementById('current-role-icon');
  const currentRoleLabel = document.getElementById('current-role-label');
  const changeRoleBtn = document.getElementById('change-role-btn');

  const tabBtnSignin = document.getElementById('tab-btn-signin');
  const tabBtnSignup = document.getElementById('tab-btn-signup');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');

  const authAlert = document.getElementById('auth-alert');
  const alertMessage = document.getElementById('alert-message');

  const btnQuickDemo = document.getElementById('btn-quick-demo');
  const demoRoleName = document.getElementById('demo-role-name');
  const demoCredentialsText = document.getElementById('demo-credentials-text');

  // Role-specific sections
  const fieldsOwner = document.getElementById('fields-owner');
  const fieldsWorker = document.getElementById('fields-worker');
  const fieldsCustomer = document.getElementById('fields-customer');

  // ==========================================================
  // Helper: Display Alerts
  // ==========================================================
  function showAlert(message, type = 'error') {
    if (!authAlert || !alertMessage) return;
    alertMessage.textContent = message;
    authAlert.className = `auth-alert ${type}`;
    authAlert.classList.remove('hidden');
    
    // Auto-scroll alert into view on mobile
    authAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    if (authAlert) {
      authAlert.classList.add('hidden');
    }
  }

  // ==========================================================
  // Role Selection
  // ==========================================================
  function selectRole(roleKey) {
    if (!ROLES[roleKey]) return;
    currentRole = roleKey;
    hideAlert();

    const roleInfo = ROLES[roleKey];
    currentRoleIcon.textContent = roleInfo.icon;
    currentRoleLabel.textContent = roleInfo.label;
    demoRoleName.textContent = roleInfo.label;
    demoCredentialsText.innerHTML = `Demo: <code>${roleInfo.demoEmail}</code> | <code>${roleInfo.demoPassword}</code>`;

    // Toggle role-specific input fields in Sign Up form
    if (fieldsOwner) fieldsOwner.classList.toggle('hidden', roleKey !== 'owner');
    if (fieldsWorker) fieldsWorker.classList.toggle('hidden', roleKey !== 'worker');
    if (fieldsCustomer) fieldsCustomer.classList.toggle('hidden', roleKey !== 'customer');

    // Smooth transition from Role Selection to Form view
    roleSelectionView.classList.add('hidden');
    authFormView.classList.remove('hidden');

    // Pre-fill demo credentials in sign in form
    prefillDemoCredentials();
  }

  function backToRoleSelection() {
    hideAlert();
    authFormView.classList.add('hidden');
    roleSelectionView.classList.remove('hidden');
  }

  // ==========================================================
  // Tab Switching (Sign In vs Sign Up)
  // ==========================================================
  function switchTab(tab) {
    currentTab = tab;
    hideAlert();

    if (tab === 'signin') {
      tabBtnSignin.classList.add('active');
      tabBtnSignin.setAttribute('aria-selected', 'true');
      tabBtnSignup.classList.remove('active');
      tabBtnSignup.setAttribute('aria-selected', 'false');

      signinForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      tabBtnSignup.classList.add('active');
      tabBtnSignup.setAttribute('aria-selected', 'true');
      tabBtnSignin.classList.remove('active');
      tabBtnSignin.setAttribute('aria-selected', 'false');

      signupForm.classList.remove('hidden');
      signinForm.classList.add('hidden');
    }
  }

  // ==========================================================
  // Demo Quick-Fill
  // ==========================================================
  function prefillDemoCredentials() {
    const roleInfo = ROLES[currentRole];
    const emailInput = document.getElementById('signin-email');
    const passInput = document.getElementById('signin-password');
    if (emailInput && passInput) {
      emailInput.value = roleInfo.demoEmail;
      passInput.value = roleInfo.demoPassword;
    }
  }

  // ==========================================================
  // Password Visibility Toggle
  // ==========================================================
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          this.textContent = '🙈';
        } else {
          input.type = 'password';
          this.textContent = '👁️';
        }
      }
    });
  });

  // ==========================================================
  // Sign In Submission
  // ==========================================================
  if (signinForm) {
    signinForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert();

      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;
      const submitBtn = document.getElementById('btn-submit-signin');
      const originalText = submitBtn.querySelector('.btn-text').textContent;

      if (!email || !password) {
        showAlert('Please provide both email and password.');
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Authenticating...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: currentRole }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          showAlert(data.message || 'Authentication failed. Please check your credentials.', 'error');
          submitBtn.disabled = false;
          submitBtn.querySelector('.btn-text').textContent = originalText;
          return;
        }

        // Store session in localStorage
        localStorage.setItem('atithi_token', data.token);
        localStorage.setItem('atithi_user', JSON.stringify(data.user));

        showAlert('Authenticated successfully! Redirecting to your workspace...', 'success');

        // Redirect to appropriate dashboard
        const redirectUrl = ROLES[data.user.role]?.dashboard || ROLES[currentRole].dashboard;
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 600);

      } catch (err) {
        console.error('Sign In Error:', err);
        showAlert('Connection error. Ensure the AtithiAI server is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = originalText;
      }
    });
  }

  // ==========================================================
  // Sign Up Submission (Tourism & Booking Platform Style)
  // ==========================================================
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert();

      const name = document.getElementById('signup-name').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-password-confirm').value;
      const submitBtn = document.getElementById('btn-submit-signup');
      const originalText = submitBtn.querySelector('.btn-text').textContent;

      if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please re-enter.');
        return;
      }

      if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.');
        return;
      }

      // Gather role-specific tourism / property info
      let details = {};
      if (currentRole === 'owner') {
        const propName = document.getElementById('owner-prop-name').value.trim();
        const propType = document.getElementById('owner-prop-type').value;
        const city = document.getElementById('owner-city').value.trim();
        const totalRooms = document.getElementById('owner-rooms').value;
        const gstin = document.getElementById('owner-gstin').value.trim();

        if (!propName || !city) {
          showAlert('Please provide both Property Name and City location.');
          return;
        }
        details = { propertyName: propName, propertyType: propType, city, totalRooms, gstin };

      } else if (currentRole === 'worker') {
        const dept = document.getElementById('worker-dept').value;
        const shift = document.getElementById('worker-shift').value;
        const assignedProp = document.getElementById('worker-property').value.trim();
        const empId = document.getElementById('worker-empid').value.trim();

        details = { department: dept, shift, assignedProperty: assignedProp, employeeId: empId };

      } else if (currentRole === 'customer') {
        const country = document.getElementById('customer-country').value.trim();
        const travelStyle = document.getElementById('customer-style').value;
        const lang = document.getElementById('customer-lang').value;
        const prefs = document.getElementById('customer-prefs').value.trim();

        if (!country) {
          showAlert('Please enter your country / nationality.');
          return;
        }
        details = { country, travelStyle, language: lang, preferences: prefs };
      }

      // Show loading
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Creating Account...';

      try {
        const payload = {
          role: currentRole,
          name,
          email,
          phone,
          password,
          ...details,
        };

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          showAlert(data.message || 'Registration failed.', 'error');
          submitBtn.disabled = false;
          submitBtn.querySelector('.btn-text').textContent = originalText;
          return;
        }

        // Store session
        localStorage.setItem('atithi_token', data.token);
        localStorage.setItem('atithi_user', JSON.stringify(data.user));

        showAlert('Registration successful! Welcome to AtithiAI. Redirecting...', 'success');

        const redirectUrl = ROLES[currentRole].dashboard;
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 700);

      } catch (err) {
        console.error('Sign Up Error:', err);
        showAlert('Failed to connect to the registration service.', 'error');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = originalText;
      }
    });
  }

  // ==========================================================
  // Event Bindings
  // ==========================================================
  document.getElementById('role-card-owner')?.addEventListener('click', () => selectRole('owner'));
  document.getElementById('role-card-worker')?.addEventListener('click', () => selectRole('worker'));
  document.getElementById('role-card-customer')?.addEventListener('click', () => selectRole('customer'));

  // Also support keyboard Enter key on role cards
  ['role-card-owner', 'role-card-worker', 'role-card-customer'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const role = id.replace('role-card-', '');
        selectRole(role);
      }
    });
  });

  changeRoleBtn?.addEventListener('click', backToRoleSelection);

  tabBtnSignin?.addEventListener('click', () => switchTab('signin'));
  tabBtnSignup?.addEventListener('click', () => switchTab('signup'));

  btnQuickDemo?.addEventListener('click', prefillDemoCredentials);

  // Check URL query parameters for pre-selected role (e.g. ?role=customer)
  const urlParams = new URLSearchParams(window.location.search);
  const paramRole = urlParams.get('role');
  if (paramRole && ROLES[paramRole.toLowerCase()]) {
    selectRole(paramRole.toLowerCase());
  }

})();
