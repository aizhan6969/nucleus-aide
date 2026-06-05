
# MynDerek → Student Ecosystem Upgrade

The scope is large, so I'll stage it across 4 phases. Each phase ships a working, polished slice. The existing Chat / RAG / Analytics / Recommendations / Plan / Tasks / Lecture / role system stays untouched.

---

## Phase 1 — Foundation: Dashboard + Profile + Settings + new navigation

**Routing change.** After login, land on `/` = **Dashboard** (not chat). Chat moves to `/chat`. New routes: `/dashboard`, `/profile`, `/settings`, `/goals`, `/career`, `/calendar`, `/today`, `/achievements`. Sidebar reorganized into sections: *Workspace* (Today, Dashboard, Chat, Documents) and *Growth* (Goals, Career, Calendar, Achievements) + existing role-specific tools.

**Dashboard** — Notion/Spotify-feel grid of cards:
- Personal greeting (time-aware: Доброе утро/день/вечер, {name})
- Streak flame + days count
- Today's recommendation card
- Active goals progress bars (top 3)
- Upcoming deadlines (next 3 from calendar)
- Recent chats (last 4)
- Recent documents (last 4)
- Motivational quote of the day

**Profile page** — avatar upload (Supabase Storage), bio, university, major, year, interests (tag chips), skills (tag chips).

**Settings page** — sections: Appearance (theme), Language, Notifications, AI preferences (model/tone), Privacy, Data export (download JSON), Delete account, Active sessions (Supabase sessions list).

**DB tables needed** (will write SQL migration):
- `profiles` — extend with `bio, university, major, year, interests[], skills[], avatar_url` (avatar_url already exists)
- `user_settings` — theme, language, notifications JSON, ai_prefs JSON
- Storage bucket `avatars` (public read)

---

## Phase 2 — Goals + Streak + Achievements

**Goals** (`/goals`): create/edit/delete personal goals with title, description, deadline, milestones (checklist), progress %. AI button "Suggest milestones" calls existing backend.

**Streak**: count consecutive days with any `student_activity` row. Display flame icon + current/best streak. Surface on Dashboard + Today page.

**Achievements** (`/achievements`): catalog of ~15 badges (First chat, First document, 7-day streak, 30-day streak, 10 goals, etc.). Computed from `student_activity` + `goals` + `chats` tables. Locked/unlocked card grid.

**DB tables**:
- `goals` (id, user_id, title, description, deadline, progress, status)
- `goal_milestones` (id, goal_id, title, done)
- `achievements_unlocked` (user_id, achievement_key, unlocked_at)

---

## Phase 3 — Career Tracker + Smart Calendar

**Career** (`/career`): user enters target profession + current skills/experience. AI returns skill gaps + roadmap + tech stack. Renders as vertical timeline + skill-gap chips. Reuses existing `learningPlan` API or adds `careerRoadmap`.

**Calendar** (`/calendar`): month view (lightweight, no heavy library — custom grid using `date-fns`). Add events: exam, deadline, meeting, project. AI assistant card: "You have 3 deadlines this week — start today." Events stored in DB.

**DB tables**:
- `career_profile` (user_id, target_role, skills, experience, roadmap_json)
- `calendar_events` (id, user_id, title, type, starts_at, ends_at, notes)

---

## Phase 4 — Today page + Personal Development Analytics + Polish

**Today page** (`/today`): single-screen daily ritual — recommendation, micro-task, tip, motivation quote, fun fact. Generated once per day, cached in DB.

**Personal Analytics**: extend existing `/analytics` for students with: hours studied, top topics, skill growth chart, weekly activity heatmap, most productive days. Uses `student_activity`.

**UI polish pass**: smooth fade/scale animations, gradient accents on hero cards (kept subtle, indigo-tinted only — preserves minimal dark aesthetic), responsive grid breakpoints, refined typography scale.

---

## Technical notes

- Stack: keep current TanStack Start + Supabase. All data in Supabase tables with RLS (`auth.uid() = user_id`).
- Backend AI calls continue to hit existing FastAPI at `localhost:8000` — no new endpoints required beyond what's there; new screens reuse `api.chat`, `api.learningPlan`, etc.
- Each phase ends with a SQL migration block that the user runs in their Supabase SQL editor (since their schema is self-managed).
- i18n: every new string added in EN / RU / KZ.
- Design rules preserved: dark `#0a0a0a`, indigo `#6366f1` accent, Inter/Geist Mono, subtle 150–200ms animations. Gradients introduced are indigo-tinted, low-opacity glows only — not colorful.

---

## Confirm before I start

1. **Start with Phase 1?** (Dashboard + Profile + Settings + nav). I'll deliver SQL + code in one batch, then wait for you to run the migration before Phase 2.
2. **Avatar storage** — OK to create a public `avatars` bucket in your Supabase?
3. **Landing route** — confirm login should redirect to `/dashboard` (and old `/` becomes the dashboard, chat moves to `/chat`).
