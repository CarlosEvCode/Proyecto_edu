import React, {useState, useEffect} from 'react';

export function PersonalDetailModal({
	personal,
	isOpen,
	onClose,
	onEdit,
	onDelete,
	cargos = [],
	especialidades = [],
}) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedData, setEditedData] = useState(personal);

	useEffect(() => {
		if (personal) {
			setEditedData(personal);
			setIsEditMode(false);
		}
	}, [personal, isOpen]);

	const calculateAge = (birthDate) => {
		if (!birthDate) return 'N/A';
		const [year, month, day] = birthDate.split('-').map((n) => parseInt(n, 10));
		const birth = new Date(year, month - 1, day);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	};

	const calculateYearsOfService = (startDate) => {
		if (!startDate) return 'N/A';
		const [year, month, day] = startDate.split('-').map((n) => parseInt(n, 10));
		const start = new Date(year, month - 1, day);
		const today = new Date();
		let years = today.getFullYear() - start.getFullYear();
		const monthDiff = today.getMonth() - start.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
			years--;
		}
		return years;
	};

	const handleInputChange = (e) => {
		const {name, value} = e.target;
		if (name.startsWith('plaza_')) {
			const field = name.replace('plaza_', '');
			setEditedData((prev) => ({
				...prev,
				plaza: {...(prev.plaza || {}), [field]: value},
			}));
		} else {
			setEditedData((prev) => ({...prev, [name]: value}));
		}
	};

	const handleSave = () => {
		onEdit(editedData);
		setIsEditMode(false);
	};

	const handleCancel = () => {
		setEditedData(personal);
		setIsEditMode(false);
	};

	const handleClose = () => {
		if (isEditMode) {
			if (confirm('¿Descartar cambios?')) {
				setIsEditMode(false);
				onClose();
			}
		} else {
			onClose();
		}
	};

	if (!isOpen || !personal || !editedData) return null;

	const age = calculateAge(personal.fecha_nacimiento);

	return (
		<div className={`modal-overlay ${isOpen ? 'show' : ''}`} onClick={handleClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>
						{editedData.nombres} {editedData.apellidos}
					</h3>
					<button className="modal-close" onClick={handleClose} aria-label="Cerrar modal">
						×
					</button>
				</div>

				<div className="modal-content">
					<div className="detail-section">
						<h4>Información del Personal</h4>
						<div className="detail-grid">
							<DetailField
								label="Nombres"
								value={editedData.nombres}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="nombres"
								required
							/>
							<DetailField
								label="Apellidos"
								value={editedData.apellidos}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="apellidos"
								required
							/>
							<DetailField
								label="DNI"
								value={editedData.dni}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="dni"
								required
							/>
							<DetailField
								label="Código Modular"
								value={editedData.codigo_modular}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="codigo_modular"
								required
							/>
							<DetailField
								label="Fecha de Nacimiento"
								value={editedData.fecha_nacimiento}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="fecha_nacimiento"
								type="date"
							/>
							<DetailField label="Edad" value={`${age} años`} isEditMode={false} />
							<DetailField
								label="Celular"
								value={editedData.numero_celular}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="numero_celular"
							/>
						</div>
					</div>

					{/* Antigüedad y Servicio */}
					<div className="detail-section">
						<h4>Antigüedad y Servicio</h4>
						<div className="detail-grid">
							{editedData.sistema_pensiones && (
								<DetailField
									label="Sistema de Pensiones"
									value={editedData.sistema_pensiones.nombre}
									isEditMode={false}
								/>
							)}
							<DetailField
								label="Fecha Inicio Ejercicio General"
								value={editedData.fecha_inicio_ejercicio_general}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="fecha_inicio_ejercicio_general"
								type="date"
							/>
							{editedData.fecha_inicio_ejercicio_general && (
								<DetailField
									label="Años de Servicio General"
									value={`${calculateYearsOfService(
										editedData.fecha_inicio_ejercicio_general
									)} años`}
									isEditMode={false}
								/>
							)}
							{editedData.plaza && (
								<>
									<DetailField
										label="Resolución de Nombramiento"
										value={editedData.plaza.resolucion_nombramiento}
										isEditMode={isEditMode}
										onChange={handleInputChange}
										name="plaza_resolucion_nombramiento"
									/>
									<DetailField
										label="Fecha Nombramiento"
										value={editedData.plaza.fecha_nombramiento_carrera}
										isEditMode={isEditMode}
										onChange={handleInputChange}
										name="plaza_fecha_nombramiento_carrera"
										type="date"
									/>
									{editedData.plaza.fecha_nombramiento_carrera && (
										<DetailField
											label="Años desde Nombramiento"
											value={`${calculateYearsOfService(
												editedData.plaza.fecha_nombramiento_carrera
											)} años`}
											isEditMode={false}
										/>
									)}
									<DetailField
										label="Fecha Ingreso a Institución"
										value={editedData.plaza.fecha_ingreso_institucion}
										isEditMode={isEditMode}
										onChange={handleInputChange}
										name="plaza_fecha_ingreso_institucion"
										type="date"
									/>
									{editedData.plaza.fecha_ingreso_institucion && (
										<DetailField
											label="Años en la Institución"
											value={`${calculateYearsOfService(
												editedData.plaza.fecha_ingreso_institucion
											)} años`}
											isEditMode={false}
										/>
									)}
								</>
							)}
						</div>
					</div>

					{/* Plaza Info */}
					{editedData.plaza && (
						<div className="detail-section">
							<h4>Información de Plaza</h4>
							<div className="detail-grid">
								<DetailField
									label="Código de Plaza"
									value={editedData.plaza.codigo_plaza}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_codigo_plaza"
								/>
								{editedData.plaza.cargo && (
									<DetailField
										label="Cargo"
										value={editedData.plaza.cargo.nombre}
										isEditMode={false}
									/>
								)}
								{editedData.plaza.especialidad && (
									<DetailField
										label="Especialidad"
										value={editedData.plaza.especialidad.nombre}
										isEditMode={false}
									/>
								)}
								{editedData.plaza.nivel_educativo && (
									<DetailField
										label="Nivel Educativo"
										value={editedData.plaza.nivel_educativo.nombre}
										isEditMode={false}
									/>
								)}
								{editedData.plaza.escala_magisterial && (
									<DetailField
										label="Escala Magisterial"
										value={editedData.plaza.escala_magisterial.nombre}
										isEditMode={false}
									/>
								)}
								{editedData.plaza.condicion && (
									<DetailField
										label="Condición"
										value={editedData.plaza.condicion.nombre}
										isEditMode={false}
									/>
								)}
								{editedData.plaza.remuneracion_bruta && (
									<DetailField
										label="Remuneración Bruta"
										value={`S/. ${editedData.plaza.remuneracion_bruta}`}
										isEditMode={false}
									/>
								)}
								{editedData.plaza.jornada_laboral && (
									<DetailField
										label="Jornada Laboral (horas)"
										value={editedData.plaza.jornada_laboral}
										isEditMode={false}
									/>
								)}
							</div>
						</div>
					)}
				</div>

				<div className="modal-footer">
					{!isEditMode ? (
						<>
							<button className="edit-toggle-btn" onClick={() => setIsEditMode(true)}>
								Editar
							</button>
							<button
								className="delete-btn"
								onClick={() => {
									if (confirm('¿Estás seguro de eliminar este personal?')) {
										onDelete(personal.dni);
									}
								}}
							>
								Eliminar
							</button>
						</>
					) : (
						<>
							<button className="cancel-btn" onClick={handleCancel}>
								Cancelar
							</button>
							<button className="save-btn" onClick={handleSave}>
								Guardar Cambios
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function DetailField({
	label,
	value,
	isEditMode,
	onChange,
	name,
	type = 'text',
	required = false,
}) {
	return (
		<div className="detail-field">
			<label>
				{label}
				{required && <span className="field-required">*</span>}
			</label>
			{isEditMode ? (
				<input
					type={type}
					name={name}
					value={value || ''}
					onChange={onChange}
					required={required}
				/>
			) : (
				<span>{value || 'N/A'}</span>
			)}
		</div>
	);
}

export default PersonalDetailModal;
