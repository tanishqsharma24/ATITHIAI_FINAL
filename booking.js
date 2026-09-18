/**
 * ATITHIAI - Customer Zero-Brokerage Booking Engine & Offline Pass Sync
 */

(function () {
  'use strict';

  // State
  let properties = [];
  let selectedProperty = null;
  let selectedRoom = null;
  let currentCheckIn = '';
  let currentCheckOut = '';

  // DOM Elements
  const propertiesGrid = document.getElementById('properties-grid');
  const resultsCount = document.getElementById('results-count');
  const searchForm = document.getElementById('search-form');
  const searchLocationInput = document.getElementById('search-location');
  const searchCheckInInput = document.getElementById('search-checkin');
  const searchCheckOutInput = document.getElementById('search-checkout');
  const searchStayTypeSelect = document.getElementById('search-stay-type');

  const aiPromptInput = document.getElementById('ai-prompt-input');
  const btnAskAiMatcher = document.getElementById('btn-ask-ai-matcher');
  const aiRecommendationBox = document.getElementById('ai-recommendation-box');
  const aiRecText = document.getElementById('ai-rec-text');
  const btnCloseAiRec = document.getElementById('btn-close-ai-rec');

  // Booking Modal Elements
  const bookingModalOverlay = document.getElementById('booking-modal-overlay');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalPropTitle = document.getElementById('modal-prop-title');
  const modalPropLocation = document.getElementById('modal-prop-location');
  const roomSelectionCards = document.getElementById('room-selection-cards');
  const modalCheckIn = document.getElementById('modal-checkin');
  const modalCheckOut = document.getElementById('modal-checkout');
  const directBookingForm = document.getElementById('direct-booking-form');

  // Summary Elements
  const summaryStayName = document.getElementById('summary-stay-name');
  const summaryRoomName = document.getElementById('summary-room-name');
  const summaryNightsCalc = document.getElementById('summary-nights-calc');
  const summaryOtaPrice = document.getElementById('summary-ota-price');
  const summaryBrokerageSavings = document.getElementById('summary-brokerage-savings');
  const summaryBasePrice = document.getElementById('summary-base-price');
  const summaryTotalPrice = document.getElementById('summary-total-price');
  const btnConfirmBooking = document.getElementById('btn-confirm-booking');

  // Confirmation Modal Elements
  const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');
  const passPropName = document.getElementById('pass-prop-name');
  const passPropCity = document.getElementById('pass-prop-city');
  const passRefCode = document.getElementById('pass-ref-code');
  const passGuestName = document.getElementById('pass-guest-name');
  const passRoomType = document.getElementById('pass-room-type');
  const passCheckIn = document.getElementById('pass-checkin');
  const passCheckOut = document.getElementById('pass-checkout');
  const passPayment = document.getElementById('pass-payment');
  const passHostPhone = document.getElementById('pass-host-phone');

  // Set default dates: CheckIn = Today, CheckOut = +2 Days
  const today = new Date();
  const plusTwo = new Date();
  plusTwo.setDate(today.getDate() + 2);

  const formatDateYMD = (d) => d.toISOString().split('T')[0];
  currentCheckIn = formatDateYMD(today);
  currentCheckOut = formatDateYMD(plusTwo);

  if (searchCheckInInput) searchCheckInInput.value = currentCheckIn;
  if (searchCheckOutInput) searchCheckOutInput.value = currentCheckOut;
  if (modalCheckIn) modalCheckIn.value = currentCheckIn;
  if (modalCheckOut) modalCheckOut.value = currentCheckOut;

  // Check active user session
  function checkSession() {
    try {
      const rawUser = localStorage.getItem('atithi_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const label = document.getElementById('nav-user-label');
        if (label && u.name) {
          label.textContent = u.name.split(' ')[0];
        }
      }
    } catch (e) {}
  }

  // Calculate nights difference
  function calculateNights(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }

  // ==========================================================
  // Fetch & Render Properties
  // ==========================================================
  async function loadProperties(location = '', stayType = '', query = '') {
    if (propertiesGrid) {
      propertiesGrid.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Searching authentic homestays & local hotels...</p>
        </div>
      `;
    }

    try {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (stayType && stayType !== 'all') params.set('stayType', stayType);
      if (query) params.set('query', query);

      const res = await fetch(`/api/properties/search?${params.toString()}`);
      const json = await res.json();

      if (!json.success || !json.data) {
        propertiesGrid.innerHTML = `<p class="error-msg">Failed to load homestays.</p>`;
        return;
      }

      properties = json.data;
      renderProperties(properties);

      if (resultsCount) {
        resultsCount.textContent = `Showing ${properties.length} verified direct stays`;
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      if (propertiesGrid) {
        propertiesGrid.innerHTML = `<p class="error-msg">Network error. Please check server connection.</p>`;
      }
    }
  }

  function renderProperties(list) {
    if (!propertiesGrid) return;
    if (list.length === 0) {
      propertiesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏡</div>
          <h3>No direct homestays found for this location.</h3>
          <p style="margin-top: 0.4rem; font-size: 0.9rem;">Try searching for Udaipur, Kumbhalgarh, Jaisalmer, or Spiti Valley.</p>
        </div>
      `;
      return;
    }

    propertiesGrid.innerHTML = list.map(prop => {
      const cover = prop.cover_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
      const minPrice = prop.minPrice || 2800;
      const otaPrice = Math.round(minPrice * 1.25); // OTAs charge 25% commission
      const savings = otaPrice - minPrice;

      const featuresHtml = (prop.features || ['0% Brokerage', 'Offline Pass Included']).slice(0, 3).map(f => {
        return `<span class="feat-tag">${f}</span>`;
      }).join('');

      return `
        <div class="property-card" data-id="${prop.id}">
          <div class="card-image-wrap">
            <img src="${cover}" alt="${prop.name}" class="card-img" loading="lazy">
            <div class="card-badges">
              <span class="badge-zero-brokerage">0% BROKERAGE DIRECT</span>
              <span class="badge-rating">★ ${prop.rating || 4.8}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/></svg>
              <span>${prop.city}, ${prop.state}</span>
            </div>
            <h3 class="card-title">${prop.name}</h3>
            <p class="card-tagline">${prop.tagline || 'Authentic rural hospitality with direct host connection.'}</p>
            
            <div class="card-host-row">
              <span class="host-name">Host: ${prop.host_name || 'Local Host'}</span>
              <span class="connectivity-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
                <span>${prop.connectivity_badge || 'Offline-Ready Pass'}</span>
              </span>
            </div>

            <div class="card-features">
              ${featuresHtml}
            </div>

            <div class="card-footer">
              <div class="price-block">
                <span class="price-strike">OTA: ₹${otaPrice}</span>
                <span class="price-main">₹${minPrice} <span class="price-unit">/ night</span></span>
              </div>
              <button type="button" class="btn-book-stay" onclick="window.AtithiBooking.openModal('${prop.id}')">
                Book Direct
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================
  // Direct Booking Modal Logic
  // ==========================================================
  function openModal(propertyId) {
    selectedProperty = properties.find(p => p.id === propertyId);
    if (!selectedProperty) return;

    modalPropTitle.textContent = selectedProperty.name;
    modalPropLocation.textContent = `${selectedProperty.address || ''}, ${selectedProperty.city}, ${selectedProperty.state}`;

    summaryStayName.textContent = selectedProperty.name;

    // Populate rooms
    const rooms = selectedProperty.rooms && selectedProperty.rooms.length > 0 ? selectedProperty.rooms : [
      { id: 'room_def_1', type: 'Classic Homestay Room', price_per_night: selectedProperty.minPrice || 2800 },
      { id: 'room_def_2', type: 'Heritage View Suite', price_per_night: Math.round((selectedProperty.minPrice || 2800) * 1.35) }
    ];

    selectedRoom = rooms[0];

    roomSelectionCards.innerHTML = rooms.map((r, idx) => `
      <label class="room-radio-card ${idx === 0 ? 'selected' : ''}" data-room-id="${r.id}">
        <div class="room-info-left">
          <input type="radio" name="selected_room" value="${r.id}" ${idx === 0 ? 'checked' : ''}>
          <span class="room-name-text">${r.type}</span>
        </div>
        <span class="room-price-tag">₹${r.price_per_night} / night</span>
      </label>
    `).join('');

    // Pre-fill user if signed in
    try {
      const rawUser = localStorage.getItem('atithi_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const nameField = document.getElementById('guest-name');
        const emailField = document.getElementById('guest-email');
        const phoneField = document.getElementById('guest-phone');
        if (nameField && u.name) nameField.value = u.name;
        if (emailField && u.email) emailField.value = u.email;
        if (phoneField && u.phone) phoneField.value = u.phone;
      }
    } catch(e) {}

    // Add room click listeners
    document.querySelectorAll('.room-radio-card').forEach(card => {
      card.addEventListener('click', function () {
        document.querySelectorAll('.room-radio-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        const roomId = this.dataset.roomId;
        selectedRoom = rooms.find(r => r.id === roomId) || rooms[0];
        updateSummary();
      });
    });

    updateSummary();

    bookingModalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    bookingModalOverlay.classList.add('hidden');
  }

  function updateSummary() {
    if (!selectedProperty || !selectedRoom) return;

    const checkInVal = modalCheckIn.value || currentCheckIn;
    const checkOutVal = modalCheckOut.value || currentCheckOut;
    const nights = calculateNights(checkInVal, checkOutVal);

    summaryRoomName.textContent = selectedRoom.type;
    summaryNightsCalc.textContent = `${nights} ${nights === 1 ? 'Night' : 'Nights'} (2 Guests)`;

    const basePerNight = selectedRoom.price_per_night;
    const totalBase = basePerNight * nights;
    const otaTotal = Math.round(totalBase * 1.25);
    const savings = otaTotal - totalBase;

    summaryOtaPrice.textContent = `₹${otaTotal.toLocaleString('en-IN')}`;
    summaryBrokerageSavings.textContent = `- ₹${savings.toLocaleString('en-IN')}`;
    summaryBasePrice.textContent = `₹${totalBase.toLocaleString('en-IN')}`;
    summaryTotalPrice.textContent = `₹${totalBase.toLocaleString('en-IN')}`;
  }

  // ==========================================================
  // Confirm Direct Booking & Offline Pass Generation
  // ==========================================================
  if (directBookingForm) {
    directBookingForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!selectedProperty || !selectedRoom) return;

      const guestName = document.getElementById('guest-name').value.trim();
      const guestPhone = document.getElementById('guest-phone').value.trim();
      const guestEmail = document.getElementById('guest-email').value.trim();
      const specialRequests = document.getElementById('guest-requests').value.trim();
      const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'arrival';

      const checkInVal = modalCheckIn.value || currentCheckIn;
      const checkOutVal = modalCheckOut.value || currentCheckOut;
      const nights = calculateNights(checkInVal, checkOutVal);
      const totalAmount = selectedRoom.price_per_night * nights;

      let customerId = null;
      try {
        const u = JSON.parse(localStorage.getItem('atithi_user'));
        if (u && u.id) customerId = u.id;
      } catch(e) {}

      btnConfirmBooking.disabled = true;
      btnConfirmBooking.querySelector('.btn-text').textContent = 'Confirming with Host...';

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            propertyId: selectedProperty.id,
            roomId: selectedRoom.id,
            guestName,
            guestEmail,
            guestPhone,
            checkIn: checkInVal,
            checkOut: checkOutVal,
            guestsCount: 2,
            totalAmount,
            paymentMethod,
            specialRequests,
          })
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          alert(json.message || 'Booking submission failed. Please try again.');
          btnConfirmBooking.disabled = false;
          btnConfirmBooking.querySelector('.btn-text').textContent = 'Confirm Direct Booking & Generate Pass';
          return;
        }

        const b = json.data;

        // Save active booking to localStorage for Customer Dashboard sync
        localStorage.setItem('atithi_active_booking', JSON.stringify(b));

        // Populate Confirmation Digital Pass
        passPropName.textContent = selectedProperty.name;
        passPropCity.textContent = `${selectedProperty.city}, ${selectedProperty.state}`;
        passRefCode.textContent = b.booking_ref;
        passGuestName.textContent = guestName;
        passRoomType.textContent = selectedRoom.type;
        passCheckIn.textContent = `${checkInVal} (14:00)`;
        passCheckOut.textContent = `${checkOutVal} (11:00)`;
        passPayment.textContent = paymentMethod === 'arrival' ? 'Pay on Arrival (Direct to Host)' : 'Paid Online (Confirmed)';
        passHostPhone.textContent = selectedProperty.host_phone || '+91 98290 12345';

        // Close booking modal, open confirmation modal
        closeModal();
        confirmationModalOverlay.classList.remove('hidden');

      } catch (err) {
        console.error('Booking submission error:', err);
        alert('Could not submit booking. Please check server connection.');
      } finally {
        btnConfirmBooking.disabled = false;
        btnConfirmBooking.querySelector('.btn-text').textContent = 'Confirm Direct Booking & Generate Pass';
      }
    });
  }

  // ==========================================================
  // Search & AI Matcher Handlers
  // ==========================================================
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const loc = searchLocationInput.value.trim();
      const cat = searchStayTypeSelect.value;
      loadProperties(loc, cat);
    });
  }

  // Quick Chips
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      const loc = this.dataset.loc;
      if (searchLocationInput) searchLocationInput.value = loc;
      loadProperties(loc);
    });
  });

  // AI Matcher
  if (btnAskAiMatcher) {
    btnAskAiMatcher.addEventListener('click', async () => {
      const prompt = aiPromptInput.value.trim();
      if (!prompt) return;

      btnAskAiMatcher.textContent = 'Searching...';

      try {
        const res = await fetch('/api/agent/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const json = await res.json();

        if (json.success) {
          aiRecText.innerHTML = json.recommendation;
          aiRecommendationBox.classList.remove('hidden');
          if (json.properties && json.properties.length > 0) {
            renderProperties(json.properties);
          }
        }
      } catch (err) {
        console.error('AI matcher error:', err);
      } finally {
        btnAskAiMatcher.textContent = 'Ask AtithiAI';
      }
    });
  }

  if (btnCloseAiRec) {
    btnCloseAiRec.addEventListener('click', () => {
      aiRecommendationBox.classList.add('hidden');
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
  }

  modalCheckIn?.addEventListener('change', updateSummary);
  modalCheckOut?.addEventListener('change', updateSummary);

  // Global helper for opening modal
  window.AtithiBooking = {
    openModal,
    closeModal,
  };

  // Init
  checkSession();
  loadProperties();

})();
