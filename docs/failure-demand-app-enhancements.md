# Failure-Demand App — Enhancement Roadmap (v2)

**How to close every best-practice gap without slow traditional discovery — sequenced into delivery waves optimised for speed, impact and low re-work.**

The organising insight is unchanged but sharpened: **you hold one asset — the classified transcript corpus — and almost every enhancement is another enrichment pass or model that reuses it.** So the roadmap is not a list of projects; it is a small number of *passes over the same data* plus four external joins, sequenced so the cheapest, highest-impact, risk-reducing work lands first.

---

## Speed & efficiency principles (apply to every wave)

1. **One corpus, many passes.** Never re-extract. Every analysis is a pass over, or a model fed by, the single anonymised corpus.
2. **Cheapest signal first.** Web analytics and metadata are near-free — mine them before expensive builds.
3. **Prove small, then scale.** A pilot gates every heavy run; no full run against an unvalidated method.
4. **Parallel arms, shared spine.** The four enrichment arms (systems, equalities, workforce, business case) share only the corpus, so they run concurrently and never block each other.
5. **Idempotent & incremental.** Every pass is checkpointed and re-runnable on deltas only, so re-baselining is minutes, not weeks.
6. **Gate, don't guess.** Work downstream of a gate does not start until the gate is green (see delivery plan G0–G6).

---

## Wave map

| Wave | Theme | Unlocks | Runs in parallel? |
|---|---|---|---|
| **0** | Foundations & fast signal | Legal-to-proceed, early hypotheses | F-series concurrent |
| **1** | Core intelligence | The corpus everything else reuses | Critical spine |
| **2** | Enrichment arms | Systemic, equalities, workforce insight | 4 arms concurrent |
| **3** | Decision & delivery | Business case, go-live, benefits | Gated |

---

## Wave 0 — Foundations & fast signal *(week 1–2, concurrent)*

| Module | Purpose | Effort | Impact | Speed lever |
|---|---|---|---|---|
| **DPIA + anonymise-on-ingest design** | Legal-to-proceed; the classic blocker, cleared first | M | Critical | Low risk profile → faster IG sign-off |
| **Early web-analytics pull (GA4, site-search)** | Free hypotheses that steer the expensive analysis | S | High | Data already exists |
| **Data-quality & join-key assessment** | Confirms the external joins are viable before you depend on them | S | High | De-risks the long-pole early |

**Wave 0 exit (G1):** IG signed, join keys confirmed, first web-demand hypotheses in hand.

---

## Wave 1 — Core intelligence *(week 2–6, critical spine)*

| Module | Purpose | Effort | Impact | Speed lever |
|---|---|---|---|---|
| **Extraction pipeline (anonymise-on-ingest)** | The reusable ingest; built once, re-run forever | M | Critical | Idempotent; powers re-baselining |
| **Calibration pilot + gold-standard set** | Validates taxonomy & model accuracy on a small sample | M | Critical | Prevents 50k-scale re-work |
| **Core classifier** (driver → root cause → value/failure → prevention) | The corpus every arm reuses | L | Critical | Bulk model + prompt caching + batch |
| **Demand model & insight pack** | Sized, ranked demand; top-ten services | M | Critical | Auto-generated from classified corpus |

**Wave 1 exit (G2 passed earlier; insight pack signed):** classified corpus + demand model live. **This is the moment the four arms fan out.**

---

## Wave 2 — Enrichment arms *(week 5–10, four arms concurrent)*

### Arm A — Systems thinking
| Module | Output | Speed lever |
|---|---|---|
| **System-conditions classifier** *(build first — biggest insight uplift)* | Systemic-cause Pareto ("what we do to ourselves") | Pure corpus pass, no external join |
| **Journey-stitching** | Repeat-contact chains + rate | Needs identity join (started Wave 0) |
| **Flow / value-stream reconstruction** | Lead time, right-first-time %, rework | Case-mgmt timestamp join |
| **Trigger correlation** | Demand our own events create | Event-calendar join |

### Arm B — Equalities *(aggregate-only; DPIA-covered)*
| Module | Output | Speed lever |
|---|---|---|
| **Vulnerability/accessibility signal classifier** | Prevalence by driver | Corpus pass |
| **Digital-exclusion risk scorer** *(priority — de-risks PSED)* | Per-intervention exclusion score + "retain assisted route" flags | Reuses vulnerability tags |
| **Equalities heat-map** | Differential-failure map | IMD/LSOA join |
| **WCAG checker + EqIA generator** | Accessibility defects + evidence-based EqIA | Automated |

### Arm C — Workforce
| Module | Output | Speed lever |
|---|---|---|
| **Advisor pain-point classifier** | Training + KB backlog + QA | Corpus pass (advisor side) |
| **Automation-suitability scorer** | Automatable vs human split | Corpus pass |
| **Capacity & workforce-shape model** | FTE reshape curve by skill | Fed by demand model |
| **Reskilling planner** | Transition plan for consultation | Fed by capacity model |

### Arm D — Business case *(builds while design/testing runs)*
| Module | Output | Speed lever |
|---|---|---|
| **Benefits calculator** | Cashable/non-cashable ranges | Fed by demand + capacity models |
| **Financial model** | NPV, payback, sensitivity | Parameterised |
| **Dis-benefit adjustment** | Risk-adjusted benefits | Guardrail metrics |

**Wave 2 exit:** every arm's evidence ready *before* its gate needs it (G3 investment, G4 equalities).

---

## Wave 3 — Decision & delivery *(week 9–16+, gated)*

| Module | Purpose | Gate |
|---|---|---|
| **Intervention backlog** | Prioritised (WSJF/impact-effort), owned prevention actions | — |
| **Options appraisal** | Do-nothing/min/something, scored incl. equalities | **G3** |
| **Prototype & test with users (Alpha)** | Validate the *solution*, not just the analysis | **G5** |
| **Delivery** | IVR, web content, forms, omni-channel, RPA, cross-skilling | G3+G4+G5 |
| **Benefits tracker + re-baseline** | Prove reduction; refresh backlog | **G6** |

---

## Build order (single prioritised list)

1. DPIA/anonymisation design → **G1**
2. Web-analytics pull + data-quality assessment *(parallel)*
3. Extraction pipeline
4. Calibration pilot + gold-standard → **G2**
5. Core classifier (full run)
6. Demand model & insight pack
7. **System-conditions classifier** *(first arm module — highest uplift)*
8. **Vulnerability classifier + digital-exclusion scorer** *(de-risks PSED)*
9. Identity/case-mgmt joins → journey-stitching + flow reconstruction
10. Automation-suitability + capacity/reshape model
11. Benefits calculator + financial model
12. Advisor pain-point, trigger correlation, equalities heat-map, WCAG, EqIA generator *(fill-in, parallel)*
13. Intervention backlog → options appraisal → **G3**
14. Prototype & test → **G5** → delivery
15. Benefits tracker → re-baseline → **G6**

Every step reuses the same corpus and pipeline; none restarts discovery. The forensic *how* for each module is in the companion **Rebuild Specification**.
