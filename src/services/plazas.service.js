import {supabase} from '../lib/supabase';

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
