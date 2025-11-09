# Echo Insights

## Overview

Echo Insights is a cloud-based sustainability analytics platform designed for food companies to evaluate and prioritize sustainability projects through real-time consumer feedback. The application features a dual-experience design: a comprehensive desktop dashboard for company analytics and a mobile-optimized survey interface for consumer engagement. The platform helps companies make data-driven decisions about sustainability initiatives by collecting consumer sentiment via QR code surveys and analyzing project impact across multiple environmental metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: wouter for client-side routing - chosen for its lightweight footprint compared to React Router while providing similar functionality.

**UI Component System**: shadcn/ui (New York variant) built on Radix UI primitives - provides accessible, customizable components with a consistent design system. The application follows a Carbon Design-inspired approach with Linear/Notion influences for clean data presentation.

**State Management**: TanStack Query (React Query) for server state management - handles data fetching, caching, and synchronization without the complexity of Redux or similar solutions.

**Styling**: Tailwind CSS with custom CSS variables for theming - enables rapid UI development with design system constraints. Custom color tokens are defined for light/dark mode support with hover and active states.

**Typography**: Inter for UI/body text and JetBrains Mono for numerical data - optimized for readability in data-heavy enterprise contexts.

**Design Tokens**: Comprehensive spacing system (2, 4, 6, 8, 12, 16px units) and responsive breakpoints (mobile <768px, tablet 768px+, desktop 1024px+).

### Backend Architecture

**Runtime**: Node.js with Express.js for the REST API server.

**TypeScript**: Full TypeScript implementation across both frontend and backend with strict mode enabled for type safety.

**Build Process**: esbuild for production builds - provides fast bundling for the server code. Vite handles the client bundle.

**Development Server**: Custom Vite middleware integration allows hot module replacement during development while serving API routes through Express.

**Session Management**: Designed to use connect-pg-simple for PostgreSQL-backed sessions (infrastructure ready, implementation pending).

**API Design**: RESTful API structure with routes prefixed with `/api` - separation of concerns between application routes and static asset serving. Comprehensive REST endpoints implemented for projects, categories, metrics, team members, goals, surveys, and QR code tracking with proper Zod validation.

### Data Storage

**Database**: PostgreSQL via Neon serverless driver with WebSocket support for real-time capabilities.

**ORM**: Drizzle ORM - chosen for type-safe database queries with minimal overhead and excellent TypeScript integration. Schema-first approach with migrations.

**Database Schema**:
- Users table with company information and notification preferences
- Projects table with sustainability metrics (CO2 saved, water saved, ROI, costs)
- Categories table for project types (Packaging, Energy, Sourcing, Waste, Water, Logistics)
- Category Metrics table for metric definitions with normalization metadata and weights
- Project Metrics table for storing custom metric values per project (normalized catalog + value design)
- Survey questions and responses for consumer feedback collection
- QR code scan tracking for survey engagement analytics
- Goals and team members for collaborative project management
- Comments and activity logs for project collaboration

**Storage Interface**: Abstracted storage layer (`storage.ts`) provides a repository pattern for database operations with full CRUD support for all entities - enables easy testing and potential database switching. Currently uses in-memory storage (MemStorage) for development with proper optional field preservation.

### Key Architectural Patterns

**Component Composition**: Extensive use of compound components (dialogs, forms, cards) that encapsulate related functionality and state.

**Design System Consistency**: All UI components follow shadcn/ui patterns with custom theming via CSS variables - ensures visual consistency and maintainability.

**Progressive Enhancement**: Survey pages designed to work on mobile devices without navigation chrome, while dashboard pages provide full desktop experience with sidebar navigation.

**Type Safety**: Shared schema types between frontend and backend via `@shared/schema` ensure API contract compliance.

**Separation of Concerns**: 
- `client/` - React application and UI components
- `server/` - Express API and business logic
- `shared/` - Database schema and shared types
- Clear boundaries between presentation, business logic, and data layers

### External Dependencies

**UI Components**: 
- @radix-ui/* - Accessible primitive components (dialogs, dropdowns, popovers, etc.)
- cmdk - Command palette component
- qrcode.react - QR code generation for survey distribution
- recharts - Data visualization library (though custom SVG charts are also used)

**Forms & Validation**:
- react-hook-form - Form state management
- @hookform/resolvers - Integration between react-hook-form and validation libraries
- zod - Schema validation and TypeScript type inference
- drizzle-zod - Automatic Zod schema generation from Drizzle schemas

**Database & Backend**:
- @neondatabase/serverless - Neon PostgreSQL driver with WebSocket support
- drizzle-orm - Type-safe ORM
- drizzle-kit - Migration and schema management tools
- ws - WebSocket library for Neon connection

**Development Tools**:
- tsx - TypeScript execution for development server
- @replit/vite-plugin-* - Replit-specific development tooling for error overlays and cartographer integration

**Date Handling**: date-fns for date manipulation and formatting - tree-shakeable alternative to moment.js.

**Utility Libraries**:
- class-variance-authority - Type-safe variant styling for components
- clsx & tailwind-merge - Conditional className composition
- nanoid - Unique ID generation

### Notable Design Decisions

**No Traditional Authentication Yet**: User authentication infrastructure is prepared (users table, password field) but not yet implemented - allows focus on core functionality first.

**Mock Data Strategy**: Pages currently use mock data with `// TODO: Remove mock data` comments - provides working UI while backend API implementation is completed incrementally.

**QR Code Survey Distribution**: Projects generate unique QR codes linking to mobile-optimized surveys - enables in-store or on-product consumer feedback collection.

**Impact Scoring System**: Complex metric normalization and weighting system for comparing sustainability projects across different categories and measurement units.

**Dual Navigation Paradigm**: Company dashboards use persistent sidebar navigation; consumer surveys have minimal header-only navigation for mobile focus.

**Progressive Metric Discovery**: Dialogs guide users through selecting relevant metrics for their project category with AI-assisted suggestions.

**Unified Metrics Selection**: Project creation now shows AI-recommended, user-entered, and file-extracted metrics together in a single dialog for streamlined metric selection without switching between separate screens.

**Manual Category Override**: Users can manually select a different project category if they disagree with the AI-detected category, which updates the recommended metrics accordingly while preserving custom metric selections.

**Organized Comparison View**: The project comparison page separates metrics into "Overlapping Metrics" (shared across all selected projects) and "Unique Metrics" (project-specific) for clearer analysis.

## Recent Changes

### November 2025
- **Backend Implementation Complete**: Built comprehensive backend with normalized database schema, full CRUD API routes, and storage layer
  - **Database Schema**: Added categories, category_metrics, and project_metrics tables using normalized catalog + value design for flexible metrics system
  - **Storage Layer**: Implemented complete IStorage interface with CRUD operations for all entities (projects, categories, metrics, goals, team members, surveys, QR scans). Fixed critical bug to preserve optional fields (actualCost, status, assignedTo, waterSaved) when creating projects
  - **API Routes**: Built comprehensive REST endpoints for all entities with proper Zod validation and error handling:
    - Projects: GET/POST/PATCH/DELETE /api/projects
    - Project Metrics: GET/POST/PATCH/DELETE /api/projects/:projectId/metrics
    - Categories: GET/POST /api/categories, GET /api/categories/:id
    - Category Metrics: GET /api/categories/:categoryId/metrics, POST /api/category-metrics
    - Goals: GET/POST/PATCH/DELETE /api/goals
    - Team Members: GET/POST/PATCH/DELETE /api/team-members
    - QR Scans: POST /api/projects/:projectId/qr-scan, GET /api/projects/:projectId/qr-scans
    - Survey Responses: POST /api/survey-responses, GET /api/projects/:projectId/survey-responses
  - **Database Migration**: Successfully ran migrations to create all tables in PostgreSQL
  - **Testing**: Verified API endpoints work correctly with proper field preservation and round-tripping
- **Dashboard Streamlining**: Removed redundant "New Project" button from Dashboard page (project creation only available from Projects page)
- **Unified Metrics Dialog**: Combined AI-recommended, user-entered, and file-extracted metrics into single selection interface during project creation
- **Comparison Page Organization**: Reorganized metrics comparison to show overlapping metrics in unified table first, followed by project-specific unique metrics in separate cards
- **Component Updates**: Enhanced RecommendedMetricsDialog to handle multiple metric sources with combined selection state
- **Dashboard Layout Optimization**: Improved visibility and user experience with semantic sections ("Key Metrics", "Analytics Overview", "Recent Projects"), balanced 3-column chart layout, better spacing (space-y-8), and enhanced responsive grid breakpoints for mobile/tablet/desktop views
- **Chart Visibility Fix**: Fixed Impact vs. Cost Matrix axis labels by expanding SVG viewBox and repositioning "Impact →" label for full visibility
- **Analytics Chart Alignment**: Standardized all 3 Analytics Overview charts (Impact vs. Cost Matrix, Projects by Type, Feedback Trend) to use identical square aspect ratios, consistent CardHeader format with descriptions, and legends positioned below charts for uniform appearance and improved readability
- **Manual Category Selection**: Added category selector dropdown to 'Select Project Metrics' dialog, allowing users to override AI-detected category and view different metric recommendations. The AI-detected category remains marked in the dropdown for reference, and custom metrics are preserved when changing categories.
- **Project Details Bug Fix**: Fixed issue where clicking "View Details" on any project always displayed "100% Recycled Packaging Initiative". Now correctly displays the selected project's details by looking up project data based on the URL ID parameter.
- **Teams Page Edit Dropdown**: Implemented functional Edit button in Team Members Actions column with dropdown menu for role management (Admin, Manager, Viewer) and member removal. Role changes and deletions update the UI reactively with state management and show toast confirmations.
- **Settings Page Cleanup**: Removed "Survey Settings" section with Base Survey URL field from Company tab in Settings page, as the feature was not needed.
- **AI-Powered Project Classification with OpenAI**: Fully integrated OpenAI GPT-5 for intelligent project categorization analyzing description, custom metrics, and file content
  - **OpenAI Integration**: Set up Replit AI Integrations service providing OpenAI-compatible API access without requiring personal API keys (charges billed to Replit credits)
  - **Backend Classification Service**: Created `server/openai-service.ts` with GPT-5 integration including retry logic, rate limiting, and error handling using p-retry
  - **Smart Prompting**: Designed comprehensive prompt that analyzes project description, custom metrics, and file content to classify into 6 categories (Packaging, Energy, Sourcing, Waste, Water, Other) with confidence scores and reasoning
  - **PDF Support**: Implemented full PDF text extraction using pdf-parse library
    - Frontend reads PDFs as base64 and sends to `/api/parse-pdf` endpoint
    - Backend extracts full text from PDF files
    - Extracted text included in OpenAI classification analysis
  - **CSV Parsing**: Real PapaParse implementation extracts column headers and values as metrics
  - **Loading State**: "Analyzing Project" dialog with spinner during AI classification
  - **API-Detected Categories**: Metrics dialog displays AI-detected category with confidence score and reasoning
  - **"Other" Category Option**: Added for projects that don't fit standard categories
  - **Go Back Button**: Allows users to return to project form without losing work
  - **Robust Fallback**: Keyword-based classification fallback if OpenAI fails, with graceful error handling and user notifications