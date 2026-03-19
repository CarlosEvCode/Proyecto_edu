import React from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {StudentCard} from '../components/StudentCard';
import {SearchAndFilters} from '../components/SearchAndFilters';
import {Pagination} from '../components/Pagination';
import {StudentDetailModal} from '../components/StudentDetailModal';
import {AddStudentModal} from '../components/AddStudentModal';
import {PageHeader, MobileDrawer, LogoutConfirmModal} from '../components/PageHeader';
import {Notification, LoadingSpinner} from '../components/Common';
import {useNotification} from '../hooks/useNotification';
import {usePageShell} from '../hooks/usePageShell';
import {useStudentsPage} from '../hooks/useStudentsPage';
import {useSessionGuard} from '../hooks/useSessionGuard';

export function EstudiantesPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const {user, logout} = useAuth();
	const {notification, notifySuccess, notifyError, clearNotification} =
		useNotification();
	const {
		students,
		grados,
		secciones,
		pagination,
		updatePagination,
		isLoading,
		selectedStudent,
		isDetailModalOpen,
		setIsDetailModalOpen,
		isAddModalOpen,
		setIsAddModalOpen,
		isSavingStudent,
		stats,
		handleSearch,
		handleStudentClick,
		handleSaveStudent,
		handleDeleteStudent,
		handleAddStudent,
	} = useStudentsPage({notifySuccess, notifyError});
	const pageShell = usePageShell({user, logout, navigate});

	useSessionGuard({logout, navigate});

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

	return (
		<div style={{minHeight: '100vh', background: '#fafafa'}}>
			<PageHeader
				title="Sistema de Estudiantes"
				icon="school"
				logoAlt="Logo Escuela"
				locationPath={location.pathname}
				statsLabel="Estudiantes"
				statsValue={mainStat}
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
				totalLabel="Total de estudiantes"
				totalValue={mainStat}
				onRequestLogout={pageShell.openLogoutConfirmFromMobile}
			/>

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

			<LogoutConfirmModal
				show={pageShell.showLogoutConfirm}
				isLoggingOut={pageShell.isLoggingOut}
				onCancel={() => pageShell.setShowLogoutConfirm(false)}
				onConfirm={pageShell.handleLogout}
			/>
		</div>
	);
}
