import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import { getInvestorProfileApi, updateInvestorProfileApi } from "../../lib/api";

const EMPTY = { firm_name: "", investment_focus: "", check_size: "", location: "", about: "" };

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
      if (active && profile) setForm({ ...EMPTY, ...profile });
    }).catch((err) => {
      if (active) setError(err.message || "Unable to load your profile.");
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
      });
      setForm({ ...EMPTY, ...profile });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0B] p-8 text-white/60">Loading investor profile…</div>;

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
            <label className="block space-y-2"><span className="text-sm">About</span><textarea name="about" value={form.about || ""} onChange={update} rows={5} maxLength={3000} className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-[#C9A15A]" placeholder="Your investment thesis, stage preference and what you offer founders." /></label>
            <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button></div>
          </form>
        </Card>
      </div>
    </main>
  );
}
