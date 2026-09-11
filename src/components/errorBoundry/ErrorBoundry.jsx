import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.log(`Caught by Error Boundary`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.fullContainer}>
          <div style={styles.leftPanel}>
            <div style={styles.iconContainer}>
              <svg
                style={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 style={styles.title}>Something Went Wrong</h2>

            <p style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <div style={styles.actions}>
              <button
                onClick={this.handleRetry}
                style={styles.primaryButton}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = '#0056b3')
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = '#007bff')
                }
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                style={styles.secondaryButton}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = '#545b62')
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = '#6c757d')
                }
              >
                Reload Page
              </button>
            </div>
          </div>

          <div style={styles.rightPanel}>
            {import.meta.env.DEV && (
              <div style={styles.stackContainer}>
                <h3 style={styles.stackTitle}>Error Stack (Development)</h3>
                <pre style={styles.errorStack}>
                  {this.state.error?.stack || 'No stack trace available.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  fullContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#fff',
    borderRight: '1px solid #dee2e6',
    padding: '40px',
  },
  rightPanel: {
    flex: 1,
    padding: '40px',
    backgroundColor: '#f1f3f5',
    overflowY: 'auto',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  icon: {
    width: '80px',
    height: '80px',
    color: '#dc3545',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#212529',
    marginBottom: '12px',
    textAlign: 'center',
  },
  message: {
    fontSize: '16px',
    color: '#6c757d',
    marginBottom: '32px',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '12px 28px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '12px 28px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  stackContainer: {
    maxWidth: '100%',
  },
  stackTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#343a40',
    marginBottom: '12px',
  },
  errorStack: {
    backgroundColor: "#1e1e1e", 
    color: "#d4d4d4", 
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    fontFamily: "Consolas, 'Courier New', monospace",
    overflowX: "auto",
  },
};

export default ErrorBoundary;