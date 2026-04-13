import React, { useState } from 'react';
import { TokenProvider, useToken } from '@ramams06/tokens-react';
import '@ramams06/tokens-web/styles.css';
import './app.css';

// ─── Button component — reads CSS vars set by TokenProvider ──────────────────
function Button({ variant = 'primary', children }: { variant?: 'primary' | 'secondary' | 'danger'; children: React.ReactNode }) {
  return (
    <button className={`ds-btn ds-btn--${variant}`}>
      {children}
    </button>
  );
}

// ─── Badge shows active tenant ────────────────────────────────────────────────
function TenantBadge() {
  const { tenant } = useToken();
  return <span className="ds-badge">tenant: {tenant}</span>;
}

// ─── One tenant "screen" ──────────────────────────────────────────────────────
function TenantDemo({ tenant, label }: { tenant: string; label: string }) {
  return (
    <TokenProvider tenant={tenant}>
      <div className="ds-card">
        <div className="ds-card__header">
          <h2 className="ds-card__title">{label}</h2>
          <TenantBadge />
        </div>
        <p className="ds-card__desc">
          Same component code — different brand tokens applied via{' '}
          <code>data-tenant="{tenant}"</code>.
        </p>
        <div className="ds-btn-row">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Delete</Button>
        </div>
      </div>
    </TokenProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="ds-page">
      <header className="ds-header">
        <h1>@ramams06/tokens-react · Multi-Tenant Demo</h1>
        <p>One <code>&lt;Button&gt;</code> component · Three brand identities</p>
      </header>

      <main className="ds-grid">
        <TenantDemo tenant="default"    label="Default Tenant (Green)" />
        <TenantDemo tenant="tenant-a"   label="Tenant A (Blue · radius 4px)" />
        <TenantDemo tenant="tenant-bjb" label="Tenant BJB (Deep Blue · tight)" />
      </main>

      <footer className="ds-footer">
        <code>{'<TokenProvider tenant="..."> → sets data-tenant on <html> → CSS vars cascade'}</code>
      </footer>
    </div>
  );
}
