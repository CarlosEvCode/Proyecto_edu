import {useCallback, useEffect, useState} from 'react';
import {useStudentContext} from './useStudentContext';
import {useCache, useRequestController} from './useCache';
import * as studentsApi from '../services/studentsApi';

export function useStudentsPage({notifySuccess, notifyError}) {
	const {
		students,
		setStudents,
		grados,
		setGrados,
		secciones,
		setSecciones,
		pagination,
		updatePagination,
		filters,
		setIsLoading,
		isLoading,
	} = useStudentContext();

	const cache = useCache();
	const requestController = useRequestController();

	const [selectedStudent, setSelectedStudent] = useState(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isSavingStudent, setIsSavingStudent] = useState(false);
	const [stats, setStats] = useState({totalStudents: 0, bySex: {}, byGrade: []});

	const loadFilterOptions = useCallback(async () => {
		const token = requestController.startRequest(
			requestController.tokens.filterOptions
		);

		try {
			const [gradosData, seccionesData] = await Promise.all([
				studentsApi.getGrados(),
				studentsApi.getSecciones(),
			]);

			if (!requestController.isActive(token)) return;

			setGrados(Array.isArray(gradosData) ? gradosData : []);
			setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
		} catch {
			if (requestController.isActive(token)) {
				notifyError(null, 'Error al cargar opciones de filtro');
			}
		}
	}, [requestController, setGrados, setSecciones, notifyError]);

	const loadStats = useCallback(async () => {
		try {
			const data = await studentsApi.getStudentStats();
			setStats(data);
		} catch {
			// Silencioso: stats no deben bloquear la pagina
		}
	}, []);

	const loadStudents = useCallback(async (page = 1, limit = 24) => {
		const token = requestController.startRequest(
			requestController.tokens.studentsList
		);

		try {
			setIsLoading(true);

			const hasFilters =
				filters.search || filters.grado || filters.seccion || filters.sexo;

			let data;
			const cacheKey = cache.getCacheKey('students', {
				filters,
				page,
				limit,
			});

			const cachedData = cache.get(cacheKey);
			if (cachedData) {
				if (!requestController.isActive(token)) return;
				setStudents(cachedData.students || []);
				updatePagination(cachedData.pagination);
				return;
			}

			if (hasFilters) {
				data = await studentsApi.searchStudents(filters, page, limit);
			} else {
				data = await studentsApi.getStudents(page, limit);
			}

			if (!requestController.isActive(token)) return;

			cache.set(cacheKey, data);
			setStudents(data.students || []);
			updatePagination(data.pagination);
		} catch (error) {
			if (requestController.isActive(token)) {
				notifyError(error, 'Error al cargar estudiantes');
			}
		} finally {
			setIsLoading(false);
		}
	}, [
		requestController,
		setIsLoading,
		filters,
		cache,
		setStudents,
		updatePagination,
		notifyError,
	]);

	useEffect(() => {
		loadFilterOptions();
	}, [loadFilterOptions]);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	useEffect(() => {
		loadStudents(pagination.page, pagination.limit);
	}, [loadStudents, pagination.page, pagination.limit]);

	const handleSearch = useCallback(() => {
		updatePagination({page: 1});
	}, [updatePagination]);

	const handleStudentClick = useCallback((student) => {
		setSelectedStudent(student);
		setIsDetailModalOpen(true);
	}, []);

	const handleSaveStudent = useCallback(
		async (updatedStudent) => {
			try {
				setIsSavingStudent(true);

				// La nueva función updateStudent ya maneja apoderado y dirección de forma coordinada
				await studentsApi.updateStudent(updatedStudent.id, updatedStudent);

				cache.invalidate('students');
				await loadStudents(pagination.page, pagination.limit);
				await loadStats();
				setIsDetailModalOpen(false);
				notifySuccess('Estudiante actualizado exitosamente');
			} catch (error) {
				notifyError(error, 'Error al guardar cambios');
			} finally {
				setIsSavingStudent(false);
			}
		},
		[cache, loadStats, loadStudents, notifyError, notifySuccess, pagination.page, pagination.limit]
	);

	const handleDeleteStudent = useCallback(
		async (id) => {
			try {
				setIsSavingStudent(true);
				await studentsApi.deleteStudent(id);
				cache.invalidate('students');
				await loadStudents(pagination.page, pagination.limit);
				await loadStats();
				setIsDetailModalOpen(false);
				notifySuccess('Estudiante eliminado exitosamente');
			} catch (error) {
				notifyError(error, 'Error al eliminar estudiante');
			} finally {
				setIsSavingStudent(false);
			}
		},
		[cache, loadStats, loadStudents, notifyError, notifySuccess, pagination.page, pagination.limit]
	);

	const handleAddStudent = useCallback(
		async (formData) => {
			try {
				setIsSavingStudent(true);
				await studentsApi.createStudent(formData);
				cache.invalidate('students');
				await loadStudents(1, pagination.limit);
				await loadStats();
				setIsAddModalOpen(false);
				notifySuccess('Estudiante creado exitosamente');
			} catch (error) {
				notifyError(error, 'Error al crear estudiante');
			} finally {
				setIsSavingStudent(false);
			}
		},
		[cache, loadStats, loadStudents, notifyError, notifySuccess, pagination.limit]
	);

	return {
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
	};
}
