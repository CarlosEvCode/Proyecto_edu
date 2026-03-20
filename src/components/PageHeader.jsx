import React from 'react';
import {Link} from 'react-router-dom';
import {hasRouteAccess, normalizeRole} from '../utils/permissions';

const NAV_ITEMS = [
	{path: '/estudiantes', label: 'Estudiantes', icon: 'school'},
	{path: '/personal', label: 'Personal Docente', icon: 'group'},
];

export function PageHeader({
	title,
	icon,
	logoAlt,
	locationPath,
	statsLabel,
	statsValue,
	user,
	userInitial,
	showUserDropdown,
	onToggleUserDropdown,
	onOpenMobileDrawer,
	onRequestLogout,
}) {
	const userRole = normalizeRole(user?.role);
	const visibleNavItems = NAV_ITEMS.filter((item) => {
		if (item.path === '/personal') return hasRouteAccess(userRole, 'personal');
		if (item.path === '/estudiantes') return hasRouteAccess(userRole, 'estudiantes');
		return false;
	});

	return (
		<header className="app-header">
			<div className="header-content">
				<div className="logo-section">
					<img
						src="/assets/logo.jpg"
						alt={logoAlt}
						className="logo-school"
						onError={(event) => {
							event.target.style.display = 'none';
						}}
					/>
					<div className="header-title-group">
						<span className="logo-icon material-icons">{icon}</span>
						<h1 className="app-title">{title}</h1>
					</div>
				</div>

				<nav className="main-nav">
					{visibleNavItems.map((item) => (
						<Link
							key={item.path}
							to={item.path}
							className={`nav-link ${locationPath === item.path ? 'active' : ''}`}
						>
							<span className="material-icons">{item.icon}</span>
							<span className="nav-label">{item.label}</span>
						</Link>
					))}
				</nav>

				<div className="stats-section">
					<div className="stat-card">
						<span className="stat-number">{statsValue}</span>
						<span className="stat-label">{statsLabel}</span>
					</div>
				</div>

				<div className="user-profile-dropdown-container">
					<button
						onClick={onToggleUserDropdown}
						className="user-profile-btn"
						title="Perfil de usuario"
					>
						<div className="user-avatar">{userInitial}</div>
					</button>

					<button
						onClick={onOpenMobileDrawer}
						className="mobile-menu-btn"
						title="Menú"
					>
						<span className="material-icons">menu</span>
					</button>

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
							<button onClick={onRequestLogout} className="user-dropdown-logout">
								<span className="material-icons">logout</span>
								Cerrar sesión
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

export function MobileDrawer({
	showMobileDrawer,
	onClose,
	user,
	userInitial,
	locationPath,
	totalLabel,
	totalValue,
	onRequestLogout,
}) {
	const userRole = normalizeRole(user?.role);
	const visibleNavItems = NAV_ITEMS.filter((item) => {
		if (item.path === '/personal') return hasRouteAccess(userRole, 'personal');
		if (item.path === '/estudiantes') return hasRouteAccess(userRole, 'estudiantes');
		return false;
	});

	return (
		<div
			className={`mobile-drawer-overlay ${showMobileDrawer ? 'active' : ''}`}
			onClick={onClose}
		>
			<div
				className={`mobile-drawer ${showMobileDrawer ? 'active' : ''}`}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="mobile-drawer-header">
					<h3 className="mobile-drawer-title">Menú</h3>
					<button onClick={onClose} className="mobile-drawer-close">
						<span className="material-icons">close</span>
					</button>
				</div>

				<div className="mobile-drawer-content">
					<div className="mobile-user-info">
						<div className="mobile-user-avatar">{userInitial}</div>
						<div className="mobile-user-details">
							<div className="mobile-user-name">{user?.full_name || 'Usuario'}</div>
							<div className="mobile-user-email">{user?.email}</div>
							<div className="mobile-user-role">
								<span className="material-icons mobile-user-role-icon">
									badge
								</span>
								{user?.role
									? user.role.charAt(0).toUpperCase() + user.role.slice(1)
									: 'Usuario'}
							</div>
						</div>
					</div>

					<div className="mobile-menu-divider"></div>

					<div className="mobile-nav-links">
						{visibleNavItems.map((item) => (
							<Link
								key={item.path}
								to={item.path}
								className={`mobile-nav-link ${locationPath === item.path ? 'active' : ''}`}
								onClick={onClose}
							>
								<span className="material-icons">{item.icon}</span>
								<span>{item.label}</span>
							</Link>
						))}
					</div>

					<div className="mobile-menu-divider"></div>

					<div className="mobile-total-text">
						{totalLabel}: {totalValue}
					</div>
				</div>

				<div className="mobile-drawer-footer">
					<button onClick={onRequestLogout} className="mobile-logout-btn">
						<span className="material-icons">logout</span>
						Cerrar sesión
					</button>
				</div>
			</div>
		</div>
	);
}

export function LogoutConfirmModal({show, isLoggingOut, onCancel, onConfirm}) {
	if (!show) return null;

	return (
		<div className="modal-overlay show">
			<div className="modal logout-modal">
				<div className="logout-modal-body">
					<p className="logout-modal-question">¿Cerrar sesión?</p>
				</div>
				<div className="logout-modal-actions">
					<button
						onClick={onCancel}
						className="logout-cancel-btn"
						disabled={isLoggingOut}
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
						className="logout-confirm-btn"
						aria-busy={isLoggingOut}
						disabled={isLoggingOut}
					>
						{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
					</button>
				</div>
			</div>
		</div>
	);
}
