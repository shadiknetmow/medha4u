/**
 * IP and Geolocation Language Detection for Medha IT Solutions
 * Detects visitor country via IP, maps to language, and synchronizes
 * with LocalStorage and Cookies.
 */

const IPDetector = {
  COUNTRY_LANG_MAP: {
    BD: 'bn', // Bangladesh -> Bengali
    SA: 'ar', AE: 'ar', EG: 'ar', QA: 'ar', KW: 'ar', OM: 'ar', BH: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar',
    ES: 'es', MX: 'es', CO: 'es', AR: 'es', PE: 'es', CL: 'es', VE: 'es', EC: 'es', GT: 'es',
    FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr',
    DE: 'de', AT: 'de', LI: 'de', LU: 'de',
    IN: 'hi', // India -> Hindi
    CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', SG: 'zh',
    JP: 'ja', // Japan -> Japanese
    US: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en'
  },

  async detectLocationAndLanguage() {
    // 1. Check if user already set language explicitly
    const savedLang = StorageManager.getPreference(StorageManager.KEYS.LANG);
    if (savedLang && TRANSLATIONS[savedLang]) {
      return {
        language: savedLang,
        country: null,
        source: 'user_saved'
      };
    }

    // 2. Check if we already cached geo info
    const cachedGeo = StorageManager.getPreference(StorageManager.KEYS.GEO);
    if (cachedGeo && cachedGeo.countryCode) {
      const mapped = this.COUNTRY_LANG_MAP[cachedGeo.countryCode] || this.getBrowserFallbackLanguage();
      return {
        language: mapped,
        country: cachedGeo.countryCode,
        geo: cachedGeo,
        source: 'cached_geo'
      };
    }

    // 3. Query IP Geolocation API with timeout & fallback
    try {
      const geo = await this.fetchGeoFromAPI();
      if (geo && geo.countryCode) {
        StorageManager.setPreference(StorageManager.KEYS.GEO, geo);
        const mappedLang = this.COUNTRY_LANG_MAP[geo.countryCode] || this.getBrowserFallbackLanguage();
        // Save initial detected language
        StorageManager.setPreference(StorageManager.KEYS.LANG, mappedLang);
        return {
          language: mappedLang,
          country: geo.countryCode,
          geo: geo,
          source: 'ip_api'
        };
      }
    } catch (err) {
      console.warn("IP Geolocation detection error, falling back to browser locale:", err);
    }

    // 4. Browser locale fallback
    const browserLang = this.getBrowserFallbackLanguage();
    StorageManager.setPreference(StorageManager.KEYS.LANG, browserLang);
    return {
      language: browserLang,
      country: null,
      source: 'browser_locale'
    };
  },

  async fetchGeoFromAPI() {
    // Controller with 3-second timeout
    const fetchWithTimeout = async (url, timeoutMs = 3000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    // Try primary API (freeipapi.com)
    try {
      const data = await fetchWithTimeout('https://freeipapi.com/api/json');
      if (data && data.countryCode) {
        return {
          countryCode: data.countryCode.toUpperCase(),
          countryName: data.countryName,
          city: data.cityName,
          ip: data.ipAddress
        };
      }
    } catch (e) {
      // Fallback API (ipwho.is)
      try {
        const data2 = await fetchWithTimeout('https://ipwho.is/');
        if (data2 && data2.country_code) {
          return {
            countryCode: data2.country_code.toUpperCase(),
            countryName: data2.country,
            city: data2.city,
            ip: data2.ip
          };
        }
      } catch (err2) {
        // Return null if both fail
      }
    }
    return null;
  },

  getBrowserFallbackLanguage() {
    const raw = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    const shortCode = raw.split('-')[0];
    if (TRANSLATIONS[shortCode]) {
      return shortCode;
    }
    return 'en';
  }
};

window.IPDetector = IPDetector;
