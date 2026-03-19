import React, {useState, useCallback} from 'react';
import {PersonalContext} from './personal-context';

export function PersonalProvider({children}) {
	const [personal, setPersonal] = useState([]);
	const [cargos, setCargos] = useState([]);
	const [especialidades, setEspecialidades] = useState([]);
	const [nivelEducativo, setNivelEducativo] = useState([]);
	const [escalasMagisteriales, setEscalasMagisteriales] = useState([]);
	const [condiciones, setCondiciones] = useState([]);
	const [sistemasPensiones, setSistemasPensiones] = useState([]);

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
		sistemasPensiones,
		setSistemasPensiones,
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
