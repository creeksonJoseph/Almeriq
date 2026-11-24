import React, { useCallback, useEffect, useState } from "react";
import { Bell, Check, ChevronRight, Loader2, Package, MessageSquare, Briefcase, TrendingUp, Compass, Users } from "lucide-react";
import { Button, Card, Pill, Skeleton, SkeletonText, Drawer } from "../../components/ui";
import { listNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const TYPE_META = {
  order: { label: "Orders", icon: Package },
  message: { label: "Messages", icon: MessageSquare },
  job: { label: "Jobs", icon: Briefcase },
  investment: { label: "Investments", icon: TrendingUp },
  advisory: { label: "Advisory", icon: Compass },
  team: { label: "Team", icon: Users },
};

const ROLE_TYPES = {
  founder: ["order", "message", "job", "investment", "advisory", "team"],
  INVESTOR: ["message", "investment"],
  INFRASTRUCTURE_PROVIDER: ["order", "message", "job"],
  JOB_SEEKER: ["message", "job", "team"],
  EXPERT: ["message", "advisory"],
  ADMIN: Object.keys(TYPE_META),
};

const PAGE_SIZE = 25;

export default function AlertsPage() {
  const { user } = useAuth();
  const role = user?.role || "founder";
  const availableTypes = ROLE_TYPES[role] || ROLE_TYPES.founder;
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotificationsApi({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        unread_only: filter === "unread",
        type: !["all", "unread"].includes(filter) ? filter : undefined,
      });
      const items = (res.items || []).filter((item) => availableTypes.includes(item.type));
      setNotifications(items);
      setTotal(res.total || 0);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  }, [page, filter, availableTypes.join("|")]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const filteredNotifications = notifications;

  const markRead = async (notification) => {
    if (notification.read) return;
    try {
      await markNotificationReadApi(notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      setSelectedNotification((item) => item?.id === notification.id ? { ...item, read: true } : item);
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to mark alert as read.");
    }
  };

  const markAllRead = async () => {
    setMarkAllLoading(true);
    try {
      await markAllNotificationsReadApi();
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setSelectedNotification((item) => item ? { ...item, read: true } : item);
      setUnreadCount(0);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to mark alerts as read.");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const openNotification = (notification) => {
    setSelectedNotification(notification);
    setDrawerOpen(true);
    markRead(notification);
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonText lines={2} className="max-w-xl" />
      {[...Array(5)].map((_, index) => <Skeleton className="h-20 w-full rounded-lg" key={index} />)}
    </div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text">Alerts</h1>
          <p className="mt-1 text-sm text-white/60">Updates related to your work on Almeriq.</p>
        </div>
        {unreadCount > 0 && <Button onClick={markAllRead} disabled={markAllLoading}>
          {markAllLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          Mark all read ({unreadCount})
        </Button>}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "unread", ...availableTypes].map((type) => (
          <Button key={type} size="sm" variant={filter === type ? "primary" : "ghost"} onClick={() => { setFilter(type); setPage(0); }}>
            {type === "all" ? "All" : type === "unread" ? "Unread" : TYPE_META[type].label}
          </Button>
        ))}
      </div>

      {error && <div role="alert" className="rounded-lg border border-gold/40 bg-surface p-3 text-sm text-gold">{error}</div>}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? <Card className="p-8 text-center">
          <Bell className="mx-auto mb-4 h-10 w-10 text-gold" />
          <p className="text-sm text-white/65">{filter === "all" ? "You're all caught up." : "No alerts in this category."}</p>
        </Card> : filteredNotifications.map((notification) => {
          const Icon = TYPE_META[notification.type]?.icon || Bell;
          return <Card key={notification.id} className={`flex cursor-pointer items-start gap-4 p-4 transition-colors ${!notification.read ? "border-gold/30 bg-surface-2" : "hover:bg-surface"}`} onClick={() => openNotification(notification)}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2"><Icon className="h-5 w-5 text-gold" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><h3 className="truncate font-semibold text-text">{notification.title}</h3><span className="shrink-0 text-xs text-white/50">{notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}</span></div>
              <p className="mt-1 line-clamp-2 text-sm text-white/65">{notification.body}</p>
              <div className="mt-2 flex items-center gap-2"><Pill variant="white" className="text-[10px]">{TYPE_META[notification.type]?.label || notification.type}</Pill>{!notification.read && <span className="h-2 w-2 rounded-full bg-gold" />}</div>
            </div>
            <ChevronRight className="shrink-0 text-white/50" />
          </Card>;
        })}
      </div>

      {pageCount > 1 && <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-white/50">Page {page + 1} of {pageCount} · {total} alerts</p>
        <div className="flex gap-2"><Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button size="sm" variant="ghost" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
      </div>}

      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedNotification(null); }} title="Alert details" side="right">
        {selectedNotification && <div className="space-y-4">
          <div><h3 className="font-serif text-lg font-semibold text-text">{selectedNotification.title}</h3><p className="mt-1 text-xs text-white/50">{selectedNotification.read ? "Read" : "Unread"} · {selectedNotification.created_at ? new Date(selectedNotification.created_at).toLocaleString() : ""}</p></div>
          <div className="border-t border-border pt-4"><p className="whitespace-pre-wrap text-sm text-text">{selectedNotification.body}</p></div>
          {selectedNotification.link && <Button className="w-full" onClick={() => { window.location.assign(selectedNotification.link); }}>View details <ChevronRight className="ml-1 h-4 w-4" /></Button>}
        </div>}
      </Drawer>
    </div>
  );
}
