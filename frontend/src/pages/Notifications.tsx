import { useState, useCallback } from "react";
import { useGraphQL, useLazyGraphQL } from "../hooks/useGraphQL";
import { useAuth } from "../contexts/AuthContext";
import LoadingState from "../components/UI/LoadingState";
import EmptyState from "../components/UI/EmptyState";
import ErrorState from "../components/UI/ErrorState";
import { Bell, CheckCheck, Check, Clock } from "lucide-react";
import type { Notification } from "../types";

type FilterTab = "all" | "unread";

interface NotificationsData {
  notifications: Notification[];
  unread: { aggregate: { count: number } };
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `Il y a ${diffD}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

const NOTIFICATIONS_QUERY = `query($where: notifications_bool_exp) {
  notifications(where: $where, order_by: { created_at: desc }) {
    id user_id client_id title message type is_read read_at created_at
  }
  unread: notifications_aggregate(where: { is_read: { _eq: false } }) {
    aggregate { count }
  }
}`;

const MARK_READ_MUTATION = `mutation($id: uuid!) {
  update_notifications_by_pk(pk_columns: { id: $id }, _set: { is_read: true, read_at: "now()" }) {
    id is_read
  }
}`;

const MARK_ALL_READ_MUTATION = `mutation {
  update_notifications(where: { is_read: { _eq: false } }, _set: { is_read: true, read_at: "now()" }) {
    affected_rows
  }
}`;

export default function Notifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterTab>("all");

  const where = filter === "unread" ? { is_read: { _eq: false } } : undefined;

  const { data, loading, error, refetch } = useGraphQL<NotificationsData>({
    query: NOTIFICATIONS_QUERY,
    variables: { where },
    skip: !user,
  });

  const { execute: markRead, loading: markingOne } =
    useLazyGraphQL<unknown>(MARK_READ_MUTATION);
  const { execute: markAllRead, loading: markingAll } = useLazyGraphQL<unknown>(
    MARK_ALL_READ_MUTATION,
  );

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markRead({ id });
      await refetch();
    },
    [markRead, refetch],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    await refetch();
  }, [markAllRead, refetch]);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread?.aggregate?.count ?? 0;

  if (loading)
    return <LoadingState message="Chargement des notifications..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Tout est lu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          className={`tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Toutes
        </button>
        <button
          className={`tab ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Non lues
          {unreadCount > 0 && (
            <span className="badge badge-primary" style={{ marginLeft: 6 }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            filter === "unread"
              ? "Aucune notification non lue"
              : "Aucune notification"
          }
          description="Les notifications apparaitront ici."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-md)",
                padding: "var(--space-md) var(--space-lg)",
                background: n.is_read
                  ? "var(--gradient-card)"
                  : "var(--color-primary-soft)",
                borderColor: n.is_read
                  ? "var(--color-border)"
                  : "rgba(59, 130, 246, 0.3)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  marginTop: 6,
                  flexShrink: 0,
                  background: n.is_read
                    ? "var(--color-text-muted)"
                    : "var(--color-primary)",
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-sm)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: n.is_read ? 500 : 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    {n.title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Clock size={12} />
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-text-secondary)",
                    marginTop: "var(--space-xs)",
                  }}
                >
                  {n.message}
                </p>
              </div>

              {!n.is_read && (
                <button
                  className="btn btn-ghost btn-sm"
                  title="Marquer comme lu"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markingOne}
                  style={{ flexShrink: 0 }}
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
