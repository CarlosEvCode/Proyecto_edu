import React, {useState, useEffect} from 'react';

export function PersonalCard({personal, onClick}) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const getInitials = (nombres, apellidos) => {
		const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
		const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
		return firstInitial + lastInitial;
	};

	const initials = getInitials(personal.nombres, personal.apellidos);

	// Renderizar vista mobile
	if (isMobile) {
		return (
			<div
				onClick={onClick}
				className="personal-card personal-card-mobile"
				style={{
					background: 'white',
					border: '1px solid #d4d4d8',
					borderRadius: '10px',
					padding: '14px',
					cursor: 'pointer',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.transform = 'translateY(-2px)';
					e.currentTarget.style.boxShadow =
						'0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)';
					e.currentTarget.style.borderColor = '#1976d2';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = 'translateY(0)';
					e.currentTarget.style.boxShadow = 'none';
					e.currentTarget.style.borderColor = '#d4d4d8';
				}}
			>
				{/* Header: Avatar + Nombre */}
				<div
					className="card-header-mobile"
					style={{
						display: 'flex',
						gap: '12px',
						marginBottom: '12px',
						alignItems: 'flex-start',
					}}
				>
					<div
						className="avatar-small"
						style={{
							width: '40px',
							height: '40px',
							minWidth: '40px',
							borderRadius: '50%',
							background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '16px',
							fontWeight: '700',
							boxShadow: '0 2px 4px rgba(25, 118, 210, 0.3)',
						}}
					>
						{initials}
					</div>
					<div className="name-section-mobile" style={{flex: 1, minWidth: 0}}>
						<div
							className="name"
							style={{
								fontSize: '15px',
								fontWeight: '700',
								color: '#1a1a1a',
								marginBottom: '4px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								letterSpacing: '-0.3px',
							}}
						>
							{personal.apellidos}, {personal.nombres}
						</div>
						<div
							className="dni-mobile"
							style={{
								fontSize: '12px',
								color: '#64748b',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								fontWeight: '500',
							}}
						>
							<span className="material-icons" style={{fontSize: '12px'}}>
								badge
							</span>
							<span>{personal.dni}</span>
						</div>
					</div>
				</div>

				{/* Info chips: Código Modular, Cargo */}
				<div
					className="card-info-grid-mobile"
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						marginBottom: '12px',
					}}
				>
					{personal.plaza && personal.plaza.cargo && (
						<div
							className="info-chip academic"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '8px 12px',
								background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
								color: 'white',
								borderRadius: '8px',
								fontSize: '12px',
								fontWeight: '700',
								boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
								letterSpacing: '-0.2px',
							}}
						>
							<span className="material-icons" style={{fontSize: '14px'}}>
								work
							</span>
							<span>{personal.plaza.cargo.nombre}</span>
						</div>
					)}
					{personal.codigo_modular && (
						<div
							className="info-chip"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '8px 12px',
								background: '#f0f4f8',
								color: '#1a1a1a',
								borderRadius: '8px',
								fontSize: '12px',
								fontWeight: '600',
								letterSpacing: '-0.2px',
							}}
						>
							<span className="material-icons" style={{fontSize: '14px'}}>
								code
							</span>
							<span>{personal.codigo_modular}</span>
						</div>
					)}
				</div>

				{/* Info secundaria: Especialidad y Contacto */}
				<div
					className="card-secondary-info-mobile"
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
					}}
				>
					{personal.plaza && personal.plaza.especialidad ? (
						<div
							className="info-row"
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: '8px',
								fontSize: '12px',
								color: '#1a1a1a',
								fontWeight: '500',
							}}
						>
							<span
								className="material-icons icon"
								style={{fontSize: '18px', color: '#1976d2', marginTop: '2px'}}
							>
								school
							</span>
							<span className="text">{personal.plaza.especialidad.nombre}</span>
						</div>
					) : (
						<div
							className="info-row missing"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontSize: '12px',
								color: '#cbd5e1',
								fontStyle: 'italic',
								fontWeight: '500',
							}}
						>
							<span
								className="material-icons icon"
								style={{fontSize: '18px', marginTop: '2px'}}
							>
								school
							</span>
							<span className="text">Sin especialidad</span>
						</div>
					)}

					{personal.numero_celular ? (
						<div
							className="info-row"
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: '8px',
								fontSize: '12px',
								color: '#1a1a1a',
								fontWeight: '500',
							}}
						>
							<span
								className="material-icons icon"
								style={{fontSize: '18px', color: '#1976d2', marginTop: '2px'}}
							>
								phone
							</span>
							<span className="text">{personal.numero_celular}</span>
						</div>
					) : (
						<div
							className="info-row missing"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontSize: '12px',
								color: '#cbd5e1',
								fontStyle: 'italic',
								fontWeight: '500',
							}}
						>
							<span
								className="material-icons icon"
								style={{fontSize: '18px', marginTop: '2px'}}
							>
								phone_off
							</span>
							<span className="text">Sin teléfono</span>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			onClick={onClick}
			style={{
				background: 'white',
				border: '1px solid #e0e0e0',
				borderRadius: '8px',
				padding: '16px',
				cursor: 'pointer',
				transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
				display: 'flex',
				alignItems: 'center',
				gap: '16px',
				minHeight: '80px',
			}}
			className="personal-card"
			onMouseEnter={(e) => {
				e.currentTarget.style.transform = 'translateY(-1px)';
				e.currentTarget.style.boxShadow =
					'0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)';
				e.currentTarget.style.borderColor = '#42a5f5';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = 'translateY(0)';
				e.currentTarget.style.boxShadow = 'none';
				e.currentTarget.style.borderColor = '#e0e0e0';
			}}
		>
			{/* Avatar */}
			<div
				style={{
					width: '48px',
					height: '48px',
					minWidth: '48px',
					borderRadius: '50%',
					background: '#1976d2',
					color: 'white',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '16px',
					fontWeight: '600',
					flexShrink: 0,
					userSelect: 'none',
				}}
			>
				{initials}
			</div>

			{/* Info - Vista horizontal como lista */}
			<div
				style={{
					flex: 1,
					minWidth: 0,
					display: 'grid',
					gridTemplateColumns: '2.5fr 1.2fr 1.5fr 1.8fr 1.2fr',
					gap: '16px',
					alignItems: 'center',
				}}
			>
				{/* Sección de nombre y DNI */}
				<div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
					<div
						style={{
							fontSize: '15px',
							fontWeight: '600',
							color: '#212121',
							marginBottom: '4px',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{personal.apellidos}, {personal.nombres}
					</div>
					<div
						style={{
							fontSize: '13px',
							color: '#757575',
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
						}}
					>
						<span className="material-icons" style={{fontSize: '14px'}}>
							badge
						</span>
						<span>{personal.dni}</span>
					</div>
				</div>

				{/* Código Modular */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						textAlign: 'left',
						minWidth: '80px',
					}}
				>
					<div
						style={{
							fontSize: '11px',
							color: '#999',
							marginBottom: '4px',
							fontWeight: '500',
							textTransform: 'uppercase',
						}}
					>
						Código
					</div>
					<div
						style={{
							fontSize: '13px',
							color: '#212121',
							fontFamily: 'monospace',
							fontWeight: '500',
						}}
					>
						{personal.codigo_modular || 'N/A'}
					</div>
				</div>

				{/* Cargo */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						justifyContent: 'center',
						textAlign: 'left',
						gap: '6px',
						minWidth: '100px',
					}}
				>
					{personal.plaza && personal.plaza.cargo ? (
						<>
							<div
								style={{
									fontSize: '11px',
									color: '#999',
									fontWeight: '500',
									textTransform: 'uppercase',
								}}
							>
								Cargo
							</div>
							<span
								style={{
									padding: '4px 8px',
									background: '#1976d2',
									color: 'white',
									borderRadius: '6px',
									fontSize: '12px',
									fontWeight: '600',
									maxWidth: '100%',
									textAlign: 'center',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
								title={personal.plaza.cargo.nombre}
							>
								{personal.plaza.cargo.nombre}
							</span>
						</>
					) : (
						<>
							<div
								style={{
									fontSize: '11px',
									color: '#999',
									fontWeight: '500',
									textTransform: 'uppercase',
								}}
							>
								Cargo
							</div>
							<span
								style={{
									fontSize: '12px',
									color: '#bdbdbd',
									fontStyle: 'italic',
								}}
							>
								Sin asignar
							</span>
						</>
					)}
				</div>

				{/* Especialidad */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						minWidth: 0,
						maxWidth: '220px',
					}}
				>
					<div
						style={{
							fontSize: '11px',
							color: '#999',
							marginBottom: '4px',
							fontWeight: '500',
							textTransform: 'uppercase',
						}}
					>
						Especialidad
					</div>
					{personal.plaza && personal.plaza.especialidad ? (
						<div
							style={{
								fontSize: '13px',
								color: '#212121',
								fontWeight: '500',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								maxWidth: '100%',
							}}
							title={personal.plaza.especialidad.nombre}
						>
							{personal.plaza.especialidad.nombre}
						</div>
					) : (
						<div
							style={{
								fontSize: '13px',
								color: '#bdbdbd',
								fontStyle: 'italic',
							}}
						>
							Sin especialidad
						</div>
					)}
				</div>

				{/* Teléfono / Contacto */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						minWidth: '0',
					}}
				>
					<div
						style={{
							fontSize: '11px',
							color: '#999',
							marginBottom: '4px',
							fontWeight: '500',
							textTransform: 'uppercase',
						}}
					>
						Contacto
					</div>
					{personal.numero_celular ? (
						<div
							style={{
								fontSize: '13px',
								color: '#212121',
								fontFamily: 'monospace',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
							title={personal.numero_celular}
						>
							{personal.numero_celular}
						</div>
					) : (
						<div
							style={{
								fontSize: '12px',
								color: '#bdbdbd',
								fontStyle: 'italic',
							}}
						>
							-
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
