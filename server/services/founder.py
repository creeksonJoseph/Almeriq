"""services/founder.py - Founder analysis orchestration and Gemini integration."""
from __future__ import annotations

import asyncio
import json
import logging
import urllib.error
import urllib.request

from core.config import GEMINI_API_KEY, GEMINI_MODEL
from schemas.founder import FounderAnalysisRequest, FounderAnalysisResponse

logger = logging.getLogger(__name__)


def _fallback_analysis(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    return FounderAnalysisResponse(
        source="local",
        summary=(
            f"{payload.idea.strip()} targets {payload.customer.strip()} by solving {payload.problem.strip()[:50]}. "
            f"The solution approach is {payload.solution.strip()[:50]}. Key validation needed: customer willingness to pay and problem urgency in {payload.location.strip()}."
        ),
        market=(
            f"Start with 15-20 customer interviews among {payload.customer.strip()} in {payload.location.strip()}. "
            f"Measure: (1) Problem frequency and cost impact, (2) Current workarounds and switching costs, (3) Willingness to pay for your solution. "
            f"Run a small pilot with 3-5 customers to validate the core workflow before scaling acquisition."
        ),
        risks=[
            "The stated problem may be a symptom of a deeper issue that your solution doesn't address.",
            "Customer acquisition costs may exceed the lifetime value at your proposed pricing.",
            "Competitive incumbents or free alternatives may already partially solve this problem.",
            "The target customer segment may lack budget or decision-making authority to buy.",
            "Regulatory or operational constraints in the launch location may limit market size.",
        ],
        mvp=[
            "Core workflow that delivers the primary outcome in under 5 minutes of user time.",
            "Ability to save and retrieve customer data with basic reporting.",
            "Integration or import capability for the customer's existing data sources.",
            "Feedback loop: in-app survey or email to measure customer satisfaction and next priorities.",
            "Shareable output (PDF, link, or export) that the customer can use immediately.",
        ],
        roadmap=[
            "Week 1-2: Conduct 15 customer discovery interviews; document pain points and current solutions.",
            "Week 3-4: Build and test the MVP core workflow with 3 pilot customers.",
            "Week 5-6: Iterate based on pilot feedback; measure time-to-value and NPS.",
            "Week 7-8: Expand pilot to 10 customers; track retention and feature requests.",
            "Month 3: Analyze unit economics (CAC, LTV, payback period); decide on pricing and positioning.",
            "Month 4+: Scale customer acquisition through the highest-ROI channel identified in pilots.",
        ],
        next_steps=[
            "Schedule 15 customer discovery calls this week; focus on understanding their current workflow and pain.",
            "Document the top 3 objections or concerns you hear; these are your biggest risks.",
            "Build a simple landing page with a value proposition and email waitlist.",
            "Create a 1-page pitch that explains the problem, solution, and why now.",
            "Identify 3 potential distribution channels (communities, partnerships, content) for your customer segment.",
            "Set a clear success metric for the MVP (e.g., 5 paying customers or $500 MRR in 90 days).",
            "Find 1-2 co-founders or advisors with domain expertise in your customer segment.",
        ],
    )


def _parse_model_response(text: str) -> FounderAnalysisResponse:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    data = json.loads(cleaned)
    return FounderAnalysisResponse(
        source="gemini",
        summary=str(data.get("summary", "")),
        market=str(data.get("market", "")),
        risks=[str(item) for item in data.get("risks", [])][:7],
        mvp=[str(item) for item in data.get("mvp", [])][:7],
        roadmap=[str(item) for item in data.get("roadmap", [])][:8],
        next_steps=[str(item) for item in data.get("next_steps", [])][:8],
    )


def _request_gemini(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    prompt = f"""You are Alimeriq's startup strategy analyst. Provide a detailed, actionable analysis.
Return ONLY valid JSON with these keys:
- summary: 3-4 sentences analyzing the core opportunity, customer fit, differentiation, and key validation needed
- market: 4-5 sentences on market validation approach, TAM context, go-to-market signals, and customer acquisition strategy
- risks: array of 6-7 specific, ranked risks (most critical first) with brief context
- mvp: array of 6-7 concrete MVP features/workflows that prove core value
- roadmap: array of 8 specific milestones with timeframes (Week X, Month Y, specific deliverables)
- next_steps: array of 8 prioritized actions the founder should take immediately

Be specific, practical, and grounded in the customer context. Do not invent statistics.

Idea: {payload.idea}
Problem: {payload.problem}
Proposed solution: {payload.solution}
Target customer: {payload.customer}
Launch location: {payload.location}

Analyze deeply:
1. How does this solution uniquely address the stated problem for this specific customer?
2. What are the top 3 risks that could kill this venture? Why?
3. What is the minimum viable proof point needed to validate the core assumption?
4. What should the founder validate first, second, and third?
5. What are realistic unit economics (CAC, LTV, payback) for this customer segment?
6. What are 2-3 distribution channels that could work for this customer?
7. What are the key metrics to track in the first 90 days?"""

    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        result = json.loads(response.read().decode("utf-8"))
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_model_response(text)


async def analyze_founder_idea(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    if not GEMINI_API_KEY:
        return _fallback_analysis(payload)
    try:
        return await asyncio.to_thread(_request_gemini, payload)
    except (KeyError, TypeError, ValueError, urllib.error.URLError, TimeoutError) as exc:
        logger.warning("Gemini founder analysis failed; using local fallback: %s", exc)
        return _fallback_analysis(payload)


# ── Individual AI Tools ────────────────────────────────────────────────────────

def _fallback_tool_result(payload) -> dict:
    key = payload.tool_key
    idea = payload.idea
    customer = payload.customer or "target customers"
    location = payload.location or "global market"

    if key == "lean_canvas":
        return {
            "problem": [
                f"Lack of tailored solutions for {customer}",
                "High manual overhead and inefficient workflows",
                "Fragmented tooling with high cost of adoption",
            ],
            "customer_segments": [
                f"Primary: {customer} in {location}",
                "Early adopters: Tech-forward teams and solo operators",
            ],
            "unique_value_prop": f"The streamlined platform designed specifically for {customer} to solve core bottlenecks faster.",
            "solution": [
                "Automated workflow engine",
                "Real-time visibility and reporting dashboard",
                "Seamless integration with existing tools",
            ],
            "channels": [
                "Direct outbound to industry communities",
                "Targeted content marketing and SEO",
                "Strategic partnerships with local ecosystem hubs",
            ],
            "revenue_streams": [
                "Monthly/Annual SaaS subscription tiers",
                "Usage-based add-ons for high-volume transactions",
            ],
            "cost_structure": [
                "Cloud infrastructure and compute",
                "Customer acquisition and sales commissions",
                "Engineering and product maintenance",
            ],
            "key_metrics": [
                "Monthly Recurring Revenue (MRR)",
                "Weekly Active Users (WAU)",
                "Customer Acquisition Cost (CAC) Payback < 6 mos",
            ],
            "unfair_advantage": "Localized domain workflows and integrated distribution network.",
        }

    if key == "swot":
        return {
            "strengths": [
                f"Deep domain focus on {customer}",
                "Modern, responsive web-native architecture",
                "Agile execution speed versus legacy incumbents",
            ],
            "weaknesses": [
                "Early brand recognition and initial trust building",
                "Limited initial marketing budget",
                "Need for extensive customer education",
            ],
            "opportunities": [
                f"Rapidly growing digital adoption in {location}",
                "Expanding into adjacent vertical integrations",
                "API partnerships with financial and identity providers",
            ],
            "threats": [
                "Incumbents adding simplified clone features",
                "Shifts in local regulatory or compliance policies",
                "Macroeconomic tightening affecting software spend",
            ],
        }

    if key == "pitch_deck":
        return {
            "slides": [
                {"slide_number": 1, "title": "Title & Vision", "bullets": [idea, f"Empowering {customer} in {location}"], "speaker_notes": "Introduce the bold vision and team mission."},
                {"slide_number": 2, "title": "The Problem", "bullets": [f"{customer} suffer from fragmented tools", "Wasting 15+ hours weekly", "Costly operational errors"], "speaker_notes": "Anchor the urgency with real friction."},
                {"slide_number": 3, "title": "The Solution", "bullets": ["Unified intelligent workspace", "Instant time-to-value", "Designed for local context"], "speaker_notes": "Present the product as the obvious answer."},
                {"slide_number": 4, "title": "Market Opportunity", "bullets": [f"Total Addressable Market in {location}: $1.2B+", "Serviceable Addressable Market: $250M", "High double-digit annual CAGR"], "speaker_notes": "Highlight size and growth momentum."},
                {"slide_number": 5, "title": "Product Demo", "bullets": ["3-step onboarding flow", "Real-time sync", "Automated insights"], "speaker_notes": "Walk through the core user triumph."},
                {"slide_number": 6, "title": "Business Model", "bullets": ["Tiered subscription ($49-$299/mo)", "85% Gross margin", "Net revenue retention target >115%"], "speaker_notes": "Explain monetization and unit economics."},
                {"slide_number": 7, "title": "Go-to-Market", "bullets": ["Community-led growth", "Local partnerships", "High-conversion self-serve funnel"], "speaker_notes": "Show how customer acquisition scales."},
                {"slide_number": 8, "title": "Competitive Advantage", "bullets": ["Built specifically for underserved segment", "Proprietary workflows", "10x faster implementation"], "speaker_notes": "Differentiate against incumbents."},
                {"slide_number": 9, "title": "Traction & Milestones", "bullets": ["MVP ready and validated", "Initial pilot waitlist secured", "Core architecture stress-tested"], "speaker_notes": "Prove velocity and momentum."},
                {"slide_number": 10, "title": "The Ask", "bullets": ["Raising Seed round to accelerate GTM & engineering", "Key milestone: reach $50k MRR in 12 months"], "speaker_notes": "End with clear funding goal and milestones."},
            ]
        }

    if key == "financial_model":
        return {
            "currency": "USD",
            "assumptions": [
                "Average Revenue Per Account: $80/month",
                "Customer churn: 2.5% monthly",
                "CAC: $180 per paying customer",
            ],
            "revenue_drivers": [
                "Self-serve starter accounts",
                "Enterprise team workspaces",
                "Transaction & usage add-ons",
            ],
            "cost_drivers": [
                "Server hosting and cloud database ($200-$1,200/mo)",
                "Paid acquisition & marketing campaigns",
                "Customer success and support",
            ],
            "projections_summary": {
                "month_3": "50 customers | $4,000 MRR | Breakeven on cloud",
                "month_6": "180 customers | $14,400 MRR | Positive unit margin",
                "month_12": "600 customers | $48,000 MRR | Operating profitability",
            },
            "break_even_units": "45 active paying subscriptions",
            "unit_economics": {
                "cac": "$180",
                "ltv": "$1,920 (based on 24mo lifetime)",
                "payback_period": "2.2 months",
                "gross_margin": "82%",
            },
        }

    if key == "risk_matrix":
        return {
            "risks": [
                {"category": "Product / Market", "risk": "Adoption friction among non-technical users", "likelihood": "Medium", "impact": "High", "mitigation": "Design an intuitive zero-configuration onboarding flow."},
                {"category": "Financial", "risk": "Higher than projected acquisition costs in paid channels", "likelihood": "High", "impact": "Medium", "mitigation": "Pivot acquisition toward organic communities and partner referrals."},
                {"category": "Operational", "risk": "Downtime during peak business hours", "likelihood": "Low", "impact": "High", "mitigation": "Multi-region failover and rigorous automated health checks."},
                {"category": "Regulatory", "risk": "Data protection compliance changes", "likelihood": "Medium", "impact": "Medium", "mitigation": "Implement strict data tenancy, encryption at rest, and audit logs."},
            ]
        }

    if key == "user_personas":
        return {
            "personas": [
                {
                    "name": "Sarah the Operator",
                    "role": f"Lead Coordinator in {location}",
                    "quote": "I spend half my day stitching spreadsheets together when I should be serving clients.",
                    "goals": ["Eliminate manual tracking errors", "Automate weekly progress summaries", "Fast ramp-up without heavy training"],
                    "pain_points": ["Clunky enterprise software", "Lack of mobile accessibility", "Slow sync between team members"],
                },
                {
                    "name": "David the Business Owner",
                    "role": "Founder / Managing Director",
                    "quote": "I need full visibility into our pipeline and cashflow at a glance.",
                    "goals": ["Scale operations without doubling headcount", "Accurate forecasts", "Retain high-value clients"],
                    "pain_points": ["Opaque project status", "Unpredictable costs", "Over-reliance on key staff"],
                },
            ]
        }

    if key == "user_journey":
        return {
            "steps": [
                {"stage": "1. Discovery", "user_action": f"Searches for solutions to solve problem for {customer}", "emotion": "Frustrated", "touchpoint": "Google Search / Peer Referral", "opportunity": "High-intent landing page with interactive value calculator."},
                {"stage": "2. Evaluation", "user_action": "Tests out demo or starts free workspace trial", "emotion": "Curious", "touchpoint": "Onboarding Wizard", "opportunity": "Pre-filled templates tailored to their exact industry."},
                {"stage": "3. Aha Moment", "user_action": "Generates first complete output in under 3 minutes", "emotion": "Relieved & Delighted", "touchpoint": "Dashboard Results View", "opportunity": "One-click export and collaborative share link."},
                {"stage": "4. Habituation", "user_action": "Integrates daily workflows and invites teammates", "emotion": "Confident", "touchpoint": "Team settings & Notifications", "opportunity": "Automated weekly impact summary emails."},
            ]
        }

    if key == "tech_stack":
        return {
            "frontend": "React 19 + Vite (Fast HMR, modern hooks, responsive CSS)",
            "backend": "FastAPI (Python 3.11 asynchronous REST API with Pydantic validation)",
            "database": "PostgreSQL (Neon serverless with SQLAlchemy 2.0 async engine)",
            "infrastructure": "Docker containerized, reverse-proxied via NGINX with SSL",
            "third_party_services": ["Google Gemini AI API", "Stripe / Local Mobile Money gateway", "Resend / SendGrid for emails"],
            "rationale": "Prioritizes developer velocity, low maintenance overhead, sub-100ms response times, and zero vendor lock-in.",
        }

    if key == "sprint_backlog":
        return {
            "mvp_epics": [
                {"epic": "Core Authentication & Roles", "user_stories": ["Sign up with email/password and OAuth", "Role-based workspace routing", "Profile setup wizard"], "priority": "High", "estimate": "3 days"},
                {"epic": "Core Value Workflow", "user_stories": ["Idea brief submission form", "Instant AI analysis generation", "Save and retrieve venture history"], "priority": "High", "estimate": "5 days"},
                {"epic": "Deliverable Exports", "user_stories": ["Export pitch deck to PDF/Markdown", "Copy executive summaries", "Shareable venture link"], "priority": "Medium", "estimate": "2 days"},
                {"epic": "Billing & Subscription", "user_stories": ["Pricing tier selection", "Checkout session integration", "Invoice history"], "priority": "Medium", "estimate": "3 days"},
            ]
        }

    if key == "investor_update":
        return {
            "subject": f"Monthly Founder Update — {idea[:40]}",
            "highlights": [
                "Completed MVP deployment and verified end-to-end functionality.",
                f"Secured initial test cohort of {customer} across {location}.",
                "Reduced user onboarding time down to under 2 minutes.",
            ],
            "lowlights": [
                "Customer acquisition via paid social had higher bounce rates than organic referrals.",
                "Engineering bandwidth stretched as we finalized backend migrations.",
            ],
            "kpis": [
                "Pilot users onboarded: 35",
                "Weekly active retention: 68%",
                "Runway: 11 months",
            ],
            "asks": [
                f"Introductions to 3 {customer} leaders for customer discovery.",
                "Feedback on our updated seed deck pitch outline.",
            ],
            "full_email": f"Hi team,\n\nHere is our latest update on {idea[:40]}.\n\nHighlights:\n- Finished core platform rollout and onboarded initial users.\n- Strong retention signal in first-time user completions.\n\nKey KPIs:\n- 35 pilots active | 68% weekly retention.\n\nAsks:\n- If you know operators who match {customer}, we would love an intro.\n\nThank you for your ongoing support!\nBest regards,\nThe Founders",
        }

    if key == "job_post":
        return {
            "title": f"Founding Product Engineer ({idea[:30]})",
            "role_summary": f"We are building the category-defining platform for {customer} in {location}. You will own full-stack feature delivery from day one.",
            "responsibilities": [
                "Build scalable features using modern React and Python FastAPI.",
                "Collaborate directly with the founder to translate customer feedback into product updates.",
                "Own system reliability, database design, and end-to-end performance.",
            ],
            "requirements": [
                "3+ years building and shipping web applications.",
                "Strong proficiency in React, TypeScript/JavaScript, and Python.",
                "Self-driven mindset comfortable with fast-paced startup iteration.",
            ],
            "why_join_us": "Significant equity upside, high autonomy, and the chance to build a transformative product from the ground up.",
        }

    return {"status": "success", "content": f"Deliverable generated for {key} based on: {idea}"}


def _request_gemini_tool(payload) -> dict:
    prompt = f"""You are Alimeriq's startup advisor and strategist. Generate a structured JSON deliverable for the tool: "{payload.tool_key}".
Startup idea: {payload.idea}
Target customer: {payload.customer}
Location: {payload.location}
Problem: {payload.problem}
Solution: {payload.solution}
Additional parameters: {json.dumps(payload.extra_params or {})}

Follow these JSON key conventions based on tool_key:
- If tool_key == "lean_canvas": problem (array of 3 strings), customer_segments (array of 2 strings), unique_value_prop (string), solution (array of 3 strings), channels (array of 3 strings), revenue_streams (array of 2 strings), cost_structure (array of 3 strings), key_metrics (array of 3 strings), unfair_advantage (string).
- If tool_key == "swot": strengths (array of 3 strings), weaknesses (array of 3 strings), opportunities (array of 3 strings), threats (array of 3 strings).
- If tool_key == "pitch_deck": slides (array of 10 objects each with slide_number, title, bullets (array of strings), speaker_notes).
- If tool_key == "financial_model": currency (string), assumptions (array of 3 strings), revenue_drivers (array of 3 strings), cost_drivers (array of 3 strings), projections_summary (object with month_3, month_6, month_12), break_even_units (string), unit_economics (object with cac, ltv, payback_period, gross_margin).
- If tool_key == "risk_matrix": risks (array of 4 objects with category, risk, likelihood, impact, mitigation).
- If tool_key == "user_personas": personas (array of 2 objects with name, role, quote, goals (array), pain_points (array)).
- If tool_key == "user_journey": steps (array of 4 objects with stage, user_action, emotion, touchpoint, opportunity).
- If tool_key == "tech_stack": frontend (string), backend (string), database (string), infrastructure (string), third_party_services (array), rationale (string).
- If tool_key == "sprint_backlog": mvp_epics (array of 4 objects with epic, user_stories (array), priority, estimate).
- If tool_key == "investor_update": subject (string), highlights (array), lowlights (array), kpis (array), asks (array), full_email (string).
- If tool_key == "job_post": title (string), role_summary (string), responsibilities (array), requirements (array), why_join_us (string).

Return ONLY valid JSON matching these specifications. No markdown code blocks."""

    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.loads(response.read().decode("utf-8"))
    text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    return json.loads(text)


async def generate_tool_deliverable(payload) -> tuple[dict, str]:
    if not GEMINI_API_KEY:
        return _fallback_tool_result(payload), "local"
    try:
        data = await asyncio.to_thread(_request_gemini_tool, payload)
        return data, "gemini"
    except Exception as exc:
        logger.warning("Gemini tool execution failed for %s: %s; falling back to local", payload.tool_key, exc)
        return _fallback_tool_result(payload), "local"
