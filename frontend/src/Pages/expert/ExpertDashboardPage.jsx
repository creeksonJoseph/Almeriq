import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/ui";

export default function ExpertDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white font-sans antialiased px-4 py-10 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="font-serif text-3xl text-white">Expert Dashboard</h1>
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
            <h1 className="font-serif text-3xl text-white">Expert Dashboard</h1>
            <p className="mt-2 text-sm text-white/60">
              Expert engagements, reviews, and advisory opportunities.
            </p>
          </div>
          <Button
            className="bg-[#C9A15A] text-[#111318] hover:bg-[#E8D6A8]"
            onClick={() => navigate("/settings")}
          >
            Edit Profile
          </Button>
        </div>

        <Card className="p-6 border border-white/10 bg-white/2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C9A15A] mb-4">
            Opportunities
          </h2>
          <p className="text-white/50 hyphens-auto">
            Expert matching and engagement requests will appear here as ventures
            request your sector expertise.
          </p>
        </Card>
      </div>
    </div>
  );
}
