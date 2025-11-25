import {supabase} from '../lib/supabase';

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
