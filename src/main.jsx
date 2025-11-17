import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter as Router} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import {PersonalProvider} from './context/PersonalContext';
import App from './App';
import './styles/main.css';

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Router>
			<AuthProvider>
				<PersonalProvider>
					<App />
				</PersonalProvider>
			</AuthProvider>
		</Router>
	</React.StrictMode>
);
