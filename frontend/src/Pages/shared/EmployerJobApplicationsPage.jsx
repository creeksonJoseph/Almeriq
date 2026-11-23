import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Skeleton, SkeletonText } from "../../components/ui";
import { listJobApplicationsApi, listMyJobsApi, reviewJobApplicationApi } from "../../lib/api/job";

export default function EmployerJobApplicationsPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobsResult, applicationsResult] = await Promise.all([
        listMyJobsApi(),
        listJobApplicationsApi(Number(jobId)),
      ]);
      const selectedJob = (jobsResult.items || []).find((item) => String(item.id) === String(jobId));
      if (!selectedJob) {
        setJob(null);
        setError("This job posting could not be found in your workspace.");
      } else {
        setJob(selectedJob);
        setApplications(applicationsResult.items || []);
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to load applications for this role.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const review = async (applicationId, status) => {
    setBusyId(applicationId);
    setError("");
    setNotice("");
    try {
      const updated = await reviewJobApplicationApi(Number(jobId), applicationId, status);
      setApplications((items) => items.map((item) => item.id === applicationId ? updated : item));
      setNotice("Application marked " + status + ".");
    } catch (requestError) {
      setError(requestError.message || "Unable to update this application.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-text">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Hiring workspace</p>
            <h1 className="mt-2 font-serif text-3xl">Applicant review</h1>
            <p className="mt-2 text-sm text-white/60">{job?.title || "Applications for selected role"}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/jobs/manage")}>Back to job postings</Button>
        </header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        {loading ? <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((item) => <Card key={item} className="space-y-3 p-5"><Skeleton className="h-5 w-1/3" /><SkeletonText lines={2} /><div className="flex gap-2"><Skeleton className="h-9 w-24 rounded-xl" /><Skeleton className="h-9 w-24 rounded-xl" /></div></Card>)}</div>
          : applications.length === 0 ? <Card className="p-8 text-center text-sm text-white/55">No applications have been submitted for this role yet.</Card>
          : <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-serif text-xl">Applications</h2><span className="text-sm text-white/45">{applications.length} total</span></div>
            {applications.map((application) => (
              <Card key={application.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{application.applicant_name || "Applicant #" + application.applicant_id}</h3>
                  <p className="mt-1 text-xs text-white/45">Status: {application.status}</p>
                  {application.applicant_profile?.headline && <p className="mt-2 text-sm text-gold">{application.applicant_profile.headline}</p>}
                  {application.applicant_profile?.bio && <p className="mt-2 text-sm text-white/60">{application.applicant_profile.bio}</p>}
                  {application.applicant_profile?.skills?.length > 0 && <p className="mt-2 text-xs text-white/50">Skills: {application.applicant_profile.skills.join(", ")}</p>}
                  {application.cover_letter && <p className="mt-2 whitespace-pre-line text-sm text-white/60">{application.cover_letter}</p>}
                  {(application.resume_url || application.applicant_profile?.resume_url) && <a href={application.resume_url || application.applicant_profile.resume_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-gold underline">View resume</a>}
                  {application.applicant_profile?.portfolio_url && <a href={application.applicant_profile.portfolio_url} target="_blank" rel="noreferrer" className="ml-3 mt-2 inline-block text-xs text-gold underline">Portfolio</a>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {application.status === "pending" && <Button size="sm" variant="ghost" disabled={busyId === application.id} onClick={() => review(application.id, "reviewed")}>Mark reviewed</Button>}
                  {["pending", "reviewed"].includes(application.status) && <Button size="sm" disabled={busyId === application.id} onClick={() => review(application.id, "accepted")}>Accept</Button>}
                  {["pending", "reviewed"].includes(application.status) && <Button size="sm" variant="ghost" disabled={busyId === application.id} onClick={() => review(application.id, "rejected")}>Reject</Button>}
                </div>
              </Card>
            ))}
          </section>}
      </div>
    </main>
  );
}
