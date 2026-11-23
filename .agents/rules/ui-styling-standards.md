# UI Styling & Design Standards

## Color Palette Constraints
- **Primary & Neutral**: Black / Dark Charcoal (`#090a0d`, `#0a0a0b`, `#0c0d12`, `#13141b`).
- **Accent**: Gold (`#f2ca50`, `#e2ba40`, `#c9a15a`, `rgba(242, 202, 80, ...)`).
- **Error**: Red (`text-red-*`, `border-red-*`, `bg-red-*`) — **reserved for error states only**.
- **Text & Foreground**: Pure White (`text-white` / `#ffffff`). Emulate the landing page text standards.
- **Forbidden Colors**: Do NOT use green (`text-emerald-*`, `text-green-*`, emerald badges), rose/pink (`text-rose-*`), or other disparate palette colors in dashboards, dossiers, or legal views. Keep everything in strict White, Gold, and Black.
- **Red usage**: Red is allowed **only** for error states (error banners, error toasts, error text). All other states (success, info, warnings, accents, hover) must use Gold.

## Typography & Text Color Rules
- **Always White Over Gray**: All body copy, titles, descriptions, and content must use crisp **white** (`text-white`), NOT gray (`text-slate-400`, `text-gray-400`, `text-slate-300`, etc.).
- Only use slight white opacity (such as `text-white/70` or `text-white/60`) for minor secondary labels or single-word meta tags when strictly necessary.
- Content must never look washed out or fatigued by excessive gray text.

## Language Simplicity & Punctuation Standards
- **Simple, Everyday English**: Write in simple, clear, approachable English so that anyone—including high school students or teenagers starting their first business—can understand everything effortlessly.
- **NO Dense Jargon or Legalese**: Avoid intimidating academic and legal terms (like "juridical person", "ring-fences personal liability", "statutory standing", "monetization architecture"). Explain concepts using simple human words.
- **NEVER Use Em Dashes or En Dashes**: Absolutely NEVER use em dashes (—) or en dashes (–) anywhere in UI copy or AI prompts.
- **Everyday Punctuation Only**: Use only basic punctuation (periods, commas, question marks). Only use hyphens (-) when truly necessary for compound words.

## Button Design Standards
- **Text OR Icon, Not Both**: Each button must use either text alone OR an icon alone — never both together. This prevents visual clutter.
- **Icon-only buttons**: Reserved for universally obvious actions (e.g., delete = trash icon, close = X, menu = hamburger). No text label needed.
- **Text buttons**: For actions that need explanation or are not immediately obvious (e.g., "Add Asset", "Export Report", "Confirm Order"). No icon unless the icon adds clear meaning.
- **Avoid unnecessary icons**: Do not add decorative icons to buttons. Only include an icon when it instantly communicates the action without text.

## Border Standards
- **No White Borders**: Never use `border-white`, `border-white/*`, or `border-gray-200/300` on dark themes. White borders create harsh contrast and visual clutter.
- **Subtle Surface Borders Only**: Use `#282a2f` (surfaceHigh) for card borders, `#1e2025` (surfaceContainer) for section separators. Keep borders minimal — they should gently separate, not frame everything.
- **Remove Unnecessary Borders**: Don't add borders to every component. Use background color contrast (surface vs bg) instead of borders where possible. Less border = cleaner hierarchy.

## Workspace UI Consistency Rules

- **No emojis in product UI.** Do not use emoji characters as category icons, status indicators, decoration, or empty-state art. Use the existing `lucide-react` icon set where an icon adds meaning, or use a clear text label.
- **Use the existing design system.** Follow the black, white, and gold palette, Fraunces headings, Inter body text, JetBrains Mono for technical metadata, existing radius tokens, and shared UI components. Do not introduce a one-off visual language for an individual portal.
- **Buttons use text or icon, not both.** Text buttons should communicate the action without a decorative icon. Icon-only buttons must have an accessible name through `aria-label` or equivalent.
- **Every page-level loading state must use a skeleton.** This applies to route authentication checks, lazy route fallbacks, dashboard pages, tables, forms, detail views, marketplace grids, inboxes, and initial data fetches.
- **Skeletons must resemble the content being loaded.** Match the page's major layout, number and shape of regions, card proportions, table rows, form fields, and responsive grid. Do not use a centered spinner or a generic block when a page-specific skeleton can be shown.
- **Use the shared skeleton primitives** from `frontend/src/components/ui/Skeleton.jsx` and reusable page skeletons from `frontend/src/components/ui/RouteSkeleton.jsx`. Extend them when a new page layout needs a new variant rather than inventing a separate loading system.
- **Avoid layout shift.** Skeleton dimensions should be close to the final content dimensions. Use `aria-busy="true"` on the loading region and keep decorative skeleton blocks hidden from assistive technology.
- **Keep loading feedback proportional.** A small spinner is acceptable inside a button or a single action while that action is running. It must not replace the entire page during initial loading. During background refreshes, keep existing content visible where possible.
- **Keep loading, empty, and error states distinct.** Loading uses skeletons, empty states explain that there is no content and provide a useful next action, and errors use the reserved red error treatment with a retry path when possible.
- **Audit every new page and every changed data-fetching page** for an initial skeleton before calling the UI complete. Do not mark a portal complete while its initial page load still renders a full-page spinner or plain "Loading..." text.

