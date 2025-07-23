/**
 * Auto-sync vehicle count with Stripe billing
 * Call this after vehicle add/remove/status change operations
 */
export async function autoSyncVehicleCount(options?: {
  silent?: boolean; // Don't show errors to user
  force?: boolean;  // Force sync even if no changes detected
}) {
  try {
    const response = await fetch('/api/billing/sync-vehicle-count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to sync vehicle count');
    }

    console.log('Auto-sync successful:', result);
    return result;
  } catch (error) {
    console.error('Auto-sync failed:', error);
    
    if (!options?.silent) {
      // Optionally show a non-blocking notification
      // You could integrate with a toast library here
      console.warn('Billing sync failed but will retry later:', error);
    }
    
    throw error;
  }
}