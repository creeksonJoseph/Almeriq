import React from "react";
import MarketAnalysisResult from "./MarketAnalysisResult";
import FeasibilityResult from "./FeasibilityResult";
import BusinessPlanResult from "./BusinessPlanResult";
import ExecutionRoadmapResult from "./ExecutionRoadmapResult";

export default function ResultRenderer({ analysisKey, result }) {
  if (!result) return null;
  switch (analysisKey) {
    case "market_analysis":
      return <MarketAnalysisResult result={result} />;
    case "feasibility_analysis":
      return <FeasibilityResult result={result} />;
    case "business_plan":
      return <BusinessPlanResult result={result} />;
    case "execution_roadmap":
      return <ExecutionRoadmapResult result={result} />;
    default:
      return (
        <pre className="text-xs text-white/60 bg-white/5 rounded-xl p-4 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
  }
}
