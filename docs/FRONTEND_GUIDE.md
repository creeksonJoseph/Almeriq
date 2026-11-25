# Frontend Route and State Guide

## Route source of truth

All routes are declared in frontend/src/App.jsx. The list below is grouped for navigation; check App.jsx for the exact guard/component wrapper and redirects.

## Public and authentication

| Path | Page |
|---|---|
| / | Landing page |
| /login | Login |
| /signup, /register | Signup |
| /forgot-password | Password reset request |

## Shared authenticated pages

| Path | Page |
|---|---|
| /dashboard | Role-aware dashboard |
| /settings | Account settings |
| /alerts | Notifications |
| /messages | Conversations/messages |

## Founder

| Path | Page / behavior |
|---|---|
| /founder | Redirect to dashboard |
| /founder/intake | Founder intake |
| /founder/analysis | AI analysis workspace |
| /founder/roadmap | Redirect to analysis with execution roadmap selected |
| /founder/ventures | Venture list |
| /founder/validation | Validation workspace |
| /founder/ai-tools | Redirect to dashboard |
| /founder/product | Product workspace |
| /founder/talent/:userId | Talent profile |
| /founder/team, /founder/team/talent, /founder/team/members, /founder/team/invitations | Team/workforce screens |
| /founder/experts | Expert discovery and advisory requests |
| /founder/orders | Founder order view |
| /founder/pitches | Redirect to fundraising pitches |
| /founder/fundraising/pitches | Pitch management |
| /founder/fundraising/investors | Fundraising investor view |
| /founder/fundraising/updates | Investor updates |
| /founder/legal | Redirect to legal guide |
| /founder/legal/guide, /founder/legal/templates, /founder/legal/filings | Legal workspace |
| /founder/outreach | Redirect to dashboard |

## Expert

| Path | Page |
|---|---|
| /expert/profile | Expert profile editor |

The expert dashboard is selected through the role-aware /dashboard route. Expert profile completion is a separate page after shared onboarding.

## Infrastructure provider

| Path | Page |
|---|---|
| /provider/setup | Provider setup |
| /provider/dashboard | Provider dashboard |
| /provider/listings | Provider listing management |
| /provider/listings/:id/preview | Provider listing preview |
| /provider/listings/new | Create asset/listing |
| /provider/listings/:id/edit | Edit asset/listing |
| /provider/orders | Provider orders |
| /provider/orders/:id | Order details |
| /provider/orders/:id/dispatch | Dispatch workflow |

## Employer and jobs

| Path | Page |
|---|---|
| /jobs/manage/new | Create job |
| /jobs/manage | Manage jobs |
| /jobs/manage/:jobId/applications | Review applications |

These employer pages allow founder and infrastructure-provider roles in the current route configuration.

## Investor

| Path | Page |
|---|---|
| /investor/dashboard | Investor dashboard |
| /investor/startups | Investor startup discovery |
| /investor/deals | Investor deals |
| /investor/portfolio | Investor portfolio |
| /investor/analytics | Investor analytics |
| /investor/resources | Investor resources |
| /investor/updates | Investor updates |
| /investor/settings | Investor settings |
| /investor/startups/:pitchId | Startup detail |
| /investor/deals/:dealId | Deal detail |
| /investor/profile | Investor profile |

Several investor paths currently render the same dashboard component with route-specific location state/path handling. Inspect InvestorDashboardPage before splitting them into separate pages.

## Job seeker

| Path | Page |
|---|---|
| /job-seeker/dashboard | Job seeker dashboard |
| /job-seeker/jobs | Job discovery |
| /job-seeker/applications | Application list |
| /job-seeker/applications/:applicationId | Application detail |
| /job-seeker/setup | Profile setup |
| /job-seeker/invitations | Team invitations |

## Marketplace and checkout

| Path | Page |
|---|---|
| /marketplace | Marketplace |
| /listings/:id | Public listing detail |
| /search | Search |
| /checkout/:orderId | Checkout/order flow |

## Development-only / diagnostic routes

| Path | Page |
|---|---|
| /sentry-test | Sentry test page |
| * | Not found |

Confirm that diagnostic routes are appropriately restricted or removed for production as part of the security review.

## Route guards

The route tree uses shared guard components:
- ProtectedRoute: requires an authenticated user and handles incomplete onboarding.
- RoleRoute: checks the normalized role against an allowed-role list.
- FounderRoute: founder-specific route protection.
- ProviderRoute: infrastructure-provider route protection.

The backend must still independently enforce every authorization rule and resource ownership check.

## Shared React providers and state

Provider composition is defined in frontend/src/main.jsx and App.jsx. Key context modules:
- AuthContext: authenticated user/session state.
- IdeaContext: current idea/venture workflow context.
- ToastContext: user feedback.
- ConfirmContext: shared confirmation dialogs.
- SidebarContext: navigation/sidebar state.

Prefer the existing domain hooks over embedding network requests and complex state machines in page components. Examples include useFounderFlow, useProviderSetupWorkflow, useInvestorWorkspace, useExpertDashboard, useExpertProfile and useJobSeekerProfile.

## Adding a route

1. Create the page under the matching Pages/domain folder.
2. Add or reuse a domain hook for state and data orchestration.
3. Add API calls to the matching frontend/src/lib/api module.
4. Register the route in App.jsx with the correct guard.
5. Update role-aware sidebar navigation if needed.
6. Add route/page tests and verify responsive behavior.
7. Confirm backend role and ownership checks exist.
