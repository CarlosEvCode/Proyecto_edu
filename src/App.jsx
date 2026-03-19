import {Routes, Route, Navigate} from 'react-router-dom';
import {LoginPage} from './pages/LoginPage';
import {PersonalPage} from './pages/AppPage';
import {EstudiantesPage} from './pages/EstudiantesPage';
import {ProtectedRoute} from './components/ProtectedRoute';
import {StudentProvider} from './context/StudentContext';

export default function App() {
	return (
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
			{/* Legacy route for backwards compatibility */}
			<Route
				path="/app"
				element={<Navigate to="/estudiantes" replace />}
			/>
			{/* Default: redirect to Estudiantes (main module) */}
			<Route path="/" element={<Navigate to="/estudiantes" replace />} />
			<Route path="*" element={<Navigate to="/estudiantes" replace />} />
		</Routes>
	);
}
