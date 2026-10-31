/**
 * Storage and Cookie Management Module for Medha IT Solutions
 * Manages preferences, saved inquiries, quotes, and IP location data
 * completely client-side via LocalStorage and Cookies.
 */

const CookieManager = {
  set(name, value, days = 365) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    const safeValue = encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : value);
    document.cookie = `${name}=${safeValue}${expires}; path=/; SameSite=Lax`;
  },

  get(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const val = decodeURIComponent(c.substring(nameEQ.length, c.length));
        try {
          return JSON.parse(val);
        } catch (e) {
          return val;
        }
      }
    }
    return null;
  },

  delete(name) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
};

const StorageManager = {
  KEYS: {
    LANG: 'medha_language',
    GEO: 'medha_geo_info',
    INQUIRIES: 'medha_inquiries',
    SAVED_QUOTES: 'medha_saved_quotes',
    THEME: 'medha_theme',
    WHATSAPP_PREFILL: 'medha_wa_prefill'
  },

  // Save with sync across localStorage and Cookies
  setPreference(key, value) {
    try {
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      localStorage.setItem(key, serialized);
      CookieManager.set(key, value, 365);
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  },

  getPreference(key, fallback = null) {
    try {
      const localVal = localStorage.getItem(key);
      if (localVal !== null) {
        try {
          return JSON.parse(localVal);
        } catch (e) {
          return localVal;
        }
      }
      const cookieVal = CookieManager.get(key);
      if (cookieVal !== null) {
        return cookieVal;
      }
    } catch (e) {
      console.warn("Storage read failed:", e);
    }
    return fallback;
  },

  // Inquiries Management
  saveInquiry(inquiryData) {
    const inquiries = this.getInquiries();
    const newEntry = {
      id: 'INQ-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      timestampFormatted: new Date().toLocaleString(),
      ...inquiryData
    };
    inquiries.unshift(newEntry);
    // Keep last 50 inquiries in storage
    const trimmed = inquiries.slice(0, 50);
    this.setPreference(this.KEYS.INQUIRIES, trimmed);
    return newEntry;
  },

  getInquiries() {
    return this.getPreference(this.KEYS.INQUIRIES, []);
  },

  deleteInquiry(id) {
    const inquiries = this.getInquiries().filter(item => item.id !== id);
    this.setPreference(this.KEYS.INQUIRIES, inquiries);
    return inquiries;
  },

  clearAllInquiries() {
    this.setPreference(this.KEYS.INQUIRIES, []);
  },

  // Saved Quotes
  saveQuote(quoteData) {
    const quotes = this.getQuotes();
    const newQuote = {
      id: 'QT-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      timestampFormatted: new Date().toLocaleString(),
      ...quoteData
    };
    quotes.unshift(newQuote);
    this.setPreference(this.KEYS.SAVED_QUOTES, quotes.slice(0, 20));
    return newQuote;
  },

  getQuotes() {
    return this.getPreference(this.KEYS.SAVED_QUOTES, []);
  },

  // Export data as JSON or CSV
  exportInquiriesAsCSV() {
    const list = this.getInquiries();
    if (!list.length) return null;

    const headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Service', 'Budget', 'Message'];
    const rows = list.map(item => [
      `"${item.id}"`,
      `"${item.timestampFormatted || item.createdAt}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${(item.service || '').replace(/"/g, '""')}"`,
      `"${(item.budget || '').replace(/"/g, '""')}"`,
      `"${(item.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `medha_inquiries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
};

window.CookieManager = CookieManager;
window.StorageManager = StorageManager;
