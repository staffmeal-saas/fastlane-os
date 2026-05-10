import { useState, useCallback } from "react";
import { Plus, Copy, Trash2, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useGraphQL, useLazyGraphQL } from "../../hooks/useGraphQL";
import { useToast } from "../../components/UI/Toast";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";

interface ApiKeyRow {
  id: string;
  key_prefix: string;
  label: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  user: { id: string; email: string };
}

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

interface ApiKeysData {
  api_keys: ApiKeyRow[];
  auth_users: AuthUser[];
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateRawKey(): string {
  return (
    "fk_live_" +
    crypto.randomUUID().replace(/-/g, "").substring(0, 24)
  );
}

export default function ApiKeysManagement() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [keyLabel, setKeyLabel] = useState<string>("");

  const { data, loading, error, refetch } = useGraphQL<ApiKeysData>({
    query: `query {
      api_keys(order_by: { created_at: desc }) {
        id
        key_prefix
        label
        is_active
        last_used_at
        created_at
        user { id email }
      }
      auth_users(order_by: { email: asc }) {
        id
        email
        displayName
      }
    }`,
  });

  const { execute: createApiKey } = useLazyGraphQL(
    `mutation($objects: [api_keys_insert_input!]!) {
      insert_api_keys(objects: $objects) { id }
    }`,
  );

  const { execute: revokeApiKey } = useLazyGraphQL(
    `mutation($id: uuid!, $is_active: Boolean!) {
      update_api_keys_by_pk(pk_columns: {id: $id}, _set: {is_active: $is_active}) { id }
    }`,
  );

  const apiKeys = data?.api_keys || [];
  const authUsers = data?.auth_users || [];

  const handleGenerate = useCallback(async () => {
    if (!selectedUserId || !keyLabel.trim()) return;

    try {
      const rawKey = generateRawKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      await createApiKey({
        objects: {
          user_id: selectedUserId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          label: keyLabel.trim(),
        },
      });

      setGeneratedKey(rawKey);
      setShowModal(false);
      setShowKeyModal(true);
      setSelectedUserId("");
      setKeyLabel("");
      refetch();
      toast("Cle API generee", "success");
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la generation de la cle", "error");
    }
  }, [selectedUserId, keyLabel, createApiKey, refetch, toast]);

  const handleRevoke = useCallback(
    async (id: string) => {
      if (!confirm("Confirmer la revocation de cette cle ? Elle ne pourra plus etre utilisee.")) {
        return;
      }

      try {
        await revokeApiKey({ id, is_active: false });
        refetch();
        toast("Cle revokee", "success");
      } catch (err) {
        console.error(err);
        toast("Erreur lors de la revocation", "error");
      }
    },
    [revokeApiKey, refetch, toast],
  );

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast("Copie dans le presse-papiers", "success"),
      () => toast("Echec de la copie", "error"),
    );
  }, [toast]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des cles API</h1>
          <p className="page-subtitle">
            {apiKeys.length} cle(s) — generer et revoker les cles d'acces.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Generer une cle
        </button>
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
                <th>Utilisateur</th>
                <th>Cle</th>
                <th>Label</th>
                <th>Statut</th>
                <th>Derniere utilisation</th>
                <th>Creée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td style={{ fontWeight: 500 }}>{key.user?.email || "—"}</td>
                  <td>
                    <code style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      {key.key_prefix}...
                    </code>
                  </td>
                  <td>{key.label || "—"}</td>
                  <td>
                    <span className={`badge ${key.is_active ? "badge-success" : "badge-info"}`}>
                      {key.is_active ? "Active" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>{formatDate(key.last_used_at)}</td>
                  <td style={{ fontSize: "0.8rem" }}>{formatDate(key.created_at)}</td>
                  <td>
                    {key.is_active && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleRevoke(key.id)}
                        title="Revoker"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {apiKeys.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "var(--space-xl)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Aucune cle API.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Key Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Generer une cle API</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Utilisateur</label>
              <select
                className="form-select"
                value={selectedUserId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedUserId(e.target.value)
                }
              >
                <option value="">Selectionner...</option>
                {authUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label / Description</label>
              <input
                className="form-input"
                placeholder="Ex: Cle de production equipe marketing"
                value={keyLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setKeyLabel(e.target.value)
                }
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!selectedUserId || !keyLabel.trim()}
              >
                Generer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Key Display Modal */}
      {showKeyModal && generatedKey && (
        <div className="modal-overlay" onClick={() => {
          setShowKeyModal(false);
          setGeneratedKey(null);
        }}>
          <div
            className="modal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                <Shield size={20} style={{ marginRight: 8, color: "var(--color-success)" }} />
                Cle generee avec succes
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowKeyModal(false);
                  setGeneratedKey(null);
                }}
              >
                ✕
              </button>
            </div>
            <div
              className="alert alert-warning"
              style={{
                marginBottom: "var(--space-md)",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            >
              <strong>⚠️ Copie cette cle maintenant. Elle ne sera plus jamais affichée.</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Cle API</label>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <input
                  className="form-input"
                  readOnly
                  value={generatedKey}
                  style={{ fontFamily: "monospace", flex: 1 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => copyToClipboard(generatedKey)}
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowKeyModal(false);
                  setGeneratedKey(null);
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
