# SmartApply - AI Job Analyzer & CoverLetter Generator

SmartApply is a production-ready Chrome Extension that allows users to instantly scrape job descriptions from LinkedIn , gives them analysis of their resume with a score and reason , how much is their resume suitable for the job along with the missing keywords from their resume and generates a highly tailored cover letter using AI. 

Built with a secure **Thick Client Architecture**, it leverages Firebase on the client side for lightning-fast authentication and data persistence, while securely delegating AI generation to a custom Node.js API gateway to protect API secrets and enforce rate limiting.

## ✨ Features
* **One-Click Job Scraping:** Extracts the information about the job directly from the active LinkedIn job tab.
* **AI Resume Matching:** Compares the user's base resume against the job description to generate targeted bullet points.
* **Secure OAuth:** Google and Facebook login flows implemented via Firebase Authentication.
* **Cloud Sync:** Auto saving user's generated scans and accessible through history across devices via Cloud Firestore.
* **Enterprise Security:** Client-side JWT generation ensures completely secure, authenticated requests to the backend API.

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, Chrome Extensions API (Manifest V3)
* **Authentication & Database:** Firebase Auth, Cloud Firestore (Client SDK)
* **Backend:** Node.js, Express, Firebase Admin SDK
* **AI Provider:** OpenRouter

---

## 💻 Local Installation (For Developers & Testers)

Follow these steps to run the extension locally on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/MRIDUL1978/SmartApply.git
cd SmartApply
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Extension

Because Chrome cannot read raw React files, you must compile the code:

```bash
npm run build
```

This will generate a `dist` (or `build`) folder containing the final extension files.

### 4. Load into Chrome
1. Open Google Chrome and navigate to \`chrome://extensions/\`.
2. Toggle **Developer mode** ON (top right corner).
3. Click the **Load unpacked** button (top left).
4. Select the newly generated \`dist\` (or \`build\`) folder inside your project directory.
5. Pin the extension to your toolbar and you are ready to go!

---

## 🏗️ System Architecture
* **Frontend:** Handles user state, OAuth flows, and Firestore reads/writes directly using the Client SDK for zero-latency UI updates.
* **Database Security:** Locked down via Firestore Security Rules.
* **Backend:** A secure Node.js server handles the AI generation. It authenticates every request to block unauthorized access and enforces strict rate limiting per user to prevent spam and API abuse.
