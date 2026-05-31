import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorPage } from "@/components/pages/ErrorPage";
import { buildErrorContext } from "@/lib/errorReport";

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
	componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null, componentStack: null };

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		this.setState({ componentStack: info.componentStack ?? null });
		console.error("App error:", error, info.componentStack);
	}

	handleRetry = () => {
		this.setState({ error: null, componentStack: null });
	};

	render() {
		if (this.state.error) {
			return (
				<ErrorPage
					error={this.state.error}
					componentStack={this.state.componentStack}
					context={buildErrorContext()}
					onRetry={this.handleRetry}
				/>
			);
		}
		return this.props.children;
	}
}
