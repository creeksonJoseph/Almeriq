import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Skeleton, SkeletonText } from "../../components/ui";
import { listMyTeamInvitationsApi, respondToTeamInvitationApi } from "../../lib/api/team";

export default function TeamInvitationsPage() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const result = await listMyTeamInvitationsApi();
      setInvitations(result.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to load team invitations.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const respond = async (invitation, status) => {
    setBusyId(invitation.id); setError(""); setNotice("");
    try {
      await respondToTeamInvitationApi(invitation.id, status);
      setInvitations((items) => items.map((item) => item.id === invitation.id ? { ...item, status } : item));
      setNotice(status === "accepted" ? "You joined the founder's team. A conversation is ready in Messages." : "Invitation declined.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to respond to this invitation.");
    } finally { setBusyId(null); }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-4xl space-y-6">
        <header><p className="text-xs uppercase tracking-widest text-gold">Talent workspace</p><h1 className="mt-2 font-serif text-3xl">Team invitations</h1><p className="mt-2 text-sm text-white/60">Review invitations from founders looking to bring you onto their teams.</p></header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        {loading ? <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((item) => <Card key={item} className="space-y-3 p-5"><Skeleton className="h-5 w-1/3" /><SkeletonText lines={2} /><div className="flex gap-2"><Skeleton className="h-9 w-32 rounded-xl" /><Skeleton className="h-9 w-32 rounded-xl" /></div></Card>)}</div> : invitations.length === 0 ? <Card className="p-8 text-center text-sm text-white/55">No team invitations yet.</Card> : invitations.map((invitation) => <Card key={invitation.id} className="space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-xl">{invitation.other_party_name || "Founder"}</h2><p className="mt-1 text-sm text-white/55">Team invitation</p></div><span className="rounded-full border border-border px-3 py-1 text-xs capitalize">{invitation.status}</span></div>
          {invitation.message && <p className="whitespace-pre-wrap text-sm text-white/65">{invitation.message}</p>}
          {invitation.status === "pending" && <div className="flex gap-2"><Button size="sm" disabled={busyId === invitation.id} onClick={() => respond(invitation, "accepted")}>Accept invitation</Button><Button size="sm" variant="ghost" disabled={busyId === invitation.id} onClick={() => respond(invitation, "declined")}>Decline</Button></div>}
          {invitation.status === "accepted" && <Button size="sm" variant="ghost" onClick={() => navigate("/messages")}>Open messages</Button>}
        </Card>)}
      </div>
    </main>
  );
}
