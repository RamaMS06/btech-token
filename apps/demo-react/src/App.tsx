import '@ramaMS06/tokens-web/styles.css';
import './app.css';

// ─── Button — reads CSS vars from nearest [data-tenant] ancestor ──────────────
function Button({ variant = 'primary', children }: { variant?: 'primary' | 'secondary' | 'danger'; children: React.ReactNode }) {
  return (
    <button className={`ds-btn ds-btn--${variant}`}>
      {children}
    </button>
  );
}

// ─── One tenant "screen" ──────────────────────────────────────────────────────
function TenantDemo({ tenant, label }: { tenant: string; label: string }) {
  return (
    <div className="ds-card" data-tenant={tenant}>
      <div className="ds-card__header">
        <h2 className="ds-card__title">{label}</h2>
        <span className="ds-badge">tenant: {tenant}</span>
      </div>
      <p className="ds-card__desc">
        Same component code — different brand tokens via{' '}
        <code>data-tenant="{tenant}"</code>.
      </p>
      <div className="ds-btn-row">
        <Button variant="primary">Primary Action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Delete</Button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="ds-page">
      <header className="ds-header">
        <h1>@ramaMS06/tokens-web · Multi-Tenant Demo</h1>
        <p>One <code>&lt;Button&gt;</code> component · Three brand identities</p>
      </header>

      <main className="ds-grid">
        <TenantDemo tenant="default"    label="Default Tenant (Green)" />
        <TenantDemo tenant="tenant-a"   label="Tenant A (Blue · radius 4px)" />
        <TenantDemo tenant="tenant-bjb" label="Tenant BJB (Deep Blue · tight)" />
      </main>

      <footer className="ds-footer">
        <code>{'data-tenant="..." on wrapper div → CSS vars cascade down'}</code>
      </footer>
    </div>
  );
}
