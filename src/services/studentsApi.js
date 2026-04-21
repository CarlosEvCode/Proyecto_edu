/**
 * Servicios API - Estudiantes
 * Llamadas directas a Supabase para gestión de estudiantes
 */

import {supabase} from '../lib/supabase';
import {
	assertRequired,
	assertValidBirthDate,
	assertValidDni,
	cleanText,
	normalizeNullableText,
} from '../utils/validators';

/**
 * Estudiantes - GET todos con paginación
 */
export async function getStudents(page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;

		// Contar total de estudiantes
		const {count, error: countError} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});

		if (countError) throw countError;

		const total = count || 0;
		const totalPages = Math.ceil(total / limit);

		// Obtener estudiantes con relaciones
		const {data, error} = await supabase
			.from('estudiantes')
			.select(`
				id,
				apellidos,
				nombres,
				dni,
				fecha_nacimiento,
				sexo,
				discapacidad,
				aula_id,
				apoderado_id,
				direccion_id,
				aulas (
					id,
					grado,
					seccion,
					anio,
					nivel_id,
					niveles (
						id,
						nombre
					)
				),
				apoderados (
					id,
					apellidos,
					nombres,
					dni,
					fecha_nacimiento,
					celular
				),
				direcciones (
					id,
					departamento,
					provincia,
					distrito,
					domicilio
				)
			`)
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		// Mapear datos al formato esperado por los componentes
		const students = mapStudentsData(data || []);

		return {
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
	} catch (error) {
		console.error('Error al obtener estudiantes:', error);
		throw new Error(error.message || 'Error al obtener estudiantes');
	}
}

/**
 * Estudiantes - GET por ID
 */
export async function getStudentById(id) {
	try {
		const {data, error} = await supabase
			.from('estudiantes')
			.select(`
				id,
				apellidos,
				nombres,
				dni,
				fecha_nacimiento,
				sexo,
				discapacidad,
				aula_id,
				apoderado_id,
				direccion_id,
				aulas (
					id,
					grado,
					seccion,
					anio,
					nivel_id,
					niveles (
						id,
						nombre
					)
				),
				apoderados (
					id,
					apellidos,
					nombres,
					dni,
					fecha_nacimiento,
					celular
				),
				direcciones (
					id,
					departamento,
					provincia,
					distrito,
					domicilio
				)
			`)
			.eq('id', id)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				throw new Error('Estudiante no encontrado');
			}
			throw error;
		}

		return mapStudentData(data);
	} catch (error) {
		console.error('Error al obtener estudiante:', error);
		throw new Error(error.message || 'Error al obtener estudiante');
	}
}

/**
 * Búsqueda de estudiantes con filtros
 */
export async function searchStudents(filters = {}, page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;
		const {search = '', grado = '', seccion = '', sexo = '', searchType = 'general'} = filters;

		// Construir query base
		let query = supabase
			.from('estudiantes')
			.select(`
				id,
				apellidos,
				nombres,
				dni,
				fecha_nacimiento,
				sexo,
				discapacidad,
				aula_id,
				apoderado_id,
				direccion_id,
				aulas (
					id,
					grado,
					seccion,
					anio,
					nivel_id,
					niveles (
						id,
						nombre
					)
				),
				apoderados (
					id,
					apellidos,
					nombres,
					dni,
					fecha_nacimiento,
					celular
				),
				direcciones (
					id,
					departamento,
					provincia,
					distrito,
					domicilio
				)
			`, {count: 'exact'});

		// Aplicar filtros de búsqueda por texto
		if (search) {
			if (searchType === 'students') {
				query = query.or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,dni.ilike.%${search}%`);
			} else if (searchType === 'guardians') {
				// Para búsqueda de apoderado, necesitamos hacer join
				query = query.or(`apoderados.nombres.ilike.%${search}%,apoderados.apellidos.ilike.%${search}%,apoderados.dni.ilike.%${search}%`);
			} else if (searchType === 'dni') {
				query = query.or(`dni.ilike.%${search}%`);
			} else {
				// Búsqueda general
				query = query.or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,dni.ilike.%${search}%`);
			}
		}

		// Aplicar filtros adicionales
		if (grado) {
			query = query.eq('aulas.grado', grado);
		}

		if (seccion) {
			query = query.eq('aulas.seccion', seccion);
		}

		if (sexo) {
			query = query.eq('sexo', sexo);
		}

		// Ordenar y paginar
		const {data, error, count} = await query
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		const total = count || 0;
		const totalPages = Math.ceil(total / limit);

		const students = mapStudentsData(data || []);

		return {
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
	} catch (error) {
		console.error('Error en búsqueda:', error);
		throw new Error(error.message || 'Error en la búsqueda');
	}
}

/**
 * Crear nuevo estudiante
 */
export async function createStudent(studentData) {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			sexo,
			discapacidad,
			grado,
			seccion,
			apoderado,
			direccion,
		} = studentData;

		assertRequired(['nombres', 'apellidos', 'dni', 'sexo'], {
			nombres,
			apellidos,
			dni,
			sexo,
		});
		assertValidDni(dni);
		assertValidBirthDate(fecha_nacimiento);

		if (apoderado?.dni) {
			assertValidDni(apoderado.dni, 'DNI del apoderado');
		}
		if (apoderado?.fecha_nacimiento) {
			assertValidBirthDate(apoderado.fecha_nacimiento, 'Fecha de nacimiento del apoderado');
		}

		// Primero intentar vía RPC transaccional
		const {data: rpcData, error: rpcError} = await supabase.rpc(
			'create_student_full',
			{
				p_payload: {
					nombres: cleanText(nombres),
					apellidos: cleanText(apellidos),
					dni: cleanText(dni),
					fecha_nacimiento: fecha_nacimiento || null,
					sexo: cleanText(sexo),
					discapacidad: normalizeNullableText(discapacidad),
					grado: grado || null,
					seccion: seccion || null,
					apoderado: apoderado || {},
					direccion: direccion || {},
				},
			}
		);

		if (!rpcError && rpcData?.student_id) {
			return {
				message: 'Estudiante creado exitosamente',
				studentId: rpcData.student_id,
			};
		}

		if (rpcError) {
			console.warn('RPC create_student_full no disponible, usando fallback:', rpcError.message);
		}

		let apoderadoId = null;
		let direccionId = null;
		let aulaId = null;

		// Crear dirección si se proporciona
		if (direccion && (direccion.departamento || direccion.provincia || direccion.distrito || direccion.domicilio)) {
			const {data: dirData, error: dirError} = await supabase
				.from('direcciones')
				.insert([{
					departamento: normalizeNullableText(direccion.departamento),
					provincia: normalizeNullableText(direccion.provincia),
					distrito: normalizeNullableText(direccion.distrito),
					domicilio: normalizeNullableText(direccion.domicilio),
				}])
				.select()
				.single();

			if (dirError) throw dirError;
			direccionId = dirData.id;
		}

		// Crear apoderado si se proporciona
		if (apoderado && (apoderado.nombres || apoderado.apellidos)) {
			const {data: apoData, error: apoError} = await supabase
				.from('apoderados')
				.insert([{
					nombres: normalizeNullableText(apoderado.nombres),
					apellidos: normalizeNullableText(apoderado.apellidos),
					dni: normalizeNullableText(apoderado.dni),
					fecha_nacimiento: apoderado.fecha_nacimiento || null,
					celular: normalizeNullableText(apoderado.celular),
				}])
				.select()
				.single();

			if (apoError) throw apoError;
			apoderadoId = apoData.id;
		}

		// Obtener aula_id si se proporciona grado y sección
		if (grado || seccion) {
			aulaId = await getAulaIdByGradoSeccion(grado, seccion);
		}

		// Crear estudiante
		const {data, error} = await supabase
			.from('estudiantes')
			.insert([{
				nombres: cleanText(nombres),
				apellidos: cleanText(apellidos),
				dni: cleanText(dni),
				fecha_nacimiento: fecha_nacimiento || null,
				sexo: cleanText(sexo),
				discapacidad: normalizeNullableText(discapacidad),
				aula_id: aulaId,
				apoderado_id: apoderadoId,
				direccion_id: direccionId,
			}])
			.select()
			.single();

		if (error) {
			if (error.message.includes('unique') || error.message.includes('duplicate')) {
				throw new Error('Ya existe un estudiante con este DNI');
			}
			throw error;
		}

		return {
			message: 'Estudiante creado exitosamente',
			studentId: data.id,
		};
	} catch (error) {
		console.error('Error al crear estudiante:', error);
		throw new Error(error.message || 'Error al crear estudiante');
	}
}

/**
 * Actualizar estudiante
 */
export async function updateStudent(id, studentData) {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			sexo,
			discapacidad,
			grado,
			seccion,
			apoderado,
			direccion,
		} = studentData;

		assertRequired(['nombres', 'apellidos', 'dni', 'sexo'], {
			nombres,
			apellidos,
			dni,
			sexo,
		});
		assertValidDni(dni);
		assertValidBirthDate(fecha_nacimiento);

		// Obtener IDs actuales para saber qué actualizar
		const {data: currentStudent, error: getError} = await supabase
			.from('estudiantes')
			.select('apoderado_id, direccion_id')
			.eq('id', id)
			.single();

		if (getError) throw getError;

		let apoderadoId = currentStudent.apoderado_id;
		let direccionId = currentStudent.direccion_id;

		// 1. Manejar Apoderado
		if (apoderado && (apoderado.nombres || apoderado.apellidos || apoderado.dni || apoderado.celular)) {
			if (apoderado.dni) assertValidDni(apoderado.dni, 'DNI del apoderado');
			if (apoderado.fecha_nacimiento) assertValidBirthDate(apoderado.fecha_nacimiento, 'Fecha de nacimiento del apoderado');

			const apoPayload = {
				nombres: cleanText(apoderado.nombres),
				apellidos: cleanText(apoderado.apellidos),
				dni: normalizeNullableText(apoderado.dni),
				fecha_nacimiento: apoderado.fecha_nacimiento || null,
				celular: normalizeNullableText(apoderado.celular),
			};

			if (apoderadoId) {
				const {error: apoError} = await supabase
					.from('apoderados')
					.update(apoPayload)
					.eq('id', apoderadoId);
				if (apoError) throw apoError;
			} else {
				const {data: apoData, error: apoError} = await supabase
					.from('apoderados')
					.insert([apoPayload])
					.select()
					.single();
				if (apoError) throw apoError;
				apoderadoId = apoData.id;
			}
		}

		// 2. Manejar Dirección
		if (direccion && (direccion.departamento || direccion.provincia || direccion.distrito || direccion.domicilio)) {
			const dirPayload = {
				departamento: normalizeNullableText(direccion.departamento),
				provincia: normalizeNullableText(direccion.provincia),
				distrito: normalizeNullableText(direccion.distrito),
				domicilio: normalizeNullableText(direccion.domicilio),
			};

			if (direccionId) {
				const {error: dirError} = await supabase
					.from('direcciones')
					.update(dirPayload)
					.eq('id', direccionId);
				if (dirError) throw dirError;
			} else {
				const {data: dirData, error: dirError} = await supabase
					.from('direcciones')
					.insert([dirPayload])
					.select()
					.single();
				if (dirError) throw dirError;
				direccionId = dirData.id;
			}
		}

		// 3. Manejar Aula
		let aulaId = undefined; // usar undefined para no sobreescribir si no se toca
		if (grado && seccion) {
			aulaId = await getAulaIdByGradoSeccion(grado, seccion);
		} else if (grado === '' || seccion === '') {
			aulaId = null; // Caso "Sin Sección"
		}

		// 4. Actualizar Estudiante
		const updatePayload = {
			nombres: cleanText(nombres),
			apellidos: cleanText(apellidos),
			dni: cleanText(dni),
			fecha_nacimiento: fecha_nacimiento || null,
			sexo: cleanText(sexo),
			discapacidad: normalizeNullableText(discapacidad),
			apoderado_id: apoderadoId,
			direccion_id: direccionId,
		};

		if (aulaId !== undefined) {
			updatePayload.aula_id = aulaId;
		}

		const {error} = await supabase
			.from('estudiantes')
			.update(updatePayload)
			.eq('id', id);

		if (error) throw error;

		return {message: 'Estudiante y datos relacionados actualizados exitosamente'};
	} catch (error) {
		console.error('Error al actualizar estudiante:', error);
		throw new Error(error.message || 'Error al actualizar estudiante');
	}
}

/**
 * Actualizar apoderado
 */
export async function updateApoderado(id, apoderadoData) {
	try {
		if (apoderadoData.dni) {
			assertValidDni(apoderadoData.dni, 'DNI del apoderado');
		}
		assertValidBirthDate(
			apoderadoData.fecha_nacimiento,
			'Fecha de nacimiento del apoderado'
		);

		const {error} = await supabase
			.from('apoderados')
			.update({
				nombres: cleanText(apoderadoData.nombres),
				apellidos: cleanText(apoderadoData.apellidos),
				dni: normalizeNullableText(apoderadoData.dni),
				fecha_nacimiento: apoderadoData.fecha_nacimiento || null,
				celular: normalizeNullableText(apoderadoData.celular),
			})
			.eq('id', id);

		if (error) throw error;

		return {message: 'Apoderado actualizado exitosamente'};
	} catch (error) {
		console.error('Error al actualizar apoderado:', error);
		throw new Error(error.message || 'Error al actualizar apoderado');
	}
}

/**
 * Actualizar dirección
 */
export async function updateDireccion(id, direccionData) {
	try {
		const {error} = await supabase
			.from('direcciones')
			.update({
				departamento: normalizeNullableText(direccionData.departamento),
				provincia: normalizeNullableText(direccionData.provincia),
				distrito: normalizeNullableText(direccionData.distrito),
				domicilio: normalizeNullableText(direccionData.domicilio),
			})
			.eq('id', id);

		if (error) throw error;

		return {message: 'Dirección actualizada exitosamente'};
	} catch (error) {
		console.error('Error al actualizar dirección:', error);
		throw new Error(error.message || 'Error al actualizar dirección');
	}
}

/**
 * Eliminar estudiante
 */
export async function deleteStudent(id) {
	try {
		const {error: rpcError} = await supabase.rpc('soft_delete_student', {
			p_student_id: id,
		});

		if (!rpcError) {
			return {message: 'Estudiante eliminado exitosamente'};
		}

		console.warn('RPC soft_delete_student no disponible, usando fallback:', rpcError.message);

		// Primero obtener los IDs relacionados
		const {data: student, error: getError} = await supabase
			.from('estudiantes')
			.select('apoderado_id, direccion_id')
			.eq('id', id)
			.single();

		if (getError) throw getError;

		// Eliminar estudiante
		const {error: deleteError} = await supabase
			.from('estudiantes')
			.delete()
			.eq('id', id);

		if (deleteError) throw deleteError;

		// Eliminar apoderado si existe
		if (student.apoderado_id) {
			await supabase
				.from('apoderados')
				.delete()
				.eq('id', student.apoderado_id);
		}

		// Eliminar dirección si existe
		if (student.direccion_id) {
			await supabase
				.from('direcciones')
				.delete()
				.eq('id', student.direccion_id);
		}

		return {message: 'Estudiante eliminado exitosamente'};
	} catch (error) {
		console.error('Error al eliminar estudiante:', error);
		throw new Error(error.message || 'Error al eliminar estudiante');
	}
}

/**
 * Obtener grados disponibles
 */
export async function getGrados() {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('grado')
			.order('grado', {ascending: true});

		if (error) throw error;

		// Obtener valores únicos
		const uniqueGrados = [...new Set(data.map(d => d.grado))];
		return uniqueGrados.map(grado => ({grado}));
	} catch (error) {
		console.error('Error al obtener grados:', error);
		throw new Error(error.message || 'Error al obtener grados');
	}
}

/**
 * Obtener secciones disponibles
 */
export async function getSecciones() {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('seccion')
			.order('seccion', {ascending: true});

		if (error) throw error;

		// Obtener valores únicos
		const uniqueSecciones = [...new Set(data.map(d => d.seccion))];
		return uniqueSecciones.map(seccion => ({seccion}));
	} catch (error) {
		console.error('Error al obtener secciones:', error);
		throw new Error(error.message || 'Error al obtener secciones');
	}
}

/**
 * Obtener estadísticas de estudiantes
 */
export async function getStudentStats() {
	try {
		// Total de estudiantes
		const {count: totalStudents} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});

		// Estudiantes por sexo
		const {data: bySex} = await supabase
			.from('estudiantes')
			.select('sexo');

		const sexCounts = {};
		(bySex || []).forEach(s => {
			sexCounts[s.sexo] = (sexCounts[s.sexo] || 0) + 1;
		});

		// Estudiantes por grado
		const {data: byGrade} = await supabase
			.from('estudiantes')
			.select('aula_id, aulas(grado)');

		const gradeCounts = {};
		(byGrade || []).forEach((row) => {
			const grado = row.aulas?.grado;
			if (grado) gradeCounts[grado] = (gradeCounts[grado] || 0) + 1;
		});

		return {
			totalStudents: totalStudents || 0,
			bySex: sexCounts,
			byGrade: Object.entries(gradeCounts).map(([grado, count]) => ({
				grado,
				count,
			})),
		};
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);
		throw new Error(error.message || 'Error al obtener estadísticas');
	}
}

// ============================================
// FUNCIONES HELPER PARA MAPEAR DATOS
// ============================================

function mapStudentsData(data) {
	return data.map(mapStudentData);
}

function mapStudentData(row) {
	return {
		id: row.id,
		apellidos: row.apellidos,
		nombres: row.nombres,
		dni: row.dni,
		fecha_nacimiento: row.fecha_nacimiento,
		sexo: row.sexo,
		discapacidad: row.discapacidad,
		grado: row.aulas?.grado || null,
		seccion: row.aulas?.seccion || null,
		anio: row.aulas?.anio || null,
		nivel: row.aulas?.niveles?.nombre || null,
		aula_id: row.aula_id,
		apoderado: row.apoderados ? {
			id: row.apoderados.id,
			apellidos: row.apoderados.apellidos,
			nombres: row.apoderados.nombres,
			dni: row.apoderados.dni,
			fecha_nacimiento: row.apoderados.fecha_nacimiento,
			celular: row.apoderados.celular,
		} : null,
		direccion: row.direcciones ? {
			id: row.direcciones.id,
			departamento: row.direcciones.departamento,
			provincia: row.direcciones.provincia,
			distrito: row.direcciones.distrito,
			domicilio: row.direcciones.domicilio,
		} : null,
	};
}

async function getAulaIdByGradoSeccion(grado, seccion) {
	if (!grado || !seccion) {
		throw new Error('Grado y sección son requeridos');
	}

	const {data, error} = await supabase
		.from('aulas')
		.select('id')
		.eq('grado', grado)
		.eq('seccion', seccion)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			throw new Error('Combinación de grado y sección no válida');
		}
		throw error;
	}

	return data.id;
}
