import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGraphQL, useLazyGraphQL } from "../../hooks/useGraphQL";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { ClientStatus } from "../../types";

interface ClientRow {
  id: string;
  name: string;
  status: ClientStatus;
  industry?: string;
  website?: string;
  notes?: string;
  created_at: string;
  offer?: { id: string; name: string };
  wallet?: { id: string; balance: number; reserved: number };
}

interface ClientsData {
  clients: ClientRow[];
  offers: Array<{ id: string; name: string; monthly_credits: number }>;
}

interface EditForm {
  name: string;
  industry: string;
  website: string;
  notes: string;
  status: ClientStatus;
  offer_id: string;
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

function buildEditForm(c: ClientRow): EditForm {
  return {
    name: c.name,
    industry: c.industry || "",
    website: c.website || "",
    notes: c.notes || "",
    status: c.status,
    offer_id: c.offer?.id || "",
  };
}

export default function ClientManagement() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<ClientRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    industry: "",
    website: "",
    notes: "",
    status: "active",
    offer_id: "",
  });

  const { data, loading, error, refetch } = useGraphQL<ClientsData>({
    query: `query GetClients {
      clients(order_by: { created_at: desc }) {
        id name status industry website notes created_at
        offer { id name }
        wallet { id balance reserved }
      }
      offers(order_by: { name: asc }) { id name monthly_credits }
    }`,
  });

  const { execute: updateClient, loading: updating } = useLazyGraphQL<{
    update_clients_by_pk: { id: string };
  }>(
    `mutation UpdateClient($id: uuid!, $set: clients_set_input!) {
      update_clients_by_pk(pk_columns: { id: $id }, _set: $set) { id }
    }`,
  );

  const clients = data?.clients || [];
  const offers = data?.offers || [];
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openEdit = (c: ClientRow) => {
    setEditClient(c);
    setEditForm(buildEditForm(c));
  };

  const handleSave = async () => {
    if (!editClient) return;
    try {
      await updateClient({
        id: editClient.id,
        set: {
          name: editForm.name,
          industry: editForm.industry || null,
          website: editForm.website || null,
          notes: editForm.notes || null,
          status: editForm.status,
          offer_id: editForm.offer_id || null,
        },
      });
      setEditClient(null);
      refetch();
    } catch (err) {
      console.error("Failed to update client:", err);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion Clients</h1>
          <p className="page-subtitle">
            {clients.length} comptes — création, édition, statut et accès.
          </p>
        </div>
        <Link to="/admin/clients/onboarding" className="btn btn-primary">
          <Plus size={16} /> Nouveau client
        </Link>
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
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div className="card">
        {loading ? (
          <LoadingState message="Chargement des clients..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Statut</th>
                <th>Offre</th>
                <th>Crédits</th>
                <th>Industrie</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <>
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {c.id.split("-")[0]}
                      </div>
                    </td>
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
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.wallet?.balance || 0}
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {c.industry || "-"}
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
                    <tr key={`${c.id}-details`}>
                      <td
                        colSpan={6}
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
                              Wallet
                            </div>
                            <div style={{ fontWeight: 600 }}>
                              Balance: {c.wallet?.balance || 0} | Réservé:{" "}
                              {c.wallet?.reserved || 0}
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
                              Site web
                            </div>
                            <div>{c.website || "Non renseigné"}</div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Créé le
                            </div>
                            <div>
                              {new Date(c.created_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          </div>
                        </div>
                        {c.notes && (
                          <div style={{ marginTop: "var(--space-md)" }}>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Notes
                            </div>
                            <div style={{ fontSize: "0.9rem" }}>{c.notes}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
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
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editClient && (
        <div className="modal-overlay" onClick={() => setEditClient(null)}>
          <div
            className="modal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Modifier {editClient.name}</h3>
              <button
                className="modal-close"
                onClick={() => setEditClient(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                className="form-input"
                value={editForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, name: e.target.value })
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
                <label className="form-label">Statut</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as ClientStatus,
                    })
                  }
                >
                  <option value="active">Actif</option>
                  <option value="sprint">Sprint</option>
                  <option value="suspended">Suspendu</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Offre</label>
                <select
                  className="form-select"
                  value={editForm.offer_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditForm({ ...editForm, offer_id: e.target.value })
                  }
                >
                  <option value="">Aucune</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.monthly_credits} cr/mois)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-md)",
              }}
            >
              <div className="form-group">
                <label className="form-label">Industrie</label>
                <input
                  className="form-input"
                  value={editForm.industry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, industry: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Site web</label>
                <input
                  className="form-input"
                  value={editForm.website}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={editForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditClient(null)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={updating || !editForm.name}
              >
                {updating ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
