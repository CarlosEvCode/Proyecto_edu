import React from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {PersonalCard} from '../components/PersonalCard';
import {SearchAndFiltersPersonal} from '../components/SearchAndFiltersPersonal';
import {Pagination} from '../components/Pagination';
import {PersonalDetailModal} from '../components/PersonalDetailModal';
import {AddPersonalModal} from '../components/AddPersonalModal';
import {PageHeader, MobileDrawer, LogoutConfirmModal} from '../components/PageHeader';
import {Notification, LoadingSpinner} from '../components/Common';
import {useNotification} from '../hooks/useNotification';
import {usePageShell} from '../hooks/usePageShell';
import {usePersonalPage} from '../hooks/usePersonalPage';
import {useSessionGuard} from '../hooks/useSessionGuard';
import {normalizeRole} from '../utils/permissions';

export function PersonalPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const {user, logout} = useAuth();
	const {notification, notifySuccess, notifyError, clearNotification} =
		useNotification();
	const {
		personal,
		cargos,
		especialidades,
		nivelEducativo,
		escalasMagisteriales,
		condiciones,
		sistemasPensiones,
		pagination,
		updatePagination,
		isLoading,
		selectedPersonal,
		isDetailModalOpen,
		setIsDetailModalOpen,
		isAddModalOpen,
		setIsAddModalOpen,
		isSavingPersonal,
		handleSearch,
		handlePersonalClick,
		handleSavePersonal,
		handleDeletePersonal,
		handleAddPersonal,
	} = usePersonalPage({notifySuccess, notifyError});
	const pageShell = usePageShell({user, logout, navigate});

	useSessionGuard({logout, navigate});

	const userRole = normalizeRole(user?.role);
	const canEdit = ['admin', 'direccion', 'secretaria'].includes(userRole);

	return (
		<div style={{minHeight: '100vh', background: '#fafafa'}}>
			<PageHeader
				title="Sistema de Personal Docente"
				icon="group"
				logoAlt="Logo Escuela"
				locationPath={location.pathname}
				statsLabel="Personal"
				statsValue={pagination.total || 0}
				user={user}
				userInitial={pageShell.userInitial}
				showUserDropdown={pageShell.showUserDropdown}
				onToggleUserDropdown={() =>
					pageShell.setShowUserDropdown(!pageShell.showUserDropdown)
				}
				onOpenMobileDrawer={() => pageShell.setShowMobileDrawer(true)}
				onRequestLogout={pageShell.openLogoutConfirm}
			/>

			<MobileDrawer
				showMobileDrawer={pageShell.showMobileDrawer}
				onClose={() => pageShell.setShowMobileDrawer(false)}
				user={user}
				userInitial={pageShell.userInitial}
				locationPath={location.pathname}
				totalLabel="Total de personal"
				totalValue={pagination.total || 0}
				onRequestLogout={pageShell.openLogoutConfirmFromMobile}
			/>
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
				{canEdit && (
					<button
						onClick={() => setIsAddModalOpen(true)}
						className="fab-btn"
						title="Agregar nuevo personal"
					>
						<span className="material-icons">person_add</span>
					</button>
				)}
			</main>
			{/* Modals */}
			<PersonalDetailModal
				personal={selectedPersonal}
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				onEdit={canEdit ? handleSavePersonal : null}
				onDelete={canEdit ? handleDeletePersonal : null}
				cargos={cargos}
				especialidades={especialidades}
				niveles={nivelEducativo}
				escalas={escalasMagisteriales}
				condiciones={condiciones}
			/>
			<AddPersonalModal
				isOpen={canEdit && isAddModalOpen}
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
					onClose={clearNotification}
				/>
			)}
			<LogoutConfirmModal
				show={pageShell.showLogoutConfirm}
				isLoggingOut={pageShell.isLoggingOut}
				onCancel={() => pageShell.setShowLogoutConfirm(false)}
				onConfirm={pageShell.handleLogout}
			/>
		</div>
	);
}

// Alias for backwards compatibility
export const AppPage = PersonalPage;
