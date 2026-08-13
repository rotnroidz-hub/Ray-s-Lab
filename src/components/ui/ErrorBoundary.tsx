import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render/lifecycle errors anywhere below it so a crash shows a useful
 * message instead of a blank white page. The store's CartProvider and router
 * live below this boundary; its fallback deliberately renders no context
 * hooks so it always works even when the app state is corrupt.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
    window.location.assign(window.location.pathname + window.location.search)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 py-16">
        <div className="w-full max-w-md text-center">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            The page hit a snag
          </h1>
          <p className="mt-3 text-sm text-ink-faint">
            An unexpected error interrupted the page. Reload to get back to shopping — your cart is
            safe.
          </p>
          {import.meta.env.DEV && error.message && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-ink/5 p-4 text-left text-xs text-ink-soft">
              {error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.reset}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-8 py-3 text-sm font-semibold text-paper transition-all hover:bg-ink-2 active:scale-[0.98]"
          >
            Reload page
          </button>
        </div>
      </main>
    )
  }
}