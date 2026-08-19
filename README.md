# OpsTracka 🗂️⚡

**Enterprise Archival Digitization & Daily Operations Reporting System**

OpsTracka is a robust, full-stack enterprise platform engineered to digitize paper record archiving operations, track daily operator outputs (boxes, files, and pages), enforce Role-Based Access Control (RBAC), and streamline daily status reporting via WhatsApp integration, CSV/PDF exports, and cloud synchronization.

---

## 🚀 Key Features

- **Daily Operations Logging**: Track real-time throughput metrics across active projects and operations (Sorting, Preparation, Scanning, Quality Control, Indexing, and Repackaging).
- **Role-Based Access Control (RBAC)**:
  - **Super Admins**: Full governance privileges, project management, operator credential provisioning, auto-generating strong passwords, and global reporting.
  - **Staff Operators**: Dedicated entry logging and confidential personal contribution tracking.
- **WhatsApp Daily Summary Report Generator**: Instantaneous formatting of daily operational metrics with pre-configured redirection to WhatsApp (`+2348166771210`).
- **Professional Reports & Data Export**:
  - **PDF Reports**: Comprehensive client-ready reports generated with `jspdf` and `jspdf-autotable`.
  - **CSV Spreadsheets**: UTF-8 encoded spreadsheets with strict `YYYY-MM-DD` date formatting and cell protection against truncation errors.
  - **Printable Views**: Dedicated print windows for physical recordkeeping.
- **Progressive Web App (PWA)**: Installable on desktop and mobile devices with offline capability, manifest configuration, service worker caching, and automatic update prompts.
- **Cloud & Offline Resilience**: Dual-mode data persistence supporting seamless Firebase Firestore synchronization and robust localStorage fallback.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, jsPDF.
- **Backend & Database**: Node.js, Express, Firebase Firestore & Authentication.
- **Build Tool**: Vite, ESBuild.

---

## 📦 Installation & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Start production server:
   ```bash
   npm start
   ```

---

## 📄 License

Built for enterprise archival operations. All rights reserved.
