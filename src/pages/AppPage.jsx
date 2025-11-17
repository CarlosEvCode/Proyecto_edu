import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {usePersonalContext} from '../context/PersonalContext';
import {useCache, useRequestController} from '../hooks/useCache';
import {PersonalCard} from '../components/PersonalCard';
import {SearchAndFiltersPersonal} from '../components/SearchAndFiltersPersonal';
import {Pagination} from '../components/Pagination';
import {PersonalDetailModal} from '../components/PersonalDetailModal';
import {AddPersonalModal} from '../components/AddPersonalModal';
import {Notification, LoadingSpinner} from '../components/Common';
import * as api from '../services/api';
import {supabase} from '../lib/supabase';

export function AppPage() {
	const navigate = useNavigate();
	const {user, logout} = useAuth();
	const {
		personal,
		setPersonal,
		cargos,
		setCargos,
		especialidades,
		setEspecialidades,
		nivelEducativo,
		setNivelEducativo,
		escalasMagisteriales,
		setEscalasMagisteriales,
		condiciones,
		setCondiciones,
		sistemasPensiones,
		setSistemasPensiones,
		pagination,
		updatePagination,
		filters,
		setIsLoading,
		isLoading,
	} = usePersonalContext();

	const cache = useCache();
	const requestController = useRequestController();

	const [selectedPersonal, setSelectedPersonal] = useState(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [notification, setNotification] = useState(null);
	const [isSavingPersonal, setIsSavingPersonal] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [showMobileDrawer, setShowMobileDrawer] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

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

	// Cargar opciones de filtro una sola vez
	useEffect(() => {
		loadFilterOptions();
	}, []);

	// Cargar personal cuando cambian los filtros o paginación
	useEffect(() => {
		loadPersonal(pagination.page, pagination.limit);
	}, [filters, pagination.page, pagination.limit]);

	const loadFilterOptions = async () => {
		const token = requestController.startRequest(
			requestController.tokens.filterOptions
		);

		try {
			const [
				cargosData,
				especialidadesData,
				nivelesData,
				escalasData,
				condicionesData,
				sistemasData,
			] = await Promise.all([
				api.getCargos(),
				api.getEspecialidades(),
				api.getNivelesEducativos(),
				api.getEscalasMagisteriales(),
				api.getCondiciones(),
				api.getSistemasPensiones(),
			]);

			if (!requestController.isActive(token)) return;

			setCargos(Array.isArray(cargosData) ? cargosData : []);
			setEspecialidades(Array.isArray(especialidadesData) ? especialidadesData : []);
			setNivelEducativo(Array.isArray(nivelesData) ? nivelesData : []);
			setEscalasMagisteriales(Array.isArray(escalasData) ? escalasData : []);
			setCondiciones(Array.isArray(condicionesData) ? condicionesData : []);
			setSistemasPensiones(Array.isArray(sistemasData) ? sistemasData : []);
		} catch (error) {
			if (requestController.isActive(token)) {
				showNotification('Error al cargar opciones de filtro', 'error');
			}
		}
	};

	const loadPersonal = async (page = 1, limit = 24) => {
		const token = requestController.startRequest(
			requestController.tokens.personalList
		);

		try {
			setIsLoading(true);

			const hasFilters =
				filters.search || filters.cargo || filters.especialidad || filters.nivel;

			let data;
			if (hasFilters) {
				data = await api.searchPersonal(filters, page, limit);
			} else {
				data = await api.getPersonal(page, limit);
			}

			if (!requestController.isActive(token)) return;

			setPersonal(data.personal || []);
			updatePagination(data.pagination);
		} catch (error) {
			if (requestController.isActive(token)) {
				showNotification('Error al cargar personal: ' + error.message, 'error');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = useCallback(
		(newFilters) => {
			updatePagination({page: 1});
		},
		[updatePagination]
	);

	const handlePersonalClick = (personalItem) => {
		setSelectedPersonal(personalItem);
		setIsDetailModalOpen(true);
	};

	const handleSavePersonal = async (updatedPersonal) => {
		try {
			setIsSavingPersonal(true);

			const personalData = {
				nombres: updatedPersonal.nombres,
				apellidos: updatedPersonal.apellidos,
				dni: updatedPersonal.dni,
				fecha_nacimiento: updatedPersonal.fecha_nacimiento || null,
				numero_celular: updatedPersonal.numero_celular || null,
				codigo_modular: updatedPersonal.codigo_modular,
				fecha_inicio_ejercicio_general:
					updatedPersonal.fecha_inicio_ejercicio_general || null,
			};

			await api.updatePersonal(updatedPersonal.dni, personalData);

			// Actualizar campos de plaza si existen
			if (updatedPersonal.plaza) {
				const plazaData = {};
				if (updatedPersonal.plaza.resolucion_nombramiento !== undefined) {
					plazaData.resolucion_nombramiento =
						updatedPersonal.plaza.resolucion_nombramiento || null;
				}
				if (updatedPersonal.plaza.fecha_nombramiento_carrera !== undefined) {
					plazaData.fecha_nombramiento_carrera =
						updatedPersonal.plaza.fecha_nombramiento_carrera || null;
				}
				if (updatedPersonal.plaza.fecha_ingreso_institucion !== undefined) {
					plazaData.fecha_ingreso_institucion =
						updatedPersonal.plaza.fecha_ingreso_institucion || null;
				}
				if (updatedPersonal.plaza.cargo?.id !== undefined) {
					plazaData.cargo_id = updatedPersonal.plaza.cargo.id || null;
				}
				if (updatedPersonal.plaza.especialidad?.id !== undefined) {
					plazaData.especialidad_id = updatedPersonal.plaza.especialidad.id || null;
				}
				if (updatedPersonal.plaza.nivel_educativo?.id !== undefined) {
					plazaData.nivel_educativo_id = updatedPersonal.plaza.nivel_educativo.id || null;
				}

				// Solo actualizar si hay campos para actualizar
				if (Object.keys(plazaData).length > 0) {
					await api.updatePlaza(updatedPersonal.plaza.codigo_plaza, plazaData);
				}
			}

			cache.invalidate('personal');
			await loadPersonal(pagination.page, pagination.limit);
			setIsDetailModalOpen(false);
			showNotification('Personal actualizado exitosamente', 'success');
		} catch (error) {
			showNotification('Error al guardar cambios: ' + error.message, 'error');
		} finally {
			setIsSavingPersonal(false);
		}
	};

	const handleDeletePersonal = async (dni) => {
		try {
			setIsSavingPersonal(true);
			await api.deletePersonal(dni);
			cache.invalidate('personal');
			await loadPersonal(pagination.page, pagination.limit);
			setIsDetailModalOpen(false);
			showNotification('Personal eliminado exitosamente', 'success');
		} catch (error) {
			showNotification('Error al eliminar personal: ' + error.message, 'error');
		} finally {
			setIsSavingPersonal(false);
		}
	};

	const handleAddPersonal = async (formData) => {
		try {
			setIsSavingPersonal(true);

			// Primero crear el personal
			const personalData = {
				nombres: formData.nombres,
				apellidos: formData.apellidos,
				dni: formData.dni,
				fecha_nacimiento: formData.fecha_nacimiento || null,
				numero_celular: formData.numero_celular || null,
				codigo_modular: formData.codigo_modular,
				sistema_pensiones_id: formData.sistema_pensiones_id
					? parseInt(formData.sistema_pensiones_id, 10)
					: null,
				fecha_inicio_ejercicio_general: formData.fecha_inicio_ejercicio_general || null,
			};

			const personalResult = await api.createPersonal(personalData);
			const dniDocente = personalResult.dni || formData.dni; // Usar el DNI que se envió

			// Luego crear la plaza si se proporciona información
			if (formData.plaza_codigo || formData.cargo_id) {
				const plazaData = {
					dni_personal_asignado: dniDocente,
					codigo_plaza: formData.plaza_codigo || `PLAZA-${Date.now()}`,
					cargo_id: formData.cargo_id ? parseInt(formData.cargo_id, 10) : null,
					especialidad_id: formData.especialidad_id
						? parseInt(formData.especialidad_id, 10)
						: null,
					nivel_educativo_id: formData.nivel_educativo_id
						? parseInt(formData.nivel_educativo_id, 10)
						: null,
					escala_magisterial_id: formData.escala_magisterial_id
						? parseInt(formData.escala_magisterial_id, 10)
						: null,
					condicion_id: formData.condicion_id
						? parseInt(formData.condicion_id, 10)
						: null,
					resolucion_nombramiento: formData.resolucion_nombramiento || null,
					fecha_nombramiento_carrera: formData.fecha_nombramiento_carrera || null,
					fecha_ingreso_institucion: formData.fecha_ingreso_institucion || null,
					jornada_laboral: formData.jornada_laboral
						? parseInt(formData.jornada_laboral, 10)
						: null,
					remuneracion_bruta: formData.remuneracion_bruta
						? parseFloat(formData.remuneracion_bruta)
						: null,
				};

				await api.createPlaza(plazaData);
			}

			cache.invalidate('personal');
			await loadPersonal(1, pagination.limit);
			setIsAddModalOpen(false);
			showNotification('Personal creado exitosamente', 'success');
		} catch (error) {
			showNotification('Error al crear personal: ' + error.message, 'error');
		} finally {
			setIsSavingPersonal(false);
		}
	};

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			const result = await logout();

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

	const showNotification = (message, type = 'error') => {
		setNotification({message, type});
		setTimeout(() => setNotification(null), 5000);
	};

	const getInitial = (name) => {
		return (name || 'U').charAt(0).toUpperCase();
	};

	const userInitial = getInitial(user?.full_name || user?.email);

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
							<span className="logo-icon material-icons">group</span>
							<h1 className="app-title">Sistema de Personal Docente</h1>
						</div>
					</div>

					{/* Estadísticas */}
					<div className="stats-section">
						<div className="stat-card">
							<span className="stat-number">{pagination.total || 0}</span>
							<span className="stat-label">Personal</span>
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

						<div style={{fontSize: '13px', color: '#757575', textAlign: 'center'}}>
							Total de personal: {pagination.total || 0}
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
				{/* Search and Filters */}
				<div className="search-container">
					<SearchAndFiltersPersonal
						onSearch={handleSearch}
						cargos={cargos}
						especialidades={especialidades}
						niveles={nivelEducativo}
					/>
				</div>{' '}
				{/* Results Container */}
				<div className="results-container">
					{/* Results Header */}
					<div className="results-header">
						<h2>Resultados</h2>
						<span className="results-count">
							{personal.length > 0
								? `${personal.length} resultado${personal.length !== 1 ? 's' : ''}`
								: '0 resultados'}
						</span>
					</div>

					{/* Personal List */}
					{isLoading && personal.length === 0 ? (
						<div className="loading-spinner show">
							<LoadingSpinner />
						</div>
					) : personal.length > 0 ? (
						<>
							<div className="results-grid">
								{personal.map((personalItem) => (
									<PersonalCard
										key={personalItem.dni}
										personal={personalItem}
										onClick={() => handlePersonalClick(personalItem)}
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
				{/* Botón flotante para agregar personal */}
				<button
					onClick={() => setIsAddModalOpen(true)}
					className="fab-btn"
					title="Agregar nuevo personal"
				>
					<span className="material-icons">person_add</span>
				</button>
			</main>
			{/* Modals */}
			<PersonalDetailModal
				personal={selectedPersonal}
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				onEdit={handleSavePersonal}
				onDelete={handleDeletePersonal}
				cargos={cargos}
				especialidades={especialidades}
				niveles={nivelEducativo}
				escalas={escalasMagisteriales}
				condiciones={condiciones}
			/>
			<AddPersonalModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddPersonal}
				cargos={cargos}
				especialidades={especialidades}
				niveles={nivelEducativo}
				escalas={escalasMagisteriales}
				condiciones={condiciones}
				sistemas={sistemasPensiones}
				isLoading={isSavingPersonal}
			/>
			{/* Notification */}
			{notification && (
				<Notification
					message={notification.message}
					type={notification.type}
					onClose={() => setNotification(null)}
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
