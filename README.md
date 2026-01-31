# luminote.ai

Frontend for a luminote.ai - an AI Powered meeting intelligence platform. It provides a multi-workspace UI for managing meetings, transcripts, tasks, and integrations across Zoom/Teams/Meet and downstream tools like Slack and CRMs.

## What this app does
- **AI meeting assistant**: chat UI for questions over meetings, transcripts, and action items
- **Meetings hub**: upcoming + recorded meetings, quick filters, and meeting detail views
- **Calendar sync**: connect Google/Microsoft calendars and manage sync settings
- **Integrations**: connect meeting platforms and business tools (Slack, Salesforce, HubSpot, etc.)
- **Automations**: create rules to push summaries, tasks, and updates
- **Tasks**: track action items extracted from meetings
- **Insights & analytics**: meeting trends and usage insights
- **Notifications**: activity and sync status updates
- **Account/ops**: onboarding, workspace selection, profile, billing, admin, data management, and help

## Tech stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- React Router

## Setup
Prereqs: Node.js and npm.

```sh
npm install
npm run dev
```

Build and preview:

```sh
npm run build
npm run preview
```

## Data & APIs
- The UI is mostly wired to `src/lib/mockData.ts` for screens like meetings, tasks, and insights.
- Auth, chat, and API calls are configured to hit staging endpoints in `src/lib/api/*`.
- If you don’t have valid credentials for the staging backend, you can still navigate most screens using mock data.

## Project structure (high-level)
- `src/pages/*`: routed screens (meetings, chat, integrations, etc.)
- `src/components/*`: shared UI and feature components
- `src/lib/api/*`: API + auth utilities
- `src/lib/mockData.ts`: demo data used across screens

## Scripts
- `npm run dev` - local dev server
- `npm run build` - production build
- `npm run preview` - preview the production build
- `npm run lint` - lint the codebase
