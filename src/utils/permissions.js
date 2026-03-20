const VALID_ROLES = ['admin', 'direccion', 'secretaria', 'docente', 'consulta'];

export const ROUTE_ACCESS = {
	estudiantes: ['admin', 'direccion', 'secretaria', 'docente', 'consulta'],
	personal: ['admin', 'direccion', 'secretaria'],
};

export function normalizeRole(role) {
	if (!role) return 'docente';
	const normalized = String(role).toLowerCase().trim();

	if (normalized === 'profesor' || normalized === 'teacher') {
		return 'docente';
	}

	return VALID_ROLES.includes(normalized) ? normalized : 'consulta';
}

export function hasRouteAccess(role, routeKey) {
	const normalizedRole = normalizeRole(role);
	const allowedRoles = ROUTE_ACCESS[routeKey] || [];
	return allowedRoles.includes(normalizedRole);
}

export function getDefaultRoute(role) {
	if (hasRouteAccess(role, 'estudiantes')) return '/estudiantes';
	if (hasRouteAccess(role, 'personal')) return '/personal';
	return '/login';
}
