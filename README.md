# Aumoha Full-Stack PWA

This is a full-stack monorepo structured with a **Next.js 16** frontend progressive web application (PWA) and a **Node.js (Express + TypeScript)** backend API.

## Repository Structure

* [**`frontend/`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/frontend): Next.js App Router frontend with complete PWA config.
  * [**`public/manifest.json`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/frontend/public/manifest.json): Configuration for app icons, theme colors, and standalone window launch settings.
  * [**`public/sw.js`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/frontend/public/sw.js): Custom Service Worker for offline asset caching and offline-first HTML navigation.
  * [**`src/components/PWARegistration.tsx`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/frontend/src/components/PWARegistration.tsx): Client-side component that handles registering the service worker on mount.
  * [**`src/app/layout.tsx`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/frontend/src/app/layout.tsx): Setup for viewport metadata, layout, and PWARegistration placement.
* [**`backend/`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/backend): Node.js + Express API server configured with TypeScript and nodemon.
  * [**`src/index.ts`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/backend/src/index.ts): Main server setup, CORS configuration, API routes, and `/health` checkers.
* [**`package.json`**](file:///c:/Users/Sairaj%20Tripathy/Desktop/Aumoha/Aumoha/package.json): Root orchestration script file containing workspace shortcuts.

---

## Getting Started

### Installation
From the root folder, run:
```bash
npm install
npm run install:all
```
*Note: `npm run install:all` runs `npm install` inside both `frontend` and `backend` directories to install their respective dependencies.*

### Running the App
To start the frontend and backend servers together:
```bash
npm run dev
```
* **Frontend:** Loads at [http://localhost:3000](http://localhost:3000)
* **Backend API:** Serves endpoints at [http://localhost:5001](http://localhost:5001)

### Building for Production
To build both applications:
```bash
npm run build
```

---

## PWA Features
1. **Offline Support:** The custom service worker in `frontend/public/sw.js` caches static pages and assets, so the app remains accessible when offline.
2. **Installable:** Configured with a `manifest.json` and high-resolution icons (192px and 512px) generated via Midjourney-equivalent prompt systems. You can install the app natively on Android, iOS, and desktops.
3. **Optimized for Layouts:** Tailored meta tags are added to `layout.tsx` for optimized responsive rendering.