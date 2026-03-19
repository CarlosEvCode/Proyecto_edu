/**
 * Servicios API - Personal Docente
 * Llamadas directas a Supabase para gestión de personal
 */

import {supabase} from '../lib/supabase';

/**
 * Personal - GET todos con paginación
 */
export async function getPersonal(page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;

		// Contar total de personal
		const {count, error: countError} = await supabase
			.from('tbl_personal')
			.select('*', {count: 'exact', head: true});

		if (countError) throw countError;

		const total = count;
		const totalPages = Math.ceil(total / limit);

		// Obtener personal con relaciones usando una consulta más completa
		const {data, error} = await supabase.rpc('get_personal_with_relations', {
			p_offset: offset,
			p_limit: limit,
		});

		if (error) {
			// Si la función RPC no existe, usar la consulta PostgREST alternativa
			console.warn('RPC no disponible, usando consulta PostgREST:', error.message);

			const {data: fallbackData, error: fallbackError} = await supabase
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

			if (fallbackError) throw fallbackError;

			const personalData = mapPersonalData(fallbackData);

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
		}

		// Parsear respuesta RPC (retorna array de JSON objects)
		const personalData = data && Array.isArray(data) ? data : [];

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
 * Helper: Mapear datos de personal
 */
function mapPersonalData(data) {
	return data.map((row) => ({
		dni: row.dni,
		nombres: row.nombres,
		apellidos: row.apellidos,
		fecha_nacimiento: row.fecha_nacimiento,
		numero_celular: row.numero_celular,
		codigo_modular: row.codigo_modular,
		sistema_pensiones: row.tbl_sistemaspensiones
			? {
					id: row.tbl_sistemaspensiones.id,
					nombre: row.tbl_sistemaspensiones.nombre,
			  }
			: null,
		plaza:
			row.tbl_plazas && row.tbl_plazas.length > 0
				? {
						codigo_plaza: row.tbl_plazas[0].codigo_plaza,
						remuneracion_bruta: row.tbl_plazas[0].remuneracion_bruta,
						jornada_laboral: row.tbl_plazas[0].jornada_laboral,
						resolucion_nombramiento: row.tbl_plazas[0].resolucion_nombramiento,
						fecha_nombramiento_carrera: row.tbl_plazas[0].fecha_nombramiento_carrera,
						fecha_ingreso_institucion: row.tbl_plazas[0].fecha_ingreso_institucion,
						nivel_educativo: row.tbl_plazas[0].tbl_niveleseducativos
							? {
									id: row.tbl_plazas[0].tbl_niveleseducativos.id,
									nombre: row.tbl_plazas[0].tbl_niveleseducativos.nombre,
							  }
							: null,
						cargo: row.tbl_plazas[0].tbl_cargos
							? {
									id: row.tbl_plazas[0].tbl_cargos.id,
									nombre: row.tbl_plazas[0].tbl_cargos.nombre,
							  }
							: null,
						especialidad: row.tbl_plazas[0].tbl_especialidades
							? {
									id: row.tbl_plazas[0].tbl_especialidades.id,
									nombre: row.tbl_plazas[0].tbl_especialidades.nombre,
							  }
							: null,
						escala_magisterial: row.tbl_plazas[0].tbl_escalasmagisteriales
							? {
									id: row.tbl_plazas[0].tbl_escalasmagisteriales.id,
									nombre: row.tbl_plazas[0].tbl_escalasmagisteriales.nombre,
							  }
							: null,
						condicion: row.tbl_plazas[0].tbl_condiciones
							? {
									id: row.tbl_plazas[0].tbl_condiciones.id,
									nombre: row.tbl_plazas[0].tbl_condiciones.nombre,
							  }
							: null,
				  }
				: null,
		fecha_inicio_ejercicio_general: row.fecha_inicio_ejercicio_general,
	}));
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

		// Si hay filtros por cargo/especialidad, necesitamos hacer un join
		if (cargo || especialidad || nivel) {
			// Usar RPC para contar con filtros complejos
			const {data: countData, error: countError} = await supabase.rpc(
				'search_personal_with_filters',
				{
					p_search: search || '',
					p_cargo_id: cargo ? parseInt(cargo, 10) : null,
					p_especialidad_id: especialidad ? parseInt(especialidad, 10) : null,
					p_nivel_id: nivel ? parseInt(nivel, 10) : null,
					p_offset: 0,
					p_limit: 9999, // Usar un límite alto para contar todos
				}
			);

			if (countError) throw countError;
			const total = countData ? countData.length : 0;

			// Ahora obtener los datos paginados
			const {data: searchData, error: searchError} = await supabase.rpc(
				'search_personal_with_filters',
				{
					p_search: search || '',
					p_cargo_id: cargo ? parseInt(cargo, 10) : null,
					p_especialidad_id: especialidad ? parseInt(especialidad, 10) : null,
					p_nivel_id: nivel ? parseInt(nivel, 10) : null,
					p_offset: offset,
					p_limit: limit,
				}
			);

			if (searchError) throw searchError;

			const personalData = searchData && Array.isArray(searchData) ? searchData : [];
			const totalPages = Math.ceil(total / limit);

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
		}

		// Incluso si solo hay búsqueda de texto, usar RPC para garantizar datos completos
		// Usar RPC con todos los parámetros nulos excepto el search
		const {data: countData, error: countError} = await supabase.rpc(
			'search_personal_with_filters',
			{
				p_search: search || '',
				p_cargo_id: null,
				p_especialidad_id: null,
				p_nivel_id: null,
				p_offset: 0,
				p_limit: 9999, // Usar un límite alto para contar todos
			}
		);

		if (countError) throw countError;
		const total = countData ? countData.length : 0;
		const totalPages = Math.ceil(total / limit);

		// Obtener datos paginados
		const {data: searchData, error: searchError} = await supabase.rpc(
			'search_personal_with_filters',
			{
				p_search: search || '',
				p_cargo_id: null,
				p_especialidad_id: null,
				p_nivel_id: null,
				p_offset: offset,
				p_limit: limit,
			}
		);

		if (searchError) throw searchError;

		const personalData = searchData && Array.isArray(searchData) ? searchData : [];

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

/**
 * Cargos - GET todos
 */
export async function getCargos() {
	try {
		const {data, error} = await supabase
			.from('tbl_cargos')
			.select('id, nombre')
			.order('nombre', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener cargos:', error);
		throw new Error(error.message || 'Error al obtener cargos');
	}
}

/**
 * Especialidades - GET todas
 */
export async function getEspecialidades() {
	try {
		const {data, error} = await supabase
			.from('tbl_especialidades')
			.select('id, nombre')
			.order('nombre', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener especialidades:', error);
		throw new Error(error.message || 'Error al obtener especialidades');
	}
}

/**
 * Niveles Educativos - GET todos
 */
export async function getNivelesEducativos() {
	try {
		const {data, error} = await supabase
			.from('tbl_niveleseducativos')
			.select('id, nombre')
			.order('nombre', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener niveles educativos:', error);
		throw new Error(error.message || 'Error al obtener niveles educativos');
	}
}

/**
 * Escalas Magisteriales - GET todos
 */
export async function getEscalasMagisteriales() {
	try {
		const {data, error} = await supabase
			.from('tbl_escalasmagisteriales')
			.select('id, nombre')
			.order('nombre', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener escalas magisteriales:', error);
		throw new Error(error.message || 'Error al obtener escalas magisteriales');
	}
}

/**
 * Condiciones - GET todos
 */
export async function getCondiciones() {
	try {
		const {data, error} = await supabase
			.from('tbl_condiciones')
			.select('id, nombre')
			.order('nombre', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener condiciones:', error);
		throw new Error(error.message || 'Error al obtener condiciones');
	}
}

/**
 * Sistemas de Pensiones - GET todos
 */
export async function getSistemasPensiones() {
	try {
		const {data, error} = await supabase
			.from('tbl_sistemaspensiones')
			.select('id, nombre')
			.order('nombre', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener sistemas de pensiones:', error);
		throw new Error(error.message || 'Error al obtener sistemas de pensiones');
	}
}

/**
 * Plazas - GET todas
 */
export async function getPlazas() {
	try {
		const {data, error} = await supabase
			.from('tbl_plazas')
			.select(
				`
				codigo_plaza,
				remuneracion_bruta,
				jornada_laboral,
				tbl_niveleseducativos(id, nombre),
				tbl_cargos(id, nombre)
			`
			)
			.order('codigo_plaza', {ascending: true});

		if (error) throw error;

		return data;
	} catch (error) {
		console.error('Error al obtener plazas:', error);
		throw new Error(error.message || 'Error al obtener plazas');
	}
}

/**
 * Plazas - POST crear nueva
 */
export async function createPlaza(plazaData) {
	try {
		const {data, error} = await supabase
			.from('tbl_plazas')
			.insert([plazaData])
			.select();

		if (error) throw error;

		return data[0];
	} catch (error) {
		console.error('Error al crear plaza:', error);
		throw new Error(error.message || 'Error al crear plaza');
	}
}

/**
 * Plazas - PUT actualizar
 */
export async function updatePlaza(codigoPlaza, plazaData) {
	try {
		const {error} = await supabase
			.from('tbl_plazas')
			.update(plazaData)
			.eq('codigo_plaza', codigoPlaza);

		if (error) throw error;

		return {message: 'Plaza actualizada exitosamente'};
	} catch (error) {
		console.error('Error al actualizar plaza:', error);
		throw new Error(error.message || 'Error al actualizar plaza');
	}
}

/**
 * Estadísticas - GET
 */
export async function getStats() {
	try {
		const stats = {};

		// Total de personal
		const {count: totalPersonal} = await supabase
			.from('tbl_personal')
			.select('*', {count: 'exact', head: true});

		stats.totalPersonal = [{count: totalPersonal}];

		// Personal por cargo
		const {data: byCargo} = await supabase
			.from('tbl_plazas')
			.select('cargo_id, tbl_cargos(nombre)');

		const grouped = {};
		byCargo.forEach((p) => {
			const cargo = p.tbl_cargos?.nombre;
			if (cargo) grouped[cargo] = (grouped[cargo] || 0) + 1;
		});

		stats.personalByCargo = Object.entries(grouped).map(([cargo, count]) => ({
			cargo,
			count,
		}));

		// Total de plazas
		const {count: totalPlazas} = await supabase
			.from('tbl_plazas')
			.select('*', {count: 'exact', head: true});

		stats.totalPlazas = [{count: totalPlazas}];

		return stats;
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);
		throw new Error(error.message || 'Error al obtener estadísticas');
	}
}
