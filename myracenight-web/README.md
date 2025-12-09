# MyRaceNight Web App 🏇

The organiser dashboard for MyRaceNight - a fundraising race night platform for GAA, rugby, and soccer clubs.

## Features

- 🎫 **Event Management** - Create and manage race night events
- 🏆 **Horse Approval** - Review and approve horse submissions
- 🏁 **Race Control** - Open betting, start races, select winners
- 👥 **Club Management** - Manage your club profiles
- 📊 **Dashboard** - View stats and recent activity
- 🔐 **Authentication** - Secure login with JWT tokens

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide** - Icons

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the values:
```env
NEXT_PUBLIC_API_URL=https://myracenight-backend-production.up.railway.app
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/myracenight-web)

### Option 2: Manual Deploy

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://myracenight-backend-production.up.railway.app`
6. Click "Deploy"

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Protected dashboard pages
│   │   ├── events/
│   │   ├── clubs/
│   │   ├── horses/
│   │   ├── races/
│   │   └── settings/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── layout/            # Sidebar, Header
│   └── ui/                # Button, Card, Input, etc.
├── hooks/                 # Custom React hooks
├── lib/
│   ├── api.ts            # API client
│   └── auth.ts           # Auth store (Zustand)
└── types/                 # TypeScript types
```

## API Integration

The app connects to your Railway backend at the URL specified in `NEXT_PUBLIC_API_URL`.

All API calls go through `src/lib/api.ts` which handles:
- JWT token management
- Request/response formatting
- Error handling

## Styling

Uses a custom racing theme with:
- **Racing green** - Primary brand color
- **Gold** - Accent & CTAs
- **Night** - Dark backgrounds
- **Playfair Display** - Display font
- **Source Sans 3** - Body font

## Authentication Flow

1. User registers/logs in → receives JWT tokens
2. Access token stored in localStorage + Zustand store
3. API client attaches token to all requests
4. Refresh token used to get new access tokens
5. Auth guard protects dashboard routes

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | Login page |
| `/auth/register` | Registration page |
| `/dashboard` | Main dashboard |
| `/dashboard/events` | List all events |
| `/dashboard/events/new` | Create new event |
| `/dashboard/clubs` | Manage clubs |
| `/dashboard/horses` | Approve horses |
| `/dashboard/races` | Race control panel |
| `/dashboard/settings` | Account settings |

## License

Private - MyRaceNight © 2025
