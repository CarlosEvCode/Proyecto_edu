import {useState, useCallback} from 'react';
import * as api from '../services/api';
import {useRequestController} from './useCache';

export function usePersonal() {
	const [personal, setPersonal] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
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
	});

	const requestController = useRequestController();

	const fetchPersonal = useCallback(
		async (page = 1, currentFilters = filters) => {
			const token = requestController.startRequest(requestController.tokens.personalList);

			try {
				setLoading(true);
				setError(null);
				console.log('usePersonal: fetching data for page', page, 'filters:', currentFilters);

				const hasFilters =
					currentFilters.search ||
					currentFilters.cargo ||
					currentFilters.especialidad ||
					currentFilters.nivel;

				let data;
				if (hasFilters) {
					console.log('usePersonal: calling searchPersonal');
					data = await api.searchPersonal(currentFilters, page, pagination.limit);
				} else {
					console.log('usePersonal: calling getPersonal');
					data = await api.getPersonal(page, pagination.limit);
				}

				if (!requestController.isActive(token)) {
					console.log('usePersonal: request cancelled');
					return;
				}

				console.log('usePersonal: data received', data);
				setPersonal(data.personal || []);
				setPagination((prev) => ({...prev, ...data.pagination}));
			} catch (err) {
				if (requestController.isActive(token)) {
					console.error('usePersonal: error fetching data', err);
					setError(err.message);
					setPersonal([]);
				}
			} finally {
				if (requestController.isActive(token)) {
					setLoading(false);
				}
			}
		},
		[filters, pagination.limit] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const updateFilters = useCallback((newFilters) => {
		setFilters((prev) => ({...prev, ...newFilters}));
	}, []);

	const updatePagination = useCallback((newPagination) => {
		setPagination((prev) => ({...prev, ...newPagination}));
	}, []);

	const resetFilters = useCallback(() => {
		setFilters({
			search: '',
			cargo: '',
			especialidad: '',
			nivel: '',
		});
	}, []);

	// CRUD Operations wrappers
	const addPersonal = async (personalData, plazaData) => {
		setLoading(true);
		try {
			// 1. Crear Personal
			const result = await api.createPersonal(personalData);

			// 2. Crear Plaza si existen datos
			if (plazaData && Object.keys(plazaData).length > 0) {
				// Asignar DNI al objeto de plaza
				const plazaToCreate = {
					...plazaData,
					dni_personal_asignado: result.dni,
				};
				await api.createPlaza(plazaToCreate);
			}

			// 3. Recargar lista
			await fetchPersonal(pagination.page, filters);
			return result;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const editPersonal = async (dni, personalData, plazaData) => {
		setLoading(true);
		try {
			// 1. Actualizar Personal
			await api.updatePersonal(dni, personalData);

			// 2. Actualizar Plaza si existen datos y código de plaza
			if (plazaData && plazaData.codigo_plaza) {
				await api.updatePlaza(plazaData.codigo_plaza, plazaData);
			}

			// 3. Recargar lista
			await fetchPersonal(pagination.page, filters);
			return {message: 'Personal actualizado exitosamente'};
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const removePersonal = async (dni) => {
		setLoading(true);
		try {
			const result = await api.deletePersonal(dni);
			await fetchPersonal(pagination.page, filters);
			return result;
		} catch (err) {
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		personal,
		loading,
		error,
		pagination,
		filters,
		fetchPersonal,
		updateFilters,
		updatePagination,
		resetFilters,
		addPersonal,
		editPersonal,
		removePersonal,
	};
}
