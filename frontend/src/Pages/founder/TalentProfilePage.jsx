import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../../components/ui";
import { getTalentProfileApi, inviteTalentApi } from "../../lib/api/team";

export default function TalentProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getTalentProfileApi(userId).then((data) => { if (active) setProfile(data); })
      .catch((err) => { if (active) setError(err.response?.data?.detail || err.message || "Unable to load this profile."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const invite = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      await inviteTalentApi({ invitee_id: Number(userId), message: "I'd like to discuss having you join our team." });
      setNotice("Invitation sent. You can track its response in Teams & Workforce.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to send this invitation.");
    } finally { setBusy(false); }
  };

  if (loading) return <main className="min-h-screen bg-bg p-8 text-white/50">Loading talent profile…</main>;
  if (!profile) return <main className="min-h-screen bg-bg p-8 text-text"><p role="alert">{error || "Profile not found."}</p><Button className="mt-4" onClick={() => navigate("/founder/team")}>Back to talent</Button></main>;

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-4xl space-y-5">
        <Button size="sm" variant="ghost" onClick={() => navigate("/founder/team")}>Back to Teams & Workforce</Button>
        <Card className="space-y-4 p-6">
          <div><p className="text-xs uppercase tracking-widest text-gold">Talent profile</p><h1 className="mt-2 font-serif text-3xl">{profile.full_name}</h1><p className="mt-1 text-gold">{profile.headline || "Professional"}</p><p className="mt-2 text-sm text-white/50">{profile.location || "Location not set"} · {profile.experience_years ?? "Experience not listed"} years experience</p></div>
          <p className="whitespace-pre-wrap text-sm text-white/70">{profile.bio || "No bio provided."}</p>
          <div className="flex flex-wrap gap-2">{(profile.skills || []).map((skill) => <span key={skill} className="rounded-md border border-border px-2 py-1 text-xs text-white/65">{skill}</span>)}</div>
          <div className="flex flex-wrap gap-3">{profile.portfolio_url && <a className="text-sm text-gold underline" href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}{profile.preferences?.desired_roles?.length > 0 && <span className="text-sm text-white/55">Interested in: {profile.preferences.desired_roles.join(", ")}</span>}</div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}
          <Button onClick={invite} disabled={busy}>{busy ? "Sending invitation…" : "Invite to team"}</Button>
        </Card>
        {profile.experience?.length > 0 && <Card className="space-y-3 p-5"><h2 className="font-serif text-xl">Work experience</h2>{profile.experience.map((item, index) => <div key={index} className="border-b border-border pb-3 last:border-0"><h3 className="font-medium">{item.title || "Role"} · {item.company || "Company not listed"}</h3><p className="text-xs text-white/45">{item.start_date || ""} – {item.end_date || "Present"}</p><p className="mt-1 whitespace-pre-wrap text-sm text-white/60">{item.description}</p></div>)}</Card>}
        {profile.education?.length > 0 && <Card className="space-y-3 p-5"><h2 className="font-serif text-xl">Education</h2>{profile.education.map((item, index) => <div key={index}><p className="font-medium">{item.qualification || "Qualification"} · {item.institution || "Institution"}</p><p className="text-xs text-white/45">{item.year}</p>{item.details && <p className="text-sm text-white/60">{item.details}</p>}</div>)}</Card>}
        {profile.certifications?.length > 0 && <Card className="space-y-3 p-5"><h2 className="font-serif text-xl">Certifications</h2>{profile.certifications.map((item, index) => <div key={index} className="text-sm"><span className="font-medium">{item.name}</span> · {item.issuer} {item.year && <span className="text-white/45">({item.year})</span>}</div>)}</Card>}
        {profile.projects?.length > 0 && <Card className="space-y-3 p-5"><h2 className="font-serif text-xl">Projects</h2>{profile.projects.map((item, index) => <div key={index}><h3 className="font-medium">{item.name || "Project"}</h3><p className="mt-1 text-sm text-white/60">{item.description}</p><p className="mt-1 text-xs text-white/45">{item.technologies}</p>{item.url && <a className="text-xs text-gold underline" href={item.url} target="_blank" rel="noreferrer">View project</a>}</div>)}</Card>}
      </div>
    </main>
  );
}
