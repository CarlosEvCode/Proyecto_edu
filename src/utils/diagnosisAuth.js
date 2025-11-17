/**
 * Script de Diagnóstico para Autenticación de Supabase
 * Ejecutar en la consola del navegador para diagnosticar problemas de sesión
 */

import {supabase} from '../lib/supabase';

export async function runAuthDiagnosis() {
	console.log('🔍 INICIANDO DIAGNÓSTICO DE AUTENTICACIÓN...\n');

	try {
		// 1. Verificar si el cliente de Supabase está bien configurado
		console.log('1️⃣ Verificando configuración de Supabase...');
		console.log('   URL:', supabase._url);
		console.log(
			'   Key (primeros 20 chars):',
			supabase._key?.substring(0, 20) + '...'
		);

		// 2. Obtener sesión actual
		console.log('\n2️⃣ Verificando sesión actual...');
		const {data: sessionData, error: sessionError} =
			await supabase.auth.getSession();
		if (sessionError) {
			console.error('   ❌ Error obteniendo sesión:', sessionError);
		} else {
			if (sessionData?.session) {
				console.log('   ✅ Sesión activa encontrada');
				console.log('   Usuario:', sessionData.session.user?.email);
				console.log(
					'   Token expira en:',
					new Date(sessionData.session.expires_at * 1000)
				);
				console.log('   Tiene refresh token:', !!sessionData.session.refresh_token);
				console.log(
					'   Refresh token (primeros 20 chars):',
					sessionData.session.refresh_token?.substring(0, 20) + '...'
				);
			} else {
				console.warn('   ⚠️ No hay sesión activa');
			}
		}

		// 3. Verificar usuario actual
		console.log('\n3️⃣ Verificando usuario actual...');
		const {data: userData, error: userError} = await supabase.auth.getUser();
		if (userError) {
			console.error('   ❌ Error obteniendo usuario:', userError);
		} else {
			if (userData?.user) {
				console.log('   ✅ Usuario autenticado:', userData.user.email);
				console.log('   ID:', userData.user.id);
			} else {
				console.warn('   ⚠️ No hay usuario autenticado');
			}
		}

		// 4. Verificar localStorage
		console.log('\n4️⃣ Verificando localStorage...');
		const supabaseSession = localStorage.getItem(
			'sb-fnoebgtfnfecpgajzjpe-auth-token'
		);
		if (supabaseSession) {
			console.log('   ✅ Token de Supabase encontrado en localStorage');
			try {
				const sessionObj = JSON.parse(supabaseSession);
				console.log('   - Tiene access_token:', !!sessionObj.access_token);
				console.log('   - Tiene refresh_token:', !!sessionObj.refresh_token);
				console.log(
					'   - Expira en:',
					sessionObj.expires_at ? new Date(sessionObj.expires_at * 1000) : 'N/A'
				);
			} catch (e) {
				console.warn('   ⚠️ No se pudo parsear el token', e);
			}
		} else {
			console.warn('   ⚠️ No hay token en localStorage');
		}

		// 5. Verificar que la tabla users_profiles es accesible
		console.log('\n5️⃣ Verificando acceso a datos (users_profiles)...');
		const {data: profilesData, error: profilesError} = await supabase
			.from('users_profiles')
			.select('*')
			.limit(1);

		if (profilesError) {
			console.error('   ❌ Error accediendo a users_profiles:', profilesError);
		} else {
			console.log('   ✅ Acceso a users_profiles OK');
		}

		// 6. Verificar que la tabla tbl_personal es accesible
		console.log('\n6️⃣ Verificando acceso a datos (tbl_personal)...');
		const {
			data: personalData,
			error: personalError,
			count,
		} = await supabase
			.from('tbl_personal')
			.select('*', {count: 'exact', head: true});

		if (personalError) {
			console.error('   ❌ Error accediendo a tbl_personal:', personalError);
		} else {
			console.log('   ✅ Acceso a tbl_personal OK');
			console.log('   - Total de registros:', count);
		}

		console.log('\n✅ DIAGNÓSTICO COMPLETADO\n');
		return {
			session: sessionData?.session,
			user: userData?.user,
			supabaseToken: !!supabaseSession,
			personalAccess: !personalError,
		};
	} catch (error) {
		console.error('❌ ERROR en diagnóstico:', error);
		return null;
	}
}

export async function testRefreshToken() {
	console.log('🔄 PROBANDO REFRESCO DE TOKEN...');

	try {
		const {data, error} = await supabase.auth.refreshSession();
		if (error) {
			console.error('❌ Error refrescando token:', error);
			console.error('   Mensaje:', error.message);
			console.error('   Status:', error.status);
		} else {
			console.log('✅ Token refrescado exitosamente');
			console.log(
				'   Nuevo token expira en:',
				new Date(data.session?.expires_at * 1000)
			);
		}
		return {success: !error, error};
	} catch (error) {
		console.error('❌ Error en testRefreshToken:', error);
		return {success: false, error};
	}
}

export function printInstructions() {
	console.log(`
🛠️ INSTRUCCIONES PARA USO EN CONSOLA DEL NAVEGADOR:

1. Abre la consola del navegador (F12 o Ctrl+Shift+K)
2. Copia y pega esto en la consola:

   // Importar el módulo (esto debe estar disponible después de que la app cargue)
   import { runAuthDiagnosis, testRefreshToken } from '/src/utils/diagnosisAuth.js';
   
   // Ejecutar diagnóstico
   await runAuthDiagnosis();
   
   // Probar refresco de token
   await testRefreshToken();

3. O simplemente ejecuta en la consola:
   localStorage.getItem('sb-fnoebgtfnfecpgajzjpe-auth-token')
   
   Para ver qué hay en localStorage

POSIBLES CAUSAS DEL ERROR "Invalid Refresh Token":

1. ❌ El refresh token no se está guardando en localStorage
   Solución: Verificar que persistSession: true en supabase.js

2. ❌ El refresh token expiró (validos por 7 días por defecto)
   Solución: Hacer logout e login de nuevo

3. ❌ Incompatibilidad entre proyectos de Supabase
   Solución: Verificar que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY apunten al proyecto correcto

4. ❌ CORS o problema de red
   Solución: Revisar Network tab en DevTools

5. ❌ El usuario fue eliminado en Supabase
   Solución: Crear nuevo usuario y hacer login de nuevo
	`);
}
