import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ToasterErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Toaster crashed:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return null; // Render nothing instead of crashing the app
        }

        return this.props.children;
    }
}
