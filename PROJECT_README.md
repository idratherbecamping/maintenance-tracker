# Maintenance Tracker

A web-based vehicle maintenance tracking system with mobile-friendly interface for logging vehicle maintenance, tracking costs, and providing insights through dashboards.

## Features

- Mobile-friendly maintenance logging form
- Vehicle maintenance history and reporting
- Smart dashboard with cost analysis
- Multi-tenant support with company groupings
- Role-based access (Owner vs Employee)
- Authentication system
- Notification/reminder system

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI**: Tailwind CSS + Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the schema SQL file in `supabase/schema.sql`
   - Copy your project URL and anon key

4. Create `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```
   Then update the values with your Supabase credentials.

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── dashboard/   # Dashboard components
│   ├── maintenance/ # Maintenance tracking components
│   ├── ui/          # Reusable UI components
│   └── vehicle/     # Vehicle management components
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── lib/             # Library configurations
│   └── supabase/    # Supabase client setup
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```