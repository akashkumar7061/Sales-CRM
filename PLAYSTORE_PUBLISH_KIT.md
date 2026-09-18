# 🚀 Google Play Store Publishing & Submission Kit (Sales CRM)

This document contains everything needed to complete the **Google Play Store submission** for **Sales CRM**.

---

## 1. App Listing Information (Play Console Metadata)

### 📌 App Details
* **App Name:** Sales CRM - Customer & Team Management
* **Short Description (max 80 chars):**
  Manage customers, field cash collections, call recordings & daily work reports.
* **Full Description (max 4000 chars):**
```text
Sales CRM is an all-in-one Customer Relationship and Sales Management platform designed for growing businesses, sales executives, and field teams.

Key Features:
- 👥 Customer & Lead Management: Track leads, communication history, status updates, and customer documents with ease.
- 💵 Daily Worker Cash Collection: Track real-time daily cash collections by worker/salesperson name with instant summary cards and audit records.
- 🎙️ Call Recordings & Voice Notes: Listen to customer call recordings and voice notes directly within the app for quality assurance.
- 📊 Performance Analytics & Targets: Set sales targets, monitor progress, and review employee performance with interactive charts.
- 📝 Daily Work Reports: Submit and inspect end-of-day reports to keep the whole team aligned.
- 🔒 Enterprise-Grade Security: End-to-end encrypted API communications with secure role-based access for Admins and Employees.

Streamline your sales workflow, increase team productivity, and maintain complete transparency with Sales CRM.
```
* **Category:** Business / Productivity
* **Contact Email:** your-business-email@example.com

---

## 2. Release Keystore Details (Already Generated ✅)

The production keystore has been generated and pre-configured in `client/android/app/build.gradle`:

* **Keystore File Location:** `client/android/app/salescrm-release-key.jks`
* **Keystore Alias:** `salescrm-key`
* **Keystore Password:** `SalesCrmSecurePass2026!`
* **Key Password:** `SalesCrmSecurePass2026!`
* **Validity:** 10,000 Days (~27 Years)

---

## 3. Google Play Data Safety Section Answers

When completing the **Data Safety form** in Play Console, select these exact answers:

1. **Does your app collect or share user data?**
   - ✅ **Yes**
2. **Is all of the user data encrypted in transit?**
   - ✅ **Yes** (HTTPS/TLS enforced)
3. **Do you provide a way for users to request data deletion?**
   - ✅ **Yes**
4. **Data Types Collected:**
   - **Personal Info:** Name, Email address, Phone number (Used for: *Account management, App functionality*).
   - **Financial Info:** Other financial info / Cash Collection amounts (Used for: *App functionality, internal accounting*).
   - **Audio:** Voice or sound recordings (Used for: *App functionality, Quality Assurance*).
   - **App info & Performance:** Crash logs, Diagnostics.

---

## 4. Privacy Policy URL

Google Play requires a public HTTPS URL. You can use:
* `https://<your-deployed-domain>/privacy-policy.html`
*(The HTML file is ready at `client/public/privacy-policy.html`)*

---

## 5. Visual Graphic Assets Checklist

Before submitting to Google Play Console, upload:
1. **App Icon:** 512 x 512 px (PNG, 32-bit).
2. **Feature Graphic:** 1024 x 500 px (JPG or PNG).
3. **Screenshots:** 4 to 8 phone screenshots (1080 x 2400 or 1080 x 1920 px) showing:
   - Login / Dashboard
   - Customer Management Table
   - Cash Collection Ledger
   - Call Recordings Player Hub
