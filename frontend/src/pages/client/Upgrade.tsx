import { useState } from "react";
import {
  ArrowUpCircle,
  CreditCard,
  CheckCircle2,
  Wallet,
  Megaphone,
  LucideIcon,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useGraphQL, useLazyGraphQL } from "../../hooks/useGraphQL";
import LoadingState from "../../components/UI/LoadingState";
import ErrorState from "../../components/UI/ErrorState";
import type { UpgradePackType } from "../../types";

interface Pack {
  id: string;
  credits: number;
  price: string;
  description: string;
  popular: boolean;
}

interface AllocationOption {
  value: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

const FALLBACK_PACKS: Pack[] = [
  {
    id: "500",
    credits: 500,
    price: "1 250\u20AC",
    description: "Ideal pour une action ponctuelle",
    popular: false,
  },
  {
    id: "1000",
    credits: 1000,
    price: "2 250\u20AC",
    description: "Budget campagne dedie",
    popular: true,
  },
  {
    id: "2000",
    credits: 2000,
    price: "4 000\u20AC",
    description: "Acceleration a fort impact",
    popular: false,
  },
];

interface OffersData {
  offers: Array<{
    id: string;
    name: string;
    monthly_credits: number;
    price_monthly: number | null;
    description: string | null;
  }>;
}

const allocationOptions: AllocationOption[] = [
  {
    value: "general",
    label: "Reserve generale",
    desc: "Les credits sont ajoutes au portefeuille sans affectation specifique.",
    icon: Wallet,
  },
  {
    value: "campaign",
    label: "Campagne existante",
    desc: "Affecter les credits a une campagne en cours.",
    icon: Megaphone,
  },
];

function mapOffersToPacks(offers: OffersData["offers"]): Pack[] {
  if (offers.length === 0) return FALLBACK_PACKS;
  return offers.map((o, idx) => ({
    id: o.id,
    credits: o.monthly_credits,
    price: o.price_monthly
      ? `${o.price_monthly.toLocaleString("fr-FR")}\u20AC`
      : "Sur devis",
    description: o.description || o.name,
    popular: idx === 1,
  }));
}

export default function Upgrade() {
  const { currentClient, currentWallet } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [allocation, setAllocation] = useState("general");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: offersData,
    loading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGraphQL<OffersData>({
    query: `query { offers(where: { is_sprint: { _eq: false } }, order_by: { monthly_credits: asc }) { id name monthly_credits price_monthly description } }`,
  });

  const packs = mapOffersToPacks(offersData?.offers || []);

  const { execute: createUpgrade, loading: creating } = useLazyGraphQL(
    `mutation($obj: upgrades_insert_input!) { insert_upgrades_one(object: $obj) { id } }`,
  );

  if (offersLoading) return <LoadingState message="Chargement des packs..." />;
  if (offersError)
    return <ErrorState message={offersError} onRetry={refetchOffers} />;

  const handleSubmit = async () => {
    if (!selectedPack || !currentClient || !currentWallet) return;
    setSubmitError(null);
    const pack = packs.find((p) => p.id === selectedPack);
    if (!pack) return;

    try {
      const result = await createUpgrade({
        obj: {
          client_id: currentClient.id,
          wallet_id: currentWallet.id,
          credits_amount: pack.credits,
          pack_type: selectedPack as UpgradePackType,
          status: "demande",
          allocation_target: allocation,
        },
      });
      if (result) {
        setSubmitted(true);
      }
    } catch (err) {
      setSubmitError((err as Error).message || "Erreur lors de la demande");
    }
  };

  if (submitted) {
    return (
      <div
        className="animate-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <CheckCircle2
            size={64}
            style={{
              color: "var(--color-success)",
              marginBottom: "var(--space-lg)",
            }}
          />
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "var(--space-sm)",
            }}
          >
            Demande envoyée !
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary)",
              maxWidth: 400,
              margin: "0 auto",
            }}
          >
            Votre demande de recharge de{" "}
            {packs.find((p) => p.id === selectedPack)?.credits} crédits a été
            transmise à l'équipe Fastlane. Vous serez notifié dès la validation.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSubmitted(false);
              setSelectedPack(null);
            }}
            style={{ marginTop: "var(--space-xl)" }}
          >
            Nouvelle demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recharger des crédits</h1>
          <p className="page-subtitle">
            Ajoutez des crédits à votre portefeuille pour accélérer vos
            campagnes.
          </p>
        </div>
      </div>

      {/* Step 1: Choose Pack */}
      <h3
        style={{
          fontWeight: 700,
          marginBottom: "var(--space-md)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--gradient-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: 800,
            color: "white",
          }}
        >
          1
        </span>
        Choisissez votre pack
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-2xl)",
        }}
      >
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="card"
            onClick={() => setSelectedPack(pack.id)}
            style={{
              cursor: "pointer",
              position: "relative",
              borderColor:
                selectedPack === pack.id ? "var(--color-primary)" : undefined,
              boxShadow:
                selectedPack === pack.id ? "var(--shadow-glow)" : undefined,
            }}
          >
            {pack.popular && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  right: 16,
                  background: "var(--gradient-primary)",
                  color: "white",
                  padding: "2px 12px",
                  borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                POPULAIRE
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <CreditCard
                size={32}
                style={{
                  color: "var(--color-primary)",
                  marginBottom: "var(--space-md)",
                }}
              />
              <div
                style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 4 }}
              >
                {pack.credits}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                crédits
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                {pack.price}
              </div>
              <div
                style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}
              >
                {pack.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step 2: Allocation */}
      {selectedPack && (
        <>
          <h3
            style={{
              fontWeight: 700,
              marginBottom: "var(--space-md)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--gradient-primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 800,
                color: "white",
              }}
            >
              2
            </span>
            Affectation des crédits
          </h3>

          <div className="card" style={{ marginBottom: "var(--space-2xl)" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {allocationOptions.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-md)",
                    padding: "var(--space-md)",
                    background:
                      allocation === opt.value
                        ? "var(--color-primary-soft)"
                        : "var(--color-surface)",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${allocation === opt.value ? "var(--color-primary)" : "var(--color-border)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="radio"
                    name="allocation"
                    value={opt.value}
                    checked={allocation === opt.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAllocation(e.target.value)
                    }
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-md)",
                      background:
                        allocation === opt.value
                          ? "var(--color-primary-glow)"
                          : "var(--color-surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        allocation === opt.value
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    <opt.icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Confirm */}
          <h3
            style={{
              fontWeight: 700,
              marginBottom: "var(--space-md)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--gradient-primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 800,
                color: "white",
              }}
            >
              3
            </span>
            Confirmer
          </h3>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-lg)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Pack sélectionné
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {packs.find((p) => p.id === selectedPack)?.credits} crédits —{" "}
                  {packs.find((p) => p.id === selectedPack)?.price}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Affectation
                </div>
                <div style={{ fontWeight: 700 }}>
                  {allocation === "general"
                    ? "Réserve générale"
                    : "Campagne existante"}
                </div>
              </div>
            </div>
            {submitError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-md)",
                  background: "var(--color-danger-soft)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-danger)",
                  marginBottom: "var(--space-md)",
                  fontSize: "0.85rem",
                  color: "var(--color-danger)",
                }}
              >
                <AlertTriangle size={16} />
                {submitError}
              </div>
            )}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={creating}
              style={{ width: "100%" }}
            >
              {creating ? (
                "Envoi en cours..."
              ) : (
                <>
                  <ArrowUpCircle size={18} /> Envoyer la demande de recharge
                </>
              )}
            </button>
            <p
              style={{
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginTop: "var(--space-md)",
              }}
            >
              Votre demande sera validee par l'equipe Fastlane avant le credit
              de votre portefeuille.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
