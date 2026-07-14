# Multi-Channel Demand & Failure Demand Reduction — End-to-End Process

**A copy of the delivery process for the AI-driven application built to review council contact (calls, web and email), surface failure demand, and design out the causes.**

Morrison Consulting / Marrufo Consultancy Ltd — Tony Morrison
Reference build: London Borough of Waltham Forest contact centre transformation (280,000 calls per year → 36% call volume reduction, 100,000+ unnecessary calls eliminated per year). Figures confirmed against the *Resident Experience, Digital and Technology Update* — Scrutiny Committee, 24 March 2026.

---

## 1. Purpose & Scope

The application exists to answer a question that traditional contact-centre reporting cannot: **not just *how many* residents are contacting the council, but *why*, and *what would stop the contact being necessary in the first place*.**

It does this by ingesting real contact across every channel — **telephone calls, web/self-service, and email** — running it through a structured AI analysis framework, and turning the output into a prioritised, costed programme of interventions that remove **failure demand** (contact caused by something not being done, or not being done right, for the resident).

**In scope**
- Telephone contact (call recordings/transcripts via the telephony API — e.g. 8x8)
- Web and self-service contact (forms, page journeys, search, chat/deflection)
- Email and corporate correspondence / complaints
- Root-cause and failure-demand classification
- Intervention design, delivery and benefits realisation

**Out of scope (handled by partner workstreams)**
- Statutory case management systems of record
- Core line-of-business process re-platforming (fed *from* this process as requirements)

---

## 2. Core Definitions

| Term | Working definition used by the app |
|---|---|
| **Value demand** | Contact the council *wants* — a genuine, first-time request for a service the resident is entitled to. |
| **Failure demand** | Contact caused by a failure to do something, or to do it right, for the resident — chasing, re-explaining, correcting, escalating. The primary target for elimination. |
| **Call/contact driver** | The specific reason a resident made contact (e.g. "chasing a missed bin collection"). |
| **Root cause** | The underlying system, process, content or channel failure that generated the driver. |
| **Prevention action** | The specific, owned intervention that removes or deflects the driver at source. |

---

## 3. Process at a Glance

```
        INPUTS                    THE APP / ANALYSIS ENGINE                 OUTPUTS
   ┌───────────────┐        ┌──────────────────────────────────┐     ┌────────────────────┐
   │ Calls (8x8)   │        │ 1. Extract & ingest              │     │ Failure-demand map │
   │ Web / forms   │  ───▶  │ 2. Anonymise (GDPR)              │ ──▶ │ Prioritised backlog│
   │ Email / corr. │        │ 3. Classify (driver/root cause)  │     │ Intervention pack  │
   │ Ops MI / cost │        │ 4. Model & quantify demand       │     │ Benefits case      │
   └───────────────┘        │ 5. Design interventions          │     └────────────────────┘
                            └──────────────────────────────────┘
                                          │
                                          ▼
                        DELIVERY ──▶ MEASURE ──▶ RE-BASELINE (continuous loop)
```

The process is a **loop, not a line**. Once interventions land, the same pipeline re-runs on fresh contact to confirm the demand has actually gone (not just moved channel) and to surface the next priorities.

---

## 4. The Products (What Gets Built)

The delivery is made of a small number of reusable **products** that each have clear inputs and outputs. They are listed here once, then referenced by the stages in Section 5.

| # | Product | What it is | Primary owner |
|---|---|---|---|
| P1 | **Data extraction pipeline** | API pulls + secure landing for calls, web analytics/forms and email. | Data / engineering |
| P2 | **Anonymisation & governance layer** | PII redaction, DPIA, retention rules, access control. | Information governance |
| P3 | **AI analysis model** | The structured classification framework: driver → root cause → failure/value → prevention action, run over transcripts and text. | Analysis lead |
| P4 | **Demand model & insight pack** | Quantified, ranked view of demand by service, channel, driver and cost. | Analysis lead |
| P5 | **Intervention backlog** | Prioritised, owned, costed set of prevention actions. | Product owner |
| P6 | **Delivery products** | IVR redesign, top-service web content, self-service forms, omni-channel config, staff cross-skilling, complaint handling. | Delivery teams |
| P7 | **Benefits & QA framework** | Baseline, targets, tracking, quality assurance and re-baselining. | Programme / finance |

---

## 5. End-to-End Process — Stage by Stage

> **Sequencing principles (why the order is what it is).** Three deliberate refinements keep the process efficient and low-risk:
> 1. **Governance before bulk extraction.** The DPIA and anonymisation approach are locked *before* the full data pull, and data is **anonymised on ingest** — raw PII never lands in the analysis environment. Sequencing governance after extraction (a common mistake) creates both a compliance exposure and re-work if redaction rules change what you needed to keep.
> 2. **A calibration pilot before full scale.** A small sample runs end-to-end first to prove the taxonomy and model accuracy, so the expensive full run isn't classified against a framework you then have to revise.
> 3. **Cheapest signal first.** Web analytics usually already exists and costs almost nothing — it is pulled up front to *shape* where the more expensive call analysis looks, rather than being processed only in parallel.

### Stage 0 — Mobilisation & Discovery
**Aim:** agree the problem, the mandate and the measurement baseline before touching data.

- **Inputs:** contact-centre MI (volumes, answer rates, wait times, AHT, cost to serve), organisation chart, service catalogue, existing channel strategy, political/leadership priorities.
- **Activities:** confirm scope and channels; secure sponsor and information-governance sign-off; **complete the DPIA and agree the anonymisation approach now, before any bulk pull**; define the baseline and the definition of "failure demand" with operational leaders; agree success measures; **pull the already-available web analytics (GA4, site search) as an early hypothesis-former.**
- **Products/Outputs:** agreed scope & mandate; **baseline pack** (e.g. 280,000 calls/yr; answer rate 54.4% at its worst point); measurement plan; data-access approvals; **completed DPIA and anonymisation design (P2)**; first web-demand hypotheses.

### Stage 1 — Data Extraction & Ingestion
**Aim:** get a representative, defensible sample of real contact off the operational systems and into a safe analysis environment — safely.

- **Inputs:** telephony platform (8x8) call recordings/transcripts **plus call metadata** (abandonment, IVR drop-off, repeat-caller data); web analytics, self-service form submissions and search/chat logs; email and corporate correspondence / complaints records; signed-off DPIA and anonymisation design (Stage 0).
- **Activities:** build API extraction (P1) with **anonymise-on-ingest** so PII is redacted at the point of capture; first pull a **small validation sample** for the calibration pilot (Stage 1.5); once the taxonomy is proven, pull the full statistically meaningful sample (reference build used **50,000 call transcripts**); capture matching web and email contact for the same period and services; validate completeness and representativeness (period, seasonality, service mix).
- **Products/Outputs:** anonymised contact dataset landed securely across all three channels; reusable extraction pipeline (P1); governance layer (P2) live.

### Stage 1.5 — Calibration Pilot (thin slice)
**Aim:** prove the analytical framework on a small sample before committing to full-scale processing.

- **Inputs:** small validation sample (Stage 1); draft failure-demand taxonomy; service knowledge from operational leads.
- **Activities:** run the classification framework over the sample; **build a human-labelled gold-standard set** and measure model precision/recall; review results with service experts and refine the taxonomy; confirm the extraction fields are the right ones.
- **Products/Outputs:** validated taxonomy; model accuracy baseline; go/no-go decision to scale — **only then does the full extraction and Stage 3 run at volume.**

### Stage 2 — Preparation & Structuring
**Aim:** make the anonymised data analysis-ready without losing analytical value.

- **Inputs:** anonymised dataset (Stage 1); retention and access policy.
- **Activities:** de-duplicate; normalise transcripts and text; tag by service, channel, date, and outcome where known; stitch cross-channel journeys where an identifier allows (did this caller first try the website?).
- **Products/Outputs:** clean, structured corpus ready for classification; audit trail.

### Stage 3 — AI Analysis & Classification
**Aim:** turn unstructured contact into a structured, comparable dataset of *why* people contacted the council.

- **Inputs:** anonymised corpus (Stage 2); service knowledge from operational leads.
- **Activities:** run the **structured analytical framework** (P3) over calls, web and email to classify each contact by: **contact driver → root cause → value vs failure demand → recommended prevention action.** Calibrate the model against a human-reviewed sample for accuracy; iterate the taxonomy with service experts.
- **Products/Outputs:** classified contact dataset; **failure-demand taxonomy**; the trained/validated AI analysis model (P3) reusable across channels.

### Stage 4 — Demand Modelling & Insight
**Aim:** quantify and rank the demand so investment goes where the return is greatest.

- **Inputs:** classified dataset (Stage 3); volume and cost-to-serve data (Stage 0).
- **Activities:** size each driver by volume, channel and cost; identify the **top ten services** driving contact; separate value from failure demand; model the addressable reduction and the benefit of each prevention action.
- **Products/Outputs:** **Demand model & insight pack** (P4) — failure-demand map, top-driver ranking, channel-shift opportunities, and a benefits estimate per intervention.

### Stage 5 — Intervention Design & Prioritisation
**Aim:** convert insight into a deliverable, owned, costed backlog.

- **Inputs:** insight pack (P4); operational and IT constraints; resident/user needs.
- **Activities:** design specific prevention actions per driver; sequence by value, effort and dependency; assign owners; write requirements for downstream systems (web CMS, forms, telephony/IVR, CRM, complaints).
- **Products/Outputs:** **Intervention backlog** (P5) — prioritised, costed, owned; target operating model / digital front-door blueprint where relevant.

### Stage 6 — Delivery & Implementation
**Aim:** build and land the interventions that remove the demand.

- **Inputs:** intervention backlog (P5).
- **Activities & delivery products (P6):**
  - **IVR redesign** — route and deflect at first contact.
  - **Web content overhaul** for the top ten services — answer the question before the call.
  - **Self-service form redesign** — make the digital route genuinely usable.
  - **Cloud-based omni-channel contact centre** implementation.
  - **Email / complaints handling** improvements and automation (RPA where it fits).
  - **Staff cross-skilling using AI tools** — QA, knowledge, and assisted handling.
  - **Change management throughout** — engagement, training, resistance management, leadership buy-in.
- **Products/Outputs:** live interventions; updated content, forms, IVR and channels; trained staff.

### Stage 7 — Benefits Realisation & Continuous Improvement
**Aim:** prove the demand has gone, bank the benefit, and find the next priority.

- **Inputs:** delivered interventions (Stage 6); benefits framework (P7); fresh contact data.
- **Activities:** measure against baseline; QA classification accuracy and service quality; check demand hasn't simply moved channel; **re-run the pipeline (Stages 1–4) on new contact** to re-baseline and refresh the backlog.
- **Products/Outputs:** benefits report; QA findings; refreshed backlog; sustained reduction (reference build, per the March 2026 scrutiny report: **36% call reduction — 1,242 to 790 calls/day, ~100,000 fewer calls a year; answer rates 54.4% → 85.5%; average wait 19m45s → 6m26s; advisors 33 → 21 (−36%); £914k recurring annual benefits against £3.109m invested, break-even 2028/29**).

---

## 6. Inputs & Outputs by Channel

| Channel | Key inputs (source) | What the app extracts | Typical interventions | Output measures |
|---|---|---|---|---|
| **Calls** | Call recordings/transcripts via telephony API (8x8); IVR routing data; volumes, answer rate, AHT, wait time | Contact drivers, root cause, failure vs value demand, prevention actions | IVR redesign, deflection, omni-channel, staff cross-skilling | Call volume ↓, answer rate ↑, FTE ↓, cost to serve ↓ |
| **Web / self-service** | Web analytics, form submissions, on-site search, chat/deflection logs | Failed journeys, content gaps, form abandonment, unanswered questions | Top-ten-service content overhaul, self-service form redesign, front-door blueprint | Deflection ↑, form completion ↑, avoidable calls ↓ |
| **Email / correspondence** | Corporate mailboxes, complaints records | Repeat/chasing contact, correspondence-driven failure demand | Automated handling/RPA, complaints management, process fixes | Email/complaint volume ↓, resolution time ↓ |

---

## 7. Data Robustness, Blind Spots & Additional Tests

Call transcripts are rich, but on their own they measure only the demand that **arrived and got through**. The largest pools of failure demand often sit in the gaps between channels. This section makes those gaps explicit and adds the tests that surface them.

### 7.1 Known blind spots in a transcript-only view

| Blind spot | Why it hides failure demand |
|---|---|
| **Survivorship / unanswered contact** | Transcripts capture *answered* calls only. At the worst point only 54.4% of calls were answered — nearly half of callers never connected — abandoned calls, repeat dialling and callback failures are invisible, yet often represent the *most* failed residents. |
| **Deflection-failure demand** | Residents who tried self-service, failed, then called. The call is logged; the failed online journey that caused it is not. |
| **Silent unmet demand** | Residents who failed online and gave up, or went to a councillor/MP instead. Appears in no contact log. |
| **Self-selection** | Digitally excluded residents are over-represented in calls; digitally confident residents under-represented. |
| **Temporal / seasonal skew** | A snapshot sample can miss billing runs, garden waste, school admissions and elections. |
| **Transcription quality** | Accents, noise and mis-tagged services degrade classification accuracy. |

### 7.2 Additional discovery tests (highest value, lowest cost first)

| Test / source | Unseen demand it exposes | Cost |
|---|---|---|
| **GA4 site-search analytics** | Zero-result and top search terms — residents literally typing what they can't find. Direct content-gap evidence. | Low |
| **Heatmaps + session replay** (Microsoft **Clarity** — free; Hotjar) | Rage clicks, dead clicks, quick-backs, scroll drop-off — *where* the digital journey breaks before it becomes a call. | Low |
| **Form field-level analytics** | The exact field that kills a self-service form (abandonment by field). | Low |
| **Funnel / conversion analysis** | Start-to-complete rate for each top-ten journey. | Low |
| **Telephony metadata** (beyond transcripts) | Abandonment rate, IVR menu drop-off, and **repeat-caller analysis** (same number within X days = chasing = failure demand). | Low |
| **Front-line advisor workshops** | Advisors name the top failure drivers in an afternoon — fast triangulation. | Low |
| **Post-contact surveys / IVR reason-for-contact** | "Did this resolve your issue?" and self-reported driver. | Medium |
| **Usability testing / mystery shopping** on top-ten journeys | Watch real residents fail a task in real time. | Medium |
| **Complaints + MP/councillor enquiry themes** | Concentrated, high-severity failure demand. | Low |
| **Back-office process data** (SLA breaches, rework) | The origin of the chase call — failure demand *before* the phone rings. | Medium |

### 7.3 Making the data defensible

- **Gold-standard validation set** — a human-labelled sample to measure classifier precision/recall (established in the Stage 1.5 pilot).
- **Triangulation** — cross-check call drivers against site-search terms and advisor workshops. Where they **agree**, confidence is high; where they **diverge**, that divergence points straight at the unseen demand.
- **Representativeness checks** — sample size/confidence intervals on driver proportions, and coverage across seasons and services.
- **Cross-channel stitching** — link a call back to a preceding failed web session wherever an identifier allows, to size deflection-failure demand.

> **The one-line takeaway:** transcripts tell you why residents *called*; heatmaps, GA site-search and telephony abandonment/repeat-caller data tell you why they *couldn't* — or *didn't*. Adding those three closes the biggest blind spots at very low cost.

---

## 8. Roles & Governance

| Role | Responsibility in this process |
|---|---|
| **Sponsor / SRO** | Mandate, funding, political and leadership cover. |
| **Programme/Product Owner** | Owns the backlog (P5), prioritisation and benefits. |
| **Analysis lead** | Owns the AI model (P3) and insight pack (P4); calibrates accuracy. |
| **Information governance** | Owns the DPIA and anonymisation layer (P2). |
| **Data / engineering** | Owns extraction pipeline (P1) and integrations. |
| **Delivery teams** | Build the delivery products (P6): web, forms, IVR, telephony, complaints. |
| **Operational leads / front line** | Validate drivers, own prevention actions, make change stick. |

**Governance gates:** Stage 0 mandate **& DPIA/anonymisation sign-off (before any bulk extraction)** → Stage 1.5 pilot go/no-go to scale → Stage 4 investment decision → Stage 6 go-live approval → Stage 7 benefits sign-off.

---

## 9. Key Principles

1. **Evidence before opinion.** Interventions come from classified real contact, not assumption.
2. **Attack the cause, not the symptom.** The target is failure demand at root, not faster handling of avoidable contact.
3. **Every channel, one framework.** Calls, web and email are analysed through the same driver→root-cause→prevention model so demand can't just hide by moving channel.
4. **Governance first.** Anonymisation and DPIA are prerequisites, locked before extraction — not afterthoughts.
5. **Prove it small, then scale.** A calibration pilot validates the taxonomy and model accuracy before the full run, avoiding costly re-work.
6. **Mind the gaps.** Transcripts miss the un-connected and the deflected — triangulate with web analytics, heatmaps and telephony metadata to see the unseen demand.
7. **Prioritise ruthlessly.** The top ten services usually explain the majority of avoidable demand — start there.
8. **Change makes it stick.** Technology only delivers value when staff and residents actually use it — engagement and training are in the critical path.
9. **Close the loop.** Re-baseline on fresh data to confirm the demand is gone and to find what's next.

---

*Prepared by Morrison Consulting. Reference implementation: AI-Driven Contact Centre Transformation, London Borough, 2023–2026.*
