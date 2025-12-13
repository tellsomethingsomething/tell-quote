import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to track unsaved changes and warn users before navigation
 * @param {boolean} enabled - Whether change detection is enabled
 * @param {any} data - The data to track for changes
 * @returns {Object} - { hasUnsavedChanges, confirmNavigateAway, markAsSaved }
 */
export function useUnsavedChanges(enabled, data) {
  const lastSavedDataRef = useRef(null);

  // Check if data has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!enabled) return false;
    if (!lastSavedDataRef.current) return false;

    // Compare current data with last saved state (excluding timestamps)
    const currentData = { ...data };
    const savedData = { ...lastSavedDataRef.current };
    delete currentData.updatedAt;
    delete savedData.updatedAt;

    return JSON.stringify(currentData) !== JSON.stringify(savedData);
  }, [data, enabled]);

  // Mark current state as saved
  const markAsSaved = useCallback(() => {
    if (enabled && data) {
      lastSavedDataRef.current = { ...data };
    }
  }, [data, enabled]);

  // Confirm navigation away from page with unsaved changes
  const confirmNavigateAway = useCallback((callback) => {
    if (hasUnsavedChanges()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        lastSavedDataRef.current = null;
        callback();
      }
    } else {
      callback();
    }
  }, [hasUnsavedChanges]);

  // Warn about unsaved changes when closing/refreshing browser
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    confirmNavigateAway,
    markAsSaved,
  };
}
