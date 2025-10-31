# Echo Insights Design Guidelines

## Design Approach

**Selected Framework:** Design System Approach (Carbon Design-inspired) with Linear/Notion influences for clean interfaces
**Rationale:** Data-heavy enterprise application requiring efficient information architecture, clear data visualization, and dual-experience optimization (desktop analytics + mobile surveys)

## Typography System

**Font Families:**
- Primary: Inter (Google Fonts) - UI elements, body text, data displays
- Monospace: JetBrains Mono (Google Fonts) - numerical data, metrics, codes

**Type Scale:**
- Hero/Page Headers: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Subsection Headers: text-lg font-semibold (18px)
- Body Text: text-base font-normal (16px)
- Small Text/Labels: text-sm font-medium (14px)
- Metrics/Numbers: text-3xl font-bold (30px, monospace)
- Micro Labels: text-xs font-medium (12px)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16 (p-2, m-4, gap-6, space-y-8, etc.)

**Grid Structure:**
- Desktop Dashboards: 12-column grid with 6px gaps
- Mobile Surveys: Single column, full-width components
- Content max-width: max-w-7xl for dashboard areas
- Form sections: max-w-2xl for optimal readability

**Responsive Breakpoints:**
- Mobile: base (< 768px) - Stack all elements, large touch targets
- Tablet: md (768px+) - 2-column layouts where appropriate
- Desktop: lg (1024px+) - Full multi-column dashboards, side navigation

## Component Library

### Navigation & Structure

**Company Dashboard Navigation:**
- Fixed left sidebar (w-64) with vertical navigation menu
- Collapsed state on mobile (hamburger menu)
- Navigation items: icon + label, generous padding (py-3 px-4)
- Top bar with company logo, user profile, notifications (h-16)

**Consumer Survey Pages:**
- No persistent navigation
- Simple header with company logo (h-12)
- Back button only when needed

### Data Display Components

**Analytics Dashboards:**
- Card-based layout with shadow-sm borders
- Dashboard cards: min-h-64, p-6
- 2x2 grid on desktop (grid-cols-2), stack on mobile
- Chart containers with clear titles (text-lg font-semibold mb-4)

**Project Cards:**
- Structured information hierarchy
- Title: text-xl font-semibold
- Metadata row with icons: Heroicons via CDN
- Key metrics displayed prominently (text-2xl font-bold monospace)
- Action buttons aligned to card bottom

**Data Tables:**
- Striped rows for readability
- Sticky headers on scroll
- Column headers: text-sm font-semibold uppercase tracking-wide
- Cell padding: py-4 px-6
- Row hover states for interactivity

**Impact vs Cost Matrix:**
- 2x2 quadrant visualization
- Scatter plot with project dots
- Axes labels with clear metrics
- Interactive tooltips on hover showing project details

### Forms & Input

**Project Creation Form:**
- Two-column layout on desktop (grid-cols-2 gap-6)
- Form sections with clear headers (text-lg font-semibold mb-4)
- Input fields with labels above (text-sm font-medium mb-2)
- Input height: h-12 with px-4 padding
- Textarea: min-h-32
- Dropdowns for project type classification with search capability

**File Upload (CSV Import):**
- Drag-and-drop zone with dashed border
- Large dropzone area (min-h-48)
- Upload icon (Heroicons: cloud-arrow-up)
- File preview list with remove buttons

**Consumer Survey Interface:**
- Question text: text-xl font-semibold mb-6
- Large response buttons: min-h-16 with text-lg
- Slider controls: Track height h-2, thumb size w-6 h-6
- Touch-friendly spacing between elements (space-y-6)
- Progress indicator at top showing question X of Y

### Interactive Elements

**Buttons:**
- Primary actions: px-6 py-3 text-base font-semibold rounded-lg
- Secondary actions: px-4 py-2 text-sm font-medium rounded-md
- Icon buttons: w-10 h-10 rounded-full
- Survey buttons: w-full min-h-14 text-lg font-semibold rounded-xl

**QR Code Display:**
- Centered in modal or dedicated card
- QR code size: 256x256px
- Download button below (text-sm)
- Share/copy link functionality

**Feedback Indicators:**
- Toast notifications: Fixed top-right, w-96, p-4, slide-in animation
- Loading states: Skeleton screens matching content structure
- Empty states: Centered with icon (w-24 h-24), message, and CTA button

### Charts & Visualizations

**Dashboard Charts (using Chart.js):**
- Bar charts for project comparison
- Line charts for feedback trends over time
- Donut charts for project type distribution
- Consistent chart heights: h-64 to h-80
- Legend positioned below charts

**Metric Cards:**
- Large number display: text-4xl font-bold monospace
- Label below: text-sm uppercase tracking-wide
- Optional trend indicator with arrow icon
- Grid layout: grid-cols-2 md:grid-cols-4 gap-4

## Page-Specific Layouts

### Login Page
- Centered card (max-w-md)
- Logo at top (h-12 mb-8)
- Form with email/password fields
- Full-width submit button
- Simple background pattern or gradient

### Company Dashboard Home
- Sidebar + main content area (ml-64 on desktop)
- Top metrics row: 4 metric cards
- Middle section: Impact vs Cost matrix (60% width) + Recent Projects list (40% width)
- Bottom section: Feedback trends chart

### Projects List
- Header with search bar, filters, and "Create Project" button
- Filter chips for project types
- Card grid or table view toggle
- Each project card: 4-6 items per row on large screens

### Project Detail
- Two-column layout
- Left: Project information, metrics, classification
- Right: QR code, consumer feedback aggregation, response charts
- Action buttons row at top

### Analytics Page
- Multi-dashboard layout
- 6-8 different visualizations in card grid
- Filters sidebar (collapsible on mobile)
- Export data button in header

### Consumer Survey
- Single question per screen
- Progress bar at top (h-1)
- Large question text centered
- Response options with generous spacing (space-y-4)
- Next button fixed at bottom (w-full)

## Spacing & Rhythm

**Section Spacing:**
- Page padding: p-6 md:p-8 lg:p-12
- Card spacing: space-y-6
- Component internal padding: p-4 to p-6
- Section separators: my-8 to my-12

**Responsive Adjustments:**
- Mobile: Reduce padding to p-4, increase touch target sizes
- Tablet: Balance between mobile and desktop
- Desktop: Full spacing system, multi-column layouts

## Icons
Use Heroicons (outline and solid variants) via CDN for all icons throughout the application. Icon sizes: w-5 h-5 for inline, w-6 h-6 for buttons, w-8 h-8 for emphasis.

## Images
No hero images required. This is a utility-focused dashboard application. Use icons, charts, and data visualizations to communicate information.