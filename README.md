# Auraa AI Platform

A modern, AI-powered platform built with React, TypeScript, and Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Features

- **AI Integration**: Powered by Google's Generative AI
- **Modern UI**: Built with React 18 and Radix UI components
- **Real-time Data**: Supabase backend with real-time subscriptions
- **Type-Safe**: Full TypeScript coverage with strict mode
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Payment Processing**: Integrated with Polar.sh
- **Error Tracking**: Optional Sentry integration
- **PWA Support**: Service worker for offline capabilities

---

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Polar.sh account (for payment features)

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ghost0000070/Auraa-AI.git
cd Auraa-AI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Then fill in your actual values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Owner Configuration
VITE_OWNER_EMAIL=your_email@example.com
VITE_OWNER_UID=your_supabase_user_id

# Polar.sh Configuration
VITE_POLAR_ACCESS_TOKEN=your_polar_access_token

# Optional: Performance Monitoring
VITE_ENABLE_ANALYTICS=true

# Optional: Rate Limiting
VITE_API_RATE_LIMIT=100

# Optional: Error Tracking (Sentry)
# VITE_SENTRY_DSN=your_sentry_dsn
# VITE_SENTRY_ENVIRONMENT=production
```

#### Getting Your Credentials

**Supabase:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**

**Polar.sh:**
1. Go to [polar.sh/settings](https://polar.sh/settings)
2. Navigate to **Access Tokens**
3. Create a new token and copy it

**Owner UID:**
1. Sign up/sign in to your app
2. Check your Supabase dashboard → **Authentication** → **Users**
3. Copy your user ID

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This will create an optimized production build in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

---

## 📝 Linting

Check code quality:

```bash
npm run lint
```

---

## 🚢 Deployment

### Deploying to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Set up environment variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_POLAR_ACCESS_TOKEN production
   vercel env add VITE_OWNER_EMAIL production
   vercel env add VITE_OWNER_UID production
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

The `vercel.json` configuration file is already set up with:
- SPA routing (all routes redirect to index.html)
- Optimized caching for static assets
- Environment variable references

---

## 🏗️ Project Structure

```
Auraa-AI/
├── .github/              # GitHub configuration and workflows
│   └── SECURITY.md      # Security policy and best practices
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # React components
│   ├── config/         # Configuration files
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and libraries
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Application entry point
├── .env.example        # Environment variable template
├── .gitignore          # Git ignore rules
├── eslint.config.js    # ESLint configuration
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── vite.config.ts      # Vite build configuration
└── vercel.json         # Vercel deployment configuration
```

---

## 🔒 Security

Please read our [Security Policy](.github/SECURITY.md) for:
- How to report vulnerabilities
- Environment variable setup best practices
- Credential rotation procedures
- Deployment security guidelines

**Important:** Never commit `.env` files or expose sensitive credentials in your code.

---

## 🛠️ Built With

### Core Technologies
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS

### UI Components
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & Data
- **[Supabase](https://supabase.com/)** - Backend as a service
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching

### AI & Integrations
- **[Google Generative AI](https://ai.google.dev/)** - AI capabilities
- **[Polar.sh](https://polar.sh/)** - Payment processing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## �� Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For questions, issues, or feature requests, please:
- Open an issue on GitHub
- Contact the maintainer via the email in the repository

---

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

**Made with ❤️ by the Auraa AI team**
