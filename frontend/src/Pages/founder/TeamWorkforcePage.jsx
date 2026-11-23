import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import {
  discoverTalentApi, inviteTalentApi, listFounderTeamInvitationsApi,
  listTeamMembersApi, removeTeamMemberApi,
} from "../../lib/api/team";

const TEAM_VIEWS = [
  { key: "talent", label: "Discover talent", path: "/founder/team/talent" },
  { key: "members", label: "My team", path: "/founder/team/members" },
  { key: "invitations", label: "Invitations", path: "/founder/team/invitations" },
];

export default function TeamWorkforcePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = location.pathname.endsWith("/members") ? "members" : location.pathname.endsWith("/invitations") ? "invitations" : "talent";
  const [talent, setTalent] = useState([]);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filters, setFilters] = useState({ query: "", role: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [talentResult, memberResult, invitationResult] = await Promise.all([
        discoverTalentApi({ query: filters.query || undefined, role: filters.role || undefined, location: filters.location || undefined }),
        listTeamMembersApi(),
        listFounderTeamInvitationsApi(),
      ]);
      setTalent(talentResult.items || []);
      setMembers(memberResult.items || []);
      setInvitations(invitationResult.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to load your workforce workspace.");
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const invite = async (person) => {
    setBusyId(person.user_id); setError(""); setNotice("");
    try {
      await inviteTalentApi({ invitee_id: person.user_id, message: "I'd like to discuss having you join our team." });
      setInvitations((items) => [{ id: `local-${person.user_id}`, invitee_id: person.user_id, other_party_name: person.full_name, headline: person.headline, status: "pending" }, ...items]);
      setNotice(`Invitation sent to ${person.full_name}.`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to send this invitation.");
    } finally { setBusyId(null); }
  };

  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.full_name} from your team?`)) return;
    setBusyId(member.member_id); setError(""); setNotice("");
    try {
      await removeTeamMemberApi(member.member_id);
      setMembers((items) => items.filter((item) => item.member_id !== member.member_id));
      setNotice(`${member.full_name} was removed from your team.`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to remove this team member.");
    } finally { setBusyId(null); }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-6xl space-y-6">
        <header><p className="text-xs uppercase tracking-widest text-gold">Founder workspace</p><h1 className="mt-2 font-serif text-3xl">Teams & Workforce</h1><p className="mt-2 text-sm text-white/60">Discover talent, invite people to your team and manage accepted members.</p></header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {TEAM_VIEWS.map((item) => <Button key={item.key} size="sm" variant={tab === item.key ? "primary" : "ghost"} onClick={() => navigate(item.path)}>{item.key === "members" ? item.label + " (" + members.length + ")" : item.key === "invitations" ? item.label + " (" + invitations.length + ")" : item.label}</Button>)}
        </div>

        {tab === "talent" && <section className="space-y-4">
          <form onSubmit={(event) => { event.preventDefault(); setFilters({ query: query.trim(), role: role.trim(), location: filterLocation.trim() }); }} className="grid gap-3 md:grid-cols-4">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, skill or keyword" />
            <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role (e.g. frontend engineer)" />
            <Input value={filterLocation} onChange={(event) => setFilterLocation(event.target.value)} placeholder="Location" />
            <Button type="submit" disabled={loading}>Search talent</Button>
          </form>
          {loading ? <p className="py-8 text-center text-sm text-white/50">Finding talent…</p> : talent.length === 0 ? <Card className="p-8 text-center text-sm text-white/55">No active talent profiles match those filters.</Card> : <div className="grid gap-4 md:grid-cols-2">{talent.map((person) => {
            const alreadyInvited = invitations.some((item) => item.invitee_id === person.user_id && ["pending", "accepted"].includes(item.status));
            const alreadyMember = members.some((item) => item.member_id === person.user_id);
            return <Card key={person.user_id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl">{person.full_name}</h2><p className="mt-1 text-sm text-gold">{person.headline || "Professional"}</p></div>{person.match_score != null && <span className="rounded-full border border-gold/30 px-2 py-1 text-xs text-gold">{person.match_score}% match</span>}</div>
              <p className="text-sm text-white/60">{person.bio || "No bio provided."}</p>
              <p className="text-xs text-white/45">{person.location || "Location not set"} · {person.experience_years ?? "Experience not listed"} years experience</p>
              <div className="flex flex-wrap gap-1.5">{(person.skills || []).slice(0, 8).map((skill) => <span key={skill} className="rounded-md border border-border px-2 py-1 text-xs text-white/65">{skill}</span>)}</div>
              {person.match_reasons?.length > 0 && <p className="text-xs text-emerald-200/80">{person.match_reasons.join(" · ")}</p>}
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/founder/talent/${person.user_id}`)}>View profile</Button>{person.portfolio_url && <a className="text-sm text-gold underline" href={person.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}
                  <Button size="sm" disabled={alreadyInvited || alreadyMember || busyId === person.user_id} onClick={() => invite(person)}>{alreadyMember ? "Already on team" : alreadyInvited ? "Invited" : busyId === person.user_id ? "Sending…" : "Invite to team"}</Button>
                </div>
              </div>
            </Card>;
          })}</div>}
        </section>}

        {tab === "members" && <section className="space-y-3">
          {members.length === 0 ? <Card className="p-8 text-center text-sm text-white/55">Your team is empty. Discover talent and send your first invitation.</Card> : members.map((member) => <Card key={member.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><h3 className="font-medium">{member.full_name}</h3><p className="mt-1 text-sm text-white/55">{member.headline || "Team member"} · {member.location || "Location not set"}</p><p className="mt-1 text-xs text-white/40">{(member.skills || []).join(" · ")}</p></div><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => navigate("/messages")}>Message</Button><Button size="sm" variant="ghost" disabled={busyId === member.member_id} onClick={() => remove(member)}>Remove</Button></div></Card>)}
        </section>}

        {tab === "invitations" && <section className="space-y-3">
          {invitations.length === 0 ? <Card className="p-8 text-center text-sm text-white/55">You have not sent any team invitations yet.</Card> : invitations.map((invitation) => <Card key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><h3 className="font-medium">{invitation.other_party_name || `Talent #${invitation.invitee_id}`}</h3><p className="mt-1 text-sm text-white/50">{invitation.headline || "Team invitation"} · {invitation.status}</p><p className="mt-1 text-xs text-white/40">{invitation.message || ""}</p></div><span className="rounded-full border border-border px-3 py-1 text-xs capitalize">{invitation.status}</span></Card>)}
        </section>}
      </div>
    </main>
  );
}
