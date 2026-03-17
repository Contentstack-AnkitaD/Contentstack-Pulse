import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[Pulse] Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-2 text-red-500">
          <h1 className="text-xl font-bold">Something went wrong.</h1>
          <p className="text-sm text-gray-500">Please refresh the page and try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
