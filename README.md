# CareerAI - Career Recommendation Platform

A React-based career recommendation platform that matches users with career opportunities based on their skills, interests, and education.

## 📁 Project Structure

```
frontend/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── services/           # Business logic (auth, API)
│   ├── utils/              # Helper functions
│   └── data/               # Static data files
├── backend/                # Backend server
│   ├── data/               # Backend data files
│   └── server.js           # Express server
├── public/                 # Public assets
│   └── data/               # CSV user database
└── guide/                  # Documentation guides
```

## 🚀 Quick Start

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

## 📝 Key Features

- User authentication (signup/login)
- Profile quiz for career matching
- Personalized career recommendations
- Save favorite careers
- CSV-based user database

## 📚 Documentation

- **Quick Start**: `guide/QUICK_START.md`
- **Project Guide**: `PROJECT_GUIDE.txt`
- **CSV Integration**: `guide/CSV_INTEGRATION_GUIDE.md`
- **Deployment**: `guide/GO_LIVE_GUIDE.md`

## 🔧 Configuration

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: Express + SQLite
- **Database**: CSV file for users (`public/data/d.csv`)

## 📄 License

ISC

