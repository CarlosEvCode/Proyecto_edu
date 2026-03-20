import React, {Suspense} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import {ProtectedRoute} from './components/ProtectedRoute';
import {StudentProvider} from './context/StudentContext';
import {getDefaultRoute} from './utils/permissions';
import {useAuth} from './hooks/useAuth';

const LoginPage = React.lazy(() =>
	import('./pages/LoginPage').then((module) => ({default: module.LoginPage}))
);
const PersonalPage = React.lazy(() =>
	import('./pages/AppPage').then((module) => ({default: module.PersonalPage}))
);
const EstudiantesPage = React.lazy(() =>
	import('./pages/EstudiantesPage').then((module) => ({
		default: module.EstudiantesPage,
	}))
);

export default function App() {
	const {user, isAuthenticated} = useAuth();
	const homeRoute = isAuthenticated ? getDefaultRoute(user?.role) : '/login';

	return (
		<Suspense fallback={null}>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route
					path="/estudiantes"
					element={
						<ProtectedRoute
							allowedRoles={['admin', 'direccion', 'secretaria', 'docente', 'consulta']}
						>
							<StudentProvider>
								<EstudiantesPage />
							</StudentProvider>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/personal"
					element={
						<ProtectedRoute allowedRoles={['admin', 'direccion', 'secretaria']}>
							<PersonalPage />
						</ProtectedRoute>
					}
				/>
				<Route path="/app" element={<Navigate to={homeRoute} replace />} />
				<Route path="/" element={<Navigate to={homeRoute} replace />} />
				<Route path="*" element={<Navigate to={homeRoute} replace />} />
			</Routes>
		</Suspense>
	);
}
