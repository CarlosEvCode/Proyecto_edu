import {supabase} from '../lib/supabase';

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
