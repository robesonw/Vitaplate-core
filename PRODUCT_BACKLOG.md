# VitaPlate Product Backlog
> Last updated: April 2026  
> Strategy: Own "biomarker-driven meal planning" completely before expanding.  
> North Star Metric: % of new users who generate a meal plan from their lab results within 48 hours of signup.

---

## Backlog Structure

Each item follows this format:
- **ID** — unique reference for tracking
- **Priority** — P0 (launch blocker) / P1 (Week 1-2) / P2 (Week 3-4) / P3 (Post-launch)
- **Effort** — S (hours) / M (1-2 days) / L (3-5 days) / XL (1+ week)
- **Status** — `[ ]` todo / `[x]` done / `[~]` partial / `[!]` blocked
- **Unique Angle** — what makes this feature unlike anything else on the market

---

## 🚨 P0 — Launch Blockers (Must ship before any real users)

These are non-negotiable. If any of these are broken, no marketing spend or press matters.

### INFRA-01 — Error Boundaries on Every Page
**Effort:** M | **Status:** `[x]`  
Currently a single JS crash blanks the entire app. Every page needs a React Error Boundary so one broken component shows a graceful error card, not a white screen.  
**Acceptance:** Deliberately break one component — rest of page still renders.

### INFRA-02 — Onboarding Completion Tracking
**Effort:** S | **Status:** `[x]`  
Onboarding page exists but there's no tracking of whether users complete it. Users who abandon onboarding never come back.  
**Acceptance:** DB stores `onboarding_completed_at` timestamp. Dashboard shows resume prompt if not complete.

### INFRA-03 — Lab PDF Upload (File Storage)
**Effort:** M | **Status:** `[x]` (stubbed)  
`UploadFile` returns empty. Users cannot upload lab PDFs. This is the #1 core feature.  
**Implementation:** Supabase Storage for PDFs → backend extracts text → Claude Haiku parses biomarkers → saves to LabResult entity.  
**Acceptance:** User uploads real lab PDF → biomarkers appear in their profile within 30 seconds.

### INFRA-04 — Meal Plan Generation End-to-End Test
**Effort:** S | **Status:** `[ ]`  
The full flow (health profile → generate → view days → grocery list) must work flawlessly with real data.  
**Acceptance:** Complete the flow as a new user. All 7 days render. Grocery list generates. No 500 errors.

### INFRA-05 — Template Seeder Run
**Effort:** S | **Status:** `[ ]`  
One-time: `node src/jobs/seedTemplates.js` generates 20 base plans for common biomarker profiles.  
~$8 cost. Eliminates AI cost for 70%+ of users.  
**Acceptance:** `meal_plan_templates` table has 20+ rows. Matching profile hash serves from cache instantly.

### INFRA-06 — Transactional Emails (Resend)
**Effort:** M | **Status:** `[x]`  
No emails fire currently. Users who sign up hear nothing.  
**Emails needed:**
- Welcome (immediate on signup)
- "Your first meal plan is ready" (after generation)
- Lab upload confirmation
- Weekly health digest (every Monday)
- Streak reminder (if no check-in in 48h)  
**Acceptance:** Each email fires at the right trigger. Unsubscribe link works.

### INFRA-07 — Pricing Page + Stripe Checkout Working
**Effort:** S | **Status:** `[~]`  
Stripe is integrated but end-to-end checkout → subscription active → UI updates to Pro hasn't been tested with live keys.  
**Acceptance:** Go through checkout as a user. Subscription activates. AI credit limit updates. Cancellation handled.

### INFRA-08 — Mobile Responsive Check
**Effort:** M | **Status:** `[ ]`  
All pages need testing on 375px (iPhone SE) and 390px (iPhone 14). This is a health app — majority of users will be on mobile.  
**Acceptance:** Dashboard, HealthDietHub, LabResults, and AICoach all render correctly on mobile. No horizontal scroll. No overlapping elements.

---

## 🔴 P1 — Week 1-2 (Core Differentiation)

Features that justify why VitaPlate beats every other app in the market.

### CORE-01 — Biomarker Auto-Extraction from PDF Labs ⭐ UNIQUE
**Effort:** L | **Status:** `[x]`  
**Unique angle:** No consumer health app automatically reads your blood panel and acts on it.  
When a user uploads their lab PDF (Quest, LabCorp, or any standard format), Claude Haiku reads it and extracts structured biomarker data: LDL, HDL, Glucose, HbA1c, Vitamin D, CRP, TSH, B12, Iron, Ferritin, Triglycerides, eGFR, ALT, AST, and 15+ more.  
The extracted values are stored, compared to optimal ranges, and flagged as normal/borderline/high/low.  
**This single feature is the product's reason to exist.**  
**Acceptance:** Upload a real Quest Diagnostics PDF → all standard markers extracted with values and status within 30 seconds.

### CORE-02 — Meal Plan ↔ Biomarker Connection UI ⭐ UNIQUE
**Effort:** M | **Status:** `[x]`  
Currently the meal plan is generated with biomarkers but the UI doesn't show the connection visually.  
Each meal card should show: "This breakfast is low in saturated fat because your LDL is 145."  
The `healthBenefit` field exists in the data — it needs to be surfaced prominently in the UI.  
**Acceptance:** User views their meal plan and can see exactly why each meal was chosen for their specific biomarkers.

### CORE-03 — Predictive Health Alerts Engine ⭐ UNIQUE
**Effort:** L | **Status:** `[x]` (rules exist, UI exists, not connected)  
**Unique angle:** No app cross-references your eating patterns against your blood work to predict what's coming.  
The alert engine (already built in backend) runs nightly and detects:
- High saturated fat intake + elevated LDL → trending warning
- Low fiber + prediabetic → blood sugar risk
- Low Vitamin D intake + deficient labs → supplement alert
- High sodium + hypertension condition → blood pressure risk  
These appear in the Dashboard's HealthAlertsCard with specific food recommendations.  
**Acceptance:** Simulate 7 days of high-carb nutrition logs for a prediabetic user → alert fires with specific food suggestions.

### CORE-04 — Lab Trend Comparison ⭐ UNIQUE
**Effort:** M | **Status:** `[x]`  
**Unique angle:** Show users their health improving over time as a direct result of following VitaPlate plans.  
When a user uploads a second set of labs, show a before/after comparison:  
- LDL: 145 → 118 (↓19%) ✅
- Vitamin D: 18 → 34 (↑89%) ✅
- Glucose: 110 → 98 (↓11%) ✅  
This is the killer testimonial that markets itself. Users screenshot this and share it.  
**Acceptance:** Upload two lab results → trend view shows delta for each marker with interpretation.

### CORE-05 — Supplement Recommendations from Labs ⭐ UNIQUE
**Effort:** S | **Status:** `[x]` (rules engine built, UI page exists)  
The rules engine correctly maps biomarkers to supplements. Connect it to the UI properly.  
Each recommendation must show: what it is, why based on their specific lab value, dose, form, priority level, and estimated cost.  
**Acceptance:** User with low Vitamin D (18) sees D3+K2 recommendation with their specific value and explanation.

### CORE-06 — Condition-Specific Nutrition Deep Dives ⭐ UNIQUE
**Effort:** M | **Status:** `[~]` (pages exist, need content and AI personalization)  
Five condition hubs each need to feel like a specialist consultation, not a generic article:
- **Diabetes Hub**: personalized carb budget based on HbA1c, CGM-friendly meal timing, blood sugar predictions per meal
- **Heart Health Hub**: LDL/HDL ratio tracking, sodium budget from actual logs, omega-3 adequacy scoring
- **Kidney Health Hub**: potassium and phosphorus budgets from eGFR, protein restriction calculator
- **Thyroid Hub**: goitrogen avoidance guide personalized to their TSH, selenium/iodine adequacy
- **Inflammation Hub**: CRP trend vs anti-inflammatory food score  
**Acceptance:** A user with diabetes who navigates to the Diabetes Hub sees their actual HbA1c value and a personalized carb budget — not generic advice.

---

## 🟡 P2 — Week 3-4 (Retention + Stickiness)

Features that make users stay and tell others.

### RETAIN-01 — Daily Check-In Streak with Gamification
**Effort:** M | **Status:** `[x]`  
Streak tracking exists in DB. Needs: visual flame counter on dashboard, milestone celebrations (7 days, 30 days, 100 days), streak recovery option (1 freeze per month), leaderboard among users.  
**Acceptance:** Check in 7 days in a row → animated celebration fires. Miss a day → freeze option offered.

### RETAIN-02 — Weekly Health Digest Email ⭐ UNIQUE
**Effort:** M | **Status:** `[ ]`  
Every Monday morning, users receive a personalized digest:
- How their eating compared to their biomarker targets last week
- Top 3 nutrients they're consistently over/under on
- One specific food swap recommendation for the coming week
- Progress toward their health goal
- Their streak and badges  
**Unique angle:** This email is generated by Claude Haiku using their actual data — not a template blast.  
**Acceptance:** Digest fires Monday 8am. Contains real user data. Unsubscribe link works.

### RETAIN-03 — Meal Plan Calendar Sync
**Effort:** M | **Status:** `[~]` (Google OAuth deferred — use Porkbun/DNS level) (SyncToCalendarDialog exists)  
Connect to Google Calendar via OAuth. Each meal appears as an event on the correct day with prep time and ingredients as notes.  
**Acceptance:** User syncs their 7-day plan → meals appear in Google Calendar as events with timing.

### RETAIN-04 — Grocery List with Price Estimates + Retailer Links
**Effort:** M | **Status:** `[x]`  
Grocery list generates but price estimates and retailer links need connecting.  
Add: estimated total cost per week, direct Instacart/Amazon Fresh links for the full list, category grouping (produce, proteins, dairy, pantry), check-off as you shop.  
**Acceptance:** Generate grocery list → see estimated total → one-click sends to Instacart.

### RETAIN-05 — Progress Photos + Body Metrics Timeline
**Effort:** M | **Status:** `[x]`  
ProgressTracking page exists. Add: weight trend chart (already built), body measurement tracking, before/after photo storage, correlation view (weight vs lab markers over time).  
**Acceptance:** User logs weight for 30 days → chart shows trend with correlation to any lab value they choose.

### RETAIN-06 — Referral Program
**Effort:** S | **Status:** `[x]` (ReferAFriend page exists)  
Users who refer a friend who subscribes get 1 free month of Pro. Simple, effective.  
**Acceptance:** User generates referral link → friend signs up → original user's subscription extended by 1 month automatically.

---

## 🟢 P2 — Week 3-4 (New Revenue Streams)

### REVENUE-01 — Practitioner Portal ⭐ UNIQUE B2B CHANNEL
**Effort:** L | **Status:** `[x]` (pages exist, backend partially built)  
**Unique angle:** No meal planning app has a clinical B2B tier.  
Registered Dietitians and Nutritionists can:
- Create accounts for their clients (invitation flow)
- Upload and review client lab results
- Push customized meal plans to clients
- Message clients through the platform
- View client compliance and progress
- Generate monthly reports for clinical notes  
**Pricing:** $49/month for up to 10 clients, $99/month unlimited.  
**Why this matters:** A single practitioner with 50 clients = $99/month and 50 new users who were told to use VitaPlate by their nutritionist. That's the highest-quality acquisition channel possible.  
**Acceptance:** Nutritionist creates account → invites 3 clients → can view their labs and push plans → clients see plans in their dashboard.

### REVENUE-02 — Corporate Wellness Tier
**Effort:** L | **Status:** `[x]` (CorporateAdmin page exists)  
Companies pay $X/employee/month for team nutrition programs.  
Simple MVP: HR admin creates company account → invites employees → gets aggregate (anonymized) team health dashboard → employees get Premium access.  
**Pricing:** $8/employee/month (min 10 employees = $80/month).  
**Acceptance:** Corporate admin creates account → invites 5 test employees → all get Pro access.

### REVENUE-03 — Affiliate/Meal Kit Integration
**Effort:** S | **Status:** `[x]` (AffiliateOrderButtons exists)  
When viewing a grocery list, offer: "Order this as a meal kit from HelloFresh" with affiliate tracking.  
Also: Amazon affiliate links on supplement recommendations.  
**Acceptance:** Click "Order as Meal Kit" → tracked affiliate link fires → AffiliateClick recorded in DB.

---

## 🔵 P3 — Post-Launch (Month 2+)

Features to build once you have real user feedback and know what they actually want.

### FUTURE-01 — CGM Integration (Dexcom/Libre) ⭐ ULTRA-UNIQUE
**Effort:** XL | **Status:** `[ ]`  
**Unique angle:** Show real-time glucose response to specific meals from their plan. "Your Monday breakfast caused a 45 mg/dL spike — here's a lower-glycemic alternative."  
This feature, when built, is a national press story. Wait until core is solid.

### FUTURE-02 — Apple Health / Google Fit Wearable Sync
**Effort:** L | **Status:** `[~]` (integration cards exist)  
Pull steps, sleep, HRV, and heart rate. Correlate activity data with nutrition logs and lab trends.

### FUTURE-03 — Food Photo Logging (AI Camera)
**Effort:** L | **Status:** `[~]` (FoodPhotoLogger exists)  
Point camera at a meal → Claude Vision identifies it → logs nutrition automatically.

### FUTURE-04 — Community Features
**Effort:** XL | **Status:** `[~]` (Forum, SharedRecipes, Community pages exist)  
Shared meal plans, recipe ratings, progress feed, leaderboard. Build after you have 500+ active users or community features feel empty.

### FUTURE-05 — Voice Meal Logging
**Effort:** M | **Status:** `[~]` (VoiceMealLogger exists)  
"I just had grilled salmon with roasted broccoli and brown rice" → logs automatically via speech-to-text + AI parsing.

### FUTURE-06 — FHIR / EHR Integration ⭐ CLINICAL
**Effort:** XL | **Status:** `[~]` (AppleHealthFHIRImport exists)  
Pull lab results directly from Epic, Cerner, or Apple Health FHIR. Eliminates PDF upload step entirely. This is where VitaPlate becomes a clinical-grade tool.

### FUTURE-07 — AI Nutritionist Report Generation
**Effort:** M | **Status:** `[ ]`  
Generate a downloadable 10-page PDF report of a user's nutritional health based on their labs, logs, and plan compliance. Shareable with their doctor.

### FUTURE-08 — Recipe Import from URL
**Effort:** S | **Status:** `[~]` (RecipeImport page exists)  
Paste any recipe URL → scrape → add to recipe library → swap into meal plan.

### FUTURE-09 — Multi-Language Support
**Effort:** L | **Status:** `[ ]`  
Spanish, Portuguese, French. Opens Latin American and European markets. High opportunity given the condition-specific focus.

---

## 📣 Launch Plan

### Pre-Launch (Week 4, Days 1-5)
- [ ] All P0 items complete
- [ ] 10 beta users recruited (5 with real health conditions, 5 general wellness)
- [ ] 3 nutritionists given free Premium accounts for honest feedback
- [ ] Landing page copy rewritten around "Your lab results become your meal plan"
- [ ] 5 Reddit posts drafted (not posted yet) for r/nutrition, r/diabetes, r/PCOS, r/bloodwork, r/EatCheapAndHealthy

### Launch Day (Tuesday of Week 4)
- [ ] Product Hunt submission live at 12:01am PST
- [ ] Reddit r/nutrition post live at 9am EST
- [ ] Email blast to anyone who signed up during beta
- [ ] 3 nutritionist partners post to their audiences

### Post-Launch Week (Week 5)
- [ ] Reddit r/diabetes post (different angle: "I built an app that reads your A1C")
- [ ] Reddit r/PCOS post (thyroid + hormone angle)
- [ ] Reply to every Product Hunt comment personally
- [ ] Monitor activation rate daily — target 40%+ complete meal plan within 48h
- [ ] Fix top 3 issues from beta feedback immediately

---

## 📊 Success Metrics

| Metric | Week 1 Target | Month 1 Target | Month 3 Target |
|---|---|---|---|
| Signups | 50 | 500 | 2,000 |
| Activation rate (plan from labs) | — | 35% | 45% |
| D7 retention | — | 25% | 40% |
| Paid conversions | — | 5% | 12% |
| MRR | $0 | $250 | $2,400 |
| NPS score | — | 40+ | 60+ |

---

## 🔒 Architecture Decisions (Locked)

These decisions are made and should not be revisited without strong data:

| Decision | Rationale |
|---|---|
| Supabase Auth only (not DB) | Railway Postgres is faster, cheaper, fully controlled |
| Claude Sonnet for meal gen, Haiku for everything else | 10x cost difference, quality difference undetectable for chat/lists |
| Cache-first with profile hashing | 70%+ of users get $0 AI cost from template library |
| Redis for plan cache, Postgres for everything else | No over-engineering |
| Railway for hosting | $5/month, simple, scales to thousands of users |
| No paid ads until Month 3 | Need activation + retention data first |

---

## 🚫 Deliberately Deferred (Do Not Build Until Post-Launch)

- Social graph / follower system
- In-app recipe marketplace
- Native iOS/Android app
- Blockchain / Web3 anything
- AI-generated food images (cost vs value poor)
- Real-time collaborative meal planning
- Restaurant menu scanning

---

*This backlog is the source of truth for VitaPlate product development.*  
*All features ship to the `main` branch of robesonw/Vitaplate-core.*  
*Launch date target: End of April 2026.*
