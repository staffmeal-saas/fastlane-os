import { useState } from "react";
import { Search, Shield, UserPlus, Mail, Edit } from "lucide-react";
import { useGraphQL, useLazyGraphQL } from "../../hooks/useGraphQL";
import { useAuth } from "../../contexts/AuthContext";
import nhost from "../../lib/nhost";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { PlatformRole } from "../../types";

interface ClientMember {
  id: string;
  user_id: string;
  role: string;
  client: { id: string; name: string };
}

interface AccessData {
  user_profiles: Array<{
    id: string;
    user_id: string;
    display_name?: string;
    platform_role: PlatformRole;
    created_at: string;
  }>;
  clients: Array<{ id: string; name: string }>;
  client_members: ClientMember[];
}

interface EnrichedProfile {
  id: string;
  user_id: string;
  display_name?: string;
  platform_role: PlatformRole;
  created_at: string;
  memberships: ClientMember[];
}

interface InviteForm {
  email: string;
  display_name: string;
  platform_role: PlatformRole;
  client_id: string;
}

const roleLabels: Record<PlatformRole, string> = {
  super_admin: "Super Admin",
  admin_ops: "Admin Ops",
  account_manager: "Account Manager",
  sprint_manager: "Sprint Manager",
  finance_admin: "Finance/Admin",
  client_owner: "Client Owner",
  client_collaborator: "Collaborateur",
  prospect_sprint: "Prospect Sprint",
};
const roleColors: Record<PlatformRole, string> = {
  super_admin: "badge-danger",
  admin_ops: "badge-purple",
  account_manager: "badge-primary",
  sprint_manager: "badge-info",
  finance_admin: "badge-warning",
  client_owner: "badge-success",
  client_collaborator: "badge-info",
  prospect_sprint: "badge-warning",
};

const ADMIN_ROLES: PlatformRole[] = [
  "super_admin",
  "admin_ops",
  "account_manager",
  "sprint_manager",
  "finance_admin",
];
const CLIENT_ROLES: PlatformRole[] = [
  "client_owner",
  "client_collaborator",
  "prospect_sprint",
];

function generateTempPassword(): string {
  return `Fl${Date.now().toString(36)}!${Math.random().toString(36).slice(2, 8)}`;
}

export default function AccessManagement() {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [form, setForm] = useState<InviteForm>({
    email: "",
    display_name: "",
    platform_role: "client_owner",
    client_id: "",
  });

  const { data, loading, error, refetch } = useGraphQL<AccessData>({
    query: `query {
      user_profiles(order_by: { created_at: desc }) {
        id user_id display_name platform_role created_at
      }
      clients(order_by: { name: asc }) { id name }
      client_members(order_by: { created_at: desc }) { id user_id role client { id name } }
    }`,
  });

  const { execute: createProfile } = useLazyGraphQL<{
    insert_user_profiles_one: { id: string };
  }>(
    `mutation($obj: user_profiles_insert_input!) {
      insert_user_profiles_one(object: $obj) { id }
    }`,
  );

  const { execute: createClientMember } = useLazyGraphQL<{
    insert_client_members_one: { id: string };
  }>(
    `mutation($obj: client_members_insert_input!) {
      insert_client_members_one(object: $obj) { id }
    }`,
  );

  const membersMap: Record<string, ClientMember[]> = {};
  (data?.client_members || []).forEach((m) => {
    if (!membersMap[m.user_id]) membersMap[m.user_id] = [];
    membersMap[m.user_id].push(m);
  });

  const profiles: EnrichedProfile[] = (data?.user_profiles || []).map((p) => ({
    ...p,
    memberships: membersMap[p.user_id] || [],
  }));
  const clients = data?.clients || [];

  const filtered = profiles.filter(
    (u) =>
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.platform_role || "").toLowerCase().includes(search.toLowerCase()),
  );

  const internal = filtered.filter((u) =>
    ADMIN_ROLES.includes(u.platform_role),
  );
  const external = filtered.filter(
    (u) => !ADMIN_ROLES.includes(u.platform_role),
  );

  const handleInvite = async () => {
    if (!form.email || !form.display_name) return;
    setInviting(true);
    setInviteError(null);

    try {
      const tempPassword = generateTempPassword();
      const { session: newSession, error: signUpError } =
        await nhost.auth.signUpEmailPassword(
          form.email,
          tempPassword,
          form.display_name,
        );

      if (signUpError) {
        setInviteError(signUpError.message);
        setInviting(false);
        return;
      }

      const userId = newSession?.user?.id;
      if (!userId) {
        setInviteError("Compte cree mais aucun user_id retourne");
        setInviting(false);
        return;
      }

      await createProfile({
        obj: {
          user_id: userId,
          display_name: form.display_name,
          platform_role: form.platform_role,
        },
      });

      if (form.client_id && CLIENT_ROLES.includes(form.platform_role)) {
        const memberRole =
          form.platform_role === "client_owner" ? "owner" : "collaborator";
        await createClientMember({
          obj: {
            user_id: userId,
            client_id: form.client_id,
            role: memberRole,
          },
        });
      }

      setShowModal(false);
      setForm({
        email: "",
        display_name: "",
        platform_role: "client_owner",
        client_id: "",
      });
      refetch();
    } catch (err) {
      setInviteError((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion Acces</h1>
          <p className="page-subtitle">
            {profiles.length} utilisateurs — inviter, attribuer des roles et
            gerer les permissions.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Inviter un utilisateur
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
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div className="card" style={{ marginBottom: "var(--space-xl)" }}>
        <div className="card-header">
          <span className="card-title">
            <Shield size={16} style={{ marginRight: 6 }} />
            Equipe interne ({internal.length})
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Role</th>
              <th>Cree le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {internal.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 700 }}>
                  {u.display_name || "Sans nom"}
                </td>
                <td>
                  <span
                    className={`badge ${roleColors[u.platform_role] || "badge-info"}`}
                  >
                    {roleLabels[u.platform_role] || u.platform_role}
                  </span>
                </td>
                <td>
                  {new Date(u.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost">
                    <Edit size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {internal.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "var(--space-md)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Aucun membre interne.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Utilisateurs externes ({external.length})
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Role</th>
              <th>Client</th>
              <th>Cree le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {external.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 700 }}>
                  {u.display_name || "Sans nom"}
                </td>
                <td>
                  <span
                    className={`badge ${roleColors[u.platform_role] || "badge-info"}`}
                  >
                    {roleLabels[u.platform_role] || u.platform_role}
                  </span>
                </td>
                <td>{u.memberships?.[0]?.client?.name || "—"}</td>
                <td>
                  {new Date(u.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost">
                    <Edit size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {external.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "var(--space-md)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Aucun utilisateur externe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Inviter un utilisateur</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {inviteError && (
              <div
                style={{
                  padding: "var(--space-sm) var(--space-md)",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-danger)",
                  fontSize: "0.85rem",
                  marginBottom: "var(--space-md)",
                }}
              >
                {inviteError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="utilisateur@example.com"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                className="form-input"
                placeholder="Prenom Nom"
                value={form.display_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, display_name: e.target.value })
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
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={form.platform_role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm({
                      ...form,
                      platform_role: e.target.value as PlatformRole,
                    })
                  }
                >
                  {(Object.entries(roleLabels) as [PlatformRole, string][]).map(
                    ([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Client (si externe)</label>
                <select
                  className="form-select"
                  value={form.client_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm({ ...form, client_id: e.target.value })
                  }
                >
                  <option value="">Aucun (interne)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--color-surface-hover)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                marginTop: "var(--space-sm)",
              }}
            >
              Un mot de passe temporaire sera genere. L'utilisateur devra le
              modifier a sa premiere connexion.
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
                onClick={handleInvite}
                disabled={inviting || !form.email || !form.display_name}
              >
                <Mail size={16} />{" "}
                {inviting ? "Creation..." : "Creer le profil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
