import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import {
  createJobApi,
  deleteJobApi,
  listMyJobsApi,
  updateJobApi,
} from "../../lib/api/job";
import { executeAiToolApi } from "../../lib/api/founder";

const EMPTY_JOB = { title: "", description: "", location: "", role_type: "full_time", requirements: "", salary_min: "", salary_max: "" };

export default function EmployerJobsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageView = location.pathname.endsWith("/new") ? "editor" : "list";
  const editId = new URLSearchParams(location.search).get("edit");
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(EMPTY_JOB);
  const [editingJobId, setEditingJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafting, setDrafting] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const result = await listMyJobsApi();
      setJobs(result.items || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load your job postings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => {
    if (pageView !== "editor" || !editId || !jobs.length) return;
    const job = jobs.find((item) => String(item.id) === String(editId));
    if (!job || String(editingJobId) === String(job.id)) return;
    setEditingJobId(job.id);
    setForm({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      role_type: job.role_type || "full_time",
      requirements: job.requirements || "",
      salary_min: job.salary_min ?? "",
      salary_max: job.salary_max ?? "",
    });
  }, [pageView, editId, jobs, editingJobId]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const draftJobWithAi = async () => {
    if (form.title.trim().length < 5) { setError("Add a job title with at least five characters before drafting."); return; }
    setDrafting(true); setError(""); setNotice("");
    try {
      const response = await executeAiToolApi({ tool_key: "job_post", idea: form.title.trim(), customer: "Potential applicants", location: form.location.trim(), extra_params: { employment_type: form.role_type, location: form.location.trim() || "Not specified", requirements: form.requirements.trim() || "Not specified", salary_min: form.salary_min || null, salary_max: form.salary_max || null } });
      const draft = response.result || {};
      const responsibilities = Array.isArray(draft.responsibilities) ? draft.responsibilities.map((item) => "- " + item).join("\n") : "";
      const description = [draft.role_summary, responsibilities, draft.why_join_us].filter(Boolean).join("\n\n");
      setForm((current) => ({ ...current, title: draft.title || current.title, description: description || current.description, requirements: Array.isArray(draft.requirements) ? draft.requirements.join(", ") : draft.requirements || current.requirements }));
      setNotice("AI draft added to the form. Review and edit every detail before publishing.");
    } catch (err) { setError(err.message || "Unable to draft this job post."); }
    finally { setDrafting(false); }
  };
  const submitJob = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const min = form.salary_min === "" ? null : Number(form.salary_min);
    const max = form.salary_max === "" ? null : Number(form.salary_max);
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0)) || (min !== null && max !== null && min > max)) {
      setError("Enter a valid salary range.");
      setSaving(false);
      return;
    }
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        role_type: form.role_type,
        requirements: form.requirements.trim() || null,
        salary_min: min,
        salary_max: max,
      };
      if (editingJobId) {
        await updateJobApi(editingJobId, payload);
        setNotice("Your job posting has been updated.");
      } else {
        await createJobApi({ ...payload, is_active: true });
        setNotice("Your job posting is live.");
      }
      setForm(EMPTY_JOB);
      setEditingJobId(null);
      await loadJobs();
      navigate("/jobs/manage");
    } catch (requestError) {
      setError(requestError.message || "Unable to publish this job.");
    } finally {
      setSaving(false);
    }
  };

  const editJob = (job) => {
    navigate("/jobs/manage/new?edit=" + job.id);
    setEditingJobId(job.id);
    setForm({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      role_type: job.role_type || "full_time",
      requirements: job.requirements || "",
      salary_min: job.salary_min ?? "",
      salary_max: job.salary_max ?? "",
    });
    setError(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingJobId(null);
    setForm(EMPTY_JOB);
    navigate("/jobs/manage");
  };

  const toggleJob = async (job) => {
    setError("");
    try {
      await updateJobApi(job.id, { is_active: !job.is_active });
      setNotice(job.is_active ? "Job posting closed." : "Job posting reopened.");
      await loadJobs();
    } catch (requestError) {
      setError(requestError.message || "Unable to update this job.");
    }
  };

  const removeJob = async (job) => {
    if (!window.confirm(`Delete “${job.title}”? This also removes its applications.`)) return;
    setError("");
    try {
      await deleteJobApi(job.id);
      setNotice("Job posting deleted.");
      await loadJobs();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this job.");
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-text">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Hiring workspace</p>
          <h1 className="mt-2 font-serif text-3xl">Manage your openings</h1>
          <p className="mt-2 text-sm text-white/60">Publish roles, manage applications and keep hiring activity in one place.</p>
        </header>
        <nav aria-label="Hiring workspace" className="flex flex-wrap gap-2 border-b border-border pb-3">
          <Button size="sm" variant={pageView === "list" ? "primary" : "ghost"} onClick={() => navigate("/jobs/manage")}>Job postings</Button>
          <Button size="sm" variant={pageView === "editor" ? "primary" : "ghost"} onClick={() => { setEditingJobId(null); setForm(EMPTY_JOB); navigate("/jobs/manage/new"); }}>Create a job</Button>
        </nav>

        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

{pageView === "editor" && (\n        <Card className="p-6">
          <h2 className="font-serif text-xl">{editingJobId ? "Edit job posting" : "Create a job posting"}</h2>
          <div className="mt-4 flex justify-end"><Button type="button" variant="ghost" disabled={drafting || !form.title.trim()} onClick={draftJobWithAi}>{drafting ? "Drafting…" : "Draft with AI"}</Button></div>
          <form onSubmit={submitJob} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm"><span>Job title</span><Input name="title" required maxLength={200} value={form.title} onChange={updateField} placeholder="e.g. Backend Engineer" /></label>
              <label className="space-y-2 text-sm"><span>Location</span><Input name="location" value={form.location} onChange={updateField} placeholder="Remote / Nairobi / Hybrid" /></label>
            </div>
            <label className="block space-y-2 text-sm"><span>Description</span><textarea required name="description" value={form.description} onChange={updateField} rows={4} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none focus:border-gold" placeholder="What will this person work on?" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm"><span>Employment type</span><select name="role_type" value={form.role_type} onChange={updateField} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="freelance">Freelance</option><option value="internship">Internship</option></select></label>
              <label className="space-y-2 text-sm"><span>Requirements</span><Input name="requirements" value={form.requirements} onChange={updateField} placeholder="Skills, experience, qualifications" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm"><span>Minimum salary</span><Input name="salary_min" type="number" min="0" step="0.01" value={form.salary_min} onChange={updateField} placeholder="Optional" /></label>
              <label className="space-y-2 text-sm"><span>Maximum salary</span><Input name="salary_max" type="number" min="0" step="0.01" value={form.salary_max} onChange={updateField} placeholder="Optional" /></label>
            </div>
            <div className="flex justify-end gap-2">{editingJobId && <Button type="button" variant="ghost" onClick={cancelEdit}>Cancel edit</Button>}<Button type="submit" disabled={saving || !form.title.trim() || !form.description.trim()}>{saving ? "Saving…" : editingJobId ? "Save changes" : "Publish job"}</Button></div>
          </form>
        </Card>

\n        )}\n{pageView === "list" && (\n        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Your job postings</h2><span className="text-sm text-white/45">{jobs.length} total</span></div>
          {loading ? <p className="py-8 text-center text-sm text-white/50">Loading your postings…</p> :
            jobs.length === 0 ? <Card className="p-8 text-center text-sm text-white/55">You have not posted a role yet. Create your first opening above.</Card> :
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{job.title}</h3><span className={`rounded-full border px-2.5 py-1 text-xs ${job.is_active ? "border-emerald-500/30 text-emerald-200" : "border-white/15 text-white/45"}`}>{job.is_active ? "Open" : "Closed"}</span></div><p className="mt-1 text-sm text-white/50">{job.location || "Location not specified"} · {job.role_type?.replaceAll("_", " ")}</p><p className="mt-3 line-clamp-2 text-sm text-white/65">{job.description}</p></div>
                    <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => editJob(job)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => toggleJob(job)}>{job.is_active ? "Close role" : "Reopen role"}</Button><Button size="sm" variant="ghost" onClick={() => navigate(`/jobs/manage/${job.id}/applications`)}>Applications</Button><Button size="sm" variant="ghost" onClick={() => removeJob(job)}>Delete</Button></div>
                  </div>

                </Card>
              ))}
            </div>
          }
        </section>\n        )}
      </div>
    </main>
  );
}
