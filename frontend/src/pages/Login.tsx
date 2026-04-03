import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import nhost from "../lib/nhost";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

type Mode = "login" | "reset";

export default function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message || "Identifiants incorrects.");
      }
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } =
        await nhost.auth.sendResetPasswordEmail(email);
      if (resetError) {
        setError(resetError.message || "Impossible d'envoyer le lien.");
      } else {
        setResetSent(true);
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const switchToReset = () => {
    setMode("reset");
    setError(null);
    setResetSent(false);
  };

  const switchToLogin = () => {
    setMode("login");
    setError(null);
    setResetSent(false);
  };

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        <div className="login-logo">
          <h1>FASTLANE</h1>
          <p>
            {mode === "login"
              ? "Connectez-vous à votre espace"
              : "Réinitialiser votre mot de passe"}
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: "relative" }}>
                <Mail
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
                  type="email"
                  className="form-input"
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <Lock
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
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", marginTop: "var(--space-md)" }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={switchToReset}
              style={{
                display: "block",
                width: "100%",
                marginTop: "var(--space-sm)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-primary)",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: "var(--space-xs)",
              }}
            >
              Mot de passe oubli&eacute; ?
            </button>
          </form>
        )}

        {mode === "reset" && !resetSent && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: "relative" }}>
                <Mail
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
                  type="email"
                  className="form-input"
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", marginTop: "var(--space-md)" }}
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>

            <button
              type="button"
              onClick={switchToLogin}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                marginTop: "var(--space-sm)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
                padding: "var(--space-xs)",
              }}
            >
              <ArrowLeft size={14} /> Retour &agrave; la connexion
            </button>
          </form>
        )}

        {mode === "reset" && resetSent && (
          <div style={{ textAlign: "center", padding: "var(--space-md) 0" }}>
            <p
              style={{
                color: "var(--color-success)",
                fontWeight: 600,
                marginBottom: "var(--space-sm)",
              }}
            >
              Lien envoy&eacute; !
            </p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
                lineHeight: 1.5,
              }}
            >
              V&eacute;rifiez votre bo&icirc;te mail. En local, consultez
              Mailhog sur{" "}
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-primary)" }}
              >
                localhost:8025
              </a>
              .
            </p>

            <button
              type="button"
              onClick={switchToLogin}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                marginTop: "var(--space-lg)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
                padding: "var(--space-xs)",
              }}
            >
              <ArrowLeft size={14} /> Retour &agrave; la connexion
            </button>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "var(--space-lg)",
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
          }}
        >
          Plateforme r&eacute;serv&eacute;e aux clients et &agrave;
          l'&eacute;quipe Fastlane
        </p>
      </div>
    </div>
  );
}
