<div align="center">
  <img src="public/Amortix.png" alt="Amortix Logo" width="200" />
  <h1>Amortix</h1>
  <p><strong>The Enterprise-Grade AI Loan Management & Debt Optimization Platform</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
</div>

---

## 🚀 Overview

**Amortix** is a sophisticated, AI-driven financial platform designed to help users regain control of their debts. By combining advanced amortization modeling with AI-powered insights, Amortix provides a comprehensive suite of tools for tracking loans, analyzing "interest leaks," and simulating repayment strategies to achieve financial freedom faster.

## ✨ Key Features

- 🏦 **Comprehensive Loan Dashboard**: Add, edit, and manage all your loans in one centralized, intuitive interface.
- 🧠 **AI Chat Advisor**: An integrated AI assistant (powered by Groq) that provides contextual guidance on your specific loan data.
- 🔍 **Financial Health Analysis**: Real-time insights into interest costs, "interest leaks," and debt-to-income ratios.
- 📊 **Strategy Simulator**: Compare different repayment strategies (Snowball vs. Avalanche) to see how much interest and time you can save.
- 📅 **EMI Calendar**: A visual representation of your upcoming payments and cash flow requirements.
- 📜 **Detailed Amortization**: Full breakdown of every payment, including principal vs. interest splits over time.
- 🔐 **Secure Authentication**: Robust user management powered by **Supabase Auth**, including Google OAuth integration.
- 📄 **Export Reports**: Generate professional PDF reports of your loan schedules and financial summaries.

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Database**: [PostgreSQL (via Supabase)](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: [Supabase Auth](https://supabase.com/auth)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) & [Groq](https://groq.com/)
- **Email**: [Nodemailer](https://nodemailer.com/)

## 📂 Project Structure

```text
├── app/             # Next.js App Router (Routes & API)
├── components/      # UI Components (Shared & Page-specific)
├── lib/             # Core logic: AI, calculations, Supabase, Prisma, email
├── prisma/          # Database schema & migrations
├── public/          # Static assets & logos
└── types/           # Global TypeScript definitions
```

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Justin-Titus/Amortix.git
cd Amortix
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and populate it with the following:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

# AI Integration
GROQ_API_KEY=your-groq-api-key

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Email (Nodemailer)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### 3. Database Initialization

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application in action.

## 📄 License

This project is **Proprietary**. All rights reserved by Justin Titus. See the [LICENSE](LICENSE) file for more details.



---

<div align="center">
  Built with ❤️ for financial freedom.
</div>

