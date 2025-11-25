import {supabase} from '../lib/supabase';

/**
 * Helper: Extraer datos de relación (maneja tanto objeto como array)
 */
function extractRelation(relationData) {
	if (!relationData) return null;
	if (Array.isArray(relationData)) {
		return relationData.length > 0
			? {id: relationData[0].id, nombre: relationData[0].nombre}
			: null;
	}
	return {id: relationData.id, nombre: relationData.nombre};
}

/**
 * Helper: Mapear datos de personal
 */
function mapPersonalData(data) {
	return data.map((row) => {
		// Obtener la primera plaza si existe (manejar array u objeto por seguridad)
		let plazaRaw = null;
		if (row.tbl_plazas) {
			if (Array.isArray(row.tbl_plazas)) {
				plazaRaw = row.tbl_plazas.length > 0 ? row.tbl_plazas[0] : null;
			} else {
				plazaRaw = row.tbl_plazas;
			}
		}

		return {
			dni: row.dni,
			nombres: row.nombres,
			apellidos: row.apellidos,
			fecha_nacimiento: row.fecha_nacimiento,
			numero_celular: row.numero_celular,
			codigo_modular: row.codigo_modular,
			sistema_pensiones: extractRelation(row.tbl_sistemaspensiones),
			plaza: plazaRaw
				? {
						codigo_plaza: plazaRaw.codigo_plaza,
						remuneracion_bruta: plazaRaw.remuneracion_bruta,
						jornada_laboral: plazaRaw.jornada_laboral,
						resolucion_nombramiento: plazaRaw.resolucion_nombramiento,
						fecha_nombramiento_carrera: plazaRaw.fecha_nombramiento_carrera,
						fecha_ingreso_institucion: plazaRaw.fecha_ingreso_institucion,
						nivel_educativo: extractRelation(plazaRaw.tbl_niveleseducativos),
						cargo: extractRelation(plazaRaw.tbl_cargos),
						especialidad: extractRelation(plazaRaw.tbl_especialidades),
						escala_magisterial: extractRelation(plazaRaw.tbl_escalasmagisteriales),
						condicion: extractRelation(plazaRaw.tbl_condiciones),
				  }
				: null,
			fecha_inicio_ejercicio_general: row.fecha_inicio_ejercicio_general,
		};
	});
}

/**
 * Personal - GET todos con paginación
 */
export async function getPersonal(page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;

		// 1. Obtener total de registros (para paginación)
		const {count, error: countError} = await supabase
			.from('tbl_personal')
			.select('*', {count: 'exact', head: true});

		if (countError) throw countError;

		const total = count;
		const totalPages = Math.ceil(total / limit);

		// 2. Obtener datos con relaciones usando consulta estándar de Supabase
		console.log('Fetching personal data with offset:', offset, 'limit:', limit);
		const {data, error} = await supabase
			.from('tbl_personal')
			.select(
				`
				dni,
				nombres,
				apellidos,
				fecha_nacimiento,
				numero_celular,
				codigo_modular,
				sistema_pensiones_id,
				fecha_inicio_ejercicio_general,
				tbl_sistemaspensiones(id, nombre),
				tbl_plazas(
					codigo_plaza,
					remuneracion_bruta,
					jornada_laboral,
					resolucion_nombramiento,
					fecha_nombramiento_carrera,
					fecha_ingreso_institucion,
					nivel_educativo_id,
					cargo_id,
					especialidad_id,
					escala_magisterial_id,
					condicion_id,
					tbl_niveleseducativos(id, nombre),
					tbl_cargos(id, nombre),
					tbl_especialidades(id, nombre),
					tbl_escalasmagisteriales(id, nombre),
					tbl_condiciones(id, nombre)
				)
			`
			)
			.order('apellidos', {ascending: true})
			.order('nombres', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) {
			console.error('Supabase error in getPersonal:', error);
			throw error;
		}

		console.log('Raw data from Supabase:', data);
		if (data && data.length > 0) {
			console.log('First item structure:', JSON.stringify(data[0], null, 2));
			if (data[0].tbl_plazas && data[0].tbl_plazas.length > 0) {
				console.log('First item plaza structure:', JSON.stringify(data[0].tbl_plazas[0], null, 2));
			}
		}

		// Mapear los datos al formato que espera la aplicación
		const personalData = mapPersonalData(data || []);
		console.log('Mapped personal data:', personalData);

		return {
			personal: personalData,
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
		console.error('Error al obtener personal:', error);
		throw new Error(error.message || 'Error al obtener personal');
	}
}

/**
 * Personal - GET por DNI
 */
export async function getPersonalByDni(dni) {
	try {
		const {data, error} = await supabase
			.from('tbl_personal')
			.select(
				`
				dni,
				nombres,
				apellidos,
				fecha_nacimiento,
				numero_celular,
				codigo_modular,
				sistema_pensiones_id,
				fecha_inicio_ejercicio_general,
				tbl_sistemaspensiones(id, nombre),
				tbl_plazas(
					codigo_plaza,
					remuneracion_bruta,
					jornada_laboral,
					resolucion_nombramiento,
					fecha_nombramiento_carrera,
					fecha_ingreso_institucion,
					nivel_educativo_id,
					cargo_id,
					especialidad_id,
					escala_magisterial_id,
					condicion_id,
					tbl_niveleseducativos(id, nombre),
					tbl_cargos(id, nombre),
					tbl_especialidades(id, nombre),
					tbl_escalasmagisteriales(id, nombre),
					tbl_condiciones(id, nombre)
				)
			`
			)
			.eq('dni', dni)
			.single();

		if (error && error.code === 'PGRST116') {
			throw new Error('Personal no encontrado');
		}
		if (error) throw error;

		const plaza =
			data.tbl_plazas && data.tbl_plazas.length > 0 ? data.tbl_plazas[0] : null;

		return {
			dni: data.dni,
			nombres: data.nombres,
			apellidos: data.apellidos,
			fecha_nacimiento: data.fecha_nacimiento,
			numero_celular: data.numero_celular,
			codigo_modular: data.codigo_modular,
			sistema_pensiones: data.tbl_sistemaspensiones
				? {
						id: data.tbl_sistemaspensiones.id,
						nombre: data.tbl_sistemaspensiones.nombre,
				  }
				: null,
			plaza: plaza
				? {
						codigo_plaza: plaza.codigo_plaza,
						remuneracion_bruta: plaza.remuneracion_bruta,
						jornada_laboral: plaza.jornada_laboral,
						resolucion_nombramiento: plaza.resolucion_nombramiento,
						fecha_nombramiento_carrera: plaza.fecha_nombramiento_carrera,
						fecha_ingreso_institucion: plaza.fecha_ingreso_institucion,
						nivel_educativo: plaza.tbl_niveleseducativos
							? {
									id: plaza.tbl_niveleseducativos.id,
									nombre: plaza.tbl_niveleseducativos.nombre,
							  }
							: null,
						cargo: plaza.tbl_cargos
							? {
									id: plaza.tbl_cargos.id,
									nombre: plaza.tbl_cargos.nombre,
							  }
							: null,
						especialidad: plaza.tbl_especialidades
							? {
									id: plaza.tbl_especialidades.id,
									nombre: plaza.tbl_especialidades.nombre,
							  }
							: null,
						escala_magisterial: plaza.tbl_escalasmagisteriales
							? {
									id: plaza.tbl_escalasmagisteriales.id,
									nombre: plaza.tbl_escalasmagisteriales.nombre,
							  }
							: null,
						condicion: plaza.tbl_condiciones
							? {
									id: plaza.tbl_condiciones.id,
									nombre: plaza.tbl_condiciones.nombre,
							  }
							: null,
				  }
				: null,
			fecha_inicio_ejercicio_general: data.fecha_inicio_ejercicio_general,
		};
	} catch (error) {
		console.error('Error al obtener personal:', error);
		throw new Error(error.message || 'Error al obtener personal');
	}
}

/**
 * Personal - POST crear
 */
export async function createPersonal(personalData) {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			numero_celular,
			codigo_modular,
		} = personalData;

		if (!nombres || !apellidos || !dni || !codigo_modular) {
			throw new Error('Campos obligatorios: nombres, apellidos, dni, codigo_modular');
		}

		const {data, error} = await supabase
			.from('tbl_personal')
			.insert([
				{
					nombres,
					apellidos,
					dni,
					fecha_nacimiento: fecha_nacimiento || null,
					numero_celular: numero_celular || null,
					codigo_modular,
				},
			])
			.select()
			.single();

		if (error) {
			if (error.message.includes('unique')) {
				throw new Error('Ya existe un personal con este DNI o código modular');
			}
			throw error;
		}

		return {
			message: 'Personal creado exitosamente',
			dni: data.dni,
		};
	} catch (error) {
		console.error('Error al crear personal:', error);
		throw new Error(error.message || 'Error al crear personal');
	}
}

/**
 * Personal - PUT actualizar
 */
export async function updatePersonal(dni, personalData) {
	try {
		const {
			nombres,
			apellidos,
			fecha_nacimiento,
			numero_celular,
			codigo_modular,
			fecha_inicio_ejercicio_general,
		} = personalData;

		const updateData = {
			nombres,
			apellidos,
			fecha_nacimiento: fecha_nacimiento || null,
			numero_celular: numero_celular || null,
			codigo_modular,
			fecha_inicio_ejercicio_general: fecha_inicio_ejercicio_general || null,
		};

		const {error} = await supabase
			.from('tbl_personal')
			.update(updateData)
			.eq('dni', dni);

		if (error) throw error;

		return {message: 'Personal actualizado exitosamente'};
	} catch (error) {
		console.error('Error al actualizar personal:', error);
		throw new Error(error.message || 'Error al actualizar personal');
	}
}

/**
 * Personal - DELETE
 */
export async function deletePersonal(dni) {
	try {
		// Primero, eliminar la plaza asociada si existe
		const {error: plazaError} = await supabase
			.from('tbl_plazas')
			.update({dni_personal_asignado: null})
			.eq('dni_personal_asignado', dni);

		if (plazaError) {
			console.warn('Advertencia al actualizar plaza:', plazaError);
		}

		// Eliminar personal
		const {error: deleteError} = await supabase
			.from('tbl_personal')
			.delete()
			.eq('dni', dni);

		if (deleteError) throw deleteError;

		return {message: 'Personal eliminado exitosamente'};
	} catch (error) {
		console.error('Error al eliminar personal:', error);
		throw new Error(error.message || 'Error al eliminar personal');
	}
}

/**
 * Búsqueda - GET con filtros
 */
export async function searchPersonal(filters = {}, page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;
		const {search = '', cargo = '', especialidad = '', nivel = ''} = filters;

		// Construir la consulta base
		let query = supabase
			.from('tbl_personal')
			.select(
				`
				*,
				tbl_sistemaspensiones(id, nombre),
				tbl_plazas!inner(
					codigo_plaza,
					remuneracion_bruta,
					jornada_laboral,
					resolucion_nombramiento,
					fecha_nombramiento_carrera,
					fecha_ingreso_institucion,
					nivel_educativo_id,
					cargo_id,
					especialidad_id,
					escala_magisterial_id,
					condicion_id,
					tbl_niveleseducativos(id, nombre),
					tbl_cargos(id, nombre),
					tbl_especialidades(id, nombre),
					tbl_escalasmagisteriales(id, nombre),
					tbl_condiciones(id, nombre)
				)
			`,
				{count: 'exact'}
			);

		// Aplicar filtros de búsqueda de texto
		if (search) {
			query = query.or(
				`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,dni.ilike.%${search}%,codigo_modular.ilike.%${search}%`
			);
		}

		// Aplicar filtros de relaciones (gracias al !inner join en tbl_plazas)
		if (cargo) {
			query = query.eq('tbl_plazas.cargo_id', cargo);
		}
		if (especialidad) {
			query = query.eq('tbl_plazas.especialidad_id', especialidad);
		}
		if (nivel) {
			query = query.eq('tbl_plazas.nivel_educativo_id', nivel);
		}

		// Ordenar y paginar
		query = query
			.order('apellidos', {ascending: true})
			.order('nombres', {ascending: true})
			.range(offset, offset + limit - 1);

		const {data, count, error} = await query;

		if (error) throw error;

		const total = count || 0;
		const totalPages = Math.ceil(total / limit);
		const personalData = mapPersonalData(data || []);

		return {
			personal: personalData,
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
