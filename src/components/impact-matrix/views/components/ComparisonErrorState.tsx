/**
 * Comparison Error State Component
 *
 * Displayed when data fetch fails
 *
 * Follows ui-skills guidelines:
 * - Show error next to where action happens
 * - Accessible button with visible focus outline
 * - aria-live="assertive" for screen readers
 * - Retry action available
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ComparisonErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function ComparisonErrorState({ error, onRetry }: ComparisonErrorStateProps) {
  return (
    <div className="p-4" role="alert" aria-live="assertive">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Failed to load comparison data</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-3">{error.message}</p>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
