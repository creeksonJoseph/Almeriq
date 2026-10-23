"""services/founder_prompts.py - Prompt templates and vocabulary guidelines for Founder Studio tools."""
from __future__ import annotations

import json
from typing import Any

VOICE_AND_STYLE_GUIDELINES = (
    "LANGUAGE, SIMPLICITY, AND PUNCTUATION RULES:\n"
    "- Use simple, clear, plain English. Speak like a friendly, practical mentor helping a founder. Keep it so clear that even a teenager or first-time high school student starting their first business can understand every single sentence.\n"
    "- STRICTLY AVOID pretentious, academic, or dense legal vocabulary. Never use words like 'ubiquitous', 'endemic', 'synergistic', 'nascent', 'paradigm', 'plethora', 'concomitant', 'behemoth', 'juridical', 'ring-fence', or 'statutory'.\n"
    "- Explain legal and business ideas in plain human words (for example, write 'your personal money is safe if the business owes debt' instead of 'limited liability ring-fences personal assets'; write 'how you make money' instead of 'monetization architecture').\n"
    "- PUNCTUATION RULES: NEVER use em dashes (—) or en dashes (–). Use only basic everyday punctuation marks: periods, commas, and question marks. Only use hyphens (-) when really needed for compound words.\n"
    "- Avoid robotic AI hype words like 'brilliantly targets', 'revolutionary', 'game-changing', or 'testament to'. Be direct, clear, and genuinely helpful.\n"
)


def get_intake_analysis_prompt(payload: Any) -> str:
    """Prompt for initial founder idea intake analysis."""
    return f"""Analyze this startup idea and return JSON.
{VOICE_AND_STYLE_GUIDELINES}
Keys: summary, market, risks (array), mvp (array), roadmap (array), next_steps (array).

Idea: {payload.idea}
Problem: {payload.problem}
Solution: {payload.solution}
Customer: {payload.customer}
Location: {payload.location}"""


def get_tool_prompt(tool_key: str, payload: Any) -> str:
    """Generate tool-specific prompts for Founder Studio modules."""
    idea = payload.idea
    customer = payload.customer or "target customers"
    location = payload.location or "global market"
    problem = payload.problem or ""
    solution = payload.solution or ""

    if tool_key == "lean_canvas":
        return f"Create a Lean Canvas for: {idea}. Customer: {customer}. Problem: {problem}. Solution: {solution}. Return JSON with: problem (array of 3 short strings), customer_segments (array of 3 short strings), unique_value_prop (single clear string), solution (array of 3 short strings), channels (array of 3 strings), revenue_streams (array of 2-3 strings), cost_structure (array of 2-3 strings), key_metrics (array of 3 strings), unfair_advantage (single string)."

    if tool_key == "swot":
        return f"SWOT analysis for {idea} targeting {customer} in {location}. Return JSON with: strengths, weaknesses, opportunities, threats (each as array of 3 strings)."

    if tool_key == "pitch_deck":
        return f"Create 10-slide pitch deck outline for {idea}. Customer: {customer}. Return JSON with slides array (slide_number, title, bullets, speaker_notes)."

    if tool_key == "financial_model":
        return f"Financial model for {idea} with {customer} in {location}. Return JSON with: currency, assumptions, revenue_drivers, cost_drivers, projections_summary, break_even_units, unit_economics."

    if tool_key == "risk_matrix":
        return f"Risk matrix for {idea}. Return JSON with risks array (category, risk, likelihood, impact, mitigation)."

    if tool_key == "user_personas":
        return f"User personas for {idea} targeting {customer}. Return JSON with personas array (name, role, quote, goals, pain_points)."

    if tool_key == "user_journey":
        return f"User journey for {idea}. Return JSON with steps array (stage, user_action, emotion, touchpoint, opportunity)."

    if tool_key == "tech_stack":
        return f"Tech stack for {idea}. Return JSON with: frontend, backend, database, infrastructure, third_party_services, rationale."

    if tool_key == "sprint_backlog":
        return f"MVP sprint backlog for {idea}. Return JSON with mvp_epics array (epic, user_stories, priority, estimate)."

    if tool_key == "investor_update":
        return f"Monthly investor update for {idea}. Return JSON with: subject, highlights, lowlights, kpis, asks, full_email."

    if tool_key == "job_post":
        return f"Job posting for {idea}. Return JSON with: title, role_summary, responsibilities, requirements, why_join_us."

    if tool_key == "market_analysis":
        return (
            f"You are a senior market research analyst. Produce a comprehensive market analysis for this startup.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"{VOICE_AND_STYLE_GUIDELINES}\n"
            f"Return JSON with these keys:\n"
            f"  market_overview (string, 2-3 sentences on the market landscape),\n"
            f"  market_size (object: tam string, sam string, som string, each with a numeric estimate and explanation),\n"
            f"  target_segments (array of objects: segment string, size_estimate string, pain_level string 1-10, willingness_to_pay string),\n"
            f"  competitive_landscape (array of objects: competitor string, strengths array, weaknesses array, market_share_estimate string),\n"
            f"  market_trends (array of 4-6 strings describing current and emerging trends),\n"
            f"  entry_barriers (array of 3-5 strings),\n"
            f"  go_to_market_channels (array of objects: channel string, rationale string, estimated_cost_to_acquire string),\n"
            f"  differentiation_opportunity (string, 2-3 sentences),\n"
            f"  key_risks (array of 3-5 strings),\n"
            f"  verdict (string: one of 'Strong Opportunity', 'Moderate Opportunity', 'Niche Opportunity', 'Challenging Market'),\n"
            f"  verdict_rationale (string, 1-2 sentences)."
        )

    if tool_key == "feasibility_analysis":
        return (
            f"You are a startup feasibility expert. Produce a thorough feasibility analysis for this startup idea.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"{VOICE_AND_STYLE_GUIDELINES}\n"
            f"Return JSON with these keys:\n"
            f"  overall_feasibility_score (integer 1-10),\n"
            f"  overall_feasibility_verdict (string: one of 'Highly Feasible', 'Feasible with Effort', 'Feasible with Pivots', 'Low Feasibility'),\n"
            f"  executive_summary (string, 2-3 sentences),\n"
            f"  dimensions (array of objects: dimension string, score integer 1-10, assessment string, risks array of strings, recommendations array of strings), covering: Technical Feasibility, Market Feasibility, Financial Feasibility, Operational Feasibility, Legal & Regulatory Feasibility,\n"
            f"  critical_success_factors (array of 4-6 strings),\n"
            f"  critical_failure_risks (array of 4-6 strings),\n"
            f"  resource_requirements (object: team array of strings, technology array of strings, capital_estimate string, timeline_to_mvp string),\n"
            f"  recommended_next_steps (array of 4-6 strings ordered by priority),\n"
            f"  pivot_options (array of 2-3 objects: pivot string, rationale string)."
        )

    if tool_key == "business_plan":
        return (
            f"You are a seasoned business strategy consultant. Write a production-grade business plan for this startup.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"{VOICE_AND_STYLE_GUIDELINES}\n"
            f"Return JSON with these keys:\n"
            f"  executive_summary (string),\n"
            f"  problem_statement (string),\n"
            f"  solution_description (string),\n"
            f"  value_proposition (string, one clear sentence),\n"
            f"  target_market (object: primary_segment string, secondary_segment string, market_size_estimate string),\n"
            f"  business_model (object: revenue_streams array of objects with stream and description, pricing_strategy string, unit_economics object with cac_estimate and ltv_estimate),\n"
            f"  product_service_overview (object: core_features array of strings, mvp_scope string, roadmap_phases array of objects with phase and deliverables array),\n"
            f"  marketing_strategy (object: positioning string, channels array of strings, acquisition_strategy string, retention_strategy string),\n"
            f"  operations_plan (object: team_structure array of strings, key_processes array of strings, technology_stack string, partnerships array of strings),\n"
            f"  financial_projections (object: assumptions array of strings, year1_revenue_estimate string, year2_revenue_estimate string, year3_revenue_estimate string, break_even_timeline string, funding_required string),\n"
            f"  risk_mitigation (array of objects: risk string, mitigation string),\n"
            f"  milestones (array of objects: milestone string, target_date string, success_metric string)."
        )

    if tool_key == "execution_roadmap":
        return (
            f"You are a product and operations expert. Create a detailed execution roadmap for this startup.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"{VOICE_AND_STYLE_GUIDELINES}\n"
            f"Return JSON with these keys:\n"
            f"  summary (string, 1-2 sentences),\n"
            f"  phases (array of exactly 4 objects representing: Foundation (0-30 days), Build (30-90 days), Launch (90-180 days), Scale (180-365 days): each object has phase string, duration string, objective string, key_activities array of 4-6 strings, deliverables array of 3-5 strings, success_metrics array of 3-4 strings, resources_needed array of strings, risks array of strings),\n"
            f"  critical_path (array of 5-8 strings, the must-do items in order),\n"
            f"  team_hiring_plan (array of objects: role string, when_to_hire string, priority string one of High/Medium/Low),\n"
            f"  budget_allocation (array of objects: category string, percentage integer, notes string, must sum to 100),\n"
            f"  kpis (array of objects: metric string, target string, measurement_frequency string),\n"
            f"  quick_wins (array of 3-5 strings, things achievable in first 2 weeks)."
        )

    if tool_key in ("idea_validation", "validation_analysis"):
        extra_ctx = ""
        if payload.extra_params and isinstance(payload.extra_params, dict):
            for k in ("summary", "market", "risks", "mvp", "problem", "solution"):
                v = payload.extra_params.get(k)
                if v:
                    extra_ctx += f"\n- {k.title()}: {v if isinstance(v, str) else json.dumps(v)}"

        return (
            f"You are a top-tier venture evaluator and startup analyst. Perform a comprehensive, rigorous Idea Validation Rubric analysis for this startup idea.\n"
            f"Startup Idea: {idea}\n"
            f"Problem Statement: {problem or 'Infer and synthesize from idea'}\n"
            f"Proposed Solution: {solution or 'Infer and synthesize from idea'}\n"
            f"Target Customer: {customer}\n"
            f"Target Market/Location: {location}\n"
            f"{f'Additional Verified Context from Previous Modules:{extra_ctx}' if extra_ctx else ''}\n\n"
            f"{VOICE_AND_STYLE_GUIDELINES}\n"
            f"Evaluate this idea thoroughly across 6 key rubric criteria. For each criterion, assign a rating of STRICTLY one of: 'Strong', 'Vague', or 'Weak'.\n"
            f"Criteria details:\n"
            f"1. Problem and Solution: Problem urgency, acute user pain vs mild inconvenience, solution clarity, differentiation, problem-solution fit.\n"
            f"2. Market Size (TAM, SAM, SOM): Total Addressable Market (TAM), Serviceable Available Market (SAM), and Serviceable Obtainable Market (SOM) with numeric/dollar estimates and sizing rationale.\n"
            f"3. Demand & User Pull: Evidence of real user demand, frequency of need, willingness to pay, validation experiments to prove traction.\n"
            f"4. Competition: Realistic landscape check, identify actual real-world existing companies, products, or startups in this space by name. Detail their strengths, weaknesses, and defensibility moats.\n"
            f"5. All Feasibilities: Comprehensive breakdown covering: Technical Feasibility (can it be built with current tech?), Operational & Regulatory Feasibility (legal, compliance, logistics), and Economic Feasibility (capital, unit economics, runway to MVP).\n"
            f"6. Business Model: Monetization streams, pricing model, unit economics viability (CAC vs LTV dynamics, gross margins).\n\n"
            f"Return a clean JSON object with this exact structure:\n"
            f"{{\n"
            f'  "overall_score": 82,\n'
            f'  "overall_rating": "Strong",\n'
            f'  "ratings_summary": {{"strong_count": 4, "vague_count": 2, "weak_count": 0}},\n'
            f'  "executive_summary": "Concise 3-4 sentence diagnosis summarizing core strength, primary blindspot, and potential.",\n'
            f'  "top_strengths": ["Strength 1", "Strength 2", "Strength 3"],\n'
            f'  "critical_red_flags": ["Red flag 1", "Red flag 2", "Red flag 3"],\n'
            f'  "immediate_action_plan": ["Step 1", "Step 2", "Step 3", "Step 4"],\n'
            f'  "rubric": {{\n'
            f'    "problem_and_solution": {{\n'
            f'      "rating": "Strong",\n'
            f'      "assessment": "Detailed assessment of the problem-solution fit...",\n'
            f'      "problem_clarity": "Analysis of the pain point clarity and urgency...",\n'
            f'      "solution_fit": "Analysis of how directly the solution solves the core problem...",\n'
            f'      "strengths": ["...", "..."],\n'
            f'      "gaps_and_risks": ["...", "..."],\n'
            f'      "recommendations": ["...", "..."]\n'
            f'    }},\n'
            f'    "market_size": {{\n'
            f'      "rating": "Strong",\n'
            f'      "assessment": "Detailed assessment of total and serviceable market...",\n'
            f'      "tam": {{"value": "$12.5B", "description": "Global market definition and methodology..."}},\n'
            f'      "sam": {{"value": "$1.4B", "description": "Serviceable addressable segment for target customers..."}},\n'
            f'      "som": {{"value": "$85M", "description": "Realistic 18-36 month serviceable obtainable capture..."}},\n'
            f'      "sizing_rationale": "Clear sizing methodology and assumptions...",\n'
            f'      "strengths": ["...", "..."],\n'
            f'      "gaps_and_risks": ["...", "..."],\n'
            f'      "recommendations": ["...", "..."]\n'
            f'    }},\n'
            f'    "demand": {{\n'
            f'      "rating": "Vague",\n'
            f'      "assessment": "Analysis of customer pull and purchasing urgency...",\n'
            f'      "urgency_level": "High",\n'
            f'      "willingness_to_pay": "Medium",\n'
            f'      "demand_signals": "Signals indicating organic adoption vs push...",\n'
            f'      "validation_experiments": ["Experiment 1: landing page pre-order test...", "Experiment 2: customer interview protocol...", "Experiment 3: concierge MVP..."],\n'
            f'      "strengths": ["...", "..."],\n'
            f'      "gaps_and_risks": ["...", "..."]\n'
            f'    }},\n'
            f'    "competition": {{\n'
            f'      "rating": "Strong",\n'
            f'      "assessment": "Thorough analysis of competitive density and positioning...",\n'
            f'      "landscape_summary": "Summary of current incumbents and substitutes...",\n'
            f'      "identified_competitors": [\n'
            f'        {{\n'
            f'          "name": "Actual Real Competitor or Incumbent Name",\n'
            f'          "type": "Direct",\n'
            f'          "strengths": "Established market presence, existing distribution",\n'
            f'          "weaknesses": "High price, dated interface, missing core feature",\n'
            f'          "differentiation_angle": "How this startup beats them"\n'
            f'        }}\n'
            f'      ],\n'
            f'      "moat_assessment": "Defensibility analysis (network effects, switching costs, proprietary data)...",\n'
            f'      "strengths": ["...", "..."],\n'
            f'      "gaps_and_risks": ["...", "..."],\n'
            f'      "recommendations": ["...", "..."]\n'
            f'    }},\n'
            f'    "feasibility": {{\n'
            f'      "rating": "Strong",\n'
            f'      "assessment": "Overall feasibility assessment across tech, ops, and economics...",\n'
            f'      "technical": {{"rating": "Strong", "assessment": "Tech stack requirements and architectural difficulty...", "key_challenges": ["...", "..."]}},\n'
            f'      "operational_regulatory": {{"rating": "Strong", "assessment": "Compliance, legal framework, licensing and operations...", "key_challenges": ["...", "..."]}},\n'
            f'      "economic": {{"rating": "Vague", "assessment": "Capital required to reach MVP, runway needs and cash burn...", "key_challenges": ["...", "..."]}},\n'
            f'      "strengths": ["...", "..."],\n'
            f'      "gaps_and_risks": ["...", "..."],\n'
            f'      "recommendations": ["...", "..."]\n'
            f'    }},\n'
            f'    "business_model": {{\n'
            f'      "rating": "Strong",\n'
            f'      "assessment": "Monetization and margin sustainability assessment...",\n'
            f'      "revenue_streams": [\n'
            f'        {{"stream": "SaaS Subscription / Usage Fee", "pricing_model": "Tiered monthly / annual", "rationale": "High recurring revenue potential"}}\n'
            f'      ],\n'
            f'      "pricing_strategy": "Pricing model logic and entry pricing...",\n'
            f'      "unit_economics": {{"cac_outlook": "$50-$120 via organic + content", "ltv_outlook": "$900+ based on 18mo retention", "margin_potential": "75-82% gross margins"}},\n'
            f'      "strengths": ["...", "..."],\n'
            f'      "gaps_and_risks": ["...", "..."],\n'
            f'      "recommendations": ["...", "..."]\n'
            f'    }}\n'
            f'  }}\n'
            f'}}\n'
        )

    return f"Generate {tool_key} for {idea}."
