import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Plus,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useGraphQL } from "../../hooks/useGraphQL";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { TransactionType } from "../../types";

const typeLabels: Record<TransactionType, string> = {
  allocation: "Allocation",
  consumption: "Consommation",
  reservation: "Reservation",
  release: "Liberation",
  carry_over: "Report",
  recharge: "Recharge",
  adjustment: "Ajustement",
  expiration: "Expiration",
};
const typeColors: Record<TransactionType, string> = {
  allocation: "badge-success",
  consumption: "badge-danger",
  reservation: "badge-warning",
  release: "badge-info",
  carry_over: "badge-purple",
  recharge: "badge-success",
  adjustment: "badge-info",
  expiration: "badge-danger",
};

interface TransactionsData {
  wallet_transactions: Array<{
    id: string;
    type: TransactionType;
    amount: number;
    balance_after: number;
    description?: string;
    created_at: string;
  }>;
  wallet_transactions_aggregate: { aggregate: { count: number } };
  allocation_aggregate: { aggregate: { sum: { amount: number } | null } };
  recharge_aggregate: { aggregate: { sum: { amount: number } | null } };
  consumption_aggregate: { aggregate: { sum: { amount: number } | null } };
  reservation_aggregate: { aggregate: { sum: { amount: number } | null } };
}

type TransactionFilter = "all" | TransactionType;

interface CreditBreakdownItem {
  label: string;
  value: number;
  total: number;
  color: string;
}

export default function Credits() {
  const { currentWallet } = useAuth();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const { currentPage, pageSize, offset, setPage, resetPage } = usePagination();

  useEffect(() => { resetPage() }, [filter, resetPage]);

  const where = filter === "all" ? {} : { type: { _eq: filter } };

  const { data, loading, error, refetch } = useGraphQL<TransactionsData>({
    query: `query($limit: Int!, $offset: Int!, $where: wallet_transactions_bool_exp) {
      wallet_transactions(order_by: { created_at: desc }, limit: $limit, offset: $offset, where: $where) {
        id type amount balance_after description created_at
      }
      wallet_transactions_aggregate(where: $where) { aggregate { count } }
      allocation_aggregate: wallet_transactions_aggregate(where: { type: { _eq: "allocation" } }) { aggregate { sum { amount } } }
      recharge_aggregate: wallet_transactions_aggregate(where: { type: { _eq: "recharge" } }) { aggregate { sum { amount } } }
      consumption_aggregate: wallet_transactions_aggregate(where: { type: { _eq: "consumption" } }) { aggregate { sum { amount } } }
      reservation_aggregate: wallet_transactions_aggregate(where: { type: { _eq: "reservation" } }) { aggregate { sum { amount } } }
    }`,
    variables: { limit: pageSize, offset, where },
  });

  const transactions = data?.wallet_transactions || [];
  const totalCount = data?.wallet_transactions_aggregate?.aggregate?.count || 0;

  const balance = currentWallet?.balance || 0;
  const reserved = currentWallet?.reserved || 0;
  const carriedOver = currentWallet?.carried_over || 0;
  const available = balance - reserved;

  const monthlyAllocation =
    data?.allocation_aggregate?.aggregate?.sum?.amount || 0;
  const totalRecharged = data?.recharge_aggregate?.aggregate?.sum?.amount || 0;
  const totalConsumed = Math.abs(
    data?.consumption_aggregate?.aggregate?.sum?.amount || 0,
  );
  const totalReserved = Math.abs(
    data?.reservation_aggregate?.aggregate?.sum?.amount || 0,
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const breakdownItems: CreditBreakdownItem[] = [
    {
      label: "Disponible",
      value: available,
      total: balance,
      color: "var(--color-success)",
    },
    {
      label: "Reserve",
      value: reserved,
      total: balance,
      color: "var(--color-warning)",
    },
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portefeuille de credits</h1>
          <p className="page-subtitle">
            Suivez vos credits, allocations, consommations et historique
            complet.
          </p>
        </div>
        <Link to="/upgrade" className="btn btn-primary">
          <Plus size={16} /> Recharger
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-xl)",
        }}
      >
        <div
          className="stat-card"
          style={
            {
              "--stat-bg": "var(--color-success-soft)",
              "--stat-color": "var(--color-success)",
            } as React.CSSProperties
          }
        >
          <div className="stat-icon">
            <Wallet size={20} />
          </div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {available.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Solde courant</div>
        </div>
        <div
          className="stat-card"
          style={
            {
              "--stat-bg": "var(--color-primary-soft)",
              "--stat-color": "var(--color-primary)",
            } as React.CSSProperties
          }
        >
          <div className="stat-icon">
            <ArrowUpRight size={20} />
          </div>
          <div className="stat-value">
            {monthlyAllocation.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Allocation mensuelle</div>
        </div>
        <div
          className="stat-card"
          style={
            {
              "--stat-bg": "var(--color-purple-soft)",
              "--stat-color": "var(--color-purple)",
            } as React.CSSProperties
          }
        >
          <div className="stat-icon">
            <RotateCcw size={20} />
          </div>
          <div className="stat-value" style={{ color: "var(--color-purple)" }}>
            {carriedOver.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Report</div>
        </div>
        <div
          className="stat-card"
          style={
            {
              "--stat-bg": "var(--color-info-soft)",
              "--stat-color": "var(--color-info)",
            } as React.CSSProperties
          }
        >
          <div className="stat-icon">
            <ShoppingCart size={20} />
          </div>
          <div className="stat-value">
            {totalRecharged.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Credits achetes</div>
        </div>
        <div
          className="stat-card"
          style={
            {
              "--stat-bg": "var(--color-warning-soft)",
              "--stat-color": "var(--color-warning)",
            } as React.CSSProperties
          }
        >
          <div className="stat-icon">
            <ArrowDownRight size={20} />
          </div>
          <div className="stat-value" style={{ color: "var(--color-warning)" }}>
            {totalReserved.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Reservations</div>
        </div>
        <div
          className="stat-card"
          style={
            {
              "--stat-bg": "var(--color-danger-soft)",
              "--stat-color": "var(--color-danger)",
            } as React.CSSProperties
          }
        >
          <div className="stat-icon">
            <TrendingDown size={20} />
          </div>
          <div className="stat-value" style={{ color: "var(--color-danger)" }}>
            {totalConsumed.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Consommation</div>
        </div>
      </div>

      {balance > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-header">
            <span className="card-title">Repartition des credits</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-lg)",
              marginBottom: "var(--space-md)",
              flexWrap: "wrap",
            }}
          >
            {breakdownItems.map((item, i) => (
              <div key={i} style={{ flex: 1, minWidth: 140 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: "0.8rem",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: 700, color: item.color }}>
                    {item.value.toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="credit-meter">
                  <div
                    className="credit-meter-fill"
                    style={{
                      width: `${Math.min(100, (item.value / item.total) * 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Historique des mouvements</span>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <select
              className="form-select"
              style={{ width: "auto", padding: "4px 12px", fontSize: "0.8rem" }}
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilter(e.target.value as TransactionFilter)
              }
            >
              <option value="all">Tous</option>
              <option value="allocation">Allocations</option>
              <option value="consumption">Consommations</option>
              <option value="reservation">Reservations</option>
              <option value="recharge">Recharges</option>
              <option value="carry_over">Reports</option>
              <option value="adjustment">Ajustements</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th style={{ textAlign: "right" }}>Montant</th>
              <th style={{ textAlign: "right" }}>Solde apres</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {new Date(t.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td>
                  <span
                    className={`badge ${typeColors[t.type] || "badge-info"}`}
                  >
                    {typeLabels[t.type] || t.type}
                  </span>
                </td>
                <td>{t.description || "\u2014"}</td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color:
                      t.amount > 0
                        ? "var(--color-success)"
                        : "var(--color-danger)",
                  }}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {(t.balance_after || 0).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "var(--space-xl)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Aucun mouvement.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setPage} />
      </div>
    </div>
  );
}
