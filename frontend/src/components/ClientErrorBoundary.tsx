"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? undefined } },
    });
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100/95"
        >
          <p className="font-medium text-amber-50">{this.props.title ?? "This section could not load"}</p>
          <p className="mt-2 text-amber-100/80">
            Something went wrong in this part of the page. The rest of Shorup should still work.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.retry}
              className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-500/20"
            >
              Try again
            </button>
            <Link href="/" className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800">
              Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
