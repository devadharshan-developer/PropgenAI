# ProgenAI — 1-Minute Client Proposal & Quote Builder

> **A modern, interactive single-page application to generate high-converting client proposals and quotes in 60 seconds.** 100% functional without a backend server, featuring Indian Rupee (`₹` INR) support, HTML5 canvas e-signature pad, high-resolution **JPG Audit Certificate** generation, and Netlify deployment readiness.

![ProgenAI Preview](public/vite.svg)

---

## ⚡ Core Features

### 1. Section 1: Input Dashboard (The Builder)
- **Modern Form Layout**: Clean visual hierarchy, subtle glassmorphism, responsive micro-interactions, and dark/light mode toggle.
- **Client & Industry Inputs**: Preset support (Web Agency, Construction, SaaS, Architecture) + custom typing.
- **3 Distinct Project Requirements**: Dedicated inputs with character counters and contextual guidance.
- **Estimated Budget & Currency**: Numeric input supporting Indian Rupee (`₹` INR) as primary default alongside global currencies (`$`, `€`, `£`, `C$`, `A$`) with quick Lakh amount chips (`₹1.5L`, `₹4.5L`, `₹10L`, `₹25L`, `₹50L`).
- **Delivery Cadence**: Expedited (5 weeks), Standard (9 weeks), and Staged (14 weeks).
- **1-Click Quick Presets**: Rapidly populate complete commercial scenarios.

### 2. Section 2: Generated Proposal View (The Output)
- **Simulated 2-Second AI Engine**: Shimmering progress bar and step-by-step synthesis indicators.
- **Client Intake Specifications**: Clearly stated 3 core requirements review card.
- **Scope of Work (SOW)**: Transforms the 3 raw requirements into comprehensive executive deliverables with technical summaries, itemized deliverables checklists, and strategic business impact tags.
- **Timeline Table**: Phased breakdown with duration, milestone tags, schedule windows, and calculated target launch date banner.
- **Cost Breakdown**: Financial table mapping requirements to budget percentages, structured payment terms (40% Deposit / 40% Mid-milestone / 20% Handover), and a bold **Total Investment** row reflecting the exact budget input.

### 3. Section 3: Client Action, E-Signature, Live Telemetry & JPG Certificate
- **Direct Blueprint Share Link**: Generates a shareable Customer Blueprint URL (`#blueprint=...&role=customer`) encoding state in the URL hash with toast confirmation.
- **Real-Time Customer Approach & Signature Telemetry**:
  - Uses `BroadcastChannel` and `localStorage` storage events for zero-backend cross-tab instant synchronization.
  - When the customer opens ("approaches") the link, the agency dashboard immediately displays a live status badge: **"🟢 Approached by Customer at [Time]"**.
  - When the customer draws their signature and clicks **"Accept & Legally Sign"**, the agency dashboard immediately updates to: **"✅ Formally Signed & Executed by Customer at [Time]"** with a visual thumbnail preview of the customer's drawn signature!
- **Canvas-based E-Signature Pad**: Interactive HTML5 drawing element with touch, mouse, and stylus support.
- **Accept & Sign Celebration**: Triggers celebratory confetti animation via `canvas-confetti`.
- **High-Resolution JPG Audit Certificate**:
  - Automatically generates an official **1600x1100 JPG Certificate (`.jpg`)** directly inside the browser using HTML5 Canvas.
  - Includes double ornate indigo & emerald borders, official verification seal, commercial details, signatory title, cryptographic SHA-256 hash, and the client's actual digital signature!
  - 1-click **"Download Audit Certificate (JPG)"** button.
- **Printable Proposal PDF**: 1-click **"Download Proposal (PDF)"** formatted with clean print CSS rules.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom glassmorphism
- **Icons**: Lucide React
- **Database**: `@supabase/supabase-js` (with local client storage fallback)
- **Celebration FX**: `canvas-confetti`
- **Certificate Export**: Native Canvas high-res JPEG exporter (`image/jpeg`)
- **Hosting**: Netlify production-ready (`netlify.toml`)

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build
```
