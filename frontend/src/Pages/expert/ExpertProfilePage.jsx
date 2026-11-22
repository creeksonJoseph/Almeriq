import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/client";
import { Button, Card, Input } from "../../components/ui";

const EMPTY = { headline: "", bio: "", expertise: "", years_experience: "", location: "", hourly_rate: "", availability: "", portfolio_url: "", is_active: true };

export default function ExpertProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient.get("/api/expert/profile").then(({ data }) => {
      if (!active || !data) return;
      setForm({ ...EMPTY, ...data, expertise: (data.expertise || []).join(", ") });
    }).catch((err) => {
      if (active && err.response?.status !== 404) setError(err.response?.data?.detail || "Unable to load your profile.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setSaved(false);
  };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setSaved(false);
    const years = form.years_experience === "" ? null : Number(form.years_experience);
    const rate = form.hourly_rate === "" ? null : Number(form.hourly_rate);
    if ((years !== null && (!Number.isInteger(years) || years < 0)) || (rate !== null && (!Number.isFinite(rate) || rate < 0))) {
      setError("Years of experience and hourly rate must be valid non-negative numbers."); setSaving(false); return;
    }
    try {
      const { data } = await apiClient.put("/api/expert/profile", {
        headline: form.headline.trim() || null, bio: form.bio.trim() || null,
        expertise: form.expertise.split(",").map((item) => item.trim()).filter(Boolean),
        years_experience: years, location: form.location.trim() || null,
        hourly_rate: rate, availability: form.availability.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null, is_active: form.is_active,
      });
      setForm({ ...EMPTY, ...data, expertise: (data.expertise || []).join(", ") });
      setSaved(true);
    } catch (err) { setError(err.response?.data?.detail || "Unable to save your profile."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0B] p-8 text-white/60">Loading expert profile…</div>;

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-[#C9A15A]">Expert portal</p><h1 className="mt-2 font-serif text-3xl">Expert profile</h1><p className="mt-2 text-sm text-white/60">Help founders understand your experience and advisory services.</p></div><Button variant="ghost" onClick={() => navigate("/dashboard")}>Back to dashboard</Button></header>
        <Card className="border border-white/10 bg-white/2 p-6">
          <form onSubmit={submit} className="space-y-5">
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            {saved && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Profile saved and listed in expert discovery.</p>}
            <label className="block space-y-2"><span className="text-sm">Professional headline</span><Input name="headline" value={form.headline || ""} onChange={update} placeholder="e.g. Fintech and payments advisor" /></label>
            <label className="block space-y-2"><span className="text-sm">About your experience</span><textarea name="bio" value={form.bio || ""} onChange={update} rows={5} className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-[#C9A15A]" placeholder="Your background, achievements and how you help founders." /></label>
            <label className="block space-y-2"><span className="text-sm">Areas of expertise</span><Input name="expertise" value={form.expertise || ""} onChange={update} placeholder="Product strategy, fundraising, cloud infrastructure" /><span className="text-xs text-white/40">Separate areas with commas.</span></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm">Years of experience</span><Input name="years_experience" value={form.years_experience ?? ""} onChange={update} placeholder="Years" /></label>
              <label className="block space-y-2"><span className="text-sm">Location</span><Input name="location" value={form.location || ""} onChange={update} placeholder="City, country or remote" /></label>
              <label className="block space-y-2"><span className="text-sm">Hourly rate (optional)</span><Input name="hourly_rate" value={form.hourly_rate ?? ""} onChange={update} placeholder="Amount" /></label>
              <label className="block space-y-2"><span className="text-sm">Availability</span><Input name="availability" value={form.availability || ""} onChange={update} placeholder="e.g. 5 hours per week" /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm">Portfolio or professional profile URL</span><Input name="portfolio_url" value={form.portfolio_url || ""} onChange={update} placeholder="https://" /></label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" checked={Boolean(form.is_active)} onChange={update} className="accent-[#C9A15A]" />Show my profile in expert discovery</label>
            <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button></div>
          </form>
        </Card>
      </div>
    </main>
  );
}
