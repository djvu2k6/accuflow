# AccuFlow: Ecclesiastical Financial Management System

**AccuFlow** is a hierarchical financial management and ledger system designed specifically for archdioceses, foranes, parishes, and substations. It provides a structured, role-based platform to securely record, track, and report on income and expenses across different administrative levels of the church.

## Overview
The system enables administrators and financial officers to easily manage ecclesiastical units, register users, and record transactions categorized into specific church-related ledgers (e.g., Sunday Collection, Pastoral Ministry, Maintenance, etc.). Each organizational unit can view and manage their own financial records while higher-tier units (like the Forane or Archdiocese) have aggregated visibility over the entities under their jurisdiction.

## Key Features
- **Hierarchical Financial Tracking**: Manage reports across multiple levels—Archdiocese, Forane, Parish, and Substation/Branch.
- **Role-Based Dashboards**: Secure, logic-driven dashboards for Master Admins, Archdioceses, Foranes, Parishes, and Substations.
- **Granular Ledger Recording**: Record income and expense entries with detailed categorization specific to ecclesiastical contexts.
- **Real-Time Financial Reporting**: Compute Net Balance with dynamic filtering based on jurisdiction, data level, date range, and ledger category.
- **Unit Management**: Admins can officially register new Foranes, Parishes, and Substations, automatically generating their secure credentials.

## Technology Stack
- **Frontend Framework**: [Next.js](https://nextjs.org/) (Recently migrated from a React + Vite template)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a professional, responsive, and modern user interface.
- **Backend / Database**: [Supabase](https://supabase.com/) configured for real-time data syncing, authentication, and structured database queries.
- **Icons**: Inline SVGs for quick loading and aesthetic fidelity.

## Getting Started
### Prerequisites
- Node.js installed
- A configured Supabase project for the backend (environment variables need to be set up appropriately in `.env`).

### Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local Next.js development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to view the application.

## Roles & Access
1. **Admin**: Master capabilities to view all jurisdictional data and register all lower-tier entities.
2. **Archdiocese (Arch)**: Oversees all Foranes.
3. **Forane**: Oversees assigned Parishes.
4. **Parish**: Records daily financial transactions, manages its own ledger, and oversees its Substations.
5. **Substation**: Records financial transactions related specifically to their branch.

---
