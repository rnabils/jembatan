# BPK Internal Office Management Dashboard

An internal office management dashboard for **Badan Pemeriksa Keuangan (BPK) – the Audit Board
of the Republic of Indonesia**, built with React + Vite (JavaScript), Tailwind CSS, shadcn/ui-style
components, React Router, Lucide icons, and Recharts.

---

## ✨ Features

- **Login page** with mock authentication (persisted in `localStorage`)
- **Role-based access control** — Admin, Employee, Viewer
- **Modern dashboard shell** — collapsible sidebar, top navigation bar, global search,
  notifications dropdown, and user profile menu
- **Clickable division cards** — HR, Finance, Legal, IT, Public Relations, Planning &
  Development, Archives & Records, General Affairs
- **Division workspaces** — each division has its own tabbed workspace with:
  - Announcements
  - Documents
  - Events
  - Gallery
  - Contacts
  - Files
- Canonical routes use `/dashboard` for the main dashboard and
  `/dashboard/division/:divisionId` for division workspaces. The previous
  `/division/:divisionId` URL redirects to the canonical route.
- **Employee content submission workflow** — Employees submit content, which enters a
  **Pending** state until an Administrator **Approves** or **Rejects** it
- **Admin Approvals center** — a dedicated page to review all pending submissions across
  every division, plus a log of recent decisions
- **Dashboard statistics & charts** (via Recharts) — bar chart of content per division,
  pie chart of approval status distribution, and a submission trend line chart
- Fully **responsive** layout (mobile, tablet, desktop) with a professional
  **white / navy (#003366) / teal (#00A99D)** color scheme

---

## 🧱 Tech Stack

| Layer            | Choice                                   |
|------------------|-------------------------------------------|
| Build tool       | Vite                                      |
| Framework        | React 18 (JavaScript, not TypeScript)     |
| Styling          | Tailwind CSS                              |
| UI components    | Custom shadcn/ui-style primitives         |
| Routing          | React Router v6                           |
| Icons            | Lucide React                              |
| Charts           | Recharts                                  |
| State/Data       | React Context API + `localStorage`        |

> **Note on shadcn/ui:** since this project has no network access to run the shadcn CLI,
> the shadcn-style primitives (`Button`, `Card`, `Input`, `Dialog`, `Tabs`, `Badge`,
> `Avatar`, `Select`, `Textarea`, `DropdownMenu`) are hand-built in
> `src/components/ui/` following the same API and visual conventions as shadcn/ui, so
> they can be swapped for the official generated versions later if desired.

---

## 📦 Installation & Running

```bash
npm install
npm run dev
```

The app will start at **http://localhost:5173**.

To build for production:

```bash
npm run build
npm run preview
```

No environment variables or backend server are required — all data is seeded in
`src/data/seed.js` and persisted to the browser's `localStorage`, so the app is fully
self-contained and runnable offline.

---

## 🔑 Demo Accounts

Use the **Quick Demo Access** buttons on the login screen, or sign in manually:

| Role          | Username    | Password       | Notes                                   |
|---------------|-------------|----------------|------------------------------------------|
| Administrator | `admin`     | `admin123`     | Full access, can approve/reject content   |
| Employee      | `employee`  | `employee123`  | HR division employee, can submit content  |
| Viewer        | `viewer`    | `viewer123`    | Finance division, read-only access        |
| Employee      | `dewi`      | `dewi123`      | IT division employee (extra demo account) |

### Role capabilities

- **Admin** — sees every division's content (including pending/rejected), can approve or
  reject submissions from the notification bell, the division workspace, or the dedicated
  **Approvals** page, and can delete any reviewed content item.
- **Employee** — can browse approved content for all divisions, submit new content
  (announcements, documents, events, gallery items, contacts, files) for review, and track
  the status of their own submissions from their **Profile** page.
- **Viewer** — read-only access to all approved content across divisions; cannot submit
  content or see the Approvals page.

---

## 🗂️ Project Structure

```
bpk-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                     # App entry point (Router + Context providers)
    ├── App.jsx                      # Route definitions
    ├── index.css                    # Tailwind directives + base styles
    ├── lib/
    │   └── utils.js                 # cn(), formatDate(), initialsFromName()
    ├── data/
    │   └── seed.js                  # Divisions, demo users, initial content items
    ├── context/
    │   ├── AuthContext.jsx          # Login/logout, current user, role helpers
    │   └── DataContext.jsx          # Divisions, content CRUD, computed stats
    ├── components/
    │   ├── ProtectedRoute.jsx       # Auth + role-based route guard
    │   ├── StatCard.jsx             # Dashboard KPI card
    │   ├── ContentCard.jsx          # Renders announcement/doc/event/gallery/contact/file
    │   ├── SubmitContentModal.jsx   # Employee/Admin content submission form
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx  # Sidebar + Topbar + <Outlet />
    │   │   ├── Sidebar.jsx          # Division nav, admin-only Approvals link
    │   │   └── Topbar.jsx           # Search, notifications, profile menu
    │   └── ui/                      # shadcn/ui-style primitives
    │       ├── avatar.jsx
    │       ├── badge.jsx
    │       ├── button.jsx
    │       ├── card.jsx
    │       ├── dialog.jsx
    │       ├── dropdown-menu.jsx
    │       ├── input.jsx
    │       ├── select.jsx
    │       ├── tabs.jsx
    │       └── textarea.jsx
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── DivisionWorkspace.jsx
        ├── Approvals.jsx
        ├── Profile.jsx
        └── NotFound.jsx
```

---

## 🎨 Design System

| Token          | Value      | Usage                                  |
|----------------|------------|------------------------------------------|
| `navy`         | `#003366`  | Primary brand color, sidebar, headings   |
| `teal`         | `#00A99D`  | Accent color, primary actions, highlights|
| White/Slate    | `#ffffff` / slate scale | Backgrounds, cards, borders |

Colors are registered as Tailwind theme extensions in `tailwind.config.js`
(`navy` and `teal`), so they can be used directly as utility classes such as
`bg-navy`, `text-teal`, `border-navy-100`, etc.

---

## 🔄 Content Submission Workflow

1. An **Employee** opens a division workspace and clicks **Submit Content**.
2. They choose a content type (Announcement, Document, Event, Gallery, Contact, File),
   fill in the details, and submit.
3. The item is created with `status: "pending"` and is immediately visible to:
   - The submitting employee (in that division tab and on their Profile page)
   - Every Administrator (in the Approvals page and the notification bell)
4. An **Admin** reviews the submission and clicks **Approve** or **Reject**.
5. Once approved, the item becomes visible to all roles (including Viewers) in the
   relevant division tab. Rejected items remain visible only to the author and admins,
   with a "Rejected" badge.

All content is stored in the `DataContext` and persisted to `localStorage` under the key
`bpk-dashboard-content`, so state survives page refreshes.

---

## 🧩 Extending the Project

- **Connect a real backend:** replace the `localStorage` logic inside `DataContext.jsx`
  and `AuthContext.jsx` with API calls (e.g. `fetch`/`axios`) to your backend of choice.
- **Supabase preparation:** the initial relational schema is available at
  `supabase/schema.sql`. It maps the current local data into `profiles`, `divisions`,
  `document_categories`, `documents`, and `content`. Role metadata is centralized in
  `src/data/accessControl.js`, so the UI and future database values use the same role
  contract.
- **Database migrations:** `supabase/jalankan-semua.sql` bundles every schema and
  policy change made after `schema.sql`, `seed.sql`, and `policies.sql` into one
  idempotent script. Run it once in the Supabase SQL Editor; it ends with a check
  table that should read `OK` on every row. Account creation (`users.sql`,
  `set-role.sql`) stays separate because it needs a password typed at run time.
- **ABK analysis:** `src/components/KondisiPegawai.jsx` is mounted on the main
  dashboard and reads an uploaded `.xlsx`/`.xls` file through the `ABK` sheet.
  The parser is isolated in `src/lib/parseExcelABK.js`; it can also be used
  directly with a `File` or `ArrayBuffer` via `parseExcelABK(source)`.
- **Add more divisions:** edit the `DIVISIONS` array in `src/data/seed.js`.
- **Add more content types:** extend `TYPE_META` in `ContentCard.jsx` and the `TYPE_OPTIONS`
  in `SubmitContentModal.jsx`.
- **Swap in official shadcn/ui components:** run `npx shadcn@latest init` and
  `npx shadcn@latest add button card dialog ...` in an environment with network access,
  then update imports in `src/components/ui/`.

---

## 📄 License

Internal prototype for demonstration purposes — Badan Pemeriksa Keuangan Republik Indonesia.
