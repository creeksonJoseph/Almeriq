import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/ui";
import { apiClient } from "../../lib/client";

export default function JobSeekerDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get("/job-seeker/profile");
        setProfile(data);
      } catch (e) {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text font-sans antialiased px-4 py-10 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="font-serif text-3xl text-text">Job Seeker Dashboard</h1>
        <Card className="p-6">
          <p className="text-white/60">{profile?.headline || "Complete your profile"}</p>
          <Button className="mt-4" onClick={() => navigate("/job-seeker/setup")}>Edit Profile</Button>
        </Card>
      </div>
    </div>
  );
}
