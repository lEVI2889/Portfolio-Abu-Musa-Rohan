# 📅 21-Day Portfolio Streak Roadmap (Portfolio v2)

This roadmap divides the **Frosted Glass CS Portfolio** into atomic, high-signal micro-commits across ~3 weeks (24 daily steps).
Each day, the scheduled Antigravity automation executes `scripts/daily_streak_commit.py`, moving the next chunk from `complete` to `main`, maintaining an unbroken GitHub streak.

---

### Phase 1: Foundation & CSS Tokens (Days 1–5)
- [x] **Day 1**: Project initialization, repository architecture & `README.md` (`caf6562`) *(Completed)*
- [x] **Day 2**: Minimalist vector avatar placeholder graphic (`assets/avatar-placeholder.svg`)
- [ ] **Day 3**: Glassmorphism design tokens, color palette & typography (`css/tokens.css`)
- [ ] **Day 4**: CSS base reset, font imports & dark canvas variables (`css/style.css` lines 1–120)
- [ ] **Day 5**: Frosted glass surface primitives & background mesh halos (`css/style.css` lines 121–230)

### Phase 2: Navigation & Hero Components (Days 6–10)
- [ ] **Day 6**: Responsive navigation bar & frosted pill styling (`css/style.css` lines 231–340)
- [ ] **Day 7**: Hero profile card, avatar ring & electric cyan glow (`css/style.css` lines 341–460)
- [ ] **Day 8**: Interactive canvas shell & telemetry viewport (`css/style.css` lines 461–570)
- [ ] **Day 9**: GitHub project showcase grid & LinkedIn feed card styling (`css/style.css` lines 571–680)
- [ ] **Day 10**: Academic journey vertical timeline & emerald milestone nodes (`css/style.css` lines 681–780)

### Phase 3: Responsive Layout & Print Engine (Days 11–15)
- [ ] **Day 11**: Responsive media queries & full styling completion (`css/style.css`)
- [ ] **Day 12**: High-contrast A4 print stylesheet for offline CV export (`css/print.css`)
- [ ] **Day 13**: Semantic HTML5 shell scaffolding, meta tags & preloads (`index.html` lines 1–80)
- [ ] **Day 14**: Semantic header & responsive navigation markup (`index.html` lines 81–150)
- [ ] **Day 15**: Hero identity section, status pill & mailto CTA (`index.html` lines 151–230)

### Phase 4: Main Portfolio Assembly (Days 16–18)
- [ ] **Day 16**: Interactive canvas telemetry component markup (`index.html` lines 231–290)
- [ ] **Day 17**: GitHub repository cards & technology tags markup (`index.html` lines 291–370)
- [ ] **Day 18**: Education timeline, achievements & contact footer (`index.html` lines 371–end)

### Phase 5: CV & Resume Engine (Days 19–21)
- [ ] **Day 19**: Standalone A4 resume document shell & executive summary (`resume.html` lines 1–100)
- [ ] **Day 20**: Full resume content: experience, education & technical skills (`resume.html`)
- [ ] **Day 21**: Printable Abu Musa Rohan CV attachment & download link (`Abu_Musa_Rohan_CV.pdf`)

### Phase 6: Documentation, Previews & Release (Days 22–24)
- [ ] **Day 22**: Comprehensive architectural specification (`PLAN.md`)
- [ ] **Day 23**: Multi-device responsive screenshots & preview gallery (`screenshots/`)
- [ ] **Day 24**: Production v1.0 milestone finalize & release badge (`README.md`)

---

### Automation Details
- **Scheduler**: Antigravity Scheduled Sidecar (`daily-portfolio-streak-upload`)
- **Execution Time**: Daily at 10:00 PM (`CRON_TZ=Asia/Dhaka 0 22 * * *`)
- **Script**: `python3 scripts/daily_streak_commit.py`
- **State File**: `.streak_state.json`
