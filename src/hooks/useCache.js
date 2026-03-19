import {useRef, useCallback, useMemo} from 'react';

/**
 * Hook para gestionar caché de datos
 */
export function useCache(duration = 5 * 60 * 1000) {
	const cacheRef = useRef(new Map());

	const getCacheKey = useCallback((endpoint, params = {}) => {
		return `${endpoint}:${JSON.stringify(params)}`;
	}, []);

	const get = useCallback((key) => {
		const item = cacheRef.current.get(key);
		if (!item) return null;

		if (Date.now() - item.timestamp > duration) {
			cacheRef.current.delete(key);
			return null;
		}
		return item.data;
	}, [duration]);

	const set = useCallback((key, data) => {
		cacheRef.current.set(key, {
			data,
			timestamp: Date.now(),
		});
	}, []);

	const invalidate = useCallback((pattern) => {
		for (const key of cacheRef.current.keys()) {
			if (key.includes(pattern)) {
				cacheRef.current.delete(key);
			}
		}
	}, []);

	const clear = useCallback(() => {
		cacheRef.current.clear();
	}, []);

	return useMemo(
		() => ({getCacheKey, get, set, invalidate, clear}),
		[getCacheKey, get, set, invalidate, clear]
	);
}

/**
 * Hook para controlar requests paralelas y cancelarlas
 */
export function useRequestController() {
	const tokensRef = useRef({
		filterOptions: Symbol('filterOptions'),
		studentsList: Symbol('studentsList'),
		search: Symbol('search'),
		personalList: Symbol('personalList'),
	});

	const activeRequestsRef = useRef(new Map());

	const startRequest = useCallback((token) => {
		activeRequestsRef.current.set(token, true);
		return token;
	}, []);

	const isActive = useCallback((token) => {
		return (
			activeRequestsRef.current.has(token) && activeRequestsRef.current.get(token)
		);
	}, []);

	const cancelRequest = useCallback((token) => {
		if (activeRequestsRef.current.has(token)) {
			activeRequestsRef.current.set(token, false);
		}
	}, []);

	const cancelAllRequests = useCallback(() => {
		for (const token of activeRequestsRef.current.keys()) {
			activeRequestsRef.current.set(token, false);
		}
	}, []);

	return useMemo(
		() => ({
			tokens: tokensRef.current,
			startRequest,
			isActive,
			cancelRequest,
			cancelAllRequests,
		}),
		[startRequest, isActive, cancelRequest, cancelAllRequests]
	);
}
