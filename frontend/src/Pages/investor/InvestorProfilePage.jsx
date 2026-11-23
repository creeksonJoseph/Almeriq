import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Skeleton, SkeletonText } from "../../components/ui";
import { getInvestorProfileApi, updateInvestorProfileApi } from "../../lib/api";

const EMPTY = { firm_name: "", investment_focus: "", check_size: "", location: "", about: "", investor_type: "", preferred_sectors: [], preferred_stages: [], geographies: [], check_size_min: "", check_size_max: "", lead_follow_preference: "either", track_record: "", value_add: "", accreditation_status: "", target_return_percent: "", years_investing: "", verification_url: "", notable_investments: "", companies_backed: "", exits: "", assets_under_management: "", time_commitment: "", contact_preference: "", contact_formats: [] };

export default function InvestorProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getInvestorProfileApi().then((profile) => {
      if (active && profile) setForm({ ...EMPTY, ...profile, preferred_sectors: profile.preferred_sectors || [], preferred_stages: profile.preferred_stages || [], geographies: profile.geographies || [] });
    }).catch((err) => {
      if (active && err.status !== 404) setError(err.message || "Unable to load your profile.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSaved(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      const profile = await updateInvestorProfileApi({
        firm_name: form.firm_name.trim() || null,
        investment_focus: form.investment_focus.trim() || null,
        check_size: form.check_size.trim() || null,
        location: form.location.trim() || null,
        about: form.about.trim() || null,
        investor_type: form.investor_type.trim() || null,
        preferred_sectors: form.preferred_sectors,
        preferred_stages: form.preferred_stages,
        geographies: form.geographies,
        check_size_min: form.check_size_min === "" ? null : Number(form.check_size_min),
        check_size_max: form.check_size_max === "" ? null : Number(form.check_size_max),
        lead_follow_preference: form.lead_follow_preference,
        track_record: form.track_record.trim() || null,
        value_add: form.value_add.trim() || null,
        accreditation_status: form.accreditation_status || null,
        target_return_percent: form.target_return_percent === "" ? null : Number(form.target_return_percent),
        years_investing: form.years_investing === "" ? null : Number(form.years_investing),
        verification_url: form.verification_url.trim() || null,
        notable_investments: form.notable_investments.trim() || null,
        companies_backed: form.companies_backed === "" ? null : Number(form.companies_backed),
        exits: form.exits === "" ? null : Number(form.exits),
        assets_under_management: form.assets_under_management.trim() || null,
        time_commitment: form.time_commitment.trim() || null,
        contact_preference: form.contact_preference.trim() || null,
        contact_formats: form.contact_formats,
      });
      setForm({ ...EMPTY, ...profile, preferred_sectors: profile.preferred_sectors || [], preferred_stages: profile.preferred_stages || [], geographies: profile.geographies || [] });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10" aria-label="Loading investor profile" aria-busy="true">
      <div className="space-y-3"><Skeleton className="h-3 w-36" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <Card className="space-y-5 p-5">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="space-y-2"><Skeleton className="h-3 w-1/4" /><Skeleton className="h-11 w-full rounded-xl" /></div>)}<Skeleton className="h-10 w-36 rounded-xl" /></Card>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs uppercase tracking-widest text-[#C9A15A]">Investor workspace</p><h1 className="mt-2 font-serif text-3xl">Investor profile</h1><p className="mt-2 text-sm text-white/60">Tell founders what you invest in and how to reach you.</p></div>
          <Button variant="ghost" onClick={() => navigate("/investor/dashboard")}>Back to dashboard</Button>
        </div>
        <Card className="border border-white/10 bg-white/2 p-6">
          <form className="space-y-5" onSubmit={submit}>
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            {saved && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Profile saved.</p>}
            <label className="block space-y-2"><span className="text-sm">Firm or investor name</span><Input name="firm_name" value={form.firm_name || ""} onChange={update} placeholder="Firm name or your name" /></label>
            <label className="block space-y-2"><span className="text-sm">Investment focus</span><Input name="investment_focus" value={form.investment_focus || ""} onChange={update} placeholder="e.g. fintech, climate, developer tools" /></label>
            <label className="block space-y-2"><span className="text-sm">Typical check size</span><Input name="check_size" value={form.check_size || ""} onChange={update} placeholder="e.g. $10k–$50k" /></label>
            <label className="block space-y-2"><span className="text-sm">Location</span><Input name="location" value={form.location || ""} onChange={update} placeholder="City, country or remote" /></label>
            <label className="block space-y-2"><span className="text-sm">Investor type</span><Input name="investor_type" value={form.investor_type || ""} onChange={update} placeholder="Angel, VC, family office, syndicate…" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm">Years investing</span><Input name="years_investing" type="number" min="0" max="100" value={form.years_investing ?? ""} onChange={update} placeholder="e.g. 6" /></label>
              <label className="block space-y-2"><span className="text-sm">LinkedIn / firm verification link</span><Input name="verification_url" type="url" value={form.verification_url || ""} onChange={update} placeholder="https://…" /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm">Preferred sectors (comma separated)</span><Input value={(form.preferred_sectors || []).join(", ")} onChange={(event) => setForm((current) => ({ ...current, preferred_sectors: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="Fintech, climate, developer tools" /></label>
            <label className="block space-y-2"><span className="text-sm">Preferred stages (comma separated)</span><Input value={(form.preferred_stages || []).join(", ")} onChange={(event) => setForm((current) => ({ ...current, preferred_stages: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="Pre-seed, seed, Series A" /></label>
            <label className="block space-y-2"><span className="text-sm">Investment geographies (comma separated)</span><Input value={(form.geographies || []).join(", ")} onChange={(event) => setForm((current) => ({ ...current, geographies: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="Kenya, East Africa, Africa" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm">Minimum check size</span><Input type="number" min="0" step="0.01" name="check_size_min" value={form.check_size_min ?? ""} onChange={update} /></label><label className="block space-y-2"><span className="text-sm">Maximum check size</span><Input type="number" min="0" step="0.01" name="check_size_max" value={form.check_size_max ?? ""} onChange={update} /></label></div>
            <label className="block space-y-2"><span className="text-sm">Lead / follow preference</span><select name="lead_follow_preference" value={form.lead_follow_preference || "either"} onChange={update} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm"><option value="either">Either</option><option value="lead">Prefer to lead</option><option value="follow">Prefer to follow</option></select></label>
            <label className="block space-y-2"><span className="text-sm">Track record</span><textarea name="track_record" value={form.track_record || ""} onChange={update} rows={3} maxLength={3000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" placeholder="Relevant investments, exits or experience." /></label>
            <label className="block space-y-2"><span className="text-sm">Notable investments</span><textarea name="notable_investments" value={form.notable_investments || ""} onChange={update} rows={2} maxLength={3000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" placeholder="Companies you have invested in." /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm">Companies backed</span><Input name="companies_backed" type="number" min="0" value={form.companies_backed ?? ""} onChange={update} /></label>
              <label className="block space-y-2"><span className="text-sm">Exits</span><Input name="exits" type="number" min="0" value={form.exits ?? ""} onChange={update} /></label>
            </div>
            <label className="block space-y-2"><span className="text-sm">Assets under management (AUM)</span><Input name="assets_under_management" value={form.assets_under_management || ""} onChange={update} placeholder="Optional, e.g. USD 40M" /></label>
            <label className="block space-y-2"><span className="text-sm">Value you bring to founders</span><textarea name="value_add" value={form.value_add || ""} onChange={update} rows={3} maxLength={3000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" placeholder="Introductions, hiring, product, operations, go-to-market…" /></label>
            <label className="block space-y-2"><span className="text-sm">Time commitment to portfolio companies</span><Input name="time_commitment" value={form.time_commitment || ""} onChange={update} placeholder="e.g. Monthly calls, 2–4 hours per month" /></label>
            <label className="block space-y-2"><span className="text-sm">Cold pitch / warm introduction preference</span><Input name="contact_preference" value={form.contact_preference || ""} onChange={update} placeholder="e.g. Warm introductions preferred" /></label>
            <label className="block space-y-2"><span className="text-sm">Preferred first-contact formats (comma separated)</span><Input value={(form.contact_formats || []).join(", ")} onChange={(event) => setForm((current) => ({ ...current, contact_formats: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="Email, Almeriq chat, video call" /></label>
            <label className="block space-y-2"><span className="text-sm">Accreditation status (self-reported)</span><select name="accreditation_status" value={form.accreditation_status || ""} onChange={update} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm"><option value="">Not provided</option><option value="accredited">Accredited</option><option value="not_accredited">Not accredited</option><option value="not_applicable">Not applicable</option></select></label>
            <label className="block space-y-2"><span className="text-sm">Illustrative annual return assumption (%)</span><Input name="target_return_percent" type="number" min="-100" max="1000" step="0.1" value={form.target_return_percent ?? ""} onChange={update} placeholder="Optional; used only for a 12-month projection" /></label>
            <label className="block space-y-2"><span className="text-sm">About</span><textarea name="about" value={form.about || ""} onChange={update} rows={4} maxLength={3000} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold" placeholder="Your investment thesis and what you offer founders." /></label>
            <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button></div>
          </form>
        </Card>
      </div>
    </main>
  );
}
