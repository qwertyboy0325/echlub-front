import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class DAWErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('DAW Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: 'white',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            background: '#2a2a2a',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #ff4444'
          }}>
            <h2 style={{ 
              color: '#ff4444', 
              marginBottom: '16px',
              fontSize: '24px' 
            }}>
              🎵 DAW 渲染錯誤
            </h2>
            
            <p style={{ 
              marginBottom: '20px', 
              lineHeight: '1.5',
              fontSize: '16px' 
            }}>
              音頻工作站渲染器遇到了問題。這通常是由於 PIXI.js 初始化或銷毀過程中的錯誤導致的。
            </p>

            <div style={{
              background: '#1a1a1a',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#ff8888'
            }}>
              <strong>錯誤詳情:</strong><br />
              {this.state.error?.message || '未知錯誤'}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🔄 重新載入 DAW
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🔄 重新載入頁面
              </button>
            </div>

            <details style={{ 
              marginTop: '20px', 
              textAlign: 'left',
              fontSize: '12px',
              opacity: 0.7 
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                顯示技術詳情
              </summary>
              <pre style={{ 
                background: '#0d1117', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '11px'
              }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 