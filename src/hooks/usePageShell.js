import {useCallback, useEffect, useMemo, useState} from 'react';

export function usePageShell({user, logout, navigate}) {
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [showMobileDrawer, setShowMobileDrawer] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showUserDropdown && !event.target.closest('.user-profile-dropdown-container')) {
				setShowUserDropdown(false);
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [showUserDropdown]);

	useEffect(() => {
		document.body.style.overflow = showMobileDrawer ? 'hidden' : 'unset';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [showMobileDrawer]);

	const openLogoutConfirm = useCallback(() => {
		setShowUserDropdown(false);
		setShowLogoutConfirm(true);
	}, []);

	const openLogoutConfirmFromMobile = useCallback(() => {
		setShowMobileDrawer(false);
		setShowLogoutConfirm(true);
	}, []);

	const handleLogout = useCallback(async () => {
		try {
			setIsLoggingOut(true);
			await logout();
			setShowLogoutConfirm(false);
			setShowUserDropdown(false);
			navigate('/login');
		} catch {
			setShowLogoutConfirm(false);
			setShowUserDropdown(false);
			navigate('/login');
		} finally {
			setIsLoggingOut(false);
		}
	}, [logout, navigate]);

	const userInitial = useMemo(() => {
		return (user?.full_name || user?.email || 'U').charAt(0).toUpperCase();
	}, [user?.full_name, user?.email]);

	return {
		showUserDropdown,
		setShowUserDropdown,
		showMobileDrawer,
		setShowMobileDrawer,
		showLogoutConfirm,
		setShowLogoutConfirm,
		isLoggingOut,
		openLogoutConfirm,
		openLogoutConfirmFromMobile,
		handleLogout,
		userInitial,
	};
}
