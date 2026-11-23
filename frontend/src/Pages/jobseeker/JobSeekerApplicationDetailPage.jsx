import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../../components/ui";
import { getJobApi, getMyJobApplicationApi, withdrawJobApplicationApi } from "../../lib/api/job";

const STATUS_STYLES = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  reviewed: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  rejected: "border-red-500/30 bg-red-500/10 text-red-200",
  withdrawn: "border-white/10 bg-white/5 text-white/50",
};

export default function JobSeekerApplicationDetailPage() {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getMyJobApplicationApi(applicationId);
      setApplication(result);
      if (result.job_posting_id) {
        const jobResult = await getJobApi(result.job_posting_id).catch(() => null);
        setJob(jobResult);
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to load this application.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { load(); }, [load]);

  const withdraw = async () => {
    if (!application || !["pending", "reviewed"].includes(application.status)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await withdrawJobApplicationApi(application.id);
      setApplication(updated);
      setNotice("Your application has been withdrawn.");
    } catch (requestError) {
      setError(requestError.message || "Unable to withdraw this application.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-text">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-gold">Talent workspace</p><h1 className="mt-2 font-serif text-3xl">Application details</h1></div>
          <Button variant="ghost" onClick={() => navigate("/job-seeker/applications")}>Back to applications</Button>
        </header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        {loading ? <Card className="p-8 text-center text-sm text-white/55">Loading application…</Card>
          : application && <div className="space-y-4">
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-xl font-semibold">{job?.title || "Job application"}</h2><p className="mt-1 text-sm text-white/50">{job?.location || "Location not specified"}{job?.role_type ? " · " + job.role_type.replaceAll("_", " ") : ""}</p></div>
                <span className={"rounded-full border px-3 py-1 text-xs capitalize " + (STATUS_STYLES[application.status] || STATUS_STYLES.pending)}>{application.status}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs uppercase tracking-wider text-white/40">Application reference</p><p className="mt-1 text-sm">#{application.id}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-white/40">Submitted</p><p className="mt-1 text-sm">{application.applied_at ? new Date(application.applied_at).toLocaleString() : "Date unavailable"}</p></div>
              </div>
              {application.cover_letter && <div className="border-t border-border pt-4"><h3 className="text-sm font-medium">Your cover letter</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/65">{application.cover_letter}</p></div>}
              {(application.resume_url || job?.resume_url) && <a className="inline-block text-sm text-gold underline" href={application.resume_url || job.resume_url} target="_blank" rel="noreferrer">View submitted resume</a>}
              {["pending", "reviewed"].includes(application.status) && <div className="flex justify-end border-t border-border pt-4"><Button variant="ghost" disabled={busy} onClick={withdraw}>{busy ? "Withdrawing…" : "Withdraw application"}</Button></div>}
            </Card>
            {job && <Card className="space-y-3 p-5"><h3 className="font-serif text-xl">Job details</h3><p className="whitespace-pre-line text-sm leading-6 text-white/65">{job.description}</p>{job.requirements && <div><p className="text-xs uppercase tracking-wider text-white/40">Requirements</p><p className="mt-1 whitespace-pre-line text-sm text-white/60">{job.requirements}</p></div>}</Card>}
          </div>}
      </div>
    </main>
  );
}
