<div align="center">
  <img src="assets/Amortix.png" alt="Amortix Logo" width="200" />
  <h1>Amortix Mobile</h1>
  <p><strong>The Enterprise-Grade AI Loan Management & Debt Optimization Platform (Mobile App)</strong></p>

  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
</div>

---

## 🚀 Overview

**Amortix Mobile** is the cross-platform mobile companion to the Amortix ecosystem. It brings advanced amortization modeling, AI-powered insights, and loan tracking directly to iOS and Android devices, allowing users to manage their financial health and debts on the go.

> **🌐 Companion Web App**  
> This repository contains the React Native (Expo) mobile application. Amortix also has a companion web dashboard built with Next.js! You can check out the web repository here: [Amortix Web Repository](https://github.com/Justin-Titus/Amortix)

## ✨ Key Features

- 📱 **Native Performance**: Smooth, native-feeling animations using `react-native-reanimated` and gesture handling.
- 🏦 **Comprehensive Loan Dashboard**: Add, edit, and manage all your loans in an intuitive mobile interface.
- 🧠 **AI Chat Advisor**: An integrated AI assistant providing contextual guidance on your specific loan data.
- 📅 **EMI Calendar**: A visual representation of your upcoming payments optimized for mobile screens.
- 🔐 **Secure Authentication**: Robust user management powered by **Supabase Auth** with secure token storage (`expo-secure-store`).
- 📄 **Export Reports**: Generate and share professional PDF reports directly from your mobile device using `expo-print` and `expo-sharing`.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) & [React Navigation](https://reactnavigation.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State/Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Fonts & Icons**: [Expo Google Fonts](https://github.com/expo/google-fonts) & [Lucide React Native](https://lucide.dev/)

## 📂 Project Structure

```text
├── app/             # Expo Router screens and navigation flows (Tabs, Drawer, Auth)
├── components/      # Reusable UI components (Buttons, Cards, Inputs)
├── constants/       # Global constants, theme configurations, and tokens
├── contexts/        # React context providers (e.g., AuthContext)
├── hooks/           # Custom React hooks
└── lib/             # Core logic: API clients, Supabase setup, AI integration
```

## 🏁 Getting Started (Internal Devs)

### 1. Prerequisites

Make sure you have Node.js and `pnpm` installed. You will also need the [Expo Go](https://expo.dev/client) app on your mobile device or an iOS Simulator / Android Emulator installed on your machine.

### 2. Install Dependencies

```bash
cd AmortixMobile
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root of the `AmortixMobile` directory. You will need the Supabase configuration variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server

Start the Expo bundler:

```bash
pnpm start
```

From here, you can:
- Press **`i`** to open the app in an iOS Simulator.
- Press **`a`** to open the app in an Android Emulator.
- Scan the **QR code** with your phone's camera (iOS) or the Expo Go app (Android) to test on a physical device.

## 📄 License

This project is **Proprietary**. All rights reserved by Justin Titus. See the [LICENSE](LICENSE) file for more details.

---

<div align="center">
  Built with ❤️ for financial freedom.
</div>
