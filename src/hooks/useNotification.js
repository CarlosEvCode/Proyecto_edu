import {useCallback, useState} from 'react';

function normalizeMessage(error, fallbackMessage = 'Ha ocurrido un error inesperado') {
	if (!error) return fallbackMessage;
	if (typeof error === 'string') return error;
	if (error instanceof Error && error.message) return error.message;
	if (typeof error.message === 'string' && error.message) return error.message;
	return fallbackMessage;
}

export function useNotification() {
	const [notification, setNotification] = useState(null);

	const clearNotification = useCallback(() => {
		setNotification(null);
	}, []);

	const notify = useCallback((message, type = 'error') => {
		setNotification({message, type});
	}, []);

	const notifySuccess = useCallback((message) => {
		setNotification({message, type: 'success'});
	}, []);

	const notifyError = useCallback((error, fallbackMessage = 'Ha ocurrido un error') => {
		setNotification({
			message: normalizeMessage(error, fallbackMessage),
			type: 'error',
		});
	}, []);

	return {
		notification,
		notify,
		notifySuccess,
		notifyError,
		clearNotification,
	};
}
