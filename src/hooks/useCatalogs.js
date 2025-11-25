import {useState, useEffect, useCallback} from 'react';
import * as api from '../services/api';
import {useCache} from './useCache';

export function useCatalogs() {
	const [catalogs, setCatalogs] = useState({
		cargos: [],
		especialidades: [],
		nivelesEducativos: [],
		escalasMagisteriales: [],
		condiciones: [],
		sistemasPensiones: [],
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const cache = useCache(30 * 60 * 1000); // 30 minutos de caché

	const fetchCatalogs = useCallback(async (force = false) => {
		setLoading(true);
		setError(null);

		try {
			// Intentar obtener del caché primero
			const cachedData = cache.get('catalogs');
			if (cachedData && !force) {
				setCatalogs(cachedData);
				setLoading(false);
				return;
			}

			const [
				cargos,
				especialidades,
				nivelesEducativos,
				escalasMagisteriales,
				condiciones,
				sistemasPensiones,
			] = await Promise.all([
				api.getCargos(),
				api.getEspecialidades(),
				api.getNivelesEducativos(),
				api.getEscalasMagisteriales(),
				api.getCondiciones(),
				api.getSistemasPensiones(),
			]);

			const data = {
				cargos: Array.isArray(cargos) ? cargos : [],
				especialidades: Array.isArray(especialidades) ? especialidades : [],
				nivelesEducativos: Array.isArray(nivelesEducativos) ? nivelesEducativos : [],
				escalasMagisteriales: Array.isArray(escalasMagisteriales)
					? escalasMagisteriales
					: [],
				condiciones: Array.isArray(condiciones) ? condiciones : [],
				sistemasPensiones: Array.isArray(sistemasPensiones)
					? sistemasPensiones
					: [],
			};

			setCatalogs(data);
			cache.set('catalogs', data);
		} catch (err) {
			console.error('Error al cargar catálogos:', err);
			setError(err.message || 'Error al cargar opciones');
		} finally {
			setLoading(false);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Cargar automáticamente al montar
	useEffect(() => {
		fetchCatalogs();
	}, [fetchCatalogs]);

	return {catalogs, loading, error, refresh: () => fetchCatalogs(true)};
}
