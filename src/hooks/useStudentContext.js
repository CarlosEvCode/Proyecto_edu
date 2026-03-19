import {useContext} from 'react';
import {StudentContext} from '../context/student-context';

export function useStudentContext() {
	const context = useContext(StudentContext);
	if (!context) {
		throw new Error('useStudentContext debe ser usado dentro de StudentProvider');
	}
	return context;
}
