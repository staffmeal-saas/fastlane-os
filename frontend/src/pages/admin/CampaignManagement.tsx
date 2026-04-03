import { useState } from "react";
import { Plus, Search, Edit, Eye, ChevronUp, X } from "lucide-react";
import { useGraphQL, useLazyGraphQL } from "../../hooks/useGraphQL";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { CampaignStatus } from "../../types";

interface CampaignsData {
  campaigns: CampaignRow[];
  clients: ClientOption[];
}

interface CampaignRow {
  id: string;
  name: string;
  status: CampaignStatus | string;
  description?: string;
  objectives?: string;
  start_date?: string;
  end_date?: string;
  credits_budget: number;
  credits_consumed: number;
  client?: { id: string; name: string };
  actions_aggregate?: { aggregate?: { count?: number } };
}

interface ClientOption {
  id: string;
  name: string;
}

interface CampaignForm {
  client_id: string;
  name: string;
  start_date: string;
  end_date: string;
  credits_budget: string | number;
  objectives: string;
}

const ALL_STATUSES: string[] = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
];
const statusColors: Record<string, string> = {
  active: "badge-success",
  completed: "badge-info",
  draft: "badge-warning",
  paused: "badge-purple",
  archived: "badge-danger",
};
const statusLabels: Record<string, string> = {
  active: "Active",
  completed: "Terminée",
  draft: "Brouillon",
  paused: "En pause",
  archived: "Archivée",
};

const EMPTY_FORM: CampaignForm = {
  client_id: "",
  name: "",
  start_date: "",
  end_date: "",
  credits_budget: 0,
  objectives: "",
};

export default function CampaignManagement() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<CampaignRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);

  const { data, loading, error, refetch } = useGraphQL<CampaignsData>({
    query: `query {
      campaigns(order_by: { created_at: desc }) {
        id name status description objectives start_date end_date
        credits_budget credits_consumed
        client { id name }
        actions_aggregate { aggregate { count } }
      }
      clients(order_by: { name: asc }) { id name }
    }`,
  });

  const { execute: createCampaign } = useLazyGraphQL(
    `mutation($obj: campaigns_insert_input!) { insert_campaigns_one(object: $obj) { id } }`,
  );

  const { execute: updateCampaign, loading: saving } = useLazyGraphQL(
    `mutation($id: uuid!, $set: campaigns_set_input!) {
      update_campaigns_by_pk(pk_columns: { id: $id }, _set: $set) { id }
    }`,
  );

  const { execute: changeStatus } = useLazyGraphQL(
    `mutation($id: uuid!, $status: campaign_status!) {
      update_campaigns_by_pk(pk_columns: { id: $id }, _set: { status: $status }) { id }
    }`,
  );

  const campaigns = data?.campaigns || [];
  const clients = data?.clients || [];

  const handleCreate = async () => {
    if (!form.name || !form.client_id) return;
    try {
      await createCampaign({
        obj: {
          client_id: form.client_id,
          name: form.name,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          credits_budget: parseInt(String(form.credits_budget)) || 0,
          objectives: form.objectives,
        },
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (c: CampaignRow) => {
    setEditCampaign(c);
    setForm({
      client_id: c.client?.id || "",
      name: c.name,
      start_date: c.start_date || "",
      end_date: c.end_date || "",
      credits_budget: c.credits_budget,
      objectives: c.objectives || "",
    });
  };

  const handleEdit = async () => {
    if (!editCampaign || !form.name) return;
    try {
      await updateCampaign({
        id: editCampaign.id,
        set: {
          name: form.name,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          credits_budget: parseInt(String(form.credits_budget)) || 0,
          objectives: form.objectives || null,
        },
      });
      setEditCampaign(null);
      setForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await changeStatus({ id, status: newStatus });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const isModalOpen = showModal || editCampaign !== null;
  const modalTitle = editCampaign
    ? `Modifier ${editCampaign.name}`
    : "Nouvelle campagne";
  const closeModal = () => {
    setShowModal(false);
    setEditCampaign(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion Campagnes</h1>
          <p className="page-subtitle">
            {campaigns.length} campagnes — créer, piloter, archiver.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditCampaign(null);
            setForm(EMPTY_FORM);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Nouvelle campagne
        </button>
      </div>

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
          placeholder="Rechercher par campagne ou client..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div className="card">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Période</th>
                <th>Budget</th>
                <th>Consommé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <>
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td>{c.client?.name || "—"}</td>
                    <td>
                      <select
                        className="form-select"
                        value={c.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleStatusChange(c.id, e.target.value)
                        }
                        style={{
                          fontSize: "0.8rem",
                          padding: "2px 6px",
                          minWidth: 120,
                          color: statusColors[c.status]?.includes("success")
                            ? "var(--color-success)"
                            : undefined,
                        }}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s] || s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {c.start_date
                        ? new Date(c.start_date).toLocaleDateString("fr-FR", {
                            month: "short",
                          })
                        : "—"}
                      {" - "}
                      {c.end_date
                        ? new Date(c.end_date).toLocaleDateString("fr-FR", {
                            month: "short",
                            year: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {c.credits_budget || 0}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {c.credits_consumed || 0}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          title="Détails"
                          onClick={() =>
                            setExpandedId(expandedId === c.id ? null : c.id)
                          }
                        >
                          {expandedId === c.id ? (
                            <ChevronUp size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          title="Modifier"
                          onClick={() => openEdit(c)}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-expand`}>
                      <td
                        colSpan={7}
                        style={{
                          background: "var(--color-surface-hover)",
                          padding: "var(--space-lg)",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "var(--space-lg)",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Objectifs
                            </div>
                            <div style={{ fontSize: "0.9rem" }}>
                              {c.objectives || "Non définis"}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Actions associées
                            </div>
                            <div style={{ fontWeight: 600 }}>
                              {c.actions_aggregate?.aggregate?.count || 0}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Description
                            </div>
                            <div style={{ fontSize: "0.9rem" }}>
                              {c.description || "Aucune"}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "var(--space-xl)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Aucune campagne.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{modalTitle}</h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>
            {!editCampaign && (
              <div className="form-group">
                <label className="form-label">Client</label>
                <select
                  className="form-select"
                  value={form.client_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm({ ...form, client_id: e.target.value })
                  }
                >
                  <option value="">Sélectionner...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Nom de la campagne</label>
              <input
                className="form-input"
                placeholder="Ex: Outbound LinkedIn Q2"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-md)",
              }}
            >
              <div className="form-group">
                <label className="form-label">Date début</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.start_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date fin</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Budget crédits</label>
              <input
                className="form-input"
                type="number"
                placeholder="Ex: 500"
                value={form.credits_budget}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, credits_budget: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Objectifs</label>
              <textarea
                className="form-textarea"
                placeholder="Objectifs de la campagne..."
                value={form.objectives}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm({ ...form, objectives: e.target.value })
                }
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={editCampaign ? handleEdit : handleCreate}
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : editCampaign
                    ? "Enregistrer"
                    : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
