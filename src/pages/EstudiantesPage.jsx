import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate, Link, useLocation} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {useStudentContext} from '../hooks/useStudentContext';
import {useCache, useRequestController} from '../hooks/useCache';
import {StudentCard} from '../components/StudentCard';
import {SearchAndFilters} from '../components/SearchAndFilters';
import {Pagination} from '../components/Pagination';
import {StudentDetailModal} from '../components/StudentDetailModal';
import {AddStudentModal} from '../components/AddStudentModal';
import {Notification, LoadingSpinner} from '../components/Common';
import {useNotification} from '../hooks/useNotification';
import * as studentsApi from '../services/studentsApi';
import {supabase} from '../lib/supabase';

export function EstudiantesPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const {user, logout} = useAuth();
	const {
		students,
		setStudents,
		grados,
		setGrados,
		secciones,
		setSecciones,
		pagination,
		updatePagination,
		filters,
		setIsLoading,
		isLoading,
	} = useStudentContext();

	const cache = useCache();
	const requestController = useRequestController();

	const [selectedStudent, setSelectedStudent] = useState(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isSavingStudent, setIsSavingStudent] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [showMobileDrawer, setShowMobileDrawer] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [stats, setStats] = useState({totalStudents: 0, bySex: {}, byGrade: []});
	const {notification, notifySuccess, notifyError, clearNotification} =
		useNotification();

	// Cerrar dropdown al hacer click fuera
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (showUserDropdown && !e.target.closest('.user-profile-dropdown-container')) {
				setShowUserDropdown(false);
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [showUserDropdown]);

	// Prevenir scroll cuando el drawer mobile está abierto
	useEffect(() => {
		if (showMobileDrawer) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [showMobileDrawer]);

	// Verificar autenticación periódicamente
	useEffect(() => {
		const verifyAuthentication = async () => {
			try {
				const {data, error} = await supabase.auth.getUser();

				if (error || !data?.user) {
					console.warn('Usuario no autenticado, cerrando sesión automáticamente');
					await logout();
					navigate('/login');
				}
			} catch (error) {
				console.error('Error verificando autenticación:', error);
				await logout();
				navigate('/login');
			}
		};

		const interval = setInterval(verifyAuthentication, 60000);
		verifyAuthentication();

		return () => clearInterval(interval);
	}, [navigate, logout]);

	const loadFilterOptions = useCallback(async () => {
		const token = requestController.startRequest(
			requestController.tokens.filterOptions
		);

		try {
			const [gradosData, seccionesData] = await Promise.all([
				studentsApi.getGrados(),
				studentsApi.getSecciones(),
			]);

			if (!requestController.isActive(token)) return;

			setGrados(Array.isArray(gradosData) ? gradosData : []);
			setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
		} catch {
			if (requestController.isActive(token)) {
				notifyError(null, 'Error al cargar opciones de filtro');
			}
		}
	}, [requestController, setGrados, setSecciones, notifyError]);

	const loadStats = useCallback(async () => {
		try {
			const data = await studentsApi.getStudentStats();
			setStats(data);
		} catch {
			// Silencioso: stats no deben bloquear la pagina
		}
	}, []);

	const loadStudents = useCallback(async (page = 1, limit = 24) => {
		const token = requestController.startRequest(
			requestController.tokens.studentsList
		);

		try {
			setIsLoading(true);

			const hasFilters =
				filters.search || filters.grado || filters.seccion || filters.sexo;

			let data;
			const cacheKey = cache.getCacheKey('students', {
				filters,
				page,
				limit,
			});

			const cachedData = cache.get(cacheKey);
			if (cachedData) {
				if (!requestController.isActive(token)) return;
				setStudents(cachedData.students || []);
				updatePagination(cachedData.pagination);
				return;
			}

			if (hasFilters) {
				data = await studentsApi.searchStudents(filters, page, limit);
			} else {
				data = await studentsApi.getStudents(page, limit);
			}

			if (!requestController.isActive(token)) return;

			cache.set(cacheKey, data);
			setStudents(data.students || []);
			updatePagination(data.pagination);
		} catch (error) {
			if (requestController.isActive(token)) {
				notifyError(error, 'Error al cargar estudiantes');
			}
		} finally {
			setIsLoading(false);
		}
	}, [
		requestController,
		setIsLoading,
		filters,
		cache,
		setStudents,
		updatePagination,
		notifyError,
	]);

	// Cargar opciones de filtro una sola vez
	useEffect(() => {
		loadFilterOptions();
	}, [loadFilterOptions]);

	// Cargar estadísticas una sola vez
	useEffect(() => {
		loadStats();
	}, [loadStats]);

	// Cargar estudiantes cuando cambian los filtros o paginación
	useEffect(() => {
		loadStudents(pagination.page, pagination.limit);
	}, [loadStudents, pagination.page, pagination.limit]);

	const handleSearch = useCallback(() => {
		updatePagination({page: 1});
	}, [updatePagination]);

	const handleStudentClick = (student) => {
		setSelectedStudent(student);
		setIsDetailModalOpen(true);
	};

	const handleSaveStudent = async (updatedStudent) => {
		try {
			setIsSavingStudent(true);

			// Actualizar estudiante
			await studentsApi.updateStudent(updatedStudent.id, {
				nombres: updatedStudent.nombres,
				apellidos: updatedStudent.apellidos,
				dni: updatedStudent.dni,
				fecha_nacimiento: updatedStudent.fecha_nacimiento || null,
				sexo: updatedStudent.sexo,
				discapacidad: updatedStudent.discapacidad || null,
				grado: updatedStudent.grado,
				seccion: updatedStudent.seccion,
			});

			// Actualizar apoderado si existe
			if (updatedStudent.apoderado?.id) {
				await studentsApi.updateApoderado(updatedStudent.apoderado.id, {
					nombres: updatedStudent.apoderado.nombres,
					apellidos: updatedStudent.apoderado.apellidos,
					dni: updatedStudent.apoderado.dni,
					fecha_nacimiento: updatedStudent.apoderado.fecha_nacimiento,
					celular: updatedStudent.apoderado.celular,
				});
			}

			// Actualizar dirección si existe
			if (updatedStudent.direccion?.id) {
				await studentsApi.updateDireccion(updatedStudent.direccion.id, {
					departamento: updatedStudent.direccion.departamento,
					provincia: updatedStudent.direccion.provincia,
					distrito: updatedStudent.direccion.distrito,
					domicilio: updatedStudent.direccion.domicilio,
				});
			}

			cache.invalidate('students');
			await loadStudents(pagination.page, pagination.limit);
			await loadStats();
			setIsDetailModalOpen(false);
			notifySuccess('Estudiante actualizado exitosamente');
		} catch (error) {
			notifyError(error, 'Error al guardar cambios');
		} finally {
			setIsSavingStudent(false);
		}
	};

	const handleDeleteStudent = async (id) => {
		try {
			setIsSavingStudent(true);
			await studentsApi.deleteStudent(id);
			cache.invalidate('students');
			await loadStudents(pagination.page, pagination.limit);
			await loadStats();
			setIsDetailModalOpen(false);
			notifySuccess('Estudiante eliminado exitosamente');
		} catch (error) {
			notifyError(error, 'Error al eliminar estudiante');
		} finally {
			setIsSavingStudent(false);
		}
	};

	const handleAddStudent = async (formData) => {
		try {
			setIsSavingStudent(true);
			await studentsApi.createStudent(formData);
			cache.invalidate('students');
			await loadStudents(1, pagination.limit);
			await loadStats();
			setIsAddModalOpen(false);
			notifySuccess('Estudiante creado exitosamente');
		} catch (error) {
			notifyError(error, 'Error al crear estudiante');
		} finally {
			setIsSavingStudent(false);
		}
	};

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			await logout();
			setShowLogoutConfirm(false);
			setShowUserDropdown(false);
			navigate('/login');
		} catch (error) {
			console.error('Error durante logout:', error);
			setShowLogoutConfirm(false);
			setShowUserDropdown(false);
			navigate('/login');
		} finally {
			setIsLoggingOut(false);
		}
	};

	const getInitial = (name) => {
		return (name || 'U').charAt(0).toUpperCase();
	};

	const userInitial = getInitial(user?.full_name || user?.email);

	const mainStat = stats?.totalStudents ?? pagination.total ?? 0;
	const sexStats = [
		{label: 'Masculino', value: stats?.bySex?.M || 0},
		{label: 'Femenino', value: stats?.bySex?.F || 0},
	].filter((item) => item.value > 0);
	const gradeStats = Array.isArray(stats?.byGrade)
		? [...stats.byGrade].sort((a, b) => {
			const aNum = Number.parseInt(a.grado, 10);
			const bNum = Number.parseInt(b.grado, 10);
			if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
				return String(a.grado).localeCompare(String(b.grado));
			}
			return aNum - bNum;
		})
		: [];

	// Navigation items
	const navItems = [
		{path: '/estudiantes', label: 'Estudiantes', icon: 'school'},
		{path: '/personal', label: 'Personal Docente', icon: 'group'},
	];

	return (
		<div style={{minHeight: '100vh', background: '#fafafa'}}>
			{/* Header */}
			<header className="app-header">
				<div className="header-content">
					{/* Logo y título */}
					<div className="logo-section">
						<img
							src="/assets/logo.jpg"
							alt="Logo Escuela"
							className="logo-school"
							onError={(e) => {
								e.target.style.display = 'none';
							}}
						/>
						<div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
							<span className="logo-icon material-icons">school</span>
							<h1 className="app-title">Sistema de Estudiantes</h1>
						</div>
					</div>

					{/* Navigation */}
					<nav className="main-nav">
						{navItems.map((item) => (
							<Link
								key={item.path}
								to={item.path}
								className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
							>
								<span className="material-icons">{item.icon}</span>
								<span className="nav-label">{item.label}</span>
							</Link>
						))}
					</nav>

					{/* Estadísticas */}
					<div className="stats-section">
					<div className="stat-card">
						<span className="stat-number">{mainStat}</span>
						<span className="stat-label">Estudiantes</span>
					</div>
					</div>

					{/* Perfil de usuario */}
					<div className="user-profile-dropdown-container">
						{/* Botón Desktop (Avatar) */}
						<button
							onClick={() => setShowUserDropdown(!showUserDropdown)}
							className="user-profile-btn"
							title="Perfil de usuario"
						>
							<div className="user-avatar">{userInitial}</div>
						</button>

						{/* Botón Mobile (Menú Hamburguesa) */}
						<button
							onClick={() => setShowMobileDrawer(true)}
							className="mobile-menu-btn"
							title="Menú"
						>
							<span className="material-icons">menu</span>
						</button>

						{/* Dropdown Menu Desktop */}
						{showUserDropdown && (
							<div className="user-dropdown active">
								<div className="user-dropdown-header">
									<div className="user-dropdown-avatar">{userInitial}</div>
									<div className="user-dropdown-info">
										<div className="user-dropdown-name">
											Hola {(user?.full_name || 'Usuario')?.split(' ')[0] || 'Usuario'}
										</div>
										<div className="user-dropdown-email">{user?.email}</div>
									</div>
								</div>
								<div className="user-dropdown-divider"></div>
								<div className="user-dropdown-role">
									Rol:{' '}
									{user?.role
										? user.role.charAt(0).toUpperCase() + user.role.slice(1)
										: 'Usuario'}
								</div>
								<div className="user-dropdown-divider"></div>
								<button
									onClick={() => setShowLogoutConfirm(true)}
									className="user-dropdown-logout"
								>
									<span className="material-icons">logout</span>
									Cerrar sesión
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Mobile Drawer */}
			<div
				className={`mobile-drawer-overlay ${showMobileDrawer ? 'active' : ''}`}
				onClick={() => setShowMobileDrawer(false)}
			>
				<div
					className={`mobile-drawer ${showMobileDrawer ? 'active' : ''}`}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Drawer Header */}
					<div className="mobile-drawer-header">
						<h3 style={{margin: 0, fontSize: '18px', fontWeight: '600'}}>Menú</h3>
						<button
							onClick={() => setShowMobileDrawer(false)}
							className="mobile-drawer-close"
						>
							<span className="material-icons">close</span>
						</button>
					</div>

					{/* Drawer Content */}
					<div className="mobile-drawer-content">
						{/* User Info */}
						<div className="mobile-user-info">
							<div className="mobile-user-avatar">{userInitial}</div>
							<div className="mobile-user-details">
								<div className="mobile-user-name">{user?.full_name || 'Usuario'}</div>
								<div className="mobile-user-email">{user?.email}</div>
								<div className="mobile-user-role">
									<span className="material-icons" style={{fontSize: '14px'}}>
										badge
									</span>
									{user?.role
										? user.role.charAt(0).toUpperCase() + user.role.slice(1)
										: 'Usuario'}
								</div>
							</div>
						</div>

						<div className="mobile-menu-divider"></div>

						{/* Navigation Links */}
						<div className="mobile-nav-links">
							{navItems.map((item) => (
								<Link
									key={item.path}
									to={item.path}
									className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
									onClick={() => setShowMobileDrawer(false)}
								>
									<span className="material-icons">{item.icon}</span>
									<span>{item.label}</span>
								</Link>
							))}
						</div>

						<div className="mobile-menu-divider"></div>

					<div style={{fontSize: '13px', color: '#757575', textAlign: 'center'}}>
						Total de estudiantes: {mainStat}
					</div>
					</div>

					{/* Drawer Footer */}
					<div className="mobile-drawer-footer">
						<button
							onClick={() => {
								setShowMobileDrawer(false);
								setShowLogoutConfirm(true);
							}}
							className="mobile-logout-btn"
						>
							<span className="material-icons">logout</span>
							Cerrar sesión
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<main className="main-content">
				{(sexStats.length > 0 || gradeStats.length > 0) && (
					<section className="stats-strip">
						{sexStats.length > 0 && (
							<div className="stats-strip-group">
								<span className="stats-strip-title">Por sexo</span>
								<div className="stats-strip-items">
									{sexStats.map((item) => (
										<div key={item.label} className="stat-chip">
											<span className="chip-label">{item.label}</span>
											<span className="chip-value">{item.value}</span>
										</div>
									))}
								</div>
							</div>
						)}
						{gradeStats.length > 0 && (
							<div className="stats-strip-group">
								<span className="stats-strip-title">Por grado</span>
								<div className="stats-strip-items">
									{gradeStats.map((item) => (
										<div key={item.grado} className="stat-chip">
											<span className="chip-label">{item.grado}°</span>
											<span className="chip-value">{item.count}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</section>
				)}
				{/* Search and Filters */}
				<div className="search-container">
					<SearchAndFilters
						onSearch={handleSearch}
						grados={grados}
						secciones={secciones}
					/>
				</div>

				{/* Results Container */}
				<div className="results-container">
					{/* Results Header */}
					<div className="results-header">
						<h2>Resultados</h2>
						<span className="results-count">
							{students.length > 0
								? `${students.length} resultado${students.length !== 1 ? 's' : ''}`
								: '0 resultados'}
						</span>
					</div>

					{/* Students List */}
					{isLoading && students.length === 0 ? (
						<div className="loading-spinner show">
							<LoadingSpinner />
						</div>
					) : students.length > 0 ? (
						<>
							<div className="results-grid">
								{students.map((student) => (
									<StudentCard
										key={student.id}
										student={student}
										onClick={() => handleStudentClick(student)}
									/>
								))}
							</div>

							{/* Pagination */}
							<div style={{borderTop: '1px solid #e0e0e0'}}>
								<Pagination
									pagination={pagination}
									onPageChange={(page) => updatePagination({page})}
									onPageSizeChange={(limit) => updatePagination({page: 1, limit})}
								/>
							</div>
						</>
					) : (
						<div className="no-results">
							<span className="material-icons">search_off</span>
							<h3>No se encontraron resultados</h3>
							<p>Intenta ajustar los filtros o modificar la búsqueda</p>
						</div>
					)}
				</div>

				{/* Botón flotante para agregar estudiante */}
				<button
					onClick={() => setIsAddModalOpen(true)}
					className="fab-btn"
					title="Agregar nuevo estudiante"
				>
					<span className="material-icons">person_add</span>
				</button>
			</main>

			{/* Modals */}
			<StudentDetailModal
				student={selectedStudent}
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				onEdit={handleSaveStudent}
				onDelete={handleDeleteStudent}
				grados={grados}
				secciones={secciones}
			/>

			<AddStudentModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddStudent}
				grados={grados}
				secciones={secciones}
				isLoading={isSavingStudent}
			/>

			{/* Notification */}
			{notification && (
				<Notification
					message={notification.message}
					type={notification.type}
					onClose={clearNotification}
				/>
			)}

			{/* Logout Confirmation Modal */}
			{showLogoutConfirm && (
				<div className="modal-overlay show">
					<div
						className="modal"
						style={{maxWidth: '400px', borderRadius: '12px', overflow: 'hidden'}}
					>
						<div style={{padding: '48px 32px 40px', textAlign: 'center'}}>
							<p
								style={{
									fontSize: '19px',
									fontWeight: '500',
									color: '#212121',
									margin: '0',
									letterSpacing: '-0.4px',
									lineHeight: '1.4',
								}}
							>
								¿Cerrar sesión?
							</p>
						</div>
						<div
							style={{
								padding: '0 32px 40px',
								display: 'flex',
								gap: '20px',
								justifyContent: 'center',
								borderTop: 'none',
							}}
						>
							<button
								onClick={() => setShowLogoutConfirm(false)}
								style={{
									minWidth: '120px',
									padding: '14px 32px',
									border: 'none',
									background: '#f5f5f5',
									borderRadius: '8px',
									cursor: 'pointer',
									fontSize: '15px',
									fontWeight: '500',
									color: '#424242',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
									userSelect: 'none',
								}}
								onMouseEnter={(e) => (e.currentTarget.style.background = '#eeeeee')}
								onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f5')}
								disabled={isLoggingOut}
							>
								Cancelar
							</button>
							<button
								onClick={handleLogout}
								style={{
									minWidth: '120px',
									padding: '14px 32px',
									border: 'none',
									background: '#d32f2f',
									borderRadius: '8px',
									cursor: isLoggingOut ? 'not-allowed' : 'pointer',
									fontSize: '15px',
									fontWeight: '600',
									color: 'white',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
									opacity: isLoggingOut ? 0.7 : 1,
									letterSpacing: '0.3px',
									userSelect: 'none',
								}}
								onMouseEnter={(e) => {
									if (!isLoggingOut) {
										e.currentTarget.style.background = '#b71c1c';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(211, 47, 47, 0.25)';
										e.currentTarget.style.transform = 'translateY(-1px)';
									}
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#d32f2f';
									e.currentTarget.style.boxShadow = 'none';
									e.currentTarget.style.transform = 'translateY(0)';
								}}
								disabled={isLoggingOut}
							>
								{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
