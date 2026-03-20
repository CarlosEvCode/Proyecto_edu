import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {LoadingSpinner} from './Common';
import {getDefaultRoute, normalizeRole} from '../utils/permissions';

export function ProtectedRoute({children, allowedRoles = null}) {
	const {isAuthenticated, isLoading, user} = useAuth();

	if (isLoading) {
		return (
			<div className="auth-loading-screen">
				<LoadingSpinner />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
		const userRole = normalizeRole(user?.role);
		if (!allowedRoles.includes(userRole)) {
			return <Navigate to={getDefaultRoute(userRole)} replace />;
		}
	}

	return children;
}
