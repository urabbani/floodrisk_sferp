# AI Integration Plan for Flood Risk Dashboard

## Context

The project is a React/TypeScript flood risk GIS application for the Indus River region:

- **42 flood scenarios**: 2 climates (present/future) × 3 maintenance (breaches/reduced capacity/perfect) × 7 return periods (2.3–500 yrs)
- **240 EAD data points**: 4 asset types × 10 regions × 2 climates × 3 maintenance
- **Impact matrices**: 9 exposure types (population, buildings, roads, etc.) across all scenarios
- **Risk dashboard**: 4 views — Summary Heatmap, District Breakdown, Spatial choropleth, EAD
- **GeoServer WMS**: Real flood scenario rendering (depth, velocity, duration, V×h)
- **Interventions**: 42 hardcoded types, drawing, auth, export
- **Existing report**: Template-based docx generator (`scripts/generate-ead-report.mjs`, added in commit 32451ae) — no LLM involvement, just structured templates with placeholders

**Reference studied:** H2O.ai Flood Intelligence Agent (NVIDIA-H2O.ai prototype) — learned architectural patterns but rejected the implementation (NVIDIA lock-in, US-only data, agent framework overhead).

**Key files:**
- `public/data/risk.json` — pre-computed EAD data
- `src/types/risk.ts` — `EadResult` type definition (LLM input schema)
- `src/components/risk-dashboard/views/RiskEadView.tsx` — EAD view component (AI report target)
- `scripts/generate-ead-report.mjs` — existing template-based report generator (extend, don't replace)
- `src/components/impact-matrix/` — impact matrix data flow

---

## Proposed AI Integration (Fresh Approach)

### Decision: Deployment Model

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| Browser-side (direct API call to LLM provider) | Simpler, no backend changes | Exposes API key, sends raw data from browser | **Avoid** — government project, data privacy concerns |
| Backend proxy (your existing API server on port 3001) | Keeps API key server-side, can anonymize data before sending, rate limiting | Requires adding endpoints to `impact-summary.mjs` | **Recommended** |

**Decision:** Use the existing API server as a proxy. All LLM calls go through `localhost:3001/api/ai/*`.

### Data Privacy Considerations

- Only send aggregated, anonymized data to LLM providers
- Never send raw exposure coordinates, building locations, or population counts per household
- District-level EAD totals and scenario metadata are safe to send
- Consider adding a `--anonymize` mode to the data serialization step

### Cost & Latency

- LLM calls: ~$0.002–$0.01 per generation (depending on provider)
- Latency: 2–10 seconds for full report generation
- Cache expensive LLM outputs by input hash to avoid re-generation
- Provide "loading" states in UI — never block the user

---

## Phase 1: High-Value, Low-Friction

### 1.1 AI-Enhanced EAD Report Generator

**What:** Extend the existing template-based report generator to include an AI-generated narrative section (executive summary, key findings, recommendations).

**Data flow:**
```
RiskEadView (user selects climate + maintenance)
  → Frontend serializes EadResult[] + metadata
  → POST /api/ai/report → Backend
  → Backend anonymizes (aggregates to district-level, strips PII)
  → Sends prompt + data to LLM
  → Receives narrative text
  → Existing script (generate-ead-report.mjs) inserts narrative into docx template
```

**Input to LLM:**
- `EadResult[]` array (climate, maintenance, region, ead per asset type, eadTotal)
- Selected climate + maintenance context
- 2–3 sentences of instructions (system prompt)

**Output:** 2–3 paragraph narrative covering:
- Overall risk profile summary
- Top 3 highest-damage districts
- Asset type breakdown (agriculture vs buildings)
- Brief recommendation context

**Effort justification (Low):**
- Data serialization already exists (RiskEadView → JSON)
- Report script already exists (generate-ead-report.mjs)
- Only need to add: LLM call + prompt template + result injection
- Reuses existing `EadResult` type from `src/types/risk.ts`

**Done criteria:**
- [ ] Selecting any climate/maintenance combination in RiskEadView triggers an AI report generation endpoint
- [ ] Generated report includes a 2–3 paragraph AI narrative appended to existing template sections
- [ ] Narrative accurately reflects the selected scenario data (no hallucination)
- [ ] Data is anonymized before leaving the server (district-level aggregation only)

---

### 1.2 AI Scenario Exploration Assistant

**What:** A chat interface (side panel or modal) where users query flood data in natural language. The LLM receives structured snapshots of the risk data and answers questions.

**Data flow:**
```
User types: "Which scenario causes the most damage in Dadu?"
  → Frontend extracts relevant data from risk.json (pre-fetched, cached)
  → Sends data snapshot + query to POST /api/ai/query
  → LLM answers using provided data
  → Response rendered in chat UI
```

**Key distinction from RAG:** This is **structured data query**, not document retrieval. No vector store needed. The frontend already has the data (`risk.json` loaded by RiskEadView, ImpactMatrix). We pass a relevant data snapshot to the LLM along with the user's question.

**Input to LLM:**
- User's natural language query
- Data snapshot (filtered to relevant scenarios/districts — not all 240 points)
- System prompt: "You are a flood risk analyst assistant. Answer based only on the provided data."

**Effort justification (Medium):**
- Needs new UI component (chat interface using existing shadcn/ui Card, Input, Button)
- Needs backend endpoint (`POST /api/ai/query`)
- Needs data snapshot logic (filter risk.json to relevant subset before sending to LLM)
- Chat UI can use existing components (Textarea, ScrollArea, Avatar for AI/user)

**Done criteria:**
- [ ] Chat interface is accessible from the Risk Dashboard (toggleable side panel)
- [ ] Answers at least 90% of questions about EAD, impact, and scenario comparisons correctly
- [ ] Refuses to answer questions outside scope (e.g., "predict tomorrow's weather")
- [ ] Data snapshots are anonymized before being sent to LLM
- [ ] Chat persists across view switches within the same session

---

### 1.3 Smart Scenario Recommendations

**What:** Proactively surface the highest-risk scenario combinations in the Risk Dashboard without the user having to query.

**Data flow:**
```
Risk Dashboard loads
  → Frontend calls POST /api/ai/recommend
  → Sends top-level summary data (not full 240 points — just aggregated district totals)
  → LLM returns ranked list of critical scenarios + brief reasoning
  → Displayed as "Top Risk Alerts" in the dashboard header or sidebar
```

**Input to LLM:**
- Aggregated district-level EAD totals (top 3 districts by damage)
- Brief context: number of scenarios analyzed, time period
- System prompt: "Rank the top 3 most critical scenario combinations by total expected annual damage."

**Effort justification (Low–Medium):**
- Similar data pipeline to the exploration assistant
- UI is simpler — just a list of recommendations, not a full chat interface
- Can be a collapsible panel in the Risk Dashboard header
- The "smart" part is trivial — we could even compute rankings server-side without LLM (sort by EAD total). LLM adds the *narrative* layer ("Why is this scenario critical?")

**Done criteria:**
- [ ] Risk Dashboard shows a "Top Risk Alerts" panel on load
- [ ] Panel lists top 3 scenario combinations with district-level EAD totals and a one-line AI-generated rationale
- [ ] Recommendations update when the user changes climate/maintenance filter
- [ ] Panel is collapsible and does not obstruct existing dashboard content

---

## Phase 2: Medium Effort

### 2.1 AI Intervention Advisor

**What:** When a user draws an intervention, suggest the most effective intervention type based on local flood conditions.

**Data flow:**
```
User draws geometry on map
  → Extract centroid coordinates
  → Query risk data for that region (from pre-fetched risk.json)
  → Send geometry region + flood parameters to POST /api/ai/advice
  → LLM suggests intervention type from the 42 hardcoded types
  → Display as a non-intrusive toast or panel update
```

**Input to LLM:**
- Region/district from centroid
- Flood parameters (depth, velocity, duration) for selected scenario
- List of all 42 intervention types with descriptions (from `src/types/interventions.ts`)
- System prompt: "Based on the flood conditions, recommend the most appropriate intervention type."

**Done criteria:**
- [ ] Drawing an intervention triggers an advisory message (non-blocking)
- [ ] Advisory suggests a specific intervention type with reasoning
- [ ] Advisory respects the 42 hardcoded intervention types (no hallucinated types)
- [ ] User can dismiss the advisory

---

### 2.2 Pattern Detection Across Scenarios

**What:** AI analyzes all 42 scenarios to identify patterns that aren't obvious from the heatmap alone.

**Data flow:**
```
POST /api/ai/patterns (manual trigger or on load)
  → Sends aggregated data: EAD by district × climate × maintenance matrix
  → LLM identifies 3–5 patterns
  → Displayed in a "Insights" panel in the Risk Dashboard
```

**Example outputs:**
- "Reduced capacity maintenance amplifies damage by ~30% compared to perfect maintenance across all return periods"
- "Future climate shows highest relative impact in lower Sindh districts (Jamshoro, Karachi)"
- "Velocity-driven damage dominates in upper Sindh; depth-driven damage dominates in lower Sindh"

**Done criteria:**
- [ ] "Insights" panel shows 3–5 AI-generated patterns
- [ ] Each pattern is grounded in actual data (LLM must cite specific numbers)
- [ ] Patterns update when filters change
- [ ] Panel is collapsible and non-obtrusive

---

## Anti-Patterns (What NOT to Do)

1. **Don't replace flood models** — HEC-RAS outputs (depth, velocity, duration) are physics-accurate. LLMs cannot improve on hydrological simulations.
2. **Don't build real-time prediction** — without live gauge data and infrastructure, this is fantasy.
3. **Don't build a full agent framework** — overkill for a data + interface problem. Simple API endpoints are sufficient.
4. **Don't add vendor lock-in** — avoid NVIDIA-specific tooling. Use standard OpenAI-compatible API format so any provider works.
5. **Don't send raw exposure data** — never transmit building coordinates, population counts per household, or sensitive geographic data to external APIs.
6. **Don't use RAG** — your data is structured (JSON), not unstructured documents. Vector stores add complexity without value.

---

## Recommended Starting Point

**Start with 1.1 (AI-enhanced report generator)** — it's the fastest win:
1. Data serialization already exists (RiskEadView → JSON)
2. Report script already exists (generate-ead-report.mjs)
3. Only addition: LLM call + prompt template + result injection into docx

**Then 1.3 (Smart recommendations)** — also low effort, builds UI confidence.

**Then 1.2 (Exploration assistant)** — medium effort, same data pipeline as 1.1.

---

## Decision Points for User

- [ ] **LLM Provider:** Anthropic (Claude), OpenAI (GPT-4o), or open-source (self-hosted)? For government use, Anthropic or open-source may have better privacy positioning.
- [ ] **API Key Management:** Store in `.env` on the server, never in frontend code or git.
- [ ] **Fallback:** If LLM is unavailable, fall back to the existing template-based report generator (no AI).
- [ ] **Integration style:** New AI tab in the app, or inline features within existing panels?
- [ ] **Interventions AI:** Proceed with Phase 2.1 (Advisor) or defer?
