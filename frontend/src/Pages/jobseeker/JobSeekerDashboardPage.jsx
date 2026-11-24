import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Skeleton, SkeletonText } from "../../components/ui";
import { getJobSeekerProfileApi, listJobsApi, listMyJobApplicationsApi } from "../../lib/api/job";

export default function JobSeekerDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [openJobs, setOpenJobs] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [profileResult, jobsResult, applicationsResult] = await Promise.all([
          getJobSeekerProfileApi().catch((profileError) => {
            if (profileError.response?.status === 404) return null;
            throw profileError;
          }),
          listJobsApi({ is_active: true, limit: 100 }),
          listMyJobApplicationsApi(),
        ]);
        if (cancelled) return;
        setProfile(profileResult);
        setOpenJobs(Number(jobsResult.total ?? jobsResult.items?.length ?? 0));
        setApplicationCount(Number(applicationsResult.total ?? applicationsResult.items?.length ?? 0));
      } catch (loadError) {
        if (!cancelled) setError(loadError.response?.data?.detail || loadError.message || "We couldn't load your dashboard. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Talent workspace</p>
            <h1 className="mt-2 font-serif text-3xl">Your career dashboard</h1>
            <p className="mt-2 text-sm text-white/60">Keep your profile current and stay on top of opportunities.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/job-seeker/setup")}>Edit profile</Button>
            <Button onClick={() => navigate("/job-seeker/jobs")}>Find jobs</Button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error} <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>Retry</Button></div>}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-xs uppercase tracking-wider text-white/45">Open roles</p><p className="mt-2 text-3xl font-semibold">{loading || error ? "—" : openJobs}</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wider text-white/45">Applications sent</p><p className="mt-2 text-3xl font-semibold">{loading || error ? "—" : applicationCount}</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wider text-white/45">Profile visibility</p><p className="mt-2 text-lg font-semibold">{loading || error ? "—" : profile?.is_active ? "Visible" : "Hidden"}</p></Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/45">Your profile</p>
              <h2 className="mt-2 font-serif text-2xl">{profile?.headline || "Complete your profile"}</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/60">{profile?.bio || "Add a headline, skills and a short introduction so employers can understand what you bring to their team."}</p>
              <p className="mt-3 text-xs text-white/45">{profile?.location || "Add your location"}{profile?.experience_years != null ? ` · ${profile.experience_years} years experience` : ""}</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/job-seeker/setup")}>Update profile</Button>
          </div>
          {Array.isArray(profile?.skills) && profile.skills.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills.map((skill) => <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs text-white/65">{skill}</span>)}
            </div>
          )}
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div><h2 className="font-serif text-xl">Ready for your next move?</h2><p className="mt-1 text-sm text-white/55">Browse open roles and apply with your saved profile details.</p></div>
          <Button onClick={() => navigate("/job-seeker/jobs")}>Browse opportunities</Button>
        </Card>
      </div>
    </main>
  );
}
