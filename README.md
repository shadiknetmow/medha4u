# Medha IT Solutions - International Tech & AI Solutions Landing Page

A modern, high-converting landing page for **Medha IT Solutions**, engineered for international technology services, AI automations, and IT consulting.

---

## 🌟 Key Highlights & Features

1. **Direct WhatsApp Integration (`+8801712813557`)**:
   - **URL Format**: `https://api.whatsapp.com/send/?phone=8801712813557&text=From%20Medha%20IT%20Website%20Inquery&type=phone_number&app_absent=0`
   - **Default Message**: Prefixed with `From Medha IT Website Inquery` so incoming messages are immediately recognized.
   - **Floating WhatsApp Widget**: Pulsating green beacon with live online status badge.
   - **Interactive Quick Chat Modal**: Pre-composed prompt chips (*AI Automation & LLM, Custom Web/Mobile App, Dedicated Tech Team, Urgent Quote*) + custom message textarea.
   - **Direct WhatsApp Buttons Everywhere**: Hero, navigation, service cards, interactive estimator, and contact form all trigger pre-formatted WhatsApp messages to `+8801712813557`.

2. **Mobile-First UX ("Less Text on Mobile")**:
   - On mobile screens (`< 768px`), long descriptive paragraphs are automatically hidden or condensed.
   - Compact tags and punchy bullet highlights (`⚡ AI Workflow Automation`, `🚀 Custom Web & Mobile Apps`, `🌍 Global Tech Teams`).
   - **Docked Mobile Bottom Bar**: 1-tap quick action bar with WhatsApp, Direct Call (`tel:+8801712813557`), Project Estimator, and Language selector.

3. **Multi-Language with Searchable Dropdown & RTL Support**:
   - **Supported Languages**:
     - 🇺🇸 English (`en`)
     - 🇧🇩 Bengali (`bn`)
     - 🇸🇦 Arabic (`ar`) - Full RTL (Right-to-Left) layout
     - 🇪🇸 Spanish (`es`)
     - 🇫🇷 French (`fr`)
     - 🇩🇪 German (`de`)
     - 🇮🇳 Hindi (`hi`)
     - 🇨🇳 Chinese (`zh`)
     - 🇯🇵 Japanese (`ja`)
   - **Searchable Dropdown**: Real-time filter by language name, native name, or code with country flags.

4. **Automatic IP Geolocation Detection**:
   - Automatically detects visitor's country on first visit via IP API and switches to their preferred language (e.g. Bangladesh -> Bengali, Arab countries -> Arabic, etc.) with browser locale fallback.

5. **No External Database Required (LocalStorage & Cookies)**:
   - Language preferences, visitor location, and submitted inquiries are persisted safely in the user's browser `localStorage` and `cookies`.
   - **Inquiries & Quotes Viewer Modal**: Built-in client-side lead viewer to inspect saved inquiries, export them as CSV, or reply directly on WhatsApp.

6. **Interactive Project Scope & Cost Estimator**:
   - Select service type, project scope, and delivery speed to get real-time timeline, recommended team composition, and starting budget.
   - 1-click **"Send Scope to WhatsApp"** button.

---

## 📁 File Structure

```text
e:/medha4u/
  ├── index.html            # Main Landing Page
  ├── serve.js              # Lightweight local HTTP server (port 3000)
  ├── css/
  │   └── style.css         # Glassmorphism, animations, mobile rules, and RTL styles
  ├── js/
  │   ├── app.js            # Main application engine & WhatsApp modal logic
  │   ├── ip-detector.js    # Automatic IP-based language detection
  │   ├── storage.js        # LocalStorage and Cookie manager
  │   └── translations.js   # 9-language translation dictionary
  └── assets/
      └── images/
          ├── logo.jpg      # Custom luxury high-tech logo
          └── hero-ai.jpg   # High-resolution AI automation visual
```

---

## 🚀 Running the Project Locally

To run the local preview server:
```bash
node serve.js
```
Then open your browser at:
`http://localhost:3000`

Or simply double-click `index.html` to open it in any modern browser!
