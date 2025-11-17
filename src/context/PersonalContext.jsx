import React, {createContext, useState, useCallback} from 'react';

export const PersonalContext = createContext();

export function PersonalProvider({children}) {
	const [personal, setPersonal] = useState([]);
	const [cargos, setCargos] = useState([]);
	const [especialidades, setEspecialidades] = useState([]);
	const [nivelEducativo, setNivelEducativo] = useState([]);
	const [escalasMagisteriales, setEscalasMagisteriales] = useState([]);
	const [condiciones, setCondiciones] = useState([]);

	const [pagination, setPagination] = useState({
		page: 1,
		limit: 24,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false,
	});

	const [filters, setFilters] = useState({
		search: '',
		cargo: '',
		especialidad: '',
		nivel: '',
		searchType: 'general',
	});

	const [isLoading, setIsLoading] = useState(false);

	const updatePagination = useCallback((newPagination) => {
		setPagination((prev) => ({
			...prev,
			...newPagination,
		}));
	}, []);

	const updateFilters = useCallback((newFilters) => {
		setFilters((prev) => ({
			...prev,
			...newFilters,
		}));
	}, []);

	const resetFilters = useCallback(() => {
		setFilters({
			search: '',
			cargo: '',
			especialidad: '',
			nivel: '',
			searchType: 'general',
		});
	}, []);

	const value = {
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
		pagination,
		updatePagination,
		filters,
		updateFilters,
		resetFilters,
		isLoading,
		setIsLoading,
	};

	return (
		<PersonalContext.Provider value={value}>{children}</PersonalContext.Provider>
	);
}

/**
 * Hook para usar el PersonalContext
 */
export function usePersonalContext() {
	const context = React.useContext(PersonalContext);
	if (!context) {
		throw new Error('usePersonalContext debe ser usado dentro de PersonalProvider');
	}
	return context;
}
