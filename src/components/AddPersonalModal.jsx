import React, {useState} from 'react';

export function AddPersonalModal({
	isOpen,
	onClose,
	onSave,
	cargos = [],
	especialidades = [],
	niveles = [],
	escalas = [],
	condiciones = [],
	sistemas = [],
	isLoading,
}) {
	const [formData, setFormData] = useState({
		nombres: '',
		apellidos: '',
		dni: '',
		fecha_nacimiento: '',
		numero_celular: '',
		codigo_modular: '',
		sistema_pensiones_id: '',
		fecha_inicio_ejercicio_general: '',
		plaza_codigo: '',
		resolucion_nombramiento: '',
		fecha_nombramiento_carrera: '',
		fecha_ingreso_institucion: '',
		cargo_id: '',
		especialidad_id: '',
		nivel_educativo_id: '',
		escala_magisterial_id: '',
		condicion_id: '',
		jornada_laboral: '',
		remuneracion_bruta: '',
	});

	const [errors, setErrors] = useState({});

	const handleInputChange = (e) => {
		const {name, value} = e.target;

		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error for this field
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = {...prev};
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.nombres.trim()) newErrors.nombres = 'Este campo es requerido';
		if (!formData.apellidos.trim()) newErrors.apellidos = 'Este campo es requerido';
		if (!formData.dni.trim()) newErrors.dni = 'Este campo es requerido';
		if (formData.dni && !/^[0-9A-Za-z]{1,12}$/.test(formData.dni)) {
			newErrors.dni = 'DNI inválido';
		}
		if (!formData.codigo_modular.trim())
			newErrors.codigo_modular = 'Este campo es requerido';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			onSave(formData);
			resetForm();
		}
	};

	const resetForm = () => {
		setFormData({
			nombres: '',
			apellidos: '',
			dni: '',
			fecha_nacimiento: '',
			numero_celular: '',
			codigo_modular: '',
			sistema_pensiones_id: '',
			fecha_inicio_ejercicio_general: '',
			plaza_codigo: '',
			resolucion_nombramiento: '',
			fecha_nombramiento_carrera: '',
			fecha_ingreso_institucion: '',
			cargo_id: '',
			especialidad_id: '',
			nivel_educativo_id: '',
			escala_magisterial_id: '',
			condicion_id: '',
			jornada_laboral: '',
			remuneracion_bruta: '',
		});
		setErrors({});
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay show" onClick={handleClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="modal-header">
					<h3>Agregar Nuevo Personal</h3>
					<button className="modal-close" onClick={handleClose} aria-label="Cerrar modal">
						×
					</button>
				</div>

				{/* Content - Scrollable */}
				<div className="modal-content" style={{maxHeight: '70vh', overflowY: 'auto'}}>
					{/* Información del Personal */}
					<div className="form-section">
						<h3>Información del Personal</h3>
						<div className="form-grid">
							<FormField
								label="Nombres *"
								name="nombres"
								value={formData.nombres}
								onChange={handleInputChange}
								error={errors.nombres}
								placeholder="Nombres del personal"
							/>
							<FormField
								label="Apellidos *"
								name="apellidos"
								value={formData.apellidos}
								onChange={handleInputChange}
								error={errors.apellidos}
								placeholder="Apellidos del personal"
							/>
							<FormField
								label="DNI *"
								name="dni"
								value={formData.dni}
								onChange={handleInputChange}
								error={errors.dni}
								placeholder="Documento de identidad"
								maxLength="12"
							/>
							<FormField
								label="Código Modular *"
								name="codigo_modular"
								value={formData.codigo_modular}
								onChange={handleInputChange}
								error={errors.codigo_modular}
								placeholder="Código modular de la institución"
								maxLength="20"
							/>
							<FormField
								label="Fecha de Nacimiento"
								name="fecha_nacimiento"
								type="date"
								value={formData.fecha_nacimiento}
								onChange={handleInputChange}
							/>
							<FormField
								label="Celular"
								name="numero_celular"
								value={formData.numero_celular}
								onChange={handleInputChange}
								placeholder="Ej: 987654321"
								maxLength="20"
							/>
						</div>
					</div>

					{/* Antigüedad y Servicio */}
					<div className="form-section">
						<h3>Antigüedad y Servicio</h3>
						<div className="form-grid">
							<SelectFormField
								label="Sistema de Pensiones"
								name="sistema_pensiones_id"
								value={formData.sistema_pensiones_id}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...sistemas.map((s) => ({value: s.id, label: s.nombre})),
								]}
							/>
							<FormField
								label="Fecha Inicio Ejercicio General"
								name="fecha_inicio_ejercicio_general"
								type="date"
								value={formData.fecha_inicio_ejercicio_general}
								onChange={handleInputChange}
							/>
						</div>
					</div>

					{/* Información de Plaza */}
					<div className="form-section">
						<h3>Información de Plaza</h3>
						<div className="form-grid">
							<FormField
								label="Código de Plaza"
								name="plaza_codigo"
								value={formData.plaza_codigo}
								onChange={handleInputChange}
								placeholder="Código de plaza (opcional)"
							/>
							<FormField
								label="Resolución de Nombramiento"
								name="resolucion_nombramiento"
								value={formData.resolucion_nombramiento}
								onChange={handleInputChange}
								placeholder="Ej: RES-2024-001"
							/>
							<FormField
								label="Fecha Nombramiento"
								name="fecha_nombramiento_carrera"
								type="date"
								value={formData.fecha_nombramiento_carrera}
								onChange={handleInputChange}
							/>
							<FormField
								label="Fecha Ingreso a Institución"
								name="fecha_ingreso_institucion"
								type="date"
								value={formData.fecha_ingreso_institucion}
								onChange={handleInputChange}
							/>
						</div>
					</div>

					{/* Datos de Puesto */}
					<div className="form-section">
						<h3>Datos de Puesto</h3>
						<div className="form-grid">
							<SelectFormField
								label="Cargo"
								name="cargo_id"
								value={formData.cargo_id}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...cargos.map((c) => ({value: c.id, label: c.nombre})),
								]}
							/>
							<SelectFormField
								label="Especialidad"
								name="especialidad_id"
								value={formData.especialidad_id}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...especialidades.map((e) => ({value: e.id, label: e.nombre})),
								]}
							/>
							<SelectFormField
								label="Nivel Educativo"
								name="nivel_educativo_id"
								value={formData.nivel_educativo_id}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...niveles.map((n) => ({value: n.id, label: n.nombre})),
								]}
							/>
							<SelectFormField
								label="Escala Magisterial"
								name="escala_magisterial_id"
								value={formData.escala_magisterial_id}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...escalas.map((e) => ({value: e.id, label: e.nombre})),
								]}
							/>
							<SelectFormField
								label="Condición"
								name="condicion_id"
								value={formData.condicion_id}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...condiciones.map((c) => ({value: c.id, label: c.nombre})),
								]}
							/>
						</div>
					</div>

					{/* Información Laboral */}
					<div className="form-section">
						<h3>Información Laboral</h3>
						<div className="form-grid">
							<FormField
								label="Jornada Laboral (horas)"
								name="jornada_laboral"
								type="number"
								value={formData.jornada_laboral}
								onChange={handleInputChange}
								placeholder="Ej: 40"
							/>
							<FormField
								label="Remuneración Bruta (S/.)"
								name="remuneracion_bruta"
								type="number"
								value={formData.remuneracion_bruta}
								onChange={handleInputChange}
								placeholder="Ej: 3500.00"
								step="0.01"
							/>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="modal-footer">
					<button className="cancel-btn" onClick={handleClose}>
						Cancelar
					</button>
					<button className="save-btn" onClick={handleSubmit} disabled={isLoading}>
						<span className="material-icons">
							{isLoading ? 'hourglass_empty' : 'person_add'}
						</span>
						{isLoading ? 'Guardando...' : 'Agregar Personal'}
					</button>
				</div>
			</div>
		</div>
	);
}

function FormField({
	label,
	name,
	value,
	onChange,
	error,
	type = 'text',
	placeholder = '',
	maxLength = '',
	step = '',
}) {
	return (
		<div className="form-field">
			<label>{label}</label>
			<input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				maxLength={maxLength}
				step={step}
				className={error ? 'error' : ''}
			/>
			{error && <span className="form-field-error">{error}</span>}
		</div>
	);
}

function SelectFormField({label, name, value, onChange, error, options}) {
	return (
		<div className="form-field">
			<label>{label}</label>
			<select
				name={name}
				value={value}
				onChange={onChange}
				className={error ? 'error' : ''}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{error && <span className="form-field-error">{error}</span>}
		</div>
	);
}
