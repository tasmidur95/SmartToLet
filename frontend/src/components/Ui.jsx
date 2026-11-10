import { Link } from 'react-router-dom';
import { Icon } from './Icons.jsx';

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon.Home width={32} height={32} /></div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error">
      <span>{error.message}</span>
      {onRetry && <button className="link-btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="container page-header-inner">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function StatusBadge({ status, label, tone }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function SectionHead({ title, to, linkLabel }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {to && <Link to={to} className="link">{linkLabel} →</Link>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.Close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
