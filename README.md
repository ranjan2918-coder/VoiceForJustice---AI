# ⚖️ VoiceForJustice - AI

**Empowering unorganized sector workers in India to speak up, file complaints, and secure their hard-earned wages safely and securely.**

VoiceForJustice - AI is a multilingual, audio-first web kiosk built specifically for construction workers and daily wage laborers who often face wage theft or exploitation. Recognizing that literacy and language barriers prevent many workers from accessing justice, we designed this platform to be accessible entirely through voice, in the worker's native tongue.

---

## 🌟 Why We Built This
Millions of unorganized sector workers in India migrate for work. When contractors withhold wages or conditions become unsafe, these workers often cannot read complex legal forms or speak the local administrative language. 

**VoiceForJustice - AI solves this by:**
1. **Speaking their language:** Offering a fully guided voice interface in Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, and English.
2. **Removing the need to type:** Workers simply press a button and speak their complaint.
3. **Using AI to structure chaos:** The system uses Groq LLMs (Llama 3) to transcribe the voice, translate it to English, and extract structured legal data (Employer Name, Wage Amount, Location, etc.).
4. **Building legal evidence:** GPS-tagged photo uploads, call recordings, and witness statements are cryptographically hashed and certified under **Section 65B of the Indian Evidence Act**, ensuring that the data holds up in a court of law or labor tribunal.

---

## ✨ Key Features

### 🎙️ Audio-First Kiosk Experience
* **Voice Navigation:** Every prompt and instruction is spoken aloud using natural-sounding regional voices powered by the **Sarvam AI TTS API**.
* **Smart Voice Complaints:** Workers record their grievances as an audio note. The system transcribes, translates, and structures the complaint automatically.
* **On-the-Fly AI Translation:** If a prompt isn't natively translated, the backend uses an LLM to translate it instantly before speaking to the worker.

### 📸 Evidence Hub
* **Photo & Audio Uploads:** Workers can snap photos of work sites, upload screenshots of messages, or attach call recordings with contractors.
* **Verified GPS Location:** Evidence is automatically tagged with the worker's exact coordinates.
* **Witness Registry:** Co-workers can add their statements and contact details directly to a complaint.

### 🏛️ Section 65B Legal Certification
* To ensure digital evidence is legally admissible in India, the system automatically generates a **SHA-256 cryptographic hash** for all digital artifacts (audio, images, logs).
* It produces a digital Section 65B compliance certificate for every filed complaint.

### 📊 End-to-End Admin Dashboard
* **Full Oversight:** Administrators and legal aid volunteers have a premium, expandable dashboard to track cases.
* **Listen & Review:** Play original voice complaints, view uploaded evidence on Google Maps, and read AI validation summaries.
* **Status Management:** Easily move cases from *Filed* ➔ *Under Review* ➔ *Resolved*.

---

## 🚀 Tech Stack

* **Frontend & Backend:** Next.js (App Router), React, CSS Modules
* **Database:** Local JSON File Storage (`db.json`) for lightweight portability
* **AI Transcription & Extraction:** Groq API (Llama 3)
* **Natural Voice Generation (TTS):** Sarvam AI (`bulbul:v2` model)

---

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. **Clone the repository** (or navigate to the project directory).
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   SARVAM_API_KEY=your_sarvam_api_key_here
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
5. **Open the App:**
   * Kiosk View: [http://localhost:3000](http://localhost:3000)
   * Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## ❤️ Human-Centric Design
This tool was built with empathy. From the soft mist gray background that feels professional but non-intimidating, to the prominent recording animations and high-contrast buttons, every design choice was made to accommodate users who may be stressed, visually impaired, or interacting with a digital kiosk for the very first time.

**VoiceForJustice - AI isn't just software; it's a microphone for the voiceless.**
