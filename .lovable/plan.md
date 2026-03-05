

# CMRR Client Portal — Full Implementation Plan

## Overview
Build a dark-mode SaaS client reporting dashboard for cold email marketing agency CreateMRR. Clients sign up with an API key (Instantly.ai), log in, and see their outbound email campaign performance. Admins can manage all clients.

## 1. Backend Setup (Lovable Cloud / Supabase)

### Database Tables
- **profiles** — id (FK auth.users), full_name, workspace_id, created_at
- **workspaces** — id, name, created_at
- **user_roles** — id, user_id (FK auth.users), role (enum: admin/client)
- **api_connections** — id, workspace_id, api_key (encrypted), auto_sync_enabled, last_synced_at
- **campaigns** — id, workspace_id, instantly_campaign_id, name, status, emails_sent, opens, replies, positive_replies, bounce_rate, meetings_booked
- **campaign_metrics** — id, campaign_id, date, emails_sent, opens, replies, positive_replies, bounces, meetings_booked
- **leads** — id, workspace_id, campaign_id, email, name, status, created_at

### RLS
- All tables filtered by workspace_id matching the user's workspace
- Admin role can access all workspaces via `has_role()` security definer function

### Triggers
- On signup: auto-create workspace + profile + client role
- Store the API key provided during signup in api_connections

## 2. Authentication

### Signup Page
- Fields: Full Name, Email, Password, **API Key** (labeled simply as "API Key")
- On signup: create auth user → trigger creates workspace, profile, role, and stores the API key in api_connections
- Dark themed, CMRR branded

### Login Page
- Email + Password
- Dark themed, redirect to dashboard on success

### Password Reset
- Forgot password flow with `/reset-password` page

## 3. Frontend Pages & Layout

### Layout
- Dark sidebar with CMRR logo placeholder, nav links: Dashboard, Campaigns, Leads, Analytics, Settings
- Main content area with smooth page transitions

### Dashboard (`/`)
- 6 metric cards: Emails Sent, Open Rate, Reply Rate, Positive Replies, Bounce Rate, Meetings Booked
- 4 Recharts line/area charts: Emails Over Time, Replies Over Time, Positive Replies Trend, Meetings Trend

### Campaigns (`/campaigns`)
- Data table: Campaign Name, Emails Sent, Opens, Replies, Positive Replies, Bounce Rate, Meetings Booked, Status (badge)

### Leads (`/leads`)
- Table: Name, Email, Status, Campaign Source

### Analytics (`/analytics`)
- Date range filter, aggregate charts, campaign comparison

### Settings (`/settings`)
- Client: View/update API key, toggle auto-sync, view connected accounts
- Admin (visible if admin role): Create client accounts, assign API keys, view all clients

## 4. Instantly.ai Integration

### Edge Functions
- **sync-campaigns**: Fetches campaign list and metrics from Instantly.ai API using stored API key, upserts into campaigns and campaign_metrics tables
- **sync-leads**: Pulls lead data per campaign
- Called on-demand from settings or triggered periodically when auto-sync is enabled

### API Key Handling
- Stored securely in api_connections table
- Passed to edge functions at runtime
- Never exposed to client-side code beyond the settings input

## 5. Styling
- Dark navy/charcoal base (`#0f1117`, `#1a1d29`)
- Accent colors for metrics (green for positive, blue for sends, amber for replies)
- Large bold metric numbers, clean card layouts
- Tailwind dark theme customization in tailwind.config.ts

## 6. Build Order
1. Theme + layout (sidebar, dark mode)
2. Auth pages (signup with API key field, login, reset password)
3. Database schema + RLS + triggers
4. Dashboard page with metric cards and charts (mock data initially wired to DB)
5. Campaigns table page
6. Leads page
7. Analytics page
8. Settings page (client + admin views)
9. Edge functions for Instantly.ai sync
10. Wire everything together

