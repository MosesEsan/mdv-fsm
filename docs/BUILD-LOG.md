
## 2026-10-21 — Tab bar fix
- Tapping a tab used to slide a new screen in, because each screen drew its own tab bar and switched with a normal stack navigation. Now there is one tab bar in `app/(app)/_layout.tsx`, outside the screens: it stays put, switching tabs has no animation, and it shows only on a tab's first screen (`activeTab()`, unit-tested). Screens inside a tab (a job, a visit) still slide in.

## 2026-10-21 — Expo Router tabs
- Real bottom tabs: `app/(app)/(tabs)/_layout.tsx` uses Expo Router `<Tabs>` with our bar (`BrandTabBar` in `src/core/modules/TabBar.tsx`). Each tab keeps its own history; switching tabs doesn't animate.
- Tab routes are top-level in `(tabs)`: `index` (Home), `jobs`, `customers`, `extra-work`, `visits`, `visit-entries`, `visit-report`, `settings`. A menu entry with `tab: true` must use a path that matches one of these (`tabRouteName()`, unit-tested). Each business still sees only its own tabs.
- MDC paths moved: Today `/visits`, Entries `/visit-entries`, Report `/visit-report`; a visit `/visit/[id]`, `/visit/new`, `/visit/[id]/edit` (open over the tabs).
- Everything outside the tabs (Team, a visit, schedule, flooring, timesheets) opens over them with the same slide from the right on iPhone and Android.
