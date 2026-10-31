/**
 * Medha IT Solutions - Main Application Engine
 * Integrates Translations, IP Detection, LocalStorage/Cookies,
 * Floating WhatsApp Widget, Interactive Estimator, and Responsive UI.
 */

const WHATSAPP_NUMBER = "8801712813557"; // Format without plus for WhatsApp API links
const DISPLAY_PHONE = "+8801712813557";
const DEFAULT_WA_INQUIRY_TEXT = "From Medha IT Website Inquery";

class MedhaApp {
  constructor() {
    this.currentLanguage = 'en';
    this.init();
  }

  async init() {
    this.setupStorageAndIP();
    this.setupLanguageDropdown();
    this.setupWhatsAppWidget();
    this.setupMobileMenu();
    this.setupCalculator();
    this.setupContactForm();
    this.setupInquiriesModal();
    this.setupServiceWhatsAppButtons();
    this.setupFaqAccordion();
  }

  /* -------------------------------------------------------------
   * 1. Storage, Cookies & IP Detection Setup
   * ----------------------------------------------------------- */
  async setupStorageAndIP() {
    // Check if language already stored in localStorage/cookie
    const savedLang = StorageManager.getPreference(StorageManager.KEYS.LANG);
    if (savedLang && TRANSLATIONS[savedLang]) {
      this.setLanguage(savedLang, false);
    } else {
      // Run automatic IP Detection
      try {
        const result = await IPDetector.detectLocationAndLanguage();
        if (result && result.language && TRANSLATIONS[result.language]) {
          this.setLanguage(result.language, true);
          if (result.source === 'ip_api' && result.geo) {
            this.showToast(`🌍 Region detected: ${result.geo.countryName || result.country}. Language set to ${AVAILABLE_LANGUAGES.find(l => l.code === result.language)?.name || result.language}.`, 'info');
          }
        }
      } catch (e) {
        this.setLanguage('en', false);
      }
    }
  }

  /* -------------------------------------------------------------
   * 2. Searchable Language Dropdown
   * ----------------------------------------------------------- */
  setupLanguageDropdown() {
    const trigger = document.getElementById('lang-selector-btn');
    const menu = document.getElementById('lang-dropdown-menu');
    const searchInput = document.getElementById('lang-search-input');
    const listContainer = document.getElementById('lang-options-list');

    // Mobile trigger if present
    const mobileTrigger = document.getElementById('mobile-lang-btn');

    if (!trigger || !menu || !listContainer) return;

    // Render language items
    const renderLanguages = (filterText = '') => {
      const query = filterText.trim().toLowerCase();
      const filtered = AVAILABLE_LANGUAGES.filter(lang => 
        lang.name.toLowerCase().includes(query) ||
        lang.native.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="p-4 text-center text-xs text-gray-400">No languages found</div>`;
        return;
      }

      listContainer.innerHTML = filtered.map(lang => {
        const isSelected = lang.code === this.currentLanguage;
        return `
          <div class="lang-item ${isSelected ? 'selected' : ''}" data-code="${lang.code}">
            <div class="flex items-center gap-2">
              <span class="text-base">${lang.flag}</span>
              <span class="font-medium text-sm text-slate-200">${lang.name}</span>
            </div>
            <span class="text-xs text-cyan-400 opacity-80">${lang.native}</span>
          </div>
        `;
      }).join('');

      // Add click listener to each item
      listContainer.querySelectorAll('.lang-item').forEach(item => {
        item.addEventListener('click', () => {
          const code = item.getAttribute('data-code');
          this.setLanguage(code, true);
          menu.classList.remove('active');
          if (searchInput) searchInput.value = '';
          renderLanguages();
        });
      });
    };

    // Toggle menu
    const toggleMenu = (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
      if (menu.classList.contains('active')) {
        renderLanguages();
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 50);
        }
      }
    };

    trigger.addEventListener('click', toggleMenu);
    if (mobileTrigger) {
      mobileTrigger.addEventListener('click', toggleMenu);
    }

    // Filter on typing
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderLanguages(e.target.value);
      });
      // Prevent closing when clicking inside search input
      searchInput.addEventListener('click', (e) => e.stopPropagation());
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.classList.remove('active');
      }
    });

    renderLanguages();
  }

  setLanguage(langCode, savePreference = true) {
    if (!TRANSLATIONS[langCode]) langCode = 'en';
    this.currentLanguage = langCode;

    if (savePreference) {
      StorageManager.setPreference(StorageManager.KEYS.LANG, langCode);
    }

    const langMeta = AVAILABLE_LANGUAGES.find(l => l.code === langCode) || AVAILABLE_LANGUAGES[0];

    // Set document direction for RTL (Arabic)
    document.documentElement.dir = langMeta.dir || 'ltr';
    document.documentElement.lang = langCode;

    // Update active label in language button
    const currentLangLabel = document.getElementById('current-lang-label');
    const currentLangFlag = document.getElementById('current-lang-flag');
    if (currentLangLabel) currentLangLabel.textContent = langMeta.native;
    if (currentLangFlag) currentLangFlag.textContent = langMeta.flag;

    // Translate DOM elements
    const dict = TRANSLATIONS[langCode] || TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Update title tag
    if (dict.meta_title) {
      document.title = dict.meta_title;
    }

    // Re-render language options in dropdown to highlight selected
    const listContainer = document.getElementById('lang-options-list');
    if (listContainer) {
      listContainer.querySelectorAll('.lang-item').forEach(item => {
        if (item.getAttribute('data-code') === langCode) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));
  }

  /* -------------------------------------------------------------
   * 3. Floating WhatsApp Widget & Interactive Chat Modal
   * ----------------------------------------------------------- */
  setupWhatsAppWidget() {
    const floatBtn = document.getElementById('floating-whatsapp-btn');
    const modal = document.getElementById('whatsapp-modal');
    const closeBtn = document.getElementById('whatsapp-modal-close');
    const promptInput = document.getElementById('whatsapp-custom-prompt');
    const sendBtn = document.getElementById('whatsapp-modal-send');
    const chips = document.querySelectorAll('.wa-prompt-chip');

    if (!floatBtn || !modal) return;

    // Toggle modal
    floatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.classList.toggle('active');
      if (modal.classList.contains('active') && promptInput) {
        promptInput.focus();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    // Click outside closes modal
    document.addEventListener('click', (e) => {
      if (!modal.contains(e.target) && !floatBtn.contains(e.target)) {
        modal.classList.remove('active');
      }
    });

    // Pre-composed prompt chips
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt') || chip.textContent.trim();
        if (promptInput) {
          promptInput.value = text;
          promptInput.focus();
        }
      });
    });

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const msg = (promptInput && promptInput.value.trim()) 
          ? promptInput.value.trim() 
          : "Hello Medha IT Solutions! I am interested in your tech services and AI automations. Please share details.";
        
        this.openWhatsApp(msg);
        modal.classList.remove('active');
        if (promptInput) promptInput.value = '';
      });
    }

    // Enter key sends
    if (promptInput) {
      promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (sendBtn) sendBtn.click();
        }
      });
    }

    // Global WhatsApp direct CTA buttons
    document.querySelectorAll('.open-whatsapp-direct').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const customMsg = btn.getAttribute('data-wa-message') || "Hello Medha IT Solutions, I would like to consult about your tech and AI solutions.";
        this.openWhatsApp(customMsg);
      });
    });
  }

  openWhatsApp(message) {
    let finalMessage = DEFAULT_WA_INQUIRY_TEXT;
    if (message && message.trim()) {
      const cleanMsg = message.trim();
      if (!cleanMsg.startsWith(DEFAULT_WA_INQUIRY_TEXT)) {
        finalMessage = `${DEFAULT_WA_INQUIRY_TEXT}\n\n${cleanMsg}`;
      } else {
        finalMessage = cleanMsg;
      }
    }
    const encoded = encodeURIComponent(finalMessage);
    const url = `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encoded}&type=phone_number&app_absent=0`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* -------------------------------------------------------------
   * 4. Service-Specific WhatsApp Inquiries
   * ----------------------------------------------------------- */
  setupServiceWhatsAppButtons() {
    document.querySelectorAll('.service-inquire-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const serviceName = btn.getAttribute('data-service') || 'Tech Services';
        const msg = `Hello Medha IT Solutions! 👋\n\nI am inquiring about your service: *${serviceName}*.\nCould you please share your case studies, timeline, and an initial estimate?\n\nThank you!`;
        this.openWhatsApp(msg);
      });
    });
  }

  /* -------------------------------------------------------------
   * 5. Interactive Project Scope & Cost Estimator
   * ----------------------------------------------------------- */
  setupCalculator() {
    const serviceSelect = document.getElementById('calc-service');
    const scaleSelect = document.getElementById('calc-scale');
    const speedSelect = document.getElementById('calc-speed');

    const resTimeline = document.getElementById('calc-result-timeline');
    const resTeam = document.getElementById('calc-result-team');
    const resEst = document.getElementById('calc-result-estimate');

    const btnWhatsApp = document.getElementById('calc-send-whatsapp');
    const btnSave = document.getElementById('calc-save-estimate');

    if (!serviceSelect || !scaleSelect || !speedSelect) return;

    const calculate = () => {
      const srv = serviceSelect.value;
      const scale = scaleSelect.value;
      const speed = speedSelect.value;

      let timelineWeeks = 3;
      let teamSize = "2 Engineers (Full-Stack + AI Specialist)";
      let priceStart = 1500;
      let priceEnd = 3000;

      // Service base modifiers
      if (srv === 'ai') {
        timelineWeeks = 2;
        teamSize = "Senior AI Engineer + LangChain Architect";
        priceStart = 1200;
        priceEnd = 4500;
      } else if (srv === 'software') {
        timelineWeeks = 4;
        teamSize = "Full-Stack Dev + UI/UX Designer + QA";
        priceStart = 2000;
        priceEnd = 7000;
      } else if (srv === 'cloud') {
        timelineWeeks = 2;
        teamSize = "DevOps Specialist + Cloud Architect";
        priceStart = 1500;
        priceEnd = 4000;
      } else if (srv === 'team') {
        timelineWeeks = 1;
        teamSize = "Dedicated Offshore Pod (2-4 Senior Engineers)";
        priceStart = 2500;
        priceEnd = 6500;
      } else if (srv === 'consulting') {
        timelineWeeks = 1;
        teamSize = "Fractional CTO / Principal Consultant";
        priceStart = 800;
        priceEnd = 2500;
      }

      // Scale multipliers
      if (scale === 'mvp') {
        priceStart = Math.round(priceStart * 0.8);
        priceEnd = Math.round(priceEnd * 0.9);
      } else if (scale === 'growth') {
        timelineWeeks = Math.round(timelineWeeks * 1.5);
        priceStart = Math.round(priceStart * 1.6);
        priceEnd = Math.round(priceEnd * 1.8);
      } else if (scale === 'enterprise') {
        timelineWeeks = Math.round(timelineWeeks * 2.5);
        priceStart = Math.round(priceStart * 3.0);
        priceEnd = Math.round(priceEnd * 3.5);
      }

      // Speed multipliers
      let timelineText = `${timelineWeeks} - ${timelineWeeks + 2} Weeks`;
      if (speed === 'express') {
        timelineText = `${Math.max(1, Math.round(timelineWeeks * 0.6))} Weeks (Fast-Track Sprint)`;
        priceStart = Math.round(priceStart * 1.25);
        priceEnd = Math.round(priceEnd * 1.25);
      } else if (speed === 'standard') {
        timelineText = `${timelineWeeks} Weeks`;
      } else if (speed === 'retainer') {
        timelineText = `Ongoing Monthly Retainer / Agile Sprints`;
      }

      const formattedBudget = `$${priceStart.toLocaleString()} - $${priceEnd.toLocaleString()} USD`;

      if (resTimeline) resTimeline.textContent = timelineText;
      if (resTeam) resTeam.textContent = teamSize;
      if (resEst) resEst.textContent = formattedBudget;

      return {
        service: serviceSelect.options[serviceSelect.selectedIndex].text,
        scale: scaleSelect.options[scaleSelect.selectedIndex].text,
        speed: speedSelect.options[speedSelect.selectedIndex].text,
        timeline: timelineText,
        team: teamSize,
        budget: formattedBudget
      };
    };

    serviceSelect.addEventListener('change', calculate);
    scaleSelect.addEventListener('change', calculate);
    speedSelect.addEventListener('change', calculate);
    calculate();

    // Send Scope to WhatsApp button
    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => {
        const est = calculate();
        const msg = 
`🚀 *Medha IT Solutions - Project Scope & Estimate* 🚀

• *Service:* ${est.service}
• *Scope / Scale:* ${est.scale}
• *Delivery Speed:* ${est.speed}
• *Estimated Timeline:* ${est.timeline}
• *Team Setup:* ${est.team}
• *Indicative Budget:* ${est.budget}

Please review this scope and let me know the next steps to start!`;

        this.openWhatsApp(msg);
      });
    }

    // Save Locally button
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const est = calculate();
        StorageManager.saveQuote(est);
        this.showToast('✅ Estimate successfully saved to your browser local storage!', 'success');
      });
    }
  }

  /* -------------------------------------------------------------
   * 6. Contact Form Integration (Local Storage & Direct WhatsApp)
   * ----------------------------------------------------------- */
  setupContactForm() {
    const form = document.getElementById('medha-contact-form');
    const sendWhatsAppBtn = document.getElementById('form-send-whatsapp-direct');

    if (!form) return;

    // Normal Submit: saves to LocalStorage & Cookies and triggers WhatsApp confirmation
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = this.getFormData(form);

      if (!formData.name || !formData.phone) {
        this.showToast('⚠️ Please provide at least your name and phone/WhatsApp number.', 'error');
        return;
      }

      // Save to client-side storage & cookies
      const saved = StorageManager.saveInquiry(formData);

      this.showToast('🎉 Inquiry saved securely to your browser storage! Opening WhatsApp...', 'success');

      // Auto-trigger WhatsApp message
      setTimeout(() => {
        const msg = 
`📨 *New Project Inquiry - Medha IT Solutions*

• *Name:* ${formData.name}
• *Email:* ${formData.email || 'N/A'}
• *WhatsApp/Phone:* ${formData.phone}
• *Service:* ${formData.service}
• *Budget:* ${formData.budget}
• *Details:* ${formData.message}

Reference ID: ${saved.id}`;

        this.openWhatsApp(msg);
      }, 700);

      form.reset();
    });

    // "Send Directly via WhatsApp" button
    if (sendWhatsAppBtn) {
      sendWhatsAppBtn.addEventListener('click', () => {
        const formData = this.getFormData(form);
        if (!formData.name || !formData.phone) {
          this.showToast('⚠️ Please enter your name and contact phone/WhatsApp number.', 'error');
          return;
        }

        // Save record locally as well
        StorageManager.saveInquiry(formData);

        const msg = 
`⚡ *Direct WhatsApp Inquiry - Medha IT Solutions*

• *Name:* ${formData.name}
• *Email:* ${formData.email || 'N/A'}
• *WhatsApp:* ${formData.phone}
• *Service:* ${formData.service}
• *Budget:* ${formData.budget}
• *Requirements:* ${formData.message || 'Ready to discuss requirements on WhatsApp.'}`;

        this.openWhatsApp(msg);
      });
    }
  }

  getFormData(form) {
    return {
      name: form.elements['name']?.value?.trim() || '',
      email: form.elements['email']?.value?.trim() || '',
      phone: form.elements['phone']?.value?.trim() || '',
      service: form.elements['service']?.value || 'General Tech Inquiry',
      budget: form.elements['budget']?.value || 'Undecided / Flexible',
      message: form.elements['message']?.value?.trim() || ''
    };
  }

  /* -------------------------------------------------------------
   * 7. Inquiries History / Saved Quotes Modal
   * ----------------------------------------------------------- */
  setupInquiriesModal() {
    const modal = document.getElementById('inquiries-history-modal');
    const openBtns = document.querySelectorAll('.open-inquiries-modal-btn');
    const closeBtn = document.getElementById('inquiries-modal-close');
    const listContainer = document.getElementById('inquiries-list-container');
    const exportBtn = document.getElementById('export-inquiries-csv');
    const clearBtn = document.getElementById('clear-inquiries-btn');

    if (!modal) return;

    const renderInquiries = () => {
      const list = StorageManager.getInquiries();
      if (!listContainer) return;

      if (list.length === 0) {
        listContainer.innerHTML = `
          <div class="py-12 text-center text-slate-400">
            <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="font-medium text-slate-300">No saved inquiries yet</p>
            <p class="text-xs text-slate-500 mt-1">Submit the contact form or calculate a quote to see them saved in your local browser storage & cookies.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = list.map(item => `
        <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-400 font-mono">${item.id}</span>
              <span class="text-xs text-slate-400">${item.timestampFormatted || 'Recent'}</span>
            </div>
            <h4 class="text-sm font-semibold text-white">${this.escapeHTML(item.name)} <span class="text-slate-400 text-xs font-normal">(${this.escapeHTML(item.phone)})</span></h4>
            <p class="text-xs text-cyan-300 font-medium">${this.escapeHTML(item.service)} • Budget: ${this.escapeHTML(item.budget)}</p>
            ${item.message ? `<p class="text-xs text-slate-400 line-clamp-2">${this.escapeHTML(item.message)}</p>` : ''}
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 text-xs font-medium border border-emerald-500/40 flex items-center gap-1.5 transition-colors wa-lead-btn" data-id="${item.id}">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.42-.101.825z"/></svg>
              Chat
            </button>
            <button class="px-2.5 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/40 text-red-400 text-xs font-medium border border-red-500/30 delete-lead-btn" data-id="${item.id}" title="Delete">
              ✕
            </button>
          </div>
        </div>
      `).join('');

      // Wire WhatsApp direct click for lead
      listContainer.querySelectorAll('.wa-lead-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const lead = list.find(l => l.id === id);
          if (lead) {
            const msg = `Hello ${lead.name}, this is Medha IT Solutions following up on your inquiry (${lead.id}) regarding ${lead.service}.`;
            this.openWhatsApp(msg);
          }
        });
      });

      // Wire Delete click
      listContainer.querySelectorAll('.delete-lead-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          StorageManager.deleteInquiry(id);
          renderInquiries();
          this.showToast('Inquiry removed from local storage.', 'info');
        });
      });
    };

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('flex');
        modal.classList.remove('hidden');
        renderInquiries();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }
    });

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const success = StorageManager.exportInquiriesAsCSV();
        if (success) {
          this.showToast('📥 Inquiries downloaded as CSV file!', 'success');
        } else {
          this.showToast('No inquiries available to export.', 'info');
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all locally saved inquiries?')) {
          StorageManager.clearAllInquiries();
          renderInquiries();
          this.showToast('All local inquiries cleared.', 'info');
        }
      });
    }
  }

  /* -------------------------------------------------------------
   * 8. FAQ Accordion
   * ----------------------------------------------------------- */
  setupFaqAccordion() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-icon');

      if (!question || !answer) return;

      question.addEventListener('click', () => {
        const isOpen = !answer.classList.contains('hidden');

        // Close all others
        document.querySelectorAll('.faq-answer').forEach(a => a.classList.add('hidden'));
        document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('rotate-180'));

        if (!isOpen) {
          answer.classList.remove('hidden');
          if (icon) icon.classList.add('rotate-180');
        }
      });
    });
  }

  /* -------------------------------------------------------------
   * 9. Mobile Navigation
   * ----------------------------------------------------------- */
  setupMobileMenu() {
    const hamburgerBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (!hamburgerBtn || !mobileMenu) return;

    hamburgerBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  /* -------------------------------------------------------------
   * Utilities
   * ----------------------------------------------------------- */
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;

    if (toastIcon) {
      if (type === 'success') {
        toastIcon.innerHTML = `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
      } else if (type === 'error') {
        toastIcon.innerHTML = `<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      } else {
        toastIcon.innerHTML = `<svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      }
    }

    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Bootstrap once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.medhaApp = new MedhaApp();
});
