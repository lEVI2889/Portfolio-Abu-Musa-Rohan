# 📅 21-Day Antigravity Portfolio Streak Roadmap

This roadmap orchestrates the iterative feature development and daily GitHub streak for the **Frosted Glass CS Portfolio** (`Portfolio-Abu-Musa-Rohan`).

Every day on schedule, the Antigravity scheduled automation runs the designated daily prompt, implements the feature on a clean feature branch, commits with conventional commit semantics, pushes to GitHub `origin`, fires a native Mac desktop notification for code review, and checks off that day.

---

## 📊 Progress Dashboard
- **Current Streak State**: Day 5 Active (Day 4 Complete)
- **Repository**: `https://github.com/lEVI2889/Portfolio-Abu-Musa-Rohan.git`
- **Schedule**: Daily at 10:00 PM (`CRON_TZ=Asia/Dhaka 0 22 * * *`)
- **Review Target**: Remote Feature Branches (`feat/day-<N>-<slug>`)

---

## 🚀 Daily Prompts & Implementation Specifications

### Week 1: Resume Engine & UI Polish

#### - [x] **Day 1: Initial UI Shell & Design Tokens** *(Completed)*
- **Commit**: `c999789` (pushed to `main`)
- **Directives Completed**: Remote origin set, README & .gitignore synced, all initial portfolio files committed and pushed.

---

#### - [x] **Day 2: The PDF Engine Data Parser** *(Completed)*
- **Commit**: `def2618` (pushed to `feat/day-2-resume-parser`)
- **Directives Completed**: Created `js/resume-engine.js` with decoupled data parsing functions for Identity, Experience, Education, and Skills; verified parser via Node; pushed to feature branch.
```markdown
@coordinator @gsd-executor @ponytail
Objective: Build the decoupled PDF data parser on a dedicated feature branch.
Directives:
1. Checkout a new branch named feat/day-2-resume-parser from main.
2. Create js/resume-engine.js and write functions to parse Identity, Experience, Education, and Skills from data/portfolio-data.js.
3. Stage, commit: "feat: decouple resume data parsing logic", and push the branch to remote.
4. Trigger a system notification: "Day 2 code is ready for review on branch feat/day-2-resume-parser."
```

---

#### - [x] **Day 3: Dynamic Template Injection** *(Completed)*
- **Commit**: `215cd7c` (pushed to `feat/day-3-dom-injection`)
- **Directives Completed**: Updated `js/resume-engine.js` to map parsed resume data into the DOM of `#cv-print-template` via `generateCVHTML`, `mapToDOM`, and `injectTemplate`; integrated `#cv-print-template` hooks in `resume.html` and `index.html`; pushed to feature branch.
```markdown
@coordinator @gsd-executor @ponytail
Objective: Connect the data parser to the hidden CV template.
Directives:
1. Checkout a new branch named feat/day-3-dom-injection from main.
2. Update js/resume-engine.js to map parsed data into the DOM of #cv-print-template.
3. Stage, commit: "feat: dynamic DOM injection for CV print template", and push the branch to remote.
4. Trigger a system notification: "Day 3 code is ready for review on branch feat/day-3-dom-injection."
```

---

#### - [x] **Day 4: PDF Trigger** *(Completed)*
- **Commit**: `8784886` (pushed to `feat/day-4-pdf-trigger`)
- **Directives Completed**: Bound click listener to the "Download Resume" buttons across portfolio and resume to trigger native `window.print()`, ensuring template population and print stylesheet binding; pushed to feature branch.
```markdown
@coordinator @gsd-executor
Objective: Bind the PDF export trigger.
Directives:
1. Checkout a new branch named feat/day-4-pdf-trigger from main.
2. Add a click listener to the "Download Resume" button to trigger window.print().
3. Stage, commit: "feat: trigger native print API", and push the branch to remote.
4. Trigger a system notification: "Day 4 code is ready for review on branch feat/day-4-pdf-trigger."
```

---

#### - [ ] **Day 5: Print CSS Refinement**
```markdown
@coordinator @gsd-executor
Objective: Optimize print CSS.
Directives:
1. Checkout a new branch named feat/day-5-print-css from main.
2. Refine @media print in print.css to hide navbars and apply strict A4 page margins.
3. Stage, commit: "style: refine A4 print layout", and push the branch to remote.
4. Trigger a system notification: "Day 5 code is ready for review on branch feat/day-5-print-css."
```

---

#### - [ ] **Day 6: Smooth Scrolling**
```markdown
@coordinator @gsd-executor
Objective: Implement smooth scrolling.
Directives:
1. Checkout a new branch named feat/day-6-smooth-scroll from main.
2. Add an IntersectionObserver to highlight active navbar links during scroll.
3. Stage, commit: "feat: intersection observer scroll tracking", and push the branch to remote.
4. Trigger a system notification: "Day 6 code is ready for review on branch feat/day-6-smooth-scroll."
```

---

#### - [ ] **Day 7: Mobile Navigation**
```markdown
@coordinator @gsd-executor
Objective: Build mobile navigation.
Directives:
1. Checkout a new branch named feat/day-7-mobile-nav from main.
2. Add a vanilla JS mobile nav drawer and hamburger toggle for viewports < 768px.
3. Stage, commit: "feat: mobile nav drawer", and push the branch to remote.
4. Trigger a system notification: "Day 7 code is ready for review on branch feat/day-7-mobile-nav."
```

---

### Week 2: Integrations, Polish & SEO

#### - [ ] **Day 8: OpenGraph SEO Metadata**
```markdown
@coordinator @gsd-executor
Objective: Add OpenGraph SEO metadata.
Directives:
1. Checkout a new branch named feat/day-8-metadata from main.
2. Add standard <meta> tags (title, description, image) to index.html for social sharing.
3. Stage, commit: "chore: add OpenGraph metadata", and push the branch to remote.
4. Trigger a system notification: "Day 8 code is ready for review on branch feat/day-8-metadata."
```

---

#### - [ ] **Day 9: Accessibility Audit**
```markdown
@coordinator @gsd-executor
Objective: Accessibility audit.
Directives:
1. Checkout a new branch named feat/day-9-a11y-audit from main.
2. Add aria-labels to buttons and ensure focus-visible styling is present.
3. Stage, commit: "fix: a11y improvements", and push the branch to remote.
4. Trigger a system notification: "Day 9 code is ready for review on branch feat/day-9-a11y-audit."
```

---

#### - [ ] **Day 10: Performance Optimizations**
```markdown
@coordinator @gsd-executor @ponytail
Objective: Performance optimizations.
Directives:
1. Checkout a new branch named feat/day-10-perf-optimize from main.
2. Ensure fonts use font-display: swap and assets are correctly loaded.
3. Stage, commit: "perf: optimize asset delivery", and push the branch to remote.
4. Trigger a system notification: "Day 10 code is ready for review on branch feat/day-10-perf-optimize."
```

---

#### - [ ] **Day 11: GitHub API Integration Setup**
```markdown
@coordinator @gsd-executor
Objective: GitHub API integration setup.
Directives:
1. Checkout a new branch named feat/day-11-github-api-util from main.
2. Create a vanilla JS fetch function to hit the GitHub API for public repositories.
3. Stage, commit: "feat: setup GitHub API fetch utility", and push the branch to remote.
4. Trigger a system notification: "Day 11 code is ready for review on branch feat/day-11-github-api-util."
```

---

#### - [ ] **Day 12: GitHub API Dynamic DOM Rendering**
```markdown
@coordinator @gsd-executor
Objective: GitHub API DOM rendering.
Directives:
1. Checkout a new branch named feat/day-12-github-api-render from main.
2. Map the fetched GitHub repository data into the HTML grid cards dynamically.
3. Stage, commit: "feat: render live GitHub repositories", and push the branch to remote.
4. Trigger a system notification: "Day 12 code is ready for review on branch feat/day-12-github-api-render."
```

---

#### - [ ] **Day 13: Legacy Browser Fallbacks**
```markdown
@coordinator @gsd-executor
Objective: Legacy browser fallbacks.
Directives:
1. Checkout a new branch named feat/day-13-legacy-fallbacks from main.
2. Add solid background colors in CSS for browsers that don't support backdrop-filter: blur().
3. Stage, commit: "style: frosted glass legacy fallbacks", and push the branch to remote.
4. Trigger a system notification: "Day 13 code is ready for review on branch feat/day-13-legacy-fallbacks."
```

---

#### - [ ] **Day 14: Portfolio Cleanup & Polish**
```markdown
@coordinator @gsd-executor
Objective: Portfolio polish.
Directives:
1. Checkout a new branch named feat/day-14-ui-cleanup from main.
2. Review the HTML for any placeholder text left over from Stitch and remove dead CSS variables.
3. Stage, commit: "chore: UI cleanup and polish", and push the branch to remote.
4. Trigger a system notification: "Day 14 code is ready for review on branch feat/day-14-ui-cleanup."
```

---

### Week 3: Game Engine Foundation

#### - [ ] **Day 15: Initialize Canvas Context**
```markdown
@coordinator @gsd-executor
Objective: Initialize the Canvas Engine.
Directives:
1. Checkout a new branch named feat/day-15-canvas-init from main.
2. Create js/game-engine.js, target the 'Interactive Game Area', set up the HTML5 <canvas> context (2D or WebGL), and bind resize listeners.
3. Stage, commit: "feat: initialize canvas context", and push the branch to remote.
4. Trigger a system notification: "Day 15 code is ready for review on branch feat/day-15-canvas-init."
```

---

#### - [ ] **Day 16: Core Game Render Loop**
```markdown
@coordinator @gsd-executor
Objective: Build the main render loop.
Directives:
1. Checkout a new branch named feat/day-16-render-loop from main.
2. Implement a requestAnimationFrame loop in the game engine that clears the screen each frame.
3. Stage, commit: "feat: core game render loop", and push the branch to remote.
4. Trigger a system notification: "Day 16 code is ready for review on branch feat/day-16-render-loop."
```

---

#### - [ ] **Day 17: Generic Input Handler Logic**
```markdown
@coordinator @gsd-executor
Objective: Implement an input handler class.
Directives:
1. Checkout a new branch named feat/day-17-input-handler from main.
2. Add an event listener system for WASD/Arrow keys and basic touch inputs, storing the state in an input object.
3. Stage, commit: "feat: generic input handler logic", and push the branch to remote.
4. Trigger a system notification: "Day 17 code is ready for review on branch feat/day-17-input-handler."
```

---

#### - [ ] **Day 18: Game State Management**
```markdown
@coordinator @gsd-executor
Objective: Build a state management structure.
Directives:
1. Checkout a new branch named feat/day-18-state-machine from main.
2. Add a state machine to the engine (INIT, PLAYING, PAUSED, GAME_OVER) to manage what the loop renders.
3. Stage, commit: "feat: game state management", and push the branch to remote.
4. Trigger a system notification: "Day 18 code is ready for review on branch feat/day-18-state-machine."
```

---

#### - [ ] **Day 19: Engine Telemetry & FPS Calculation**
```markdown
@coordinator @gsd-executor
Objective: Add live telemetry.
Directives:
1. Checkout a new branch named feat/day-19-engine-telemetry from main.
2. Write a function to calculate Delta Time (dt) and frames per second, and update the 60 FPS UI text with live data.
3. Stage, commit: "feat: engine telemetry and FPS calculation", and push the branch to remote.
4. Trigger a system notification: "Day 19 code is ready for review on branch feat/day-19-engine-telemetry."
```

---

#### - [ ] **Day 20: Base Generic Entity Class**
```markdown
@coordinator @gsd-executor
Objective: Establish a base Entity class.
Directives:
1. Checkout a new branch named feat/day-20-base-entity from main.
2. Create a generic JavaScript class for game entities with x, y, width, height properties and an empty update/draw method.
3. Stage, commit: "feat: base generic entity class", and push the branch to remote.
4. Trigger a system notification: "Day 20 code is ready for review on branch feat/day-20-base-entity."
```

---

#### - [ ] **Day 21: Complete Game Engine Foundation & Release Tag**
```markdown
@coordinator @gsd-executor
Objective: Final integration and version tag.
Directives:
1. Checkout a new branch named feat/day-21-game-engine-release from main.
2. Ensure the engine runs silently in the background without throwing console errors, waiting for specific game logic.
3. Stage, commit: "feat: complete game engine foundation", and push the branch to remote.
4. Trigger a system notification: "Day 21 code is ready for review on branch feat/day-21-game-engine-release."
```

---

## 🛠 Automation Engine Execution Protocol

Each day at 10:00 PM (Asia/Dhaka), the Antigravity automation executes a fresh agent run:
1. **Reads `.streak_state.json` and `STREAK_ROADMAP.md`** to identify the current progress and calculate the expected day based on the Oct 20 start date.
2. **Zero-Skip & Backfill Guarantee**:
   - If any days were missed due to system sleep, downtime, or restarts, the automation **never skips** them.
   - It iterates sequentially through every missed day starting from `current_step` up to today's target day.
   - For historical missed days, commits are backdated with `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` to that day's original 10:00 PM timestamp (`YYYY-MM-DD 22:00:00 +0600`) to preserve the GitHub contribution streak without gaps.
3. **Executes Each Day's Directives**:
   - `git checkout main && git pull origin main`
   - `git checkout -b feat/day-N-<slug>`
   - Implements the targeted feature cleanly.
   - `git add <files> && git commit -m "<day commit message>"`
   - `git push -u origin feat/day-N-<slug>`
   - Fires native Mac notification banner:
     `osascript -e 'display notification "Day N code is ready for review on branch feat/day-N-<slug>." with title "Antigravity Daily Streak" subtitle "Portfolio v2"'`
   - Updates `.streak_state.json` and checks off `- [x] **Day N**...` in `STREAK_ROADMAP.md`.
   - Commits roadmap updates to `main` and pushes to `origin main`.
