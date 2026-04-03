import { useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useGraphQL, useLazyGraphQL } from "../../hooks/useGraphQL";
import { useToast } from "../../components/UI/Toast";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { UpgradeStatus } from "../../types";

interface CreditData {
  clients: Array<{
    id: string;
    name: string;
    offer?: { name: string; monthly_credits: number };
    wallet?: { id: string; balance: number; reserved: number };
  }>;
  upgrades: Array<{
    id: string;
    credits_amount: number;
    pack_type: string;
    status: UpgradeStatus;
    allocation_target?: string;
    created_at: string;
    client?: { id: string; name: string };
    wallet?: { id: string; balance: number };
  }>;
}

interface AdjustForm {
  client_id: string;
  amount: string | number;
  description: string;
}

const upgradeStatusLabels: Record<UpgradeStatus, string> = {
  brouillon: "Brouillon",
  demande: "Demande",
  valide: "Validé",
  paye: "Payé",
  credite: "Crédité",
  annule: "Annulé",
};
const upgradeStatusColors: Record<UpgradeStatus, string> = {
  brouillon: "badge-warning",
  demande: "badge-info",
  valide: "badge-primary",
  paye: "badge-purple",
  credite: "badge-success",
  annule: "badge-danger",
};

export default function CreditManagement() {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({
    client_id: "",
    amount: 0,
    description: "",
  });
  const [tab, setTab] = useState<"wallets" | "upgrades">("wallets");
  const { toast } = useToast();

  const { data, loading, error, refetch } = useGraphQL<CreditData>({
    query: `query {
      clients(order_by: { name: asc }) {
        id name
        offer { name monthly_credits }
        wallet { id balance reserved }
      }
      upgrades(order_by: { created_at: desc }) {
        id credits_amount pack_type status allocation_target created_at
        client { id name }
        wallet { id balance }
      }
    }`,
  });

  const { execute: adjustCredits } = useLazyGraphQL(
    `mutation($walletId: uuid!, $amount: Int!, $balanceAfter: Int!, $description: String) {
      insert_wallet_transactions_one(object: { wallet_id: $walletId, type: "adjustment", amount: $amount, balance_after: $balanceAfter, description: $description }) { id }
      update_wallets_by_pk(pk_columns: { id: $walletId }, _inc: { balance: $amount }) { id balance }
    }`,
  );

  const { execute: updateUpgrade } = useLazyGraphQL(
    `mutation($id: uuid!, $status: String!) {
      update_upgrades_by_pk(pk_columns: {id: $id}, _set: {status: $status}) { id }
    }`,
  );

  const { execute: creditUpgrade } = useLazyGraphQL(
    `mutation($upgradeId: uuid!, $walletId: uuid!, $amount: Int!, $balanceAfter: Int!) {
      update_upgrades_by_pk(pk_columns: {id: $upgradeId}, _set: {status: "credite"}) { id }
      update_wallets_by_pk(pk_columns: {id: $walletId}, _inc: {balance: $amount}) { id balance }
      insert_wallet_transactions_one(object: { wallet_id: $walletId, type: "recharge", amount: $amount, balance_after: $balanceAfter, description: "Recharge pack crédits" }) { id }
    }`,
  );

  const { execute: allocateMonthly } = useLazyGraphQL(
    `mutation($walletId: uuid!, $amount: Int!, $balanceAfter: Int!, $description: String) {
      update_wallets_by_pk(pk_columns: { id: $walletId }, _inc: { balance: $amount }) { id balance }
      insert_wallet_transactions_one(object: { wallet_id: $walletId, type: "allocation", amount: $amount, balance_after: $balanceAfter, description: $description }) { id }
    }`,
  );

  const [allocating, setAllocating] = useState(false);

  const clients = data?.clients || [];
  const upgrades = data?.upgrades || [];

  const handleMonthlyAllocation = async () => {
    const eligible = clients.filter(
      (c) => c.wallet?.id && c.offer?.monthly_credits,
    );
    if (eligible.length === 0) return;
    setAllocating(true);
    const label = new Date().toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    try {
      for (const c of eligible) {
        const amount = c.offer!.monthly_credits;
        const balance = c.wallet!.balance || 0;
        await allocateMonthly({
          walletId: c.wallet!.id,
          amount,
          balanceAfter: balance + amount,
          description: `Allocation mensuelle ${label}`,
        });
      }
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setAllocating(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustForm.client_id || !adjustForm.amount) return;
    const client = clients.find((c) => c.id === adjustForm.client_id);
    if (!client?.wallet?.id) return;
    const amt = parseInt(String(adjustForm.amount));
    try {
      await adjustCredits({
        walletId: client.wallet.id,
        amount: amt,
        balanceAfter: (client.wallet.balance || 0) + amt,
        description: adjustForm.description || "Ajustement manuel",
      });
      setShowAdjust(false);
      setAdjustForm({ client_id: "", amount: 0, description: "" });
      refetch();
      toast("Ajustement effectue", "success");
    } catch (err) {
      console.error(err);
      toast("Erreur lors de l'ajustement", "error");
    }
  };

  const handleUpgradeStatus = async (
    upgradeId: string,
    newStatus: UpgradeStatus,
  ) => {
    try {
      await updateUpgrade({ id: upgradeId, status: newStatus });
      refetch();
      toast("Statut mis a jour", "success");
    } catch (err) {
      console.error(err);
      toast("Erreur de mise a jour", "error");
    }
  };

  const handleValidateAndCredit = async (
    upgrade: CreditData["upgrades"][0],
  ) => {
    if (!upgrade.wallet?.id) return;
    try {
      await creditUpgrade({
        upgradeId: upgrade.id,
        walletId: upgrade.wallet.id,
        amount: upgrade.credits_amount,
        balanceAfter: (upgrade.wallet.balance || 0) + upgrade.credits_amount,
      });
      refetch();
      toast("Credits recharges", "success");
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la recharge", "error");
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const pendingUpgrades = upgrades.filter(
    (u) =>
      u.status === "demande" || u.status === "valide" || u.status === "paye",
  );
  const totalBalance = filtered.reduce(
    (s, c) => s + (c.wallet?.balance || 0),
    0,
  );
  const totalReserved = filtered.reduce(
    (s, c) => s + (c.wallet?.reserved || 0),
    0,
  );
  const totalAllocation = filtered.reduce(
    (s, c) => s + (c.offer?.monthly_credits || 0),
    0,
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion Crédits</h1>
          <p className="page-subtitle">
            Allocations, ajustements, recharges et suivi global.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button
            className="btn btn-secondary"
            onClick={handleMonthlyAllocation}
            disabled={allocating}
          >
            <RotateCcw size={16} />{" "}
            {allocating ? "Allocation..." : "Allocation mensuelle"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAdjust(true)}
          >
            <Plus size={16} /> Ajustement manuel
          </button>
        </div>
      </div>

      <div className="stats-grid">
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
            <CreditCard size={20} />
          </div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {totalBalance.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Total en circulation</div>
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
          <div className="stat-label">Total réservé</div>
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
            {totalAllocation.toLocaleString("fr-FR")}
          </div>
          <div className="stat-label">Allocation mensuelle totale</div>
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
            <Clock size={20} />
          </div>
          <div className="stat-value">{pendingUpgrades.length}</div>
          <div className="stat-label">Recharges en attente</div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        <button
          className={`btn ${tab === "wallets" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("wallets")}
        >
          Wallets
        </button>
        <button
          className={`btn ${tab === "upgrades" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("upgrades")}
        >
          Recharges{" "}
          {pendingUpgrades.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "var(--color-danger)",
                color: "white",
                borderRadius: 10,
                padding: "1px 6px",
                fontSize: "0.7rem",
              }}
            >
              {pendingUpgrades.length}
            </span>
          )}
        </button>
      </div>

      {tab === "wallets" && (
        <>
          <div
            style={{
              position: "relative",
              maxWidth: 400,
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
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              style={{ paddingLeft: 38 }}
            />
          </div>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Offre</th>
                  <th>Allocation</th>
                  <th>Balance</th>
                  <th>Réservé</th>
                  <th>Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const balance = c.wallet?.balance || 0;
                  const allocation = c.offer?.monthly_credits || 1;
                  const consumed = allocation - balance;
                  const pct = Math.min(
                    100,
                    Math.max(0, Math.round((consumed / allocation) * 100)),
                  );
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td>
                        <span className="badge badge-primary">
                          {c.offer?.name || "N/A"}
                        </span>
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {allocation.toLocaleString("fr-FR")}
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color:
                            balance < 200
                              ? "var(--color-danger)"
                              : "var(--color-success)",
                        }}
                      >
                        {balance.toLocaleString("fr-FR")}
                      </td>
                      <td
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--color-warning)",
                        }}
                      >
                        {(c.wallet?.reserved || 0).toLocaleString("fr-FR")}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            className="credit-meter"
                            style={{ flex: 1, height: 6 }}
                          >
                            <div
                              className="credit-meter-fill"
                              style={{
                                width: `${pct}%`,
                                background:
                                  pct > 80
                                    ? "var(--color-danger)"
                                    : "var(--gradient-primary)",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color:
                                pct > 80
                                  ? "var(--color-danger)"
                                  : "var(--color-text-muted)",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                      Aucun client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "upgrades" && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Pack</th>
                <th>Crédits</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upgrades.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.client?.name || "—"}</td>
                  <td>
                    <span className="badge badge-info">Pack {u.pack_type}</span>
                  </td>
                  <td
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                    }}
                  >
                    +{u.credits_amount}
                  </td>
                  <td>
                    <span
                      className={`badge ${upgradeStatusColors[u.status] || "badge-info"}`}
                    >
                      {upgradeStatusLabels[u.status] || u.status}
                    </span>
                  </td>
                  <td>
                    {new Date(u.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                      {u.status === "demande" && (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUpgradeStatus(u.id, "valide")}
                            title="Valider"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleUpgradeStatus(u.id, "annule")}
                            title="Refuser"
                            style={{ color: "var(--color-danger)" }}
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {u.status === "valide" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleUpgradeStatus(u.id, "paye")}
                          title="Confirmer paiement"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      {u.status === "paye" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleValidateAndCredit(u)}
                          title="Créditer le wallet"
                        >
                          <ArrowUpRight size={14} /> Créditer
                        </button>
                      )}
                      {(u.status === "credite" || u.status === "annule") && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {upgrades.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "var(--space-xl)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Aucune demande de recharge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
          <div
            className="modal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Ajustement manuel</h3>
              <button
                className="modal-close"
                onClick={() => setShowAdjust(false)}
              >
                ✕
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Client</label>
              <select
                className="form-select"
                value={adjustForm.client_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setAdjustForm({ ...adjustForm, client_id: e.target.value })
                }
              >
                <option value="">Sélectionner...</option>
                {clients
                  .filter((c) => c.wallet)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (solde: {c.wallet?.balance || 0})
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                Montant (positif = crédit, négatif = débit)
              </label>
              <input
                className="form-input"
                type="number"
                placeholder="Ex: 200 ou -50"
                value={adjustForm.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAdjustForm({ ...adjustForm, amount: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Motif</label>
              <textarea
                className="form-textarea"
                placeholder="Geste commercial, correction, etc."
                value={adjustForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAdjustForm({ ...adjustForm, description: e.target.value })
                }
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAdjust(false)}
              >
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleAdjust}>
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
