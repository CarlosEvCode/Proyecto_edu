import {useEffect} from 'react';
import {supabase} from '../lib/supabase';

export function useSessionGuard({logout, navigate}) {
	useEffect(() => {
		let active = true;

		const handleInvalidSession = async () => {
			if (!active) return;
			await logout();
			if (active) {
				navigate('/login');
			}
		};

		const checkSession = async () => {
			const {
				data: {session},
				error,
			} = await supabase.auth.getSession();

			if (error || !session?.user) {
				await handleInvalidSession();
			}
		};

		checkSession();

		const {
			data: {subscription},
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (!active) return;
			if (event === 'SIGNED_OUT' || !session?.user) {
				await handleInvalidSession();
			}
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, [logout, navigate]);
}
