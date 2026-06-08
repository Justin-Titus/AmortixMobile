import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import Typography from '@/components/ui/Typography';
import { AlertTriangle, RefreshCcw } from 'lucide-react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Top-level React Error Boundary.
 * Catches any unhandled render errors and shows a friendly recovery screen
 * instead of crashing the entire app to a blank red screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <AlertTriangle size={32} color={Colors.amber} />
            </View>
            <Typography variant="h3" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
              Something went wrong
            </Typography>
            <Typography variant="md" color="slate" style={styles.desc}>
              The app encountered an unexpected error. Your data is safe — tap below to try again.
            </Typography>
            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Typography variant="xs" color="slate" style={styles.errorText} numberOfLines={3}>
                  {this.state.error.message}
                </Typography>
              </View>
            ) : null}
            <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry} activeOpacity={0.85}>
              <RefreshCcw size={16} color={Colors.white} />
              <Typography variant="md" weight="bold" color="white">Retry</Typography>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    ...Shadows.card,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontFamily: 'IBMPlexMono',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.emerald,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    ...Shadows.button,
  },
});
