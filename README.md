# Echo Insights

A personal product prototype for helping food companies evaluate sustainability initiatives through operational impact metrics and anonymous consumer feedback.

Originally developed in a course context and deployed to Vercel for live demonstration.

> **Portfolio status:** This repository is maintained as a portfolio prototype. It is not presented as a production service and contains no real customer or personal data.

## What it demonstrates

- Sustainability project tracking with cost, ROI, CO₂ reduction, and water-saving metrics
- Anonymous, mobile-friendly consumer surveys distributed through QR codes
- Dashboard and comparison views that combine operational impact with consumer feedback
- A full-stack TypeScript architecture with a React client and Express API
- Shared validation and data schema design with Drizzle ORM and Zod

## Core user flow

1. Review sustainability projects in the dashboard.
2. Create or update a project and its impact metrics.
3. Share a project survey via QR code.
4. Collect anonymous consumer responses.
5. Review response counts, average feedback, and project impact.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Node.js, Express, TypeScript
- **Data modelling:** Drizzle ORM, Zod, PostgreSQL schema
- **Visualisation:** Recharts
- **Survey distribution:** QR code generation

## Architecture

```text
React + Vite client
        │
        ▼
Express REST API
        │
        ├── Demo runtime storage (current default)
        └── Drizzle/PostgreSQL schema (available for persistent deployments)
```

The current default runtime uses in-memory demo storage so the application can be explored without external infrastructure. The repository also contains the Drizzle PostgreSQL schema and migration configuration used during development.

## Local setup

### Prerequisites

- Node.js 20+
- npm

### Run locally

```bash
npm ci
npm run dev
```

The application runs on port `5000` by default.

### Quality checks

```bash
npm run check
npm run build
```

### Optional database configuration

The repository includes PostgreSQL/Drizzle configuration for persistent deployments. Set `DATABASE_URL` before running database migration commands:

```bash
cp .env.example .env
# Add DATABASE_URL to .env
npm run db:push
```

> The current application runtime is intentionally self-contained for portfolio exploration. A persistent database adapter is the next step for a production-oriented deployment.

## Deployment history

Echo Insights was deployed to Vercel for live demonstration during development. The public deployment has since been retired, so this repository does not include an active demo URL.

See [deployment notes](docs/deployment.md) for the portfolio context and deployment considerations.

## Privacy and demo data

This prototype is designed around anonymous survey feedback. No real customer, consumer, or personal data is included in this repository. Sustainability metrics and project records are illustrative demo data and should not be treated as audited environmental reporting.

## Roadmap

- Replace demo runtime storage with a persistent PostgreSQL data adapter
- Add authenticated multi-user access and ownership controls
- Add automated API and end-to-end tests
- Reintroduce a verified deployment configuration
- Validate optional AI-assisted classification with transparent fallback behaviour

## License

This project is licensed under the [MIT License](LICENSE).
