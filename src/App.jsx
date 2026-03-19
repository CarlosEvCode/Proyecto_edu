import React, {Suspense} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import {ProtectedRoute} from './components/ProtectedRoute';
import {StudentProvider} from './context/StudentContext';

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
	return (
		<Suspense fallback={null}>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route
					path="/estudiantes"
					element={
						<ProtectedRoute>
							<StudentProvider>
								<EstudiantesPage />
							</StudentProvider>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/personal"
					element={
						<ProtectedRoute>
							<PersonalPage />
						</ProtectedRoute>
					}
				/>
				<Route path="/app" element={<Navigate to="/estudiantes" replace />} />
				<Route path="/" element={<Navigate to="/estudiantes" replace />} />
				<Route path="*" element={<Navigate to="/estudiantes" replace />} />
			</Routes>
		</Suspense>
	);
}
