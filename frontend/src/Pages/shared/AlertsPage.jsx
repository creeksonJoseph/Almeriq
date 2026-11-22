import React, { useEffect, useState } from "react";
import { Bell, Check, ChevronRight, Loader2 } from "lucide-react";
import { Button, Card, Pill, Skeleton, SkeletonText, Drawer } from "../../components/ui";
import { listNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from "../../lib/api";

const TYPE_ICONS = {
  order: "📦",
  message: "💬",
  payment: "💰",
  system: "⚙️",
  alert: "⚠️",
  job: "💼",
  investment: "📈",
  advisory: "🧭",
  team: "👥",
};

export default function AlertsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const res = await listNotificationsApi();
        setNotifications((res.items || res.notifications || []).map(n => ({
          ...n,
          message: n.body,
          time: n.created_at ? new Date(n.created_at).toLocaleString() : "",
          actionUrl: n.link,
        })));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const filterTypes = { orders: "order", messages: "message", payments: "payment", system: "system", jobs: "job", investments: "investment", advisory: "advisory", teams: "team" };
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterTypes[filter]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setSelectedNotification((current) => current?.id === id ? { ...current, read: true } : current);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkAllLoading(true);
    try {
      await markAllNotificationsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setSelectedNotification((current) => current ? { ...current, read: true } : current);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to mark notifications as read.");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const openDrawer = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read) handleMarkRead(notification.id);
    setDrawerOpen(true);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonText lines={2} className="max-w-xl" />
          <div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-32" /></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton className="h-20 w-full rounded-lg" key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text">Alerts</h1>
          <p className="text-white/70 mt-1">Notifications, order updates, and system messages</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} disabled={markAllLoading}>
              <Check className="w-4 h-4 mr-1" />
              {markAllLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Mark All Read (${unreadCount})`}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {["all", "unread", "orders", "messages", "payments", "jobs", "investments", "advisory", "teams", "system"].map(f => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "ghost"}
            size="sm"
            className="shrink-0"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="px-1.5 py-0.2 rounded bg-surface text-[10px] font-mono">
                {notifications.filter(n => f === "unread" ? !n.read : n.type === ({ orders: "order", messages: "message", payments: "payment", jobs: "job", investments: "investment", advisory: "advisory", teams: "team", system: "system" }[f])).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Notification List */}
      {error && <div role="alert" className="rounded-lg border border-gold/40 bg-surface p-3 text-sm text-gold">{error}</div>}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-gold mx-auto mb-4" />
            <p className="text-white/70">No notifications{filter !== "all" ? ` in ${filter}` : ""}</p>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => openDrawer(notification)}
            />
          ))
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedNotification(null); }}
        title="Notification Details"
        side="right"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{TYPE_ICONS[selectedNotification.type] || "🔔"}</span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-text">{selectedNotification.title}</h3>
                <span className={`text-label-caps text-xs ${selectedNotification.read ? "text-white/60" : "text-gold"}`}>
                  {selectedNotification.read ? "Read" : "Unread"} · {selectedNotification.time}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-text whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>
            {selectedNotification.actionUrl && (
              <Button className="w-full" onClick={() => { window.location.href = selectedNotification.actionUrl; setDrawerOpen(false); }}>
                <ChevronRight className="w-4 h-4 mr-1" /> {selectedNotification.actionLabel || "View Details"}
              </Button>
            )}
            {!selectedNotification.read && (
              <Button variant="ghost" className="w-full" onClick={() => handleMarkRead(selectedNotification.id)}>
                Mark as Read
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function NotificationItem({ notification, onClick }) {
  return (
    <Card
      className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${!notification.read ? "bg-surface-2 border-gold/30" : "hover:bg-surface"}`}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 text-2xl">
        {TYPE_ICONS[notification.type] || "🔔"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`font-semibold text-text truncate ${!notification.read ? "" : "text-white/60"}`}>{notification.title}</h4>
          <span className="text-xs font-mono text-white/60 shrink-0">{notification.time}</span>
        </div>
        <p className="text-sm text-white/70 line-clamp-2 mt-1">{notification.message}</p>
        <div className="flex items-center gap-2 mt-2">
          <Pill variant="white" className="text-[10px]">{notification.type}</Pill>
          {!notification.read && <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />}
        </div>
      </div>
      <ChevronRight className="text-white/60 shrink-0" />
    </Card>
  );
}