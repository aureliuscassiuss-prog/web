# UniNotes React - Production Deployment Guide

## 🚀 Quick Start

### Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173`

---

## 📦 Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

---

## ☁️ Vercel Deployment

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. **Set Environment Variables** in Vercel dashboard:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A secure random string
   - `GROQ_API_KEY` - Your Groq API key

6. Deploy!

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

---

## 🔐 Environment Variables

### Required for Production:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/uninotes` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key-min-32-chars` |
| `GROQ_API_KEY` | Groq AI API key | `gsk_...` |

### Optional:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL (dev only) | `/api` |

---

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Production)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a FREE cluster
3. Add database user
4. Whitelist IP: `0.0.0.0/0` (all IPs for serverless)
5. Get connection string
6. Replace `<password>` and `<dbname>` in connection string

### Option 2: Local MongoDB (Development)

```bash
# Windows
# Download from mongodb.com/try/download/community

# macOS
brew install mongodb-community

# Linux
sudo apt-get install mongodb

# Start MongoDB
mongod
```

Connection string: `mongodb://localhost:27017/uninotes`

---

## 🔑 Getting API Keys

### Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up / Login
3. Navigate to "API Keys"
4. Create new key
5. Copy and save

---

## 📱 Features

- ✅ User Authentication (JWT)
- ✅ Resource Upload/Download
- ✅ AI Assistant (Groq)
- ✅ Dark Mode
- ✅ Responsive Design
- ✅ Server less Architecture

---

## 🔧 Troubleshooting

### Build Errors

**Issue**: `Cannot find module '@vercel/node'`
```bash
npm install @vercel/node --save-dev
```

**Issue**: `Cannot find module 'mongodb'`
```bash
npm install mongodb bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### Runtime Errors

**Issue**: `MongoDBURI is not defined`
- Set `MONGODB_URI` environment variable in Vercel

**Issue**: `JWT_SECRET is not defined`
- Set `JWT_SECRET` environment variable in Vercel

**Issue**: `AI service unavailable`
- Set `GROQ_API_KEY` environment variable in Vercel

---

## 📁 Project Structure

```
uninotes-react/
├── api/                    # Vercel Serverless Functions
│   ├── auth/              # Authentication endpoints
│   │   ├── login.ts
│   │   └── register.ts
│   ├── resources/         # Resource endpoints
│   │   └── index.ts
│   └── ai/                # AI endpoints
│       └── ask.ts
├── lib/                   # Utilities
│   └── mongodb.ts         # MongoDB connection
├── src/                   # Frontend React App
│   ├── components/
│   ├── contexts/          # React Context (Auth)
│   ├── App.tsx
│   └── main.tsx
├── .env                   # Environment variables (local)
├── .env.example          # Environment template
├── vercel.json           # Vercel configuration
└── package.json
```

---

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize theme colors.

### Branding

- Logo: Update SVG in `src/components/Sidebar.tsx`
- App Name: Search for "MediNotes" and replace

---

## 📝 License

MIT

---

## 🆘 Support

For issues, create a GitHub issue or contact the development team.
