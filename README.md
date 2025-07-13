
# Tranzero: Customer Ledger Management System

<div align="center">
  <img src="https://placehold.co/150x150.png" alt="Tranzero Logo" data-ai-hint="scale balance" width="120">
  <h1 align="center">Tranzero</h1>
  <p align="center">
    A modern, real-time, and collaborative ledger management system built for teams.
    <br />
    <a href="#"><strong>Explore the live demo Â»</strong></a>
    <br />
    <br />
  </p>
</div>

Tranzero is a powerful yet intuitive web application designed to help businesses manage customer transactions, track balances, and collaborate seamlessly. Built with a robust, modern tech stack, it provides a fast, secure, and user-friendly experience that works flawlessly on both desktop and mobile devices.

---

## âœ¨ Key Features

- **Full Customer Management**: Add, edit, and archive customer profiles with ease.
- **Detailed Transaction Tracking**: Record receivable (credit) and payable (debit) transactions for each customer.
- **Partial Payments System**: Log multiple payments against a single transaction until it's fully settled.
- **Real-time Balance Calculation**: Instantly see customer balances, total receivables, and total payables.
- **Team Collaboration**:
    - Invite members to your team via unique, secure links.
    - Role-based access control (Owner vs. Member).
    - Team-wide activity log for owners to track important actions.
- **Progressive Web App (PWA)**: Install Tranzero on your phone for a native, offline-first mobile experience.
- **Data Export**: Export customer data or a full system backup to both **PDF** and **CSV** formats.
- **AI-Powered Insights**: Uses Genkit to provide intelligent account status badges (Credit, Debit, Settled).
- **Customization**:
    - Personalize the look and feel with multiple **color themes**.
    - Seamless **dark and light mode** support.
    - Choose your preferred currency (USD, EUR, GBP, PKR).
- **Responsive Design**: A beautiful and functional interface on any screen size, from mobile phones to widescreen monitors.

## ðŸ› ï¸ Tech Stack

Tranzero is built with a modern, type-safe, and scalable technology stack:

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **UI**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [ShadCN UI](https://ui.shadcn.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **AI Functionality**: [Genkit](https://firebase.google.com/docs/genkit)
- **PWA**: [@ducanh2912/next-pwa](https://www.npmjs.com/package/@ducanh2912/next-pwa)
- **Icons**: [Lucide React](https://lucide.dev/)

## ðŸš€ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/your-username/tranzero.git
    cd tranzero
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up your Firebase project**
    - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    - Enable **Firestore** and **Authentication** (with the Email/Password provider).
    - Go to Project Settings -> Web Apps, and copy your Firebase configuration object.

4.  **Create an environment file**
    - In the root of your project, create a new file named `.env.local`.
    - Add your Firebase configuration keys to this file:
      ```env
      NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
      NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
      ```
5.  **Run the development server**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can now sign up and start using the app!

## ðŸ¤ Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

---

Built with â¤ï¸ in Firebase Studio.