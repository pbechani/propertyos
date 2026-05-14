# Sprint 05 — Agent Viewings

Property viewings from an agent's perspective are far more than "showing a house." They are a data-rich, decision-making, and conversion-driving activity. This document is a structured breakdown for use in system design, product thinking, and engineering.

---

## 1. What an Agent Actually Does During Viewings

### Pre-Viewing (Preparation Phase)

Before the viewing even happens, the agent is already working:

**Client Qualification**

- Budget range (pre-approved? cash buyer?)
- Needs vs wants (bedrooms, location, lifestyle)
- Timeline urgency (urgent vs browsing)
- Decision-making authority (individual, couple, family)

**Property Preparation**

- Confirm property availability
- Ensure cleanliness/staging
- Gather key selling points:
  - Price justification
  - Area insights (schools, transport, security)
  - Unique differentiators

**Logistics**

- Schedule viewing slots
- Route planning (multiple properties in sequence)
- Key access / security clearance
- Safety checks

---

### During the Viewing (Execution Phase)

**1. Property Presentation**

- Walk the buyer through the property
- Highlight features aligned to buyer needs
- Control narrative (frame positives, handle negatives)
- Adjust pitch in real time based on reactions

**2. Buyer Observation (CRITICAL)**

Agents are constantly reading:

- Facial expressions
- Body language (lingering = interest)
- Questions asked (signal intent)
- Silence (often negative signal)

**3. Objection Handling**

- Price concerns
- Location objections
- Condition issues
- Comparison with other properties

**4. Real-Time Qualification**

- "Can you see yourself living here?"
- "How does this compare to what you've seen?"
- "What would stop you from making an offer?"

**5. Micro-Closing**

Encourage next step:

- Second viewing
- Offer discussion
- Financing conversation

---

### Post-Viewing (Follow-Up Phase)

- Capture feedback immediately
- Rank buyer interest level
- Communicate feedback to seller
- Trigger next actions:
  - Negotiation
  - Additional viewings
  - Drop or nurture lead

---

## 2. What Information Agents Need

### Buyer Data

- Personal info (name, contact details)
- Financial:
  - Budget
  - Pre-approval status
- Preferences:
  - Location
  - Property type
  - Must-haves / deal-breakers
- Behavioral profile:
  - Investor vs primary buyer
  - Risk tolerance

### Property Data

- Listing details
- Price history
- Days on market
- Seller motivation (urgent vs flexible)
- Comparable sales (comps)

### Contextual Data

- Market trends
- Area insights
- Competing listings
- Viewing history (what buyer has seen before)

---

## 3. What Agents Capture During Viewings

> This is where most systems are weak — but this is the goldmine.

### Structured Data

- Viewing date & time
- Attendees
- Duration of viewing
- Rooms of interest (tracked via notes or UI clicks)

### Buyer Feedback

- Overall rating (1-5)
- Likes: e.g. "Kitchen", "Garden"
- Dislikes: e.g. "Too small", "Bad neighborhood"

### Behavioral Signals (High Value)

- Time spent per room
- Questions asked
- Emotional reactions
- Comparison statements

### Objections

- Price too high
- Needs renovation
- Layout issues

### Intent Signals

- Interested / Not interested
- Wants second viewing
- Ready to make offer
- Needs partner approval

---

## 4. What Viewings Actually Do for an Agent

### 1. Qualification Engine

Viewings refine:

- Serious buyers vs time-wasters
- Real budget vs stated budget
- Actual preferences vs assumed

### 2. Pricing Intelligence

- If many viewers say "too expensive" -> pricing issue
- If high interest but no offers -> negotiation issue

### 3. Conversion Funnel Movement

Viewings move buyers through stages:

> Awareness -> Interest -> Consideration -> Offer -> Close

### 4. Seller Feedback Loop

Agents use viewing insights to:

- Adjust pricing
- Recommend improvements
- Manage seller expectations

### 5. Relationship Building

- Builds trust with buyer
- Positions agent as advisor (not just salesperson)

---

## 5. What Agents Get Out of Viewings

### Tangible Outcomes

- Offers
- Negotiation leverage
- Buyer pipeline progression

### Intangible Outcomes

- Market intelligence
- Buyer psychology understanding
- Personal brand strengthening

---

## 6. High-Value System Features

> This is where you can differentiate your product massively.

### A. Smart Viewing Capture (Mobile-First)

During viewing (1-tap inputs):

- Like / Dislike per room
- Voice notes -> auto-transcribed
- Emotion tagging: Excited / Hesitant / Negative

### B. AI-Powered Insights

- "Buyer prefers modern kitchens and avoids fixer-uppers"
- "Price resistance detected across 4 buyers"
- "High likelihood of offer within 7 days"

### C. Buyer Profile Evolution (Dynamic)

Instead of static profiles:

- Continuously updated preferences
- Behavior-driven insights
- Hidden preferences detection

### D. Viewing Analytics Dashboard

For agents:

- Conversion rate per viewing
- Avg time to offer
- Drop-off reasons
- Property performance score

### E. Seller Reporting Automation

Auto-generate reports:

- Number of viewings
- Feedback summary
- Market positioning
- Recommended actions

### F. Smart Matching Engine

After viewing:

- Suggest better-matching properties
- Rank listings by likelihood to convert

### G. Objection Intelligence System

Track patterns:

- "Price too high" -> trigger pricing review
- "Needs renovation" -> suggest staging

### H. Multi-Viewing Route Optimization

- Optimize agent schedules
- Cluster viewings geographically
- Reduce travel time

---

## 7. Data Model (System Design Foundation)

### Core Entities

- Buyer
- Property
- Viewing
- Feedback
- Agent
- Seller

### Viewing Object Example

```json
{
  "id": "viewing_123",
  "buyer_id": "buyer_456",
  "property_id": "property_789",
  "agent_id": "agent_001",
  "date_time": "2026-04-09T10:00:00",
  "duration_minutes": 35,
  "interest_level": "high",
  "intent": "second_viewing",
  "feedback": {
    "likes": ["kitchen", "garden"],
    "dislikes": ["price"],
    "notes": "Loved layout but concerned about price"
  },
  "signals": {
    "questions_count": 8,
    "rooms_lingered": ["kitchen", "living_room"],
    "emotional_state": "positive"
  }
}
```

---

## 8. The Real Insight (What Most Systems Miss)

Most platforms treat viewings as: **"A scheduled event"**

In reality, they are: **A high-signal behavioral data capture moment**

If your system captures and leverages this properly, you unlock:

- Predictive deal closing
- Smarter matching
- Faster sales cycles
- Better agent performance

---

## Real-Time Viewing Capture — Mobile UX (Agent App)

A production-grade, real-time mobile UX system for property viewings (50+ screens), structured for product, design, and engineering teams.

### Core Design Principles

- Zero friction capture (1-2 taps max during viewing)
- Live + passive data capture (agent input + system inference)
- Context-aware UI (changes based on viewing stage)
- Offline-first + sync later
- Voice-first input support

---

### App Structure (Navigation)

**Bottom Navigation**

| Tab | Description |
|---|---|
| Today | Scheduled viewings and route |
| Viewings | All viewings history |
| Buyers | Buyer management |
| Properties | Property listings |
| Insights | Analytics and AI reports |

---

### Screen System (50+ Screens)

#### A. Today Dashboard (5 screens)

**1. Today Overview**
- Timeline of scheduled viewings
- Travel time between appointments
- Alerts: "Buyer running late", "High-intent buyer today"

**2. Viewing Card Detail**
- Property preview
- Buyer summary (budget, preferences)
- Quick actions: Start Viewing / Call Buyer / Navigate

**3. Route Optimization**
- Map with optimized sequence
- Traffic-aware adjustments

**4. Pre-Viewing Checklist**
- Property ready?
- Keys/access confirmed?
- Notes from seller

**5. Quick Buyer Brief**
- AI summary: "Prefers modern homes", "Price sensitive above R2.5M"

---

#### B. Viewing Flow — Core (20+ screens)

##### Start Viewing

**6. Start Viewing Screen**
- "Start Viewing" button
- Auto-start timer
- GPS check-in

##### Live Capture Mode (Core UX)

**7. Live Capture Home**
- Floating quick actions: Like / Dislike / Voice note / Photo
- Real-time timeline

**8. Room Selection Overlay**
- Rooms: Kitchen / Living Room / Bedroom
- Tap to log interaction

**9. Room Feedback Screen**
- Quick toggles: Love / Neutral / Dislike
- Tags: "Spacious", "Dark", "Needs renovation"

**10. Voice Capture Screen**
- Tap to record with auto-transcription
- AI extracts: Objections / Preferences

**11. Buyer Reaction Capture**
- Emotion buttons: Love / Unsure / Negative

**12. Question Capture**
- Log buyer questions (typed or voice)
- Auto-categorized: Price / Structure / Area

**13. Objection Capture**
- Quick select: Price too high / Layout issue / Location concern

**14. Interest Level Slider**
- Low -> Medium -> High

**15. Intent Capture**
- Options: Not interested / Second viewing / Make offer

**16. Timeline View**
- Chronological log of events during viewing

**17. Photo Capture**
- Tag photos to rooms
- Annotate issues

**18. Auto Insights (Live)**
- "Buyer showing strong interest in kitchen"
- "Price objection detected"

**19. Silent Mode (Discreet Capture)**
- Minimal UI
- Gesture-based input

**20. Co-Agent Mode**
- Multiple agents capturing simultaneously

##### End Viewing

**21. End Viewing Summary**
- Auto-generated summary
- Editable notes

**22. Final Feedback Screen**
- Structured: Likes / Dislikes / Concerns

**23. Buyer Rating**
- 1-5 stars
- Seriousness score

**24. Next Step Selector**
- Schedule second viewing
- Start offer process
- Send alternatives

**25. Seller Report Preview**
- Auto-generated report

---

#### C. Buyer Management (10 screens)

| Screen | Description |
|---|---|
| 26. Buyer List | Filter by Active / Hot leads |
| 27. Buyer Profile | Budget / Preferences / Viewing history |
| 28. Buyer Insights | AI-generated: "Avoids fixer-uppers", "Prefers suburbs" |
| 29. Viewing History Timeline | All past viewings and feedback patterns |
| 30. Preference Evolution | Before vs after viewings |
| 31. Match Score Screen | Property compatibility % |
| 32. Communication Hub | Messages and call logs |
| 33. Buyer Notes | Persistent notes |
| 34. Buyer Intent Tracker | Funnel stage: Browsing -> Ready to buy |
| 35. Risk Indicators | "Time-waster risk", "Financing uncertainty" |

---

#### D. Property View (8 screens)

| Screen | Description |
|---|---|
| 36. Property List | All managed listings |
| 37. Property Detail | Images / Key facts / Seller notes |
| 38. Viewing Performance | Count of viewings and interest levels |
| 39. Feedback Heatmap | Which rooms perform best |
| 40. Objection Trends | "80% say price too high" |
| 41. Price Sensitivity Analysis | Price resistance patterns |
| 42. Seller Notes & Instructions | Agent-visible seller context |
| 43. Comparable Properties | Market comps view |

---

#### E. Insights & Analytics (7 screens)

| Screen | Description |
|---|---|
| 44. Agent Performance Dashboard | Conversion rate / Avg time to close |
| 45. Viewing Analytics | Viewings to Offers ratio |
| 46. Buyer Insights Dashboard | Top preferences / Drop-off reasons |
| 47. Property Performance Ranking | Best and worst performing listings |
| 48. AI Recommendations | "Reduce price by 5%", "Stage kitchen" |
| 49. Weekly Report | Automated weekly summary |
| 50. Notifications & Alerts | High-intent buyer alerts / Follow-up reminders |

---

### Advanced UX Features

**1. Voice-First Interaction**

Agent speaks naturally — e.g. "Buyer likes kitchen but price is high" — and the system extracts structured data automatically.

**2. AI Co-Pilot (During Viewing)**

Real-time prompts: "Ask about financing", "Highlight backyard"

**3. Passive Data Capture**

- Time spent per room (via motion/GPS)
- Movement patterns

**4. Offline Mode**

- Full functionality without internet
- Sync later

**5. Instant Follow-Up Automation**

After viewing, auto-send:
- Property brochure
- Similar listings

---

### UX Interaction Patterns

| Pattern | Mechanic |
|---|---|
| Tap-Based (Fastest) | Like/Dislike reactions, tags |
| Swipe-Based | Swipe right = positive, swipe left = negative |
| Voice-Based | Natural input -> AI structured output |
| Gesture-Based (Discreet) | Double tap = like, hold = record |

---

### System Intelligence Layer

**Real-Time Scoring**

- Buyer Intent Score (0-100)
- Property Fit Score
- Offer Probability

**Pattern Detection**

- Repeated objections across buyers
- Hidden preferences

---

## Why This System Is Elite

This UX turns viewings into:

- **Behavioral data capture engine**
- **Predictive sales system**
- **AI-assisted decision platform**
