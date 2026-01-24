# EcoSync S4 - Installation Guide

## 1. Prerequisites
Before starting, ensure you have:
*   [Node.js](https://nodejs.org/) (Version 18 or higher)
*   [Git](https://git-scm.com/)
*   A [Supabase](https://supabase.com/) Account (Free Tier)

## 2. Clone the Repository
```bash
git clone https://github.com/projectc943-prog/Ecosync.git
cd Ecosync/frontend
```

## 3. Install Dependencies
EcoSync uses `npm` for package management.
```bash
npm install
```

## 4. Environment Configuration
Create a `.env` file in the `frontend` folder:
```bash
cp .env.example .env
```
Fill in your Supabase credentials found in Project Settings -> API:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Running Vertically
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the app.

## 6. Hardware Setup (Optional)
Navigate to the `hardware` folder and open with PlatformIO (VS Code Extension) to flash the ESP32.
