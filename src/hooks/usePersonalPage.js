import {useCallback, useEffect, useState} from 'react';
import {usePersonalContext} from './usePersonalContext';
import {useCache, useRequestController} from './useCache';
import * as api from '../services/api';

export function usePersonalPage({notifySuccess, notifyError}) {
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
	const [isSavingPersonal, setIsSavingPersonal] = useState(false);

	const loadFilterOptions = useCallback(async () => {
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
		} catch {
			if (requestController.isActive(token)) {
				notifyError(null, 'Error al cargar opciones de filtro');
			}
		}
	}, [
		requestController,
		setCargos,
		setEspecialidades,
		setNivelEducativo,
		setEscalasMagisteriales,
		setCondiciones,
		setSistemasPensiones,
		notifyError,
	]);

	const loadPersonal = useCallback(async (page = 1, limit = 24) => {
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
				notifyError(error, 'Error al cargar personal');
			}
		} finally {
			setIsLoading(false);
		}
	}, [
		requestController,
		setIsLoading,
		filters,
		setPersonal,
		updatePagination,
		notifyError,
	]);

	useEffect(() => {
		loadFilterOptions();
	}, [loadFilterOptions]);

	useEffect(() => {
		loadPersonal(pagination.page, pagination.limit);
	}, [loadPersonal, pagination.page, pagination.limit]);

	const handleSearch = useCallback(() => {
		updatePagination({page: 1});
	}, [updatePagination]);

	const handlePersonalClick = useCallback((personalItem) => {
		setSelectedPersonal(personalItem);
		setIsDetailModalOpen(true);
	}, []);

	const handleSavePersonal = useCallback(
		async (updatedPersonal) => {
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
						plazaData.nivel_educativo_id =
							updatedPersonal.plaza.nivel_educativo.id || null;
					}

					if (Object.keys(plazaData).length > 0) {
						await api.updatePlaza(updatedPersonal.plaza.codigo_plaza, plazaData);
					}
				}

				cache.invalidate('personal');
				await loadPersonal(pagination.page, pagination.limit);
				setIsDetailModalOpen(false);
				notifySuccess('Personal actualizado exitosamente');
			} catch (error) {
				notifyError(error, 'Error al guardar cambios');
			} finally {
				setIsSavingPersonal(false);
			}
		},
		[cache, loadPersonal, notifyError, notifySuccess, pagination.page, pagination.limit]
	);

	const handleDeletePersonal = useCallback(
		async (dni) => {
			try {
				setIsSavingPersonal(true);
				await api.deletePersonal(dni);
				cache.invalidate('personal');
				await loadPersonal(pagination.page, pagination.limit);
				setIsDetailModalOpen(false);
				notifySuccess('Personal eliminado exitosamente');
			} catch (error) {
				notifyError(error, 'Error al eliminar personal');
			} finally {
				setIsSavingPersonal(false);
			}
		},
		[cache, loadPersonal, notifyError, notifySuccess, pagination.page, pagination.limit]
	);

	const handleAddPersonal = useCallback(
		async (formData) => {
			try {
				setIsSavingPersonal(true);

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
					fecha_inicio_ejercicio_general:
						formData.fecha_inicio_ejercicio_general || null,
					plaza:
						formData.plaza_codigo || formData.cargo_id
							? {
								codigo_plaza: formData.plaza_codigo || null,
								cargo_id: formData.cargo_id || null,
								especialidad_id: formData.especialidad_id || null,
								nivel_educativo_id: formData.nivel_educativo_id || null,
								escala_magisterial_id: formData.escala_magisterial_id || null,
								condicion_id: formData.condicion_id || null,
								resolucion_nombramiento:
									formData.resolucion_nombramiento || null,
								fecha_nombramiento_carrera:
									formData.fecha_nombramiento_carrera || null,
								fecha_ingreso_institucion:
									formData.fecha_ingreso_institucion || null,
								jornada_laboral: formData.jornada_laboral || null,
								remuneracion_bruta: formData.remuneracion_bruta || null,
							}
							: null,
				};

				const personalResult = await api.createPersonal(personalData);
				const dniDocente = personalResult.dni || formData.dni;

				if (!personalResult.usedRpc && (formData.plaza_codigo || formData.cargo_id)) {
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
				notifySuccess('Personal creado exitosamente');
			} catch (error) {
				notifyError(error, 'Error al crear personal');
			} finally {
				setIsSavingPersonal(false);
			}
		},
		[cache, loadPersonal, notifyError, notifySuccess, pagination.limit]
	);

	return {
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
	};
}
