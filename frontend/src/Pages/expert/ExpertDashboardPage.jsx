
import { useNavigate } from "react-router-dom";
import { Button, Card, Skeleton, SkeletonText } from "../../components/ui";
import { useExpertDashboard } from "../../hooks/useExpertDashboard";

export default function ExpertDashboardPage() {
  const navigate = useNavigate();
  const {
    profile, requests, profileLoading, requestsLoading, error, notice, busyId,
    updateRequest, openConversation, setError,
  } = useExpertDashboard();

  const handleOpenConversation = async (requestId) => {
    try {
      const conversation = await openConversation(requestId);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (requestError) {
      setError(requestError.message || "Unable to open this conversation.");
    }
  };



  return (
    <main className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#C9A15A]">Expert portal</p><h1 className="mt-2 font-serif text-3xl">Expert Dashboard</h1><p className="mt-2 text-sm text-white/60">Manage your advisory profile and founder requests.</p></div><Button className="bg-[#C9A15A] text-[#111318]" onClick={() => navigate("/expert/profile")}>{profile ? "Edit Profile" : "Create Profile"}</Button></header>
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
        {profileLoading ? <Card className="space-y-3 p-5" aria-busy="true"><Skeleton className="h-5 w-1/3" /><SkeletonText lines={3} /></Card> : !profile?.headline ? <Card className="border border-[#C9A15A]/20 bg-[#C9A15A]/5 p-5 text-sm text-white/70">Your profile isn't listed yet. Add your expertise and availability to start receiving advisory requests.</Card> : <Card className="border border-white/10 bg-white/2 p-5"><h2 className="font-serif text-xl">{profile.headline || "Expert profile"}</h2><p className="mt-2 text-sm text-white/60">{profile.expertise?.join(" · ") || "Add your expertise areas"}</p><p className="mt-2 text-sm text-white/50">{profile.location || "Location not set"} · {profile.years_experience ?? "—"} years experience</p><p className="mt-3 text-sm text-white/60">{profile.bio || "Add a short bio to help founders understand your background."}</p></Card>}
        <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-serif text-xl">Advisory requests</h2><span className="text-xs text-white/40">{requests.length} total</span></div>
          {requestsLoading ? <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((item) => <Card key={item} className="space-y-3 p-5"><Skeleton className="h-5 w-1/2" /><SkeletonText lines={3} /><Skeleton className="h-9 w-40" /></Card>)}</div> : requests.length === 0 ? <Card className="p-6 text-sm text-white/50">No advisory requests yet. Keep your profile active to appear in discovery.</Card> : requests.map((request) => (
            <Card key={request.id} className="border border-white/10 bg-white/2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="font-medium">{request.subject}</h3><p className="mt-1 text-xs text-white/40">{request.founder_name || `Founder #${request.founder_id}`}{request.budget != null ? ` · Budget: ${request.budget}` : ""}</p><p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{request.description}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-white/70">{request.status.replaceAll("_", " ")}</span></div>
              {request.status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "accepted")}>Accept</Button><Button size="sm" variant="ghost" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "declined")}>Decline</Button></div>}
              {request.status === "accepted" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => handleOpenConversation(request.id)}>Message founder</Button><Button size="sm" variant="ghost" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "completed")}>Mark completed</Button></div>}
              {request.status === "completed" && <div className="mt-4"><Button size="sm" variant="ghost" onClick={() => handleOpenConversation(request.id)}>Open conversation</Button></div>}
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
