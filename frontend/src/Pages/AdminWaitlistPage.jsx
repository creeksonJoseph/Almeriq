/**
 * Pages/AdminWaitlistPage.jsx - Admin console for viewing waitlist participants.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
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
  Loader2,
  Calendar,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAdminWaitlistApi } from "../lib/api";
import { StatStrip } from "../components/ui/BorderlessPrimitives";

const ROLE_BADGES = {
  Founder: { bg: "bg-[#f2ca50]/15 text-[#f2ca50] border-[#f2ca50]/30", icon: Building2 },
  Investor: { bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: TrendingUp },
  "Job Seeker": { bg: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Briefcase },
  "Infrastructure Provider": { bg: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: Truck },
};

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
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const fetchWaitlist = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminWaitlistApi();
      setData(res || { total: 0, items: [] });
    } catch (err) {
      setError(err.message || "Failed to load waitlist records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchWaitlist();
    }
  }, [user?.is_admin]);

  // Wait for auth initialization before evaluating access
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <div className="w-8 h-8 border-2 border-[#C9A15A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Guard: Admin only
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
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
            <button
              type="button"
              onClick={fetchWaitlist}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
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
          ...["Founder", "Investor", "Job Seeker", "Infrastructure Provider"].map((r) => {
            const count = (data.items || []).filter((i) => i.role?.toLowerCase() === r.toLowerCase()).length;
            return {
              label: `${r}s`,
              value: count,
              valueColor: "text-[#f2ca50]",
            };
          }),
        ]}
        className="mb-6"
      />

      {/* Filter & Search Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#14141a] py-2 pl-9 pr-4 text-xs text-white placeholder-white/35 outline-none transition-all focus:border-[#f2ca50]/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "founder", "investor", "job seeker", "infrastructure provider"].map((roleKey) => (
            <button
              key={roleKey}
              type="button"
              onClick={() => setSelectedRole(roleKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                selectedRole === roleKey
                  ? "bg-[#f2ca50] text-[#0A0A0B] shadow-sm"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {roleKey}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Participants Table / List */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#f2ca50]" />
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
              <thead className="border-b border-white/10 bg-white/[0.02] text-white/45">
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
                    bg: "bg-white/10 text-white/70 border-white/10",
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
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.bg}`}
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
    </div>
  );
}
