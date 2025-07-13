# Tranzero — Modern Customer Ledger Management System

<div align="center">
  <img src="https://placehold.co/150x150.png" alt="Tranzero Logo" width="120" />
  <h1>Tranzero</h1>
  <p>
    A modern, real-time, and collaborative ledger management system built for teams.<br />
    Designed for speed, simplicity, and clarity across all your financial records.
  </p>
  <a href="#"><strong>🚀 Try the Live Demo »</strong></a>
</div>

---

## ✨ Overview

**Tranzero** is a powerful, intuitive web application for managing customer transactions, monitoring balances, and collaborating within teams — all in real time. Whether you're a small business owner or part of a larger accounting team, Tranzero makes tracking finances effortless.

---

## 🔑 Features

- **Customer Profiles**  
  Add, edit, archive, and manage customer data in seconds.

- **Smart Transaction Tracking**  
  Record both receivables (credit) and payables (debit) — with full history.

- **Partial Payments**  
  Split settlements across multiple entries until a transaction is fully cleared.

- **Live Balances**  
  See customer totals, net receivables, and outstanding payables update instantly.

- **Team Collaboration**  
  - Invite teammates via secure links  
  - Assign Owner or Member roles  
  - View a shared activity log for transparency

- **AI-Powered Status Tags**  
  Using **Genkit**, Tranzero automatically labels accounts as Credit, Debit, or Settled.

- **Data Export**  
  Download customer data or entire backups as **PDF** or **CSV**.

- **Progressive Web App (PWA)**  
  Install on your device for a native, offline-first mobile experience.

- **Theme & Currency Customization**  
  - Light/dark mode  
  - Multiple color themes  
  - Supports USD, EUR, GBP, PKR, and more

- **Fully Responsive Design**  
  Smooth, fast UI across mobile, tablet, and desktop screens.

---

## 🛠 Tech Stack

Tranzero is built using a robust, modern, and scalable stack:

| Area            | Tech Stack |
|-----------------|------------|
| **Framework**   | [Next.js 14+](https://nextjs.org/) with App Router |
| **Frontend**    | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling**     | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components**| [ShadCN UI](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/) |
| **Database & Auth** | [Firebase Firestore & Auth](https://firebase.google.com/) |
| **AI Features** | [Genkit by Firebase](https://firebase.google.com/docs/genkit) |
| **PWA**         | [@ducanh2912/next-pwa](https://www.npmjs.com/package/@ducanh2912/next-pwa) |

---

## 🚀 Getting Started

Follow these steps to set up Tranzero on your local machine.

### Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**

### Installation

1. **Clone the Repository**

```bash
git clone https://github.com/Malik-Muzammil1/Tranzero.git
cd Tranzero

2. Install Dependencies



npm install

3. Configure Firebase



Create a project on Firebase Console

Enable:

Firestore Database

Authentication (Email/Password)


Go to Project Settings → Web App, and copy the Firebase config


4. Create Environment File



Create a file named .env.local in the root of your project and paste your Firebase config:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

5. Run the App



npm run dev

Visit http://localhost:3000 — and you're live!


---

🤝 Contributing

We welcome contributions from the community!
If you have ideas, bugs, or improvements:

1. Fork the project


2. Create your branch (git checkout -b feature/feature-name)


3. Commit your changes (git commit -m 'Add feature')


4. Push to the branch (git push origin feature/feature-name)


5. Open a Pull Request




---

📄 License

This project is open source and available under the MIT License.


---

> Built with ❤️ using Firebase Studio and Next.js.
