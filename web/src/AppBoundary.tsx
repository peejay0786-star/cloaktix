import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { renderErrorCode } from './errorCode.ts';

/** Rendering fails asynchronously: try/catch around root.render cannot catch it. */
export class AppBoundary extends Component<PropsWithChildren, { failed: boolean; code: string | null }> {
  state = { failed: false, code: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, code: renderErrorCode(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(`[CloakTix] render error ${renderErrorCode(error)}`, error, info?.componentStack ?? '');
  }

  render() {
    if (this.state.failed) return <main className="app"><div className="card" role="alert">
      <h1>Something went wrong</h1>
      <p>Your saved tickets have not been changed. Refresh to try again. Do not clear browser data.</p>
      {this.state.code && <p className="muted small">Error code: <code>{this.state.code}</code></p>}
      <button onClick={() => window.location.reload()}>Refresh page</button>
    </div></main>;
    return this.props.children;
  }
}
