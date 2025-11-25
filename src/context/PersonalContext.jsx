import React, {createContext, useContext} from 'react';
import {usePersonal} from '../hooks/usePersonal';
import {useCatalogs} from '../hooks/useCatalogs';

export const PersonalContext = createContext();

export function PersonalProvider({children}) {
	const personalLogic = usePersonal();
	const catalogsLogic = useCatalogs();

	const value = {
		...personalLogic,
		...catalogsLogic,
		// Alias para mantener compatibilidad con componentes existentes si es necesario
		cargos: catalogsLogic.catalogs.cargos,
		especialidades: catalogsLogic.catalogs.especialidades,
		nivelEducativo: catalogsLogic.catalogs.nivelesEducativos,
		escalasMagisteriales: catalogsLogic.catalogs.escalasMagisteriales,
		condiciones: catalogsLogic.catalogs.condiciones,
		sistemasPensiones: catalogsLogic.catalogs.sistemasPensiones,
	};

	return (
		<PersonalContext.Provider value={value}>{children}</PersonalContext.Provider>
	);
}

/**
 * Hook para usar el PersonalContext
 */
export function usePersonalContext() {
	const context = useContext(PersonalContext);
	if (!context) {
		throw new Error('usePersonalContext debe ser usado dentro de PersonalProvider');
	}
	return context;
}
