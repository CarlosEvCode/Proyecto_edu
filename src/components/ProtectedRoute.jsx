import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {LoadingSpinner} from './Common';

export function ProtectedRoute({children}) {
	const {isAuthenticated, isLoading} = useAuth();

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

	return children;
}
