import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/ui";
import { getInvestorProfileApi, listInvestorStartupsApi } from "../../lib/api";

export default function InvestorDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, startupsRes] = await Promise.all([
          getInvestorProfileApi().catch(() => null),
          listInvestorStartupsApi().catch(() => null),
        ]);
        setProfile(profileRes);
        setStartups(startupsRes?.items || startupsRes || []);
      } catch {
        // swallow; dashboard degrades gracefully
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white font-sans antialiased px-4 py-10 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="font-serif text-3xl text-white">Investor Dashboard</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans antialiased px-4 py-10 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white">Investor Dashboard</h1>
            <p className="mt-2 text-sm text-white/60">
              Deal flow and portfolio for {profile?.firm_name || "your firm"}.
            </p>
          </div>
          <Button
            className="bg-[#C9A15A] text-[#111318] hover:bg-[#E8D6A8]"
            onClick={() => navigate("/investor/profile")}
          >
            View Profile
          </Button>
        </div>

        <Card className="p-6 border border-white/10 bg-white/2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C9A15A] mb-4">
            Startup pipeline
          </h2>
          {startups.length === 0 ? (
            <p className="text-white/50">No startup pitches discovered yet.</p>
          ) : (
            <div className="space-y-3">
              {startups.map((pitch) => (
                <div key={pitch.id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-white">{pitch.title}</span>
                  <span className="text-xs text-white/40 hyphens-auto">
                    {pitch.sector || "-"} · {pitch.stage || "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
