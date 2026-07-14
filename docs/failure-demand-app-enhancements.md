# Failure-Demand App — Enhancement Roadmap

**How to close the best-practice gaps *without* slow traditional discovery — by building further enrichment passes and models on top of the transcript corpus you already hold.**

The unifying principle: every enhancement below is either **one more classification/enrichment pass over the existing corpus** or **a model fed by the existing demand output**, plus a small number of external data joins:

| External join | Used for |
|---|---|
| Case-management status timestamps | Flow / value-stream reconstruction |
| Deprivation indices (IMD / LSOA by postcode) | Equalities differential analysis |
| Activity-based cost-to-serve per channel | Benefits / business case |
| Operational event calendar (billing runs, letters, collections, outages) | Demand-trigger correlation |

Transcripts stay the engine. These modules just make the *same* data carry systemic, equalities, workforce and financial weight.

---

## 1. Systems Thinking

**What it precisely means here:** explain the *system that produced the call*, not just the call. Three moves — re-classify by system condition, reconstruct the flow, prove the upstream trigger.

### Modules to build

| Module | What it does | Output |
|---|---|---|
| **System-conditions classifier** *(highest value)* | One more LLM pass tagging each failure contact with the system condition that manufactured it, from a defined library (e.g. *no proactive notification*, *contradictory letters*, *form needs info resident can't have*, *target-driven handoff*, *IT can't transact*, *policy re-verification*). | A **systemic-cause Pareto** — "top 10 things the organisation does to itself that make the phone ring" — each with an owner. |
| **Journey-stitching / sequence-mining** | Identity resolution (CLI, case ref, address) + sequence reconstruction across touchpoints and time. | Repeat-contact chains, failure loops, channel-hopping — "X% of failure demand is repeat contact; mean 2.7 contacts per resolution." |
| **Flow / value-stream reconstruction** | Join transcripts to case-management timestamps. | End-to-end lead time, **right-first-time %**, handoffs, rework, wait — a value-stream map per top service, built from data not a workshop. |
| **Demand-trigger correlation** | Correlate contact volume against an operational-event calendar. | "What we sent that made the phone ring" — the demand our own processes create. |

**Defines a new KPI:** *purpose delivered first time* — how often the system does, first time, what the resident actually contacted for.

---

## 2. Equalities Lens

**What it precisely means here:** quantify differential impact from the data, at population level — not a slow subjective workshop. Satisfies the Public Sector Equality Duty (Equality Act 2010 s.149).

> **Governance note:** vulnerability extraction is **aggregate-only, not individual profiling**, with a safeguarding-routing exception where a live risk surfaces. This must be covered explicitly in the DPIA and an ethics review.

### Modules to build

| Module | What it does | Output |
|---|---|---|
| **Vulnerability / accessibility signal classifier** | LLM pass flagging population-level markers: digital exclusion, language barrier, disability/health, frailty, financial hardship, literacy, caring/safeguarding. | Prevalence overall and **by driver** — which failures fall hardest on whom. |
| **Equalities heat-map** | Join contact / answer-rate / failure to deprivation indices (IMD / LSOA — area data, not protected personal data). | Differential-failure map across communities. |
| **Digital-exclusion risk scorer** *(killer output)* | For every proposed channel shift, compute the share of that driver's contacts carrying exclusion/accessibility markers. | Quantified EqIA evidence + automatic **"retain assisted/phone route"** flags per intervention. |
| **Automated WCAG 2.2 checker** | Accessibility scan wired into the form/content build pipeline. | Pass/fail + defect list before rollout. |
| **Data-driven EqIA generator** | Assembles the above into the EqIA template. | A defensible, evidence-based EqIA — fast. |

---

## 3. Workforce Lens

**What it precisely means here:** the *voice of the advisor* (also free in the transcripts) plus an honest model of the FTE/skills *reshape* behind the headline reduction.

### Modules to build

| Module | What it does | Output |
|---|---|---|
| **Advisor pain-point / knowledge-gap classifier** | LLM pass over the advisor side of the transcript — holds, transfers, workarounds, "let me just check", apologising for the system. | Training needs, knowledge-base gaps and QA themes at scale — no observation sessions. |
| **Capacity & workforce-shape model** | `FTE = f(residual demand × AHT × target service level)`, by skill, over the transformation timeline. | A **reshape curve** — which roles shrink (transactional) and which grow (complex case, assisted digital, proactive outreach) — not just a headcount cut. |
| **Automation-suitability scorer** | Score each driver's automatability (RPA / agentic AI vs must-stay-human). | Which FTE effort is genuinely removable vs must be reskilled; feeds cashable/non-cashable and phasing. |
| **Reskilling / redeployment planner** | Skills matrix mapping residual + emerging work to current staff. | A workforce transition plan for consultation with unions and members. |

**Why the reshape framing matters:** phasing via attrition/vacancy management rather than redundancy, and a visible growth path, is what keeps unions, members and morale onside — and what makes the saving deliverable rather than just modelled.

---

## 4. Business Case Rigour

**What it precisely means here:** everything above already feeds a Green Book **Five Case Model** — it just needs wiring up. Best practice adds options appraisal, dis-benefits, and financial rigour.

### Modules to build

| Module | What it does | Output |
|---|---|---|
| **Benefits calculator** | Each intervention's volume reduction × activity-based cost-to-serve per channel. | £ benefit range, split **cashable / non-cashable**, with an assumptions register. |
| **Options-appraisal engine** | Score do-nothing / do-minimum / do-something(s) on cost, benefit, risk, deliverability *and* equalities impact. | A comparison table, auto-populated from the demand model. |
| **Financial model** | Costs (build / run / change) vs benefits over 3–5 years. | NPV, payback, and **sensitivity / Monte-Carlo** on the assumptions that swing it (adoption, deflection, AHT). |
| **Dis-benefit & risk adjustment** | Model the gaming risk — deflecting a call without solving the need just moves failure demand — and discount benefits accordingly. | Risk-adjusted benefits + guardrail metrics. |
| **Benefits-realisation tracker** | Baseline → target → actual, fed by the re-baselining loop. | Live benefits dashboard, closing back to the process's Stage 7. |

---

## Build sequence (suggested)

1. **System-conditions classifier** — biggest insight uplift, pure corpus pass, no external join.
2. **Vulnerability signal classifier + digital-exclusion scorer** — de-risks the equalities/PSED exposure that a channel-shift programme carries.
3. **Journey-stitching + flow reconstruction** — needs the case-management join; unlocks the repeat-contact and rework picture.
4. **Capacity/workforce model + benefits calculator** — turn the demand model into the workforce reshape and the business case.
5. **Advisor pain-point classifier, trigger-correlation, options-appraisal & financial model** — round out assurance and the Five Case.

Each step reuses the same corpus and pipeline; none requires restarting discovery.
