/**
 * ProtectedRoute Component
 *
 * Centralized route protection wrapper that handles:
 * - Authentication checks (redirects to login if not authenticated)
 * - Session loading state (shows loader while session is being decrypted)
 * - Permission-based access control (optional)
 * - Organization membership verification (optional)
 *
 * Usage:
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute requiredPermission="settings">
 *     <SettingsPage />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute requiresOrg>
 *     <ProjectsPage />
 *   </ProtectedRoute>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ProtectedRoute({
    children,
    requiredPermission = null,
    requiresOrg = false,
    requiresAdmin = false,
    fallbackPath = '/auth/login',
}) {
    const location = useLocation();
    const {
        isAuthenticated,
        isSessionLoading,
        user,
        hasPermission,
        isAdmin,
    } = useAuthStore();
    const { organization, loading: isOrgLoading } = useOrganizationStore();

    // Show loading spinner while session is being loaded/decrypted
    if (isSessionLoading) {
        return <LoadingSpinner text="Restoring session..." />;
    }

    // Not authenticated - redirect to login with return URL
    if (!isAuthenticated) {
        const returnUrl = location.pathname + location.search;
        return (
            <Navigate
                to={fallbackPath}
                state={{ from: returnUrl }}
                replace
            />
        );
    }

    // Check admin requirement
    if (requiresAdmin && !isAdmin()) {
        return (
            <Navigate
                to="/dashboard"
                state={{ error: 'Admin access required' }}
                replace
            />
        );
    }

    // Check specific permission if required
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <Navigate
                to="/dashboard"
                state={{ error: 'You do not have permission to access this page' }}
                replace
            />
        );
    }

    // Show loading while checking organization
    if (requiresOrg && isOrgLoading) {
        return <LoadingSpinner text="Loading organization..." />;
    }

    // Requires organization but user doesn't have one - redirect to onboarding
    if (requiresOrg && !organization) {
        return (
            <Navigate
                to="/onboarding"
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    // All checks passed - render children
    return children;
}

/**
 * Higher-order component version for class components or route config
 */
export function withProtectedRoute(
    WrappedComponent,
    options = {}
) {
    return function ProtectedComponent(props) {
        return (
            <ProtectedRoute {...options}>
                <WrappedComponent {...props} />
            </ProtectedRoute>
        );
    };
}

/**
 * Hook for checking protection status without rendering
 * Useful for conditional UI elements
 */
export function useProtectionStatus(requiredPermission = null) {
    const {
        isAuthenticated,
        isSessionLoading,
        hasPermission,
        isAdmin,
    } = useAuthStore();
    const { organization, loading: isOrgLoading } = useOrganizationStore();

    return {
        isLoading: isSessionLoading || isOrgLoading,
        isAuthenticated,
        hasOrganization: !!organization,
        hasPermission: requiredPermission ? hasPermission(requiredPermission) : true,
        isAdmin: isAdmin(),
    };
}
