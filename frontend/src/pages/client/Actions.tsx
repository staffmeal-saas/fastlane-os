import { useState } from "react";
import {
  ListChecks,
  LayoutGrid,
  Clock,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useGraphQL } from "../../hooks/useGraphQL";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { ActionStatus, ActionPriority } from "../../types";

const statusLabels: Record<ActionStatus, string> = {
  a_valider: "A valider",
  planifiee: "Planifiee",
  en_cours: "En cours",
  review: "En review",
  terminee: "Terminee",
  annulee: "Annulee",
};
const statusColors: Record<string, string> = {
  a_valider: "badge-warning",
  planifiee: "badge-info",
  en_cours: "badge-primary",
  review: "badge-purple",
  terminee: "badge-success",
  annulee: "badge-danger",
};
const priorityLabels: Record<ActionPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};
const priorityColors: Record<string, string> = {
  low: "badge-info",
  medium: "badge-warning",
  high: "badge-danger",
  urgent: "badge-danger",
};
const kanbanColumns: ActionStatus[] = [
  "a_valider",
  "planifiee",
  "en_cours",
  "review",
  "terminee",
];

interface ActionItem {
  id: string;
  title: string;
  status: string;
  priority: ActionPriority;
  description?: string;
  credits_reserved: number;
  credits_consumed: number;
  due_date?: string;
  assigned_to?: string;
  campaign?: { name: string };
}

interface ActionsData {
  actions: ActionItem[];
}

type ViewMode = "kanban" | "list" | "timeline";

function groupByDate(actions: ActionItem[]): Map<string, ActionItem[]> {
  const groups = new Map<string, ActionItem[]>();
  const withDate = actions
    .filter((a) => a.due_date)
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
    );
  const noDate = actions.filter((a) => !a.due_date);

  for (const action of withDate) {
    const key = new Date(action.due_date!).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const group = groups.get(key) || [];
    group.push(action);
    groups.set(key, group);
  }

  if (noDate.length > 0) {
    groups.set("Sans date", noDate);
  }

  return groups;
}

export default function Actions() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const { data, loading, error, refetch } = useGraphQL<ActionsData>({
    query: `query {
      actions(order_by: { created_at: desc }) {
        id title status priority description credits_reserved credits_consumed due_date assigned_to
        campaign { name }
      }
    }`,
  });

  const actions = data?.actions || [];
  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Actions en cours</h1>
          <p className="page-subtitle">
            {actions.length} actions — suivi operationnel du delivery
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button
            className={`btn ${view === "kanban" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid size={16} /> Kanban
          </button>
          <button
            className={`btn ${view === "list" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView("list")}
          >
            <ListChecks size={16} /> Liste
          </button>
          <button
            className={`btn ${view === "timeline" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView("timeline")}
          >
            <Calendar size={16} /> Timeline
          </button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          maxWidth: 320,
          marginBottom: "var(--space-xl)",
        }}
      >
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
          }}
        />
        <input
          className="form-input"
          placeholder="Rechercher une action..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          style={{ paddingLeft: 38 }}
        />
      </div>

      {view === "kanban" && (
        <div className="kanban-board">
          {kanbanColumns.map((col) => {
            const colActions = filtered.filter((a) => a.status === col);
            return (
              <div key={col} className="kanban-column">
                <div className="kanban-column-header">
                  <span className="kanban-column-title">
                    <span
                      className={`badge ${statusColors[col]}`}
                      style={{ padding: "2px 6px" }}
                    ></span>
                    {statusLabels[col]}
                  </span>
                  <span className="kanban-count">{colActions.length}</span>
                </div>
                {colActions.map((a) => {
                  const isExpanded = expandedCards.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className="kanban-card"
                      onClick={() => toggleCard(a.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            flex: 1,
                          }}
                        >
                          {a.title}
                        </div>
                        {(a.description ||
                          a.credits_consumed > 0 ||
                          a.assigned_to) &&
                          (isExpanded ? (
                            <ChevronUp
                              size={14}
                              style={{
                                color: "var(--color-text-muted)",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <ChevronDown
                              size={14}
                              style={{
                                color: "var(--color-text-muted)",
                                flexShrink: 0,
                              }}
                            />
                          ))}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          marginBottom: 8,
                        }}
                      >
                        {a.campaign?.name || "\u2014"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          className={`badge ${priorityColors[a.priority] || "badge-info"}`}
                        >
                          {priorityLabels[a.priority] || a.priority}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {a.credits_reserved || 0} cr.
                        </span>
                      </div>
                      {a.due_date && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 6,
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          <span>
                            <Clock size={12} style={{ marginRight: 2 }} />
                            {new Date(a.due_date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      )}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: "var(--space-sm)",
                            paddingTop: "var(--space-sm)",
                            borderTop: "1px solid var(--color-border)",
                          }}
                        >
                          {a.description && (
                            <p
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-text-secondary)",
                                lineHeight: 1.5,
                                marginBottom: "var(--space-sm)",
                              }}
                            >
                              {a.description}
                            </p>
                          )}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "var(--space-xs)",
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {a.credits_consumed > 0 && (
                              <div>Consomme : {a.credits_consumed} cr.</div>
                            )}
                            {a.assigned_to && (
                              <div>Assigne a : {a.assigned_to}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {colActions.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "var(--space-md)",
                      color: "var(--color-text-muted)",
                      fontSize: "0.8rem",
                    }}
                  >
                    Vide
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Campagne</th>
                <th>Statut</th>
                <th>Priorite</th>
                <th>Credits</th>
                <th>Echeance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td>{a.campaign?.name || "\u2014"}</td>
                  <td>
                    <span
                      className={`badge ${statusColors[a.status] || "badge-info"}`}
                    >
                      {statusLabels[a.status as ActionStatus] || a.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${priorityColors[a.priority] || "badge-info"}`}
                    >
                      {priorityLabels[a.priority] || a.priority}
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {a.credits_reserved || 0}
                  </td>
                  <td>
                    {a.due_date
                      ? new Date(a.due_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })
                      : "\u2014"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "var(--space-xl)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Aucune action.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "timeline" && (
        <div>
          {filtered.length === 0 && (
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "var(--space-2xl)",
                color: "var(--color-text-muted)",
              }}
            >
              Aucune action.
            </div>
          )}
          {Array.from(groupByDate(filtered)).map(([dateLabel, dateActions]) => (
            <div key={dateLabel} style={{ marginBottom: "var(--space-xl)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  marginBottom: "var(--space-md)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      dateLabel === "Sans date"
                        ? "var(--color-border)"
                        : "var(--color-primary)",
                    flexShrink: 0,
                  }}
                />
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textTransform: "capitalize",
                  }}
                >
                  {dateLabel}
                </h3>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {dateActions.length} action{dateActions.length > 1 ? "s" : ""}
                </span>
              </div>
              <div
                style={{
                  marginLeft: 5,
                  borderLeft: "2px solid var(--color-border)",
                  paddingLeft: "var(--space-lg)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-sm)",
                  }}
                >
                  {dateActions.map((a) => (
                    <div
                      key={a.id}
                      className="card"
                      style={{ padding: "var(--space-md)" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {a.title}
                        </div>
                        <div
                          style={{ display: "flex", gap: "var(--space-sm)" }}
                        >
                          <span
                            className={`badge ${priorityColors[a.priority] || "badge-info"}`}
                          >
                            {priorityLabels[a.priority] || a.priority}
                          </span>
                          <span
                            className={`badge ${statusColors[a.status] || "badge-info"}`}
                          >
                            {statusLabels[a.status as ActionStatus] || a.status}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-muted)",
                          marginBottom: a.description ? "var(--space-xs)" : 0,
                        }}
                      >
                        {a.campaign?.name || "\u2014"}{" "}
                        {a.credits_reserved > 0 && (
                          <> &middot; {a.credits_reserved} cr. reserves</>
                        )}
                      </div>
                      {a.description && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.5,
                          }}
                        >
                          {a.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
