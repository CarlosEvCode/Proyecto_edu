import React, {useState, useEffect} from 'react';

export function StudentCard({student, onClick}) {
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

	const calculateAge = (birthDate) => {
		if (!birthDate) return 'N/A';
		const [year, month, day] = birthDate.split('-').map((num) => parseInt(num, 10));
		const birth = new Date(year, month - 1, day);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	};

	const initials = getInitials(student.nombres, student.apellidos);
	const age = calculateAge(student.fecha_nacimiento);

	// Renderizar vista mobile
	if (isMobile) {
		return (
			<div onClick={onClick} className="student-card student-card-mobile">
				{/* Header: Avatar + Nombre */}
				<div className="card-header-mobile">
					<div className="avatar-small">{initials}</div>
					<div className="name-section-mobile">
						<div className="name">
							{student.apellidos}, {student.nombres}
						</div>
						<div className="dni-mobile">
							<span className="material-icons" style={{fontSize: '12px'}}>
								badge
							</span>
							<span>{student.dni}</span>
						</div>
					</div>
				</div>

				{/* Info chips: Edad, Sexo, Académico */}
				<div className="card-info-grid-mobile">
					<div className="info-chip">
						<span className="material-icons" style={{fontSize: '14px'}}>
							cake
						</span>
						<span>
							{age} años | {student.sexo === 'M' ? 'M' : 'F'}
						</span>
					</div>

					{(student.grado || student.seccion) && (
						<div className="info-chip academic">
							<span className="material-icons" style={{fontSize: '14px'}}>
								school
							</span>
							<span>
								{student.grado}
								{student.grado && student.seccion && '° - '}
								{student.seccion}
							</span>
						</div>
					)}
				</div>

				{/* Info secundaria: Apoderado y Ubicación */}
				<div className="card-secondary-info-mobile">
					{student.apoderado ? (
						<div className="info-row">
							<span className="material-icons icon">person</span>
							<span className="text">
								{student.apoderado.nombres} {student.apoderado.apellidos}
							</span>
						</div>
					) : (
						<div className="info-row missing">
							<span className="material-icons icon">person_off</span>
							<span className="text">Sin apoderado</span>
						</div>
					)}

					{student.direccion ? (
						<div className="info-row">
							<span className="material-icons icon">place</span>
							<span className="text">
								{student.direccion.distrito}
								{student.direccion.provincia && `, ${student.direccion.provincia}`}
							</span>
						</div>
					) : (
						<div className="info-row missing">
							<span className="material-icons icon">location_off</span>
							<span className="text">Sin dirección</span>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Renderizar vista desktop (original)

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
			className="student-card"
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
					gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto',
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
						{student.apellidos}, {student.nombres}
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
						<span>{student.dni}</span>
					</div>
				</div>
				{/* Información personal */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						textAlign: 'center',
						minWidth: '80px',
					}}
				>
					<div
						style={{
							fontSize: '14px',
							fontWeight: '500',
							color: '#212121',
							marginBottom: '4px',
						}}
					>
						{age} años
					</div>
					<div
						style={{
							fontSize: '12px',
							color: '#757575',
							padding: '4px 8px',
							background: '#f5f5f5',
							borderRadius: '8px',
						}}
					>
						{student.sexo === 'M' ? 'M' : 'F'}
					</div>
				</div>
				{/* Académico */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						textAlign: 'center',
						gap: '6px',
						minWidth: '80px',
					}}
				>
					{student.grado && (
						<span
							style={{
								padding: '4px 8px',
								background: '#1976d2',
								color: 'white',
								borderRadius: '8px',
								fontSize: '11px',
								fontWeight: '600',
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
								minWidth: '30px',
								textAlign: 'center',
							}}
						>
							{student.grado}
						</span>
					)}
					{student.seccion && (
						<span
							style={{
								padding: '4px 8px',
								background: '#ffea3a',
								color: '#212121',
								borderRadius: '8px',
								fontSize: '11px',
								fontWeight: '600',
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
								minWidth: '30px',
								textAlign: 'center',
							}}
						>
							{student.seccion}
						</span>
					)}
				</div>{' '}
				{/* Apoderado */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						minWidth: 0,
						maxWidth: '200px',
					}}
				>
					{student.apoderado ? (
						<>
							<div
								style={{
									fontSize: '13px',
									color: '#212121',
									fontWeight: '500',
									marginBottom: '4px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{student.apoderado.nombres} {student.apoderado.apellidos}
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#757575',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
								}}
							>
								<span className="material-icons" style={{fontSize: '12px'}}>
									phone
								</span>
								<span>{student.apoderado.celular || 'Sin teléfono'}</span>
							</div>
						</>
					) : (
						<div
							style={{
								fontSize: '12px',
								color: '#bdbdbd',
								fontStyle: 'italic',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
							}}
						>
							<span className="material-icons" style={{fontSize: '14px'}}>
								person_off
							</span>
							<span>Sin apoderado</span>
						</div>
					)}
				</div>
				{/* Ubicación */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						textAlign: 'center',
						minWidth: '100px',
						maxWidth: '120px',
					}}
				>
					{student.direccion ? (
						<>
							<div
								style={{
									fontSize: '12px',
									color: '#212121',
									fontWeight: '500',
									marginBottom: '4px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									width: '100%',
								}}
							>
								{student.direccion.distrito}
							</div>
							<div
								style={{
									fontSize: '11px',
									color: '#757575',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									width: '100%',
								}}
							>
								{student.direccion.provincia}
							</div>
						</>
					) : (
						<div
							style={{
								fontSize: '11px',
								color: '#bdbdbd',
								fontStyle: 'italic',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								justifyContent: 'center',
							}}
						>
							<span className="material-icons" style={{fontSize: '14px'}}>
								location_off
							</span>
							<span>Sin dirección</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
