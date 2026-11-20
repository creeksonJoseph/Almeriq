import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/client";
import { Button, Card, Input } from "../../components/ui";

const EMPTY_PROFILE = {
  headline: "",
  bio: "",
  location: "",
  skills: "",
  experience_years: "",
  resume_url: "",
  portfolio_url: "",
  is_active: true,
};

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
        setForm({
          headline: data.headline || "",
          bio: data.bio || "",
          location: data.location || "",
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
          experience_years: data.experience_years ?? "",
          resume_url: data.resume_url || "",
          portfolio_url: data.portfolio_url || "",
          is_active: data.is_active ?? true,
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
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const experience = form.experience_years === "" ? null : Number(form.experience_years);
    if (experience !== null && (!Number.isInteger(experience) || experience < 0)) {
      setError("Experience must be a whole number of zero or more.");
      setSaving(false);
      return;
    }

    try {
      await apiClient.put("/api/job-seeker/profile", {
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        experience_years: experience,
        resume_url: form.resume_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        is_active: form.is_active,
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6 text-white/60">Loading your profile…</div>;
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Job seeker</p>
            <h1 className="mt-2 font-serif text-3xl">Your profile</h1>
            <p className="mt-2 text-sm text-white/60">Add the details employers need to understand your experience.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => navigate("/job-seeker/dashboard")}>Back to dashboard</Button>
        </div>

        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            {saved && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Your profile has been saved.</p>}

            <label className="block space-y-2">
              <span className="text-sm font-medium">Professional headline</span>
              <Input name="headline" value={form.headline} onChange={updateField} placeholder="e.g. Junior Backend Developer" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">About you</span>
              <textarea name="bio" value={form.bio} onChange={updateField} rows={5} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-text outline-none focus:border-gold" placeholder="Summarize your experience and what you are looking for." />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Location</span>
                <Input name="location" value={form.location} onChange={updateField} placeholder="City, country" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Years of experience</span>
                <Input name="experience_years" inputMode="numeric" value={form.experience_years} onChange={updateField} placeholder="0" />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Skills</span>
              <Input name="skills" value={form.skills} onChange={updateField} placeholder="Python, React, PostgreSQL" />
              <span className="text-xs text-white/50">Separate skills with commas.</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Resume URL</span>
                <Input name="resume_url" value={form.resume_url} onChange={updateField} placeholder="https://" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Portfolio URL</span>
                <Input name="portfolio_url" value={form.portfolio_url} onChange={updateField} placeholder="https://" />
              </label>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={updateField} className="accent-gold" />
              Make my profile visible to employers
            </label>

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
