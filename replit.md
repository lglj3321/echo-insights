# Echo Insights

## Overview

Echo Insights is a cloud-based sustainability analytics platform for food companies. It enables them to evaluate and prioritize sustainability projects by collecting real-time consumer feedback via QR code surveys. The platform features a desktop dashboard for analytics and a mobile-optimized survey interface, supporting data-driven decisions on sustainability initiatives and project impact across environmental metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Frameworks & Libraries**: React with TypeScript (Vite build tool), wouter for routing, shadcn/ui (New York variant) built on Radix UI for components, TanStack Query for server state management.
**Styling**: Tailwind CSS with custom CSS variables for theming, supporting light/dark mode.
**Typography**: Inter for UI/body text, JetBrains Mono for numerical data.
**Design System**: Carbon Design-inspired with Linear/Notion influences for data presentation, comprehensive spacing system, and responsive breakpoints.

### Backend Architecture

**Runtime**: Node.js with Express.js for the REST API.
**Language**: Full TypeScript implementation with strict mode.
**Build**: esbuild for production, Vite for client bundle.
**Development**: Custom Vite middleware for HMR with Express API.
**API Design**: RESTful API (`/api` prefix) with comprehensive endpoints for projects, categories, metrics, team members, goals, surveys, and QR code tracking, including Zod validation.

### Data Storage

**Database**: PostgreSQL via Neon serverless driver with WebSocket support.
**ORM**: Drizzle ORM for type-safe queries, schema-first approach with migrations.
**Database Schema**: Includes tables for users, projects (with sustainability metrics like CO2 saved, water saved, ROI, costs), categories, category metrics, project metrics, survey data, QR scan tracking, goals, and team members.
**Storage Interface**: Abstracted `storage.ts` providing a repository pattern for CRUD operations.

### Key Architectural Patterns

**Component Composition**: Extensive use of compound components.
**Design System Consistency**: UI components follow shadcn/ui patterns with custom theming.
**Progressive Enhancement**: Desktop dashboard experience with sidebar navigation, mobile-optimized survey pages with minimal navigation.
**Type Safety**: Shared schema types (`@shared/schema`) between frontend and backend.
**Separation of Concerns**: Clear division into `client/` (React app), `server/` (Express API), and `shared/` (schemas/types).
**Dual Navigation Paradigm**: Company dashboards use persistent sidebar navigation; consumer surveys have minimal header-only navigation for mobile focus.
**Impact Scoring System**: Complex metric normalization and weighting for project comparison.
**QR Code Survey Distribution**: Unique QR codes link to mobile-optimized surveys for consumer feedback.
**AI-Powered Project Classification**: Integration with OpenAI GPT-5 for intelligent categorization of projects based on description, custom metrics, and file content (PDF, Excel, Word, CSV parsing). This includes smart prompting, multi-format file support, and robust fallbacks.
**Unified Metrics Selection**: Project creation dialog combines AI-recommended, user-entered, and file-extracted metrics.
**Manual Category Override**: Users can manually select project categories, updating metric recommendations while preserving custom metrics.
**Organized Comparison View**: Project comparison page separates "Overlapping Metrics" and "Unique Metrics."

## External Dependencies

**UI Components**:
- `@radix-ui/*`: Accessible primitives.
- `cmdk`: Command palette.
- `qrcode.react`: QR code generation.
- `recharts`: Data visualization.

**Forms & Validation**:
- `react-hook-form`: Form state management.
- `@hookform/resolvers`: Integration with validation libraries.
- `zod`: Schema validation and TypeScript inference.
- `drizzle-zod`: Zod schema generation from Drizzle schemas.

**Database & Backend**:
- `@neondatabase/serverless`: Neon PostgreSQL driver.
- `drizzle-orm`: Type-safe ORM.
- `drizzle-kit`: Migration and schema management.
- `ws`: WebSocket library for Neon connection.

**Date Handling**:
- `date-fns`: Date manipulation and formatting.

**Utility Libraries**:
- `class-variance-authority`: Type-safe variant styling.
- `clsx`, `tailwind-merge`: Conditional `className` composition.
- `nanoid`: Unique ID generation.

**AI Integration**:
- OpenAI GPT-5 (via Replit AI Integrations service).

**File Parsing**:
- `pdf-parse`: PDF text extraction.
- `xlsx`: Excel file parsing.
- `mammoth`: Word document text extraction.
- `papaparse`: CSV parsing.