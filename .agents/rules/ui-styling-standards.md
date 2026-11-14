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
