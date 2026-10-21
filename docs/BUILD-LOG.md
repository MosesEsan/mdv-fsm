
## 2026-10-21 — Tab bar fix
- Tapping a tab used to slide a new screen in, because each screen drew its own tab bar and switched with a normal stack navigation. Now there is one tab bar in `app/(app)/_layout.tsx`, outside the screens: it stays put, switching tabs has no animation, and it shows only on a tab's first screen (`activeTab()`, unit-tested). Screens inside a tab (a job, a visit) still slide in.
