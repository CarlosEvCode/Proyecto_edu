import React from 'react';
import {Link} from 'react-router-dom';

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
					<div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
						<span className="logo-icon material-icons">{icon}</span>
						<h1 className="app-title">{title}</h1>
					</div>
				</div>

				<nav className="main-nav">
					{NAV_ITEMS.map((item) => (
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
					<h3 style={{margin: 0, fontSize: '18px', fontWeight: '600'}}>Menú</h3>
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

					<div className="mobile-nav-links">
						{NAV_ITEMS.map((item) => (
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

					<div style={{fontSize: '13px', color: '#757575', textAlign: 'center'}}>
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
						onClick={onCancel}
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
						onMouseEnter={(event) => {
							event.currentTarget.style.background = '#eeeeee';
						}}
						onMouseLeave={(event) => {
							event.currentTarget.style.background = '#f5f5f5';
						}}
						disabled={isLoggingOut}
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
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
						onMouseEnter={(event) => {
							if (!isLoggingOut) {
								event.currentTarget.style.background = '#b71c1c';
								event.currentTarget.style.boxShadow =
									'0 6px 16px rgba(211, 47, 47, 0.25)';
								event.currentTarget.style.transform = 'translateY(-1px)';
							}
						}}
						onMouseLeave={(event) => {
							event.currentTarget.style.background = '#d32f2f';
							event.currentTarget.style.boxShadow = 'none';
							event.currentTarget.style.transform = 'translateY(0)';
						}}
						disabled={isLoggingOut}
					>
						{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
					</button>
				</div>
			</div>
		</div>
	);
}
