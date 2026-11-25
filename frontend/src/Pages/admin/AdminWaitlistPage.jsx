/**
 * Pages/AdminWaitlistPage.jsx - Admin console for viewing waitlist participants.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  RotateCcw,
  Users,
  Building2,
  TrendingUp,
  Briefcase,
  Truck,
  ArrowLeft,
  Calendar,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getAdminWaitlistApi, updateAdminRoleApi, getAdminProvidersApi, updateAdminProviderVerificationApi, getAdminProviderVerificationHistoryApi } from "../../lib/api";
import { StatStrip } from "../../components/ui/BorderlessPrimitives";
import { Skeleton, RouteSkeleton } from "../../components/ui";

const ROLE_BADGES = {
  Founder: { bg: "bg-gold/15 text-gold border-gold/30", icon: Building2 },
  Investor: { bg: "bg-gold/15 text-gold border-gold/30", icon: TrendingUp },
  "Job Seeker": { bg: "bg-gold/15 text-gold border-gold/30", icon: Briefcase },
  "Infrastructure Provider": { bg: "bg-gold/15 text-gold border-gold/30", icon: Truck },
  Expert: { bg: "bg-gold/15 text-gold border-gold/30", icon: ShieldCheck },
};

const USER_ROLES = [
  { value: "ADMIN", label: "Admin (restore admin role)" },
  { value: "FOUNDER", label: "Founder" },
  { value: "INVESTOR", label: "Investor" },
  { value: "JOB_SEEKER", label: "Job Seeker" },
  { value: "INFRASTRUCTURE_PROVIDER", label: "Infrastructure Provider" },
  { value: "EXPERT", label: "Expert / Advisor" },
];

function toUserRole(role) {
  return role?.toUpperCase().replaceAll(" ", "_");
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminWaitlistPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateUser } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState({ total: 0, items: [] });
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [verificationBusyId, setVerificationBusyId] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [savingRole, setSavingRole] = useState("");
  const [myRole, setMyRole] = useState(toUserRole(user?.role) || "FOUNDER");

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await getAdminWaitlistApi();
      setData(res || { total: 0, items: [] });
    } catch (err) {
      showToast(err.message || "Failed to load waitlist records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    setProvidersLoading(true);
    try {
      const result = await getAdminProvidersApi();
      setProviders(result.items || []);
    } catch (err) {
      showToast(err.message || "Failed to load provider profiles.", "error");
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleProviderVerification = async (provider) => {
    if (!provider.verified && !window.confirm("Have you independently checked this provider's business identity and supporting evidence? Almeriq does not collect verification documents yet.")) return;
    setVerificationBusyId(provider.id);
    try {
      const result = await updateAdminProviderVerificationApi(provider.id, !provider.verified);
      setProviders((items) => items.map((item) => item.id === provider.id ? result.provider : item));
      if (Object.prototype.hasOwnProperty.call(verificationHistory, provider.id)) {
        try {
          const history = await getAdminProviderVerificationHistoryApi(provider.id);
          setVerificationHistory((current) => ({ ...current, [provider.id]: history.items || [] }));
        } catch {
          setVerificationHistory((current) => {
            const nextHistory = { ...current };
            delete nextHistory[provider.id];
            return nextHistory;
          });
        }
      }
      showToast(result.provider.verified ? "Provider verified. Their active listings are now marked verified." : "Provider verification revoked.", "success");
    } catch (err) {
      showToast(err.message || "Unable to update provider verification.", "error");
    } finally {
      setVerificationBusyId(null);
    }
  };

  const handleVerificationHistory = async (provider) => {
    const providerId = provider.id;
    if (Object.prototype.hasOwnProperty.call(verificationHistory, providerId)) {
      setVerificationHistory((current) => {
        const next = { ...current };
        delete next[providerId];
        return next;
      });
      return;
    }

    setVerificationHistory((current) => ({ ...current, [providerId]: null }));
    setHistoryLoadingId(providerId);
    try {
      const result = await getAdminProviderVerificationHistoryApi(providerId);
      setVerificationHistory((current) => ({ ...current, [providerId]: result.items || [] }));
    } catch (err) {
      setVerificationHistory((current) => {
        const next = { ...current };
        delete next[providerId];
        return next;
      });
      showToast(err.message || "Unable to load verification history.", "error");
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const handleRoleChange = async (role) => {
    setSavingRole("self");
    try {
      const result = await updateAdminRoleApi(role);
      setMyRole(role);
      updateUser(result.user);
      showToast("Your test role was updated.", "success");
    } catch (err) {
      showToast(err.message || "Unable to update your role.", "error");
    } finally {
      setSavingRole("");
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchWaitlist();
      fetchProviders();
    }
  }, [user?.is_admin]);

  useEffect(() => {
    const currentRole = toUserRole(user?.role);
    if (currentRole && USER_ROLES.some((role) => role.value === currentRole)) {
      setMyRole(currentRole);
    }
  }, [user?.role]);

  const filteredItems = useMemo(() => {
    return (data.items || []).filter((item) => {
      const matchSearch =
        search === "" ||
        item.email?.toLowerCase().includes(search.toLowerCase()) ||
        item.full_name?.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        selectedRole === "all" ||
        item.role?.toLowerCase() === selectedRole.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [data.items, search, selectedRole]);

  // Wait for auth initialization before evaluating access
  if (authLoading) return <RouteSkeleton variant="table" />;

  // Guard: Admin only
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center gap-1.5 rounded-full border border-[#f2ca50]/30 bg-[#f2ca50]/10 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#f2ca50]">
                <ShieldCheck size={12} /> Admin Access
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Waitlist Console
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Review and monitor registered waitlist subscribers across all roles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <select
                value={myRole}
                onChange={(event) => handleRoleChange(event.target.value)}
                disabled={savingRole === "self"}
                aria-label="Switch my test role"
                className="rounded-xl bg-[#1a1b22] px-3 py-2.5 text-xs font-semibold text-white outline-none transition-colors focus:ring-1 focus:ring-[#f2ca50] disabled:opacity-50"
              >
                {USER_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    Switch my role: {role.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-white/40">
                Saved to your account. Admin console access stays enabled.
              </span>
            </div>
            <button
              type="button"
              onClick={fetchWaitlist}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#282a2f] bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
            >
              <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Unified Metrics Ribbon */}
      <StatStrip
        items={[
          {
            label: "Total Signups",
            value: data.total || data.items.length,
            subtext: "All registered users",
          },
          ...["Founder", "Investor", "Job Seeker", "Infrastructure Provider", "Expert"].map((r) => {
            const count = (data.items || []).filter((i) => i.role?.toLowerCase() === r.toLowerCase()).length;
            return {
              label: `${r}s`,
              value: count,
              valueColor: "text-[#f2ca50]",
            };
          }),
        ]}
        className="mb-6 !border !border-[rgba(242,202,80,0.22)] !divide-x-0 !divide-y-0"
      />

      {/* Filter & Search Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/40">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#282a2f] bg-[#14141a] py-2 pl-9 pr-4 text-xs text-white placeholder-white/35 outline-none transition-all focus:border-[#f2ca50]/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "founder", "investor", "job seeker", "infrastructure provider", "expert"].map((roleKey) => (
            <button
              key={roleKey}
              type="button"
              onClick={() => setSelectedRole(roleKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                selectedRole === roleKey
                  ? "bg-[#f2ca50] text-[#111318] shadow-sm"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {roleKey}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#282a2f] bg-[#12121a]">
        {loading ? (
          <div className="space-y-4 p-6" aria-label="Loading waitlist" aria-busy="true">
            <div className="flex gap-4 border-b border-border pb-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-3 flex-1" />)}</div>
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="flex items-center gap-4"><Skeleton className="h-9 w-9 rounded-full" />{[0, 1, 2, 3].map((cell) => <Skeleton key={cell} className="h-3 flex-1" />)}</div>)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <Users size={32} className="text-white/20" />
            <p className="mt-3 font-semibold text-white">No waitlist participants found</p>
            <p className="mt-1 text-xs text-white/45">
              {search || selectedRole !== "all"
                ? "Try adjusting your search or filters."
                : "No users have registered for the waitlist yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1e2025] bg-white/[0.02] text-white/45">
                <tr>
                  <th className="py-3.5 pl-6 pr-4 font-semibold">#</th>
                  <th className="py-3.5 px-4 font-semibold">Participant</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 pr-6 pl-4 font-semibold">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredItems.map((item, index) => {
                  const badge = ROLE_BADGES[item.role] || {
                    bg: "bg-white/10 text-white/70",
                    icon: Users,
                  };
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={item.id || index} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-3.5 pl-6 pr-4 text-white/35 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[11px] font-bold text-white/70">
                            {item.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                          <span className="truncate max-w-[180px]">{item.full_name || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white/60">
                        {item.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.bg}`}
                        >
                          <BadgeIcon size={11} />
                          {item.role || "User"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 pl-4 text-white/45 whitespace-nowrap">
                        {formatDate(item.joined_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <section className="mt-10 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Provider verification</h2>
          <p className="mt-1 text-sm text-white/50">Review provider profiles before marking them as verified. Verification must be based on checks completed outside Almeriq; supporting-document collection is not available yet. Active listings remain discoverable while unverified.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#282a2f] bg-[#12121a]">
          {providersLoading ? <div className="p-6 text-sm text-white/45">Loading provider profiles…</div> : providers.length === 0 ? <div className="p-6 text-sm text-white/45">No provider profiles have been created yet.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs">
            <thead className="border-b border-[#1e2025] text-white/45"><tr><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Review history</th></tr></thead>
            <tbody className="divide-y divide-white/5">{providers.map((provider) => (
              <React.Fragment key={provider.id}>
                <tr>
                  <td className="px-5 py-4"><p className="font-medium text-white">{provider.company_name || provider.trading_name || `Provider #${provider.id}`}</p><p className="mt-1 text-white/40">{provider.about || "No provider description supplied."}</p></td>
                  <td className="px-5 py-4 text-white/60">{provider.location || "Not provided"}</td>
                  <td className="px-5 py-4"><span className={provider.verified ? "text-emerald-300" : "text-amber-200"}>{provider.verified ? "Verified" : "Not verified"}</span>{provider.verification_reviewed_at && <p className="mt-1 text-[10px] text-white/40">Last reviewed {new Date(provider.verification_reviewed_at).toLocaleDateString()}</p>}</td>
                  <td className="px-5 py-4"><button type="button" disabled={verificationBusyId === provider.id} onClick={() => handleProviderVerification(provider)} className="rounded-lg border border-[#f2ca50]/30 px-3 py-2 font-semibold text-[#f2ca50] disabled:opacity-50">{verificationBusyId === provider.id ? "Saving…" : provider.verified ? "Revoke" : "Mark verified"}</button></td>
                  <td className="px-5 py-4"><button type="button" onClick={() => handleVerificationHistory(provider)} className="font-semibold text-[#f2ca50] hover:text-[#e8d6a8]">{Object.prototype.hasOwnProperty.call(verificationHistory, provider.id) ? "Hide history" : "View history"}</button></td>
                </tr>
                {Object.prototype.hasOwnProperty.call(verificationHistory, provider.id) && (
                  <tr>
                    <td colSpan={5} className="bg-black/20 px-5 py-4">
                      {historyLoadingId === provider.id || verificationHistory[provider.id] === null ? (
                        <p className="text-xs text-white/45">Loading review history…</p>
                      ) : verificationHistory[provider.id].length === 0 ? (
                        <p className="text-xs text-white/45">No historical reviews recorded yet.</p>
                      ) : (
                        <ol className="space-y-2">
                          {verificationHistory[provider.id].map((event) => (
                            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className={event.verified ? "text-emerald-300" : "text-amber-200"}>{event.verified ? "Marked verified" : "Verification revoked"}</span>
                              <span className="text-white/45">{formatDate(event.reviewed_at)}</span>
                              <span className="text-white/45">Reviewer: {event.reviewer_name || event.reviewer_email || (event.reviewer_id ? `User #${event.reviewer_id}` : "Former admin account")}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}</tbody>
          </table></div>}
        </div>
      </section>
    </div>
  );
}
