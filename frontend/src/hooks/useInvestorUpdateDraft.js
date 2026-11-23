import { useCallback, useState } from "react";
import { executeAiToolApi } from "../lib/api/founder";

export function useInvestorUpdateDraft({ setError, setNotice }) {
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);

  const generate = useCallback(async (pitch, details) => {
    if (!pitch) {
      setError("Choose a startup pitch first.");
      return;
    }

    setDrafting(true);
    setError("");
    setNotice("");
    try {
      const response = await executeAiToolApi({
        tool_key: "investor_update",
        idea: pitch.title,
        customer: "Current investors",
        location: pitch.location || "",
        problem: pitch.summary || "",
        solution: pitch.traction || "",
        extra_params: {
          period: details.period || "Not specified",
          sector: pitch.sector,
          stage: pitch.stage,
          company_summary: pitch.summary,
          traction_so_far: pitch.traction,
          team: pitch.team_summary,
          founder_highlights: details.highlights,
          challenges: details.challenges,
          kpis: details.kpis,
          investor_asks: details.asks,
        },
      });
      const result = response.result || {};
      setDraft(result.full_email || [
        result.subject,
        ...(result.highlights || []),
        ...(result.lowlights || []),
        ...(result.asks || []),
      ].join("\n"));
      setNotice("Investor update draft generated. Check every metric and statement before sending.");
    } catch (requestError) {
      setError(requestError.message || "Unable to draft the investor update.");
    } finally {
      setDrafting(false);
    }
  }, [setError, setNotice]);

  return { draft, setDraft, drafting, generate };
}
