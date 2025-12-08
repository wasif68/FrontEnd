/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components and displays a fallback UI
 */

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Log more details for debugging
    console.error("Error stack:", error?.stack);
    console.error("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 text-center" style={{ margin: "2rem auto", maxWidth: "600px" }}>
          <h2 style={{ color: "var(--error)", marginBottom: "1rem" }}>
            Something went wrong
          </h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
            {this.props.message || "An unexpected error occurred. Please refresh the page."}
          </p>
          <button
            className="btn"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

