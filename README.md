# CS2Club Admin

CS2Club Admin is the internal back-office application used to operate and monitor the CS2Club platform. It gives the admin team a single place to authenticate, review platform activity, and manage the most important operational areas of the business.

The dashboard includes workflows for:

- viewing platform metrics and analytics
- managing administrators
- reviewing users and producers
- monitoring events and tickets
- tracking payments and payout requests
- managing payout accounts
- reviewing finance settings
- checking supported languages
- accessing internal platform documentation

## Tech Stack

- React 19
- TypeScript
- Vite
- Redux Toolkit and RTK Query
- React Router
- Tailwind CSS
- Formik and Yup
- Recharts

## Getting Started

### Requirements

Before running the project, make sure you have:

- Node.js LTS installed
- pnpm installed
- access to the CS2Club admin API environment

### Environment Variables

Create or update the `.env` file in the project root with the values required by your environment.

Required variables:

```bash
VITE_API_URL=
VITE_ACCESS_TOKEN_KEY=
VITE_REFRESH_TOKEN_KEY=
```

Optional variable already supported by the project:

```bash
VITE_COLOR_THEME=
```

`VITE_API_URL` must point to the backend used by the admin panel.

## Installation

Install dependencies with:

```bash
pnpm install
```

## Running the Project

Start the local development server:

```bash
pnpm dev
```

After that, open the local URL shown by Vite in your terminal, usually:

```bash
http://localhost:5173
```

## Available Scripts

```bash
pnpm dev
```

Runs the app in development mode with hot reload.

```bash
pnpm build
```

Builds the application for production.

```bash
pnpm preview
```

Serves the production build locally for validation.

```bash
pnpm lint
```

Runs the ESLint checks.

```bash
pnpm codegen
```

Regenerates API-related types and aliases used by the application.

## What This Project Is For

This project is intended for internal administrative use only. It is not the customer-facing product. The application helps the operations and platform teams keep the CS2Club ecosystem under control by centralizing:

- authentication for admin users
- platform health and performance metrics
- user and producer oversight
- financial and payout operations
- administrative settings and internal support tools

## Project Structure

The source code is mainly organized as follows:

- `src/pages`: application screens and dashboard modules
- `src/components`: shared UI components
- `src/layouts`: layout structure for protected admin pages
- `src/redux`: store, API integrations, and slices
- `src/utils`: formatting, helpers, and dashboard utilities
- `src/theme`: theme management
- `scripts`: code generation helpers

## Notes

- The application depends on the admin API being available and correctly configured through `VITE_API_URL`.
- Authentication and session recovery are handled through admin-specific endpoints.
- Some routes and data depend on the permissions of the authenticated administrator.
