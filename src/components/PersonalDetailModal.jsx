import React, {useState, useEffect} from 'react';

export function PersonalDetailModal({
	personal,
	isOpen,
	onClose,
	onEdit,
	onDelete,
	cargos = [],
	especialidades = [],
	niveles = [],
	escalas = [],
	condiciones = [],
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
			// Convertir IDs a números
			let finalValue = value;
			if (field.endsWith('_id') && value) {
				finalValue = parseInt(value, 10);
			}
			setEditedData((prev) => ({
				...prev,
				plaza: {...(prev.plaza || {}), [field]: finalValue},
			}));
		} else {
			setEditedData((prev) => ({...prev, [name]: value}));
		}
	};

	const handleSave = () => {
		// Convertir IDs de cargo, especialidad, nivel, escala y condición a sus objetos
		const dataToSave = {...editedData};

		if (dataToSave.plaza) {
			if (dataToSave.plaza.cargo_id) {
				const cargoId =
					typeof dataToSave.plaza.cargo_id === 'string'
						? parseInt(dataToSave.plaza.cargo_id, 10)
						: dataToSave.plaza.cargo_id;
				const selectedCargo = cargos.find((c) => c.id === cargoId);
				if (selectedCargo) {
					dataToSave.plaza.cargo = selectedCargo;
					delete dataToSave.plaza.cargo_id;
				}
			}
			if (dataToSave.plaza.especialidad_id) {
				const especialidadId =
					typeof dataToSave.plaza.especialidad_id === 'string'
						? parseInt(dataToSave.plaza.especialidad_id, 10)
						: dataToSave.plaza.especialidad_id;
				const selectedEspecialidad = especialidades.find(
					(e) => e.id === especialidadId
				);
				if (selectedEspecialidad) {
					dataToSave.plaza.especialidad = selectedEspecialidad;
					delete dataToSave.plaza.especialidad_id;
				}
			}
			if (dataToSave.plaza.nivel_educativo_id) {
				const nivelId =
					typeof dataToSave.plaza.nivel_educativo_id === 'string'
						? parseInt(dataToSave.plaza.nivel_educativo_id, 10)
						: dataToSave.plaza.nivel_educativo_id;
				const selectedNivel = niveles.find((n) => n.id === nivelId);
				if (selectedNivel) {
					dataToSave.plaza.nivel_educativo = selectedNivel;
					delete dataToSave.plaza.nivel_educativo_id;
				}
			}
			if (dataToSave.plaza.escala_magisterial_id) {
				const escalaId =
					typeof dataToSave.plaza.escala_magisterial_id === 'string'
						? parseInt(dataToSave.plaza.escala_magisterial_id, 10)
						: dataToSave.plaza.escala_magisterial_id;
				const selectedEscala = escalas.find((e) => e.id === escalaId);
				if (selectedEscala) {
					dataToSave.plaza.escala_magisterial = selectedEscala;
					delete dataToSave.plaza.escala_magisterial_id;
				}
			}
			if (dataToSave.plaza.condicion_id) {
				const condicionId =
					typeof dataToSave.plaza.condicion_id === 'string'
						? parseInt(dataToSave.plaza.condicion_id, 10)
						: dataToSave.plaza.condicion_id;
				const selectedCondicion = condiciones.find((c) => c.id === condicionId);
				if (selectedCondicion) {
					dataToSave.plaza.condicion = selectedCondicion;
					delete dataToSave.plaza.condicion_id;
				}
			}
		}

		onEdit(dataToSave);
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
								<DetailField
									label="Cargo"
									value={
										editedData.plaza.cargo_id ||
										(editedData.plaza.cargo && editedData.plaza.cargo.id)
									}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_cargo_id"
									type="select"
									options={cargos}
								/>
								<DetailField
									label="Especialidad"
									value={
										editedData.plaza.especialidad_id ||
										(editedData.plaza.especialidad && editedData.plaza.especialidad.id)
									}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_especialidad_id"
									type="select"
									options={especialidades}
								/>
								<DetailField
									label="Nivel Educativo"
									value={
										editedData.plaza.nivel_educativo_id ||
										(editedData.plaza.nivel_educativo && editedData.plaza.nivel_educativo.id)
									}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_nivel_educativo_id"
									type="select"
									options={niveles}
								/>
								<DetailField
									label="Escala Magisterial"
									value={
										editedData.plaza.escala_magisterial_id ||
										(editedData.plaza.escala_magisterial && editedData.plaza.escala_magisterial.id)
									}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_escala_magisterial_id"
									type="select"
									options={escalas}
								/>
								<DetailField
									label="Condición"
									value={
										editedData.plaza.condicion_id ||
										(editedData.plaza.condicion && editedData.plaza.condicion.id)
									}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_condicion_id"
									type="select"
									options={condiciones}
								/>
								{editedData.plaza.remuneracion_bruta && (
									<DetailField
										label="Remuneración Bruta"
										value={`S/. ${editedData.plaza.remuneracion_bruta}`}
										isEditMode={false}
									/>
								)}
								<DetailField
									label="Jornada Laboral (horas)"
									value={editedData.plaza.jornada_laboral}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="plaza_jornada_laboral"
									type="number"
								/>
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
	options = [],
}) {
	// Para selects en modo lectura, encontrar el nombre del objeto
	let displayValue = value;
	if (!isEditMode && type === 'select' && typeof value === 'number') {
		const selectedOption = options.find((opt) => opt.id === value);
		displayValue = selectedOption ? selectedOption.nombre : value;
	}

	return (
		<div className="detail-field">
			<label>
				{label}
				{required && <span className="field-required">*</span>}
			</label>
			{isEditMode ? (
				type === 'select' ? (
					<select
						name={name}
						value={value !== null && value !== undefined ? String(value) : ''}
						onChange={onChange}
						required={required}
					>
						<option value="">Seleccionar...</option>
						{options.map((opt) => (
							<option key={opt.id} value={String(opt.id)}>
								{opt.nombre}
							</option>
						))}
					</select>
				) : (
					<input
						type={type}
						name={name}
						value={value || ''}
						onChange={onChange}
						required={required}
					/>
				)
			) : (
				<span>{displayValue || 'N/A'}</span>
			)}
		</div>
	);
}

export default PersonalDetailModal;
