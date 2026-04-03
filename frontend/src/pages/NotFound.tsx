import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--color-bg)",
        padding: "var(--space-xl)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "6rem",
          fontWeight: 800,
          lineHeight: 1,
          background: "var(--gradient-primary)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "var(--space-md)",
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: "var(--space-sm)",
        }}
      >
        Page introuvable
      </p>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-xl)",
          maxWidth: 400,
        }}
      >
        La page que vous cherchez n'existe pas ou a ete deplacee.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <ArrowLeft size={16} />
        Retour au Dashboard
      </Link>
    </div>
  );
}
