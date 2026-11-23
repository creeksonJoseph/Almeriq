import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyToJobApi, listJobsApi, listMyJobApplicationsApi, getJobSeekerProfileApi, withdrawJobApplicationApi } from "../../lib/api/job";
import { Button, Card, Input, Skeleton, SkeletonText } from "../../components/ui";

const STATUS_STYLES = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  reviewed: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  rejected: "border-red-500/30 bg-red-500/10 text-red-200",
  withdrawn: "border-white/10 bg-white/5 text-white/50",
};

export default function JobSeekerJobsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageView = location.pathname.endsWith("/applications") ? "applications" : "jobs";
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [coverLetters, setCoverLetters] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobResult, applicationResult, seekerProfile] = await Promise.all([
        listJobsApi({ is_active: true, limit: 100 }),
        listMyJobApplicationsApi(),
        getJobSeekerProfileApi().catch((profileError) => {
          if (profileError.status === 404) return null;
          throw profileError;
        }),
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
    return jobs.filter((job) => {
      const searchable = [job.title, job.description, job.location, job.role_type, job.requirements]
        .filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !normalized || searchable.includes(normalized);
      const matchesLocation = !locationFilter.trim() || String(job.location || "").toLowerCase().includes(locationFilter.trim().toLowerCase());
      const matchesType = !typeFilter || job.role_type === typeFilter;
      return matchesQuery && matchesLocation && matchesType;
    });
  }, [jobs, query, locationFilter, typeFilter]);

  const recommendedJobs = useMemo(() => {
    if (!profile) return [];
    const skills = (profile.skills || []).map((value) => String(value).toLowerCase()).filter(Boolean);
    const roles = (profile.preferences?.desired_roles || []).map((value) => String(value).toLowerCase()).filter(Boolean);
    const preferredLocation = (profile.preferences?.location || profile.location || "").toLowerCase();
    const preferredTypes = profile.preferences?.job_types || [];
    return jobs.map((job) => {
      const searchable = [job.title, job.description, job.requirements].filter(Boolean).join(" ").toLowerCase();
      const matchedSkills = skills.filter((skill) => searchable.includes(skill));
      const reasons = [];
      if (matchedSkills.length) reasons.push("Skills: " + matchedSkills.slice(0, 3).join(", "));
      if (roles.some((role) => searchable.includes(role))) reasons.push("Matches your role preferences");
      if (preferredLocation && String(job.location || "").toLowerCase().includes(preferredLocation)) reasons.push("Matches your location preference");
      if (preferredTypes.includes(job.role_type)) reasons.push("Matches your employment type");
      const score = Math.min(100, matchedSkills.length * 20 + (reasons.some((reason) => reason.startsWith("Matches your role")) ? 25 : 0) + (reasons.some((reason) => reason.startsWith("Matches your location")) ? 15 : 0) + (reasons.some((reason) => reason.startsWith("Matches your employment")) ? 10 : 0));
      return { ...job, match_score: score, match_reasons: reasons };
    }).filter((job) => job.match_reasons.length > 0).sort((a, b) => b.match_score - a.match_score).slice(0, 3);
  }, [jobs, profile]);

  const apply = async (job) => {
    setApplyingId(job.id);
    setError("");
    setNotice("");
    try {
      await applyToJobApi(job.id, { resume_url: profile?.resume_url || null, cover_letter: coverLetters[job.id]?.trim() || null });
      setNotice(`Application submitted for ${job.title}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your application.");
    } finally {
      setApplyingId(null);
    }
  };

  const withdraw = async (application) => {
    setWithdrawingId(application.id); setError(""); setNotice("");
    try {
      const updated = await withdrawJobApplicationApi(application.id);
      setApplications((items) => items.map((item) => item.id === application.id ? updated : item));
      setNotice("Your application has been withdrawn.");
    } catch (requestError) {
      setError(requestError.message || "Unable to withdraw this application.");
    } finally { setWithdrawingId(null); }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-text">
      <div className="mx-auto max-w-6xl space-y-8">
        <nav aria-label="Job seeker workspace" className="flex flex-wrap gap-2 border-b border-border pb-3">{[["jobs","Find jobs","/job-seeker/jobs"],["applications","My applications","/job-seeker/applications"]].map(([key,label,path]) => <Button key={key} size="sm" variant={pageView === key ? "primary" : "ghost"} onClick={() => navigate(path)}>{label}</Button>)}</nav>
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

        {recommendedJobs.length > 0 && pageView === "jobs" && (
        <section className="space-y-3"><div><h2 className="font-serif text-2xl">Recommended for you</h2><p className="mt-1 text-sm text-white/50">Based on your skills and saved job preferences.</p></div><div className="grid gap-3 md:grid-cols-3">{recommendedJobs.map((job) => <Card key={job.id} className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-medium">{job.title}</h3><span className="text-xs text-gold">{job.match_score}%</span></div><p className="text-xs text-white/45">{job.location || "Location not specified"}</p><p className="text-xs text-white/55">{job.match_reasons.join(" · ")}</p><Button size="sm" disabled={appliedJobIds.has(job.id) || applyingId === job.id} onClick={() => apply(job)}>{appliedJobIds.has(job.id) ? "Applied" : "Apply now"}</Button></Card>)}</div></section>
        
        )}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-serif text-2xl">Open positions</h2><p className="mt-1 text-sm text-white/50">Search by title, skills, location or description.</p></div>
            <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-2xl"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs or skills…" /><Input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="Filter by location…" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text"><option value="">All employment types</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="freelance">Freelance</option><option value="internship">Internship</option></select></div>
          </div>
          {loading ? <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <Card key={item} className="space-y-4 p-5"><Skeleton className="h-5 w-2/3" /><SkeletonText lines={3} /><Skeleton className="h-9 w-28 rounded-xl" /></Card>)}</div> :
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
                  {!appliedJobIds.has(job.id) && <label className="block space-y-2"><span className="text-xs text-white/50">Cover letter (optional)</span><textarea value={coverLetters[job.id] || ""} onChange={(event) => setCoverLetters((items) => ({ ...items, [job.id]: event.target.value }))} rows={3} maxLength={5000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold" placeholder="Briefly explain why you're a good fit." /></label>}
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

        {pageView === "applications" && (
        <section className="space-y-4">
          <div><h2 className="font-serif text-2xl">My applications</h2><p className="mt-1 text-sm text-white/50">Keep track of where each application stands.</p></div>
          {applications.length === 0 ? <Card className="p-6 text-sm text-white/55">You have not applied to any roles yet.</Card> :
            <Card className="divide-y divide-border p-0">
              {applications.map((application) => (
                <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div><p className="font-medium">{jobs.find((job) => job.id === application.job_posting_id)?.title || `Job #${application.job_posting_id}`}</p><p className="mt-1 text-xs text-white/45">Applied {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : "recently"}</p></div>
                  <div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs capitalize ${STATUS_STYLES[application.status] || STATUS_STYLES.pending}`}>{application.status}</span><Button size="sm" variant="ghost" onClick={() => navigate(`/job-seeker/applications/${application.id}`)}>View details</Button>{["pending", "reviewed"].includes(application.status) && <Button size="sm" variant="ghost" disabled={withdrawingId === application.id} onClick={() => withdraw(application)}>{withdrawingId === application.id ? "Withdrawing…" : "Withdraw"}</Button>}</div>
                </div>
              ))}
            </Card>
          }
        </section>
        )}
      </div>
    </main>
  );
}
