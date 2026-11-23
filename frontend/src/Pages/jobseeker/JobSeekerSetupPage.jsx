import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/client";
import { Button, Card, Input, Skeleton, SkeletonText } from "../../components/ui";

const EMPTY_PROFILE = {
  headline: "", bio: "", location: "", skills: "", experience_years: "",
  resume_url: "", portfolio_url: "", experience: "", education: "",
  certifications: "", projects: "", desired_roles: "", job_types: "",
  preferred_location: "", salary_min: "", salary_max: "", remote_only: false,
  is_active: true,
};

const toLines = (items, keys) => (items || []).map((item) => keys.map((key) => item?.[key] || "").join(" | ")).join("\n");
const fromLines = (value, keys) => value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
  const parts = line.split("|").map((part) => part.trim());
  return Object.fromEntries(keys.map((key, index) => [key, parts[index] || ""]));
});
const splitList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
const numberOrNull = (value) => value === "" ? null : Number(value);

export default function JobSeekerSetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const { data } = await apiClient.get("/api/job-seeker/profile");
        if (cancelled || !data) return;
        const preferences = data.preferences || {};
        setForm({
          ...EMPTY_PROFILE,
          headline: data.headline || "", bio: data.bio || "", location: data.location || "",
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
          experience_years: data.experience_years ?? "", resume_url: data.resume_url || "",
          portfolio_url: data.portfolio_url || "",
          experience: toLines(data.experience, ["title", "company", "start_date", "end_date", "description"]),
          education: toLines(data.education, ["qualification", "institution", "year", "details"]),
          certifications: toLines(data.certifications, ["name", "issuer", "year", "url"]),
          projects: toLines(data.projects, ["name", "description", "url", "technologies"]),
          desired_roles: (preferences.desired_roles || []).join(", "),
          job_types: (preferences.job_types || []).join(", "),
          preferred_location: preferences.location || "",
          salary_min: preferences.salary_min ?? "", salary_max: preferences.salary_max ?? "",
          remote_only: Boolean(preferences.remote_only), is_active: data.is_active ?? true,
        });
      } catch (requestError) {
        if (!cancelled && requestError.response?.status !== 404) {
          setError(requestError.response?.data?.detail || "Unable to load your profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const years = numberOrNull(form.experience_years);
    const salaryMin = numberOrNull(form.salary_min);
    const salaryMax = numberOrNull(form.salary_max);
    if ((years !== null && (!Number.isInteger(years) || years < 0)) ||
        (salaryMin !== null && (!Number.isFinite(salaryMin) || salaryMin < 0)) ||
        (salaryMax !== null && (!Number.isFinite(salaryMax) || salaryMax < 0)) ||
        (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax)) {
      setError("Check your experience and salary values. They must be valid non-negative numbers, and minimum salary cannot exceed maximum salary.");
      setSaving(false); return;
    }
    try {
      await apiClient.put("/api/job-seeker/profile", {
        headline: form.headline.trim() || null, bio: form.bio.trim() || null,
        location: form.location.trim() || null, skills: splitList(form.skills),
        experience_years: years, resume_url: form.resume_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        experience: fromLines(form.experience, ["title", "company", "start_date", "end_date", "description"]),
        education: fromLines(form.education, ["qualification", "institution", "year", "details"]),
        certifications: fromLines(form.certifications, ["name", "issuer", "year", "url"]),
        projects: fromLines(form.projects, ["name", "description", "url", "technologies"]),
        preferences: {
          desired_roles: splitList(form.desired_roles), job_types: splitList(form.job_types),
          location: form.preferred_location.trim(), salary_min: salaryMin,
          salary_max: salaryMax, remote_only: form.remote_only,
        },
        is_active: form.is_active,
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to save your profile. Please try again.");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10" aria-label="Loading your profile" aria-busy="true">
      <div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-full max-w-xl" /></div>
      <Card className="space-y-5 p-5">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="space-y-2"><Skeleton className="h-3 w-1/4" /><Skeleton className="h-11 w-full rounded-xl" /></div>)}<SkeletonText lines={3} /><Skeleton className="h-10 w-36 rounded-xl" /></Card>
    </main>
  );

  const section = (title, name, hint, placeholder, rows = 4) => (
    <label className="block space-y-2" key={name}>
      <span className="text-sm font-medium">{title}</span>
      <textarea name={name} value={form[name]} onChange={updateField} rows={rows}
        className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold"
        placeholder={placeholder} />
      <span className="text-xs text-white/50">{hint}</span>
    </label>
  );

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Job seeker</p>
            <h1 className="mt-2 font-serif text-3xl">Your professional profile</h1>
            <p className="mt-2 text-sm text-white/60">Build a profile employers can use to assess your experience and fit.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => navigate("/job-seeker/dashboard")}>Back to dashboard</Button>
        </div>

        <Card className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            {saved && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Your profile has been saved.</p>}

            <section className="space-y-4">
              <h2 className="font-serif text-xl">Basic information</h2>
              <label className="block space-y-2"><span className="text-sm font-medium">Professional headline</span><Input name="headline" value={form.headline} onChange={updateField} placeholder="e.g. Junior Backend Developer" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">About you</span><textarea name="bio" value={form.bio} onChange={updateField} rows={4} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold" placeholder="Summarize your experience, strengths and career direction." /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2"><span className="text-sm font-medium">Location</span><Input name="location" value={form.location} onChange={updateField} placeholder="City, country" /></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Years of experience</span><Input name="experience_years" value={form.experience_years} onChange={updateField} placeholder="0" /></label>
              </div>
              <label className="block space-y-2"><span className="text-sm font-medium">Skills</span><Input name="skills" value={form.skills} onChange={updateField} placeholder="Python, React, PostgreSQL" /><span className="text-xs text-white/50">Separate skills with commas.</span></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2"><span className="text-sm font-medium">Resume URL</span><Input name="resume_url" value={form.resume_url} onChange={updateField} placeholder="https://" /></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Portfolio URL</span><Input name="portfolio_url" value={form.portfolio_url} onChange={updateField} placeholder="https://" /></label>
              </div>
            </section>

            <div className="border-t border-border pt-5 space-y-4">
              <h2 className="font-serif text-xl">Work history & education</h2>
              {section("Work experience", "experience", "One entry per line: Job title | Company | Start date | End date | Description", "Backend Developer | Acme Ltd | Jan 2024 | Present | Built APIs and services")}
              {section("Education", "education", "One entry per line: Qualification | Institution | Year | Details", "BSc Computer Science | University | 2025 | Relevant coursework")}
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h2 className="font-serif text-xl">Proof of work</h2>
              {section("Certifications", "certifications", "One entry per line: Name | Issuer | Year | Credential URL", "AWS Cloud Practitioner | AWS | 2026 | https://")}
              {section("Projects", "projects", "One entry per line: Name | Description | URL | Technologies", "Portfolio API | REST API for projects | https:// | Python, FastAPI")}
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h2 className="font-serif text-xl">Job preferences</h2>
              <label className="block space-y-2"><span className="text-sm font-medium">Roles you're interested in</span><Input name="desired_roles" value={form.desired_roles} onChange={updateField} placeholder="Backend Developer, Cloud Engineer" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Employment types</span><Input name="job_types" value={form.job_types} onChange={updateField} placeholder="full_time, contract, internship" /><span className="text-xs text-white/50">Use full_time, part_time, contract, freelance or internship.</span></label>
              <label className="block space-y-2"><span className="text-sm font-medium">Preferred location</span><Input name="preferred_location" value={form.preferred_location} onChange={updateField} placeholder="Nairobi, Remote, or Anywhere" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2"><span className="text-sm font-medium">Minimum salary expectation</span><Input name="salary_min" value={form.salary_min} onChange={updateField} placeholder="Optional" /></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Maximum salary expectation</span><Input name="salary_max" value={form.salary_max} onChange={updateField} placeholder="Optional" /></label>
              </div>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="remote_only" checked={form.remote_only} onChange={updateField} className="accent-gold" />Only show remote opportunities</label>
            </div>

            <div className="border-t border-border pt-5">
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" checked={form.is_active} onChange={updateField} className="accent-gold" />Make my profile visible to employers</label>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
              <Button type="button" variant="ghost" onClick={() => navigate("/job-seeker/dashboard")}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
