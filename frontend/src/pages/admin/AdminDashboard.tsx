import {
  BarChart3,
  Users,
  Wallet,
  Megaphone,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGraphQL } from "../../hooks/useGraphQL";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { ClientStatus } from "../../types";

interface AdminDashboardData {
  clients: Array<{
    id: string;
    name: string;
    status: ClientStatus;
    industry?: string;
    offer?: { name: string };
    wallet?: { balance: number; reserved: number };
    campaigns_aggregate?: { aggregate?: { count?: number } };
    actions_aggregate?: { aggregate?: { count?: number } };
  }>;
  campaigns_aggregate: { aggregate: { count: number } };
  actions: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    client?: { name: string };
    campaign?: { name: string };
  }>;
}

const statusColors: Record<ClientStatus, string> = {
  active: "badge-success",
  sprint: "badge-info",
  suspended: "badge-danger",
  archived: "badge-warning",
};
const statusLabels: Record<ClientStatus, string> = {
  active: "Actif",
  sprint: "Sprint",
  suspended: "Suspendu",
  archived: "Archivé",
};

const BAR_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-purple)",
  "var(--color-info)",
  "var(--color-danger)",
];

interface BarChartEntry {
  label: string;
  value: number;
}

function CreditBarChart({ entries }: { entries: BarChartEntry[] }) {
  const maxValue = Math.max(...entries.map((e) => e.value), 1);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      {entries.map((entry, i) => (
        <div
          key={entry.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
          }}
        >
          <div
            style={{
              width: 100,
              fontSize: "0.8rem",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {entry.label}
          </div>
          <div
            style={{
              flex: 1,
              height: 24,
              background: "var(--color-surface-hover)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(2, (entry.value / maxValue) * 100)}%`,
                background: BAR_COLORS[i % BAR_COLORS.length],
                borderRadius: "var(--radius-sm)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div
            style={{
              width: 60,
              textAlign: "right",
              fontSize: "0.8rem",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {entry.value.toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useGraphQL<AdminDashboardData>({
    query: `query AdminOverview {
      clients(order_by: { created_at: desc }) {
        id name status industry
        offer { name }
        wallet { balance reserved }
        campaigns_aggregate { aggregate { count } }
        actions_aggregate(where: { status: { _nin: ["terminee", "annulee"] } }) { aggregate { count } }
      }
      campaigns_aggregate(where: { status: { _eq: "active" } }) { aggregate { count } }
      actions(where: { status: { _nin: ["terminee", "annulee"] } }, order_by: { created_at: desc }, limit: 5) {
        id title status priority
        client { name }
        campaign { name }
      }
    }`,
  });

  const clients = data?.clients || [];
  const campaigns = data?.campaigns_aggregate ? [data.campaigns_aggregate] : [];
  const actions = data?.actions || [];

  const activeClients = clients.filter((c) => c.status === "active").length;
  const totalCredits = clients.reduce(
    (sum, c) => sum + (c.wallet?.balance || 0),
    0,
  );
  const activeCampaigns = campaigns[0]?.aggregate?.count || 0;
  const lowCreditClients = clients.filter(
    (c) => (c.wallet?.balance || 0) < 200 && c.status === "active",
  );
  const suspendedClients = clients.filter((c) => c.status === "suspended");

  const chartEntries: BarChartEntry[] = clients
    .filter((c) => c.wallet && c.wallet.balance > 0)
    .sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0))
    .slice(0, 8)
    .map((c) => ({ label: c.name, value: c.wallet?.balance || 0 }));

  if (loading) return <LoadingState message="Chargement du Back-Office..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Back-Office Fastlane</h1>
          <p className="page-subtitle">
            Vue d'ensemble de tous les clients et indicateurs de pilotage.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          {
            label: "Clients actifs",
            value: activeClients,
            icon: Users,
            color: "var(--color-primary)",
            bg: "var(--color-primary-soft)",
          },
          {
            label: "Credits en circulation",
            value: totalCredits.toLocaleString("fr-FR"),
            icon: Wallet,
            color: "var(--color-success)",
            bg: "var(--color-success-soft)",
          },
          {
            label: "Campagnes actives",
            value: activeCampaigns,
            icon: Megaphone,
            color: "var(--color-warning)",
            bg: "var(--color-warning-soft)",
          },
          {
            label: "Total clients",
            value: clients.length,
            icon: BarChart3,
            color: "var(--color-purple)",
            bg: "var(--color-purple-soft)",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="stat-card"
            style={
              {
                "--stat-bg": stat.bg,
                "--stat-color": stat.color,
              } as React.CSSProperties
            }
          >
            <div className="stat-icon">
              <stat.icon size={20} />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Credits per client chart */}
      {chartEntries.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-header">
            <span className="card-title">
              <BarChart3 size={16} style={{ marginRight: 6 }} />
              Credits par client
            </span>
          </div>
          <div style={{ padding: "var(--space-md)" }}>
            <CreditBarChart entries={chartEntries} />
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Portefeuille clients</span>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <Link to="/admin/clients" className="btn btn-sm btn-secondary">
              Gerer les clients
            </Link>
            <Link
              to="/admin/clients/onboarding"
              className="btn btn-sm btn-primary"
            >
              Nouveau client
            </Link>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Statut</th>
              <th>Offre</th>
              <th>Credits</th>
              <th>Campagnes</th>
              <th>Actions ouvertes</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td>
                  <span
                    className={`badge ${statusColors[c.status] || "badge-info"}`}
                  >
                    {statusLabels[c.status] || c.status}
                  </span>
                </td>
                <td>{c.offer?.name || "N/A"}</td>
                <td
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color:
                      (c.wallet?.balance || 0) < 200
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                  }}
                >
                  {(c.wallet?.balance || 0).toLocaleString("fr-FR")}
                </td>
                <td style={{ textAlign: "center" }}>
                  {c.campaigns_aggregate?.aggregate?.count || 0}
                </td>
                <td style={{ textAlign: "center" }}>
                  {c.actions_aggregate?.aggregate?.count || 0}
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "var(--space-xl)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Aucun client.{" "}
                  <Link to="/admin/clients/onboarding">
                    Creer le premier client
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alerts & Recent Actions */}
      <div className="section-grid" style={{ marginTop: "var(--space-xl)" }}>
        <div
          className="card"
          style={{ borderLeft: "3px solid var(--color-warning)" }}
        >
          <div className="card-header">
            <span className="card-title">
              <AlertCircle
                size={16}
                style={{ marginRight: 6, color: "var(--color-warning)" }}
              />
              Alertes
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
            }}
          >
            {lowCreditClients.map((c) => (
              <div
                key={c.id}
                style={{
                  fontSize: "0.85rem",
                  padding: "var(--space-sm) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span
                  style={{ color: "var(--color-warning)", fontWeight: 600 }}
                >
                  {c.name}
                </span>{" "}
                — Credits bas ({c.wallet?.balance || 0} restants)
              </div>
            ))}
            {suspendedClients.map((c) => (
              <div
                key={c.id}
                style={{
                  fontSize: "0.85rem",
                  padding: "var(--space-sm) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ color: "var(--color-danger)", fontWeight: 600 }}>
                  {c.name}
                </span>{" "}
                — Compte suspendu
              </div>
            ))}
            {lowCreditClients.length === 0 && suspendedClients.length === 0 && (
              <div
                style={{
                  fontSize: "0.85rem",
                  padding: "var(--space-sm) 0",
                  color: "var(--color-text-muted)",
                }}
              >
                Aucune alerte — tout va bien
              </div>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{ borderLeft: "3px solid var(--color-success)" }}
        >
          <div className="card-header">
            <span className="card-title">
              <Clock
                size={16}
                style={{ marginRight: 6, color: "var(--color-success)" }}
              />
              Actions recentes
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
            }}
          >
            {actions.map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: "0.85rem",
                  padding: "var(--space-sm) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ fontWeight: 600 }}>{a.title}</span> —{" "}
                {a.client?.name}{" "}
                <span
                  className={`badge badge-sm ${a.priority === "high" || a.priority === "urgent" ? "badge-danger" : "badge-info"}`}
                >
                  {a.priority}
                </span>
              </div>
            ))}
            {actions.length === 0 && (
              <div
                style={{
                  fontSize: "0.85rem",
                  padding: "var(--space-sm) 0",
                  color: "var(--color-text-muted)",
                }}
              >
                Aucune action en cours.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
