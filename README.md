## 🧠 About Nomadly

**Nomadly** is a web app that helps Mongolian university students find internships, track their applications, and analyze resumes using AI.  
Built with a **React frontend**, **Firebase backend** (Auth, Firestore, and Storage), and hosted on **Vercel** for fast global deployment.







## ⚙️ Performance & Functionality Report

**Nomadly** is a full-stack web application for Mongolian university students to explore internships, track applications, and receive AI-powered resume feedback.

---

### ⚡ Performance
- **Load Time:** ~2–3 seconds on standard connection  
- **API Latency:** <1s average response (REST endpoints + Strapi backend)  
- **Frontend Optimization:** Lazy-loaded assets, minimal blocking scripts, efficient state updates  
- **Scalability:** Handles concurrent requests without performance drop  
- **Reliability:** Loading/error states implemented to prevent UI blocking

---

### 🧩 Functionality

| Module | Status | Notes |
|---------|---------|-------|
| **User Authentication** | ✅ | JWT-based auth for secure login/register |
| **Internship Listings** | ✅ | Dynamic fetch, search, and filter |
| **Application Tracker** | ✅ | CRUD operations with persistent storage |
| **AI Resume Analyzer** | ⚠️ | Functional; minor parsing issues with multilingual text |
| **Admin Dashboard** | ✅ | Managed via Strapi CMS |
| **Responsive UI** | ✅ | Optimized for desktop and mobile |

---

### 🪲 Known Issues
- Resume analyzer may misread non-English text  
- Occasional delay in loading internship images (CDN-related)

---
