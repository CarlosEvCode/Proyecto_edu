import {useContext} from 'react';
import {PersonalContext} from '../context/personal-context';

export function usePersonalContext() {
	const context = useContext(PersonalContext);
	if (!context) {
		throw new Error('usePersonalContext debe ser usado dentro de PersonalProvider');
	}
	return context;
}
