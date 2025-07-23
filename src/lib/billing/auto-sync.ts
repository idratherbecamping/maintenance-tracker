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

    return result;
  } catch (error) {
    if (!options?.silent) {
      // Re-throw error only if not in silent mode
      throw error;
    }
    
    // Silently handle error in silent mode
    return null;
  }
}