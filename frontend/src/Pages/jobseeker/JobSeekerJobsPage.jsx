import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyToJobApi, listJobsApi, listMyJobApplicationsApi, getJobSeekerProfileApi } from "../../lib/api/job";
import { Button, Card, Input } from "../../components/ui";

const STATUS_STYLES = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  reviewed: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  rejected: "border-red-500/30 bg-red-500/10 text-red-200",
  withdrawn: "border-white/10 bg-white/5 text-white/50",
};

export default function JobSeekerJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobResult, applicationResult, seekerProfile] = await Promise.all([
        listJobsApi({ is_active: true, limit: 100 }),
        listMyJobApplicationsApi(),
        getJobSeekerProfileApi().catch(() => null),
      ]);
      setJobs(jobResult.items || []);
      setApplications(applicationResult.items || []);
      setProfile(seekerProfile);
    } catch (requestError) {
      setError(requestError.message || "Unable to load jobs right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const appliedJobIds = useMemo(
    () => new Set(applications.map((application) => application.job_posting_id)),
    [applications],
  );
  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return jobs;
    return jobs.filter((job) =>
      [job.title, job.description, job.location, job.role_type, job.requirements]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [jobs, query]);

  const apply = async (job) => {
    setApplyingId(job.id);
    setError("");
    setNotice("");
    try {
      await applyToJobApi(job.id, { resume_url: profile?.resume_url || null });
      setNotice(`Application submitted for ${job.title}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your application.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-text">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Talent workspace</p>
            <h1 className="mt-2 font-serif text-3xl">Find your next opportunity</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">Explore open roles from founders and infrastructure providers, then track your applications here.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/job-seeker/setup")}>Edit profile</Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-xs uppercase tracking-wider text-white/45">Open roles</p><p className="mt-2 text-3xl font-semibold">{jobs.length}</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wider text-white/45">Applications</p><p className="mt-2 text-3xl font-semibold">{applications.length}</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wider text-white/45">Profile status</p><p className="mt-2 text-lg font-semibold">{profile?.is_active ? "Visible to employers" : "Not visible"}</p></Card>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-serif text-2xl">Open positions</h2><p className="mt-1 text-sm text-white/50">Search by title, skills, location or description.</p></div>
            <div className="w-full sm:max-w-sm"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs…" /></div>
          </div>
          {loading ? <p className="py-10 text-center text-sm text-white/50">Loading opportunities…</p> :
            filteredJobs.length === 0 ? <Card className="p-8 text-center"><p className="font-medium">No matching roles found</p><p className="mt-2 text-sm text-white/50">Try another search, or check back as new roles are posted.</p></Card> :
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-lg font-semibold">{job.title}</h3><p className="mt-1 text-sm text-white/50">{job.location || "Location not specified"}{job.role_type ? ` · ${job.role_type.replaceAll("_", " ")}` : ""}</p></div>
                    <span className="shrink-0 rounded-full border border-gold/30 px-3 py-1 text-xs text-gold">Open</span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-white/70">{job.description}</p>
                  {job.requirements && <div><p className="text-xs font-semibold uppercase tracking-wider text-white/40">Requirements</p><p className="mt-1 whitespace-pre-line text-sm text-white/60">{job.requirements}</p></div>}
                  {(job.salary_min != null || job.salary_max != null) && <p className="text-sm text-white/60">Salary range: {job.salary_min ?? "—"} – {job.salary_max ?? "—"}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-xs text-white/40">Job #{job.id}</span>
                    {appliedJobIds.has(job.id) ?
                      <span className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-200">Applied</span> :
                      <Button disabled={applyingId === job.id} onClick={() => apply(job)}>{applyingId === job.id ? "Applying…" : "Apply now"}</Button>}
                  </div>
                </Card>
              ))}
            </div>
          }
        </section>

        <section className="space-y-4">
          <div><h2 className="font-serif text-2xl">My applications</h2><p className="mt-1 text-sm text-white/50">Keep track of where each application stands.</p></div>
          {applications.length === 0 ? <Card className="p-6 text-sm text-white/55">You have not applied to any roles yet.</Card> :
            <Card className="divide-y divide-border p-0">
              {applications.map((application) => (
                <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div><p className="font-medium">Job #{application.job_posting_id}</p><p className="mt-1 text-xs text-white/45">Applied {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : "recently"}</p></div>
                  <span className={`rounded-full border px-3 py-1 text-xs capitalize ${STATUS_STYLES[application.status] || STATUS_STYLES.pending}`}>{application.status}</span>
                </div>
              ))}
            </Card>
          }
        </section>
      </div>
    </main>
  );
}
