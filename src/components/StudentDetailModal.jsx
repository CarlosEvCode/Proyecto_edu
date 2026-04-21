import React, {useState, useEffect} from 'react';

export function StudentDetailModal({
	student,
	isOpen,
	onClose,
	onEdit,
	onDelete,
	grados = [],
	secciones = [],
}) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedData, setEditedData] = useState(null);

	useEffect(() => {
		if (student && isOpen) {
			setEditedData({
				...student,
				apoderado: student.apoderado || {
					nombres: '',
					apellidos: '',
					dni: '',
					fecha_nacimiento: '',
					celular: '',
				},
				direccion: student.direccion || {
					departamento: '',
					provincia: '',
					distrito: '',
					domicilio: '',
				},
			});
			setIsEditMode(false);
		}
	}, [student, isOpen]);

	const handleInputChange = (e) => {
		const {name, value} = e.target;
		if (name.startsWith('apoderado_')) {
			const field = name.replace('apoderado_', '');
			setEditedData(prev => ({
				...prev,
				apoderado: {...prev.apoderado, [field]: value}
			}));
		} else if (name.startsWith('direccion_')) {
			const field = name.replace('direccion_', '');
			setEditedData(prev => ({
				...prev,
				direccion: {...prev.direccion, [field]: value}
			}));
		} else {
			setEditedData(prev => ({...prev, [name]: value}));
		}
	};

	const handleSave = async () => {
		try {
			await onEdit(editedData);
			setIsEditMode(false);
		} catch (error) {
			console.error('Error al guardar:', error);
		}
	};

	if (!isOpen || !student || !editedData) return null;

	return (
		<div className="modal-overlay show" onClick={() => !isEditMode && onClose()}>
			<div className="modal" style={{maxWidth: '800px', width: '95%'}} onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>{isEditMode ? 'Editando Estudiante' : `${editedData.nombres} ${editedData.apellidos}`}</h3>
					<button className="modal-close" onClick={onClose}>×</button>
				</div>

				<div className="modal-content" style={{maxHeight: '70vh', overflowY: 'auto', padding: '20px'}}>
					{/* SECCIÓN ESTUDIANTE */}
					<div className="detail-section" style={{marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px'}}>
						<h4 style={{color: '#2563eb', marginBottom: '15px'}}>Información del Estudiante</h4>
						<div className="detail-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px'}}>
							<div className="detail-field">
								<label>Nombres *</label>
								{isEditMode ? <input name="nombres" value={editedData.nombres || ''} onChange={handleInputChange} /> : <span>{editedData.nombres}</span>}
							</div>
							<div className="detail-field">
								<label>Apellidos *</label>
								{isEditMode ? <input name="apellidos" value={editedData.apellidos || ''} onChange={handleInputChange} /> : <span>{editedData.apellidos}</span>}
							</div>
							<div className="detail-field">
								<label>DNI *</label>
								{isEditMode ? <input name="dni" value={editedData.dni || ''} onChange={handleInputChange} /> : <span>{editedData.dni}</span>}
							</div>
							<div className="detail-field">
								<label>Sexo</label>
								{isEditMode ? (
									<select name="sexo" value={editedData.sexo || ''} onChange={handleInputChange}>
										<option value="M">Masculino</option>
										<option value="F">Femenino</option>
									</select>
								) : <span>{editedData.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>}
							</div>
							<div className="detail-field">
								<label>Grado</label>
								{isEditMode ? (
									<select name="grado" value={editedData.grado || ''} onChange={handleInputChange}>
										<option value="">Sin Grado</option>
										{grados.map(g => <option key={g.grado} value={g.grado}>{g.grado}</option>)}
									</select>
								) : <span>{editedData.grado || 'N/A'}</span>}
							</div>
							<div className="detail-field">
								<label>Sección</label>
								{isEditMode ? (
									<select name="seccion" value={editedData.seccion || ''} onChange={handleInputChange}>
										<option value="">Sin Sección</option>
										{secciones.map(s => <option key={s.seccion} value={s.seccion}>{s.seccion}</option>)}
									</select>
								) : <span>{editedData.seccion || 'N/A'}</span>}
							</div>
						</div>
					</div>

					{/* SECCIÓN APODERADO - SIEMPRE VISIBLE */}
					<div className="detail-section" style={{marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px'}}>
						<h4 style={{color: '#2563eb', marginBottom: '15px'}}>Información del Apoderado</h4>
						<div className="detail-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px'}}>
							<div className="detail-field">
								<label>Nombres Apoderado</label>
								{isEditMode ? <input name="apoderado_nombres" value={editedData.apoderado?.nombres || ''} onChange={handleInputChange} /> : <span>{editedData.apoderado?.nombres || 'No registrado'}</span>}
							</div>
							<div className="detail-field">
								<label>Apellidos Apoderado</label>
								{isEditMode ? <input name="apoderado_apellidos" value={editedData.apoderado?.apellidos || ''} onChange={handleInputChange} /> : <span>{editedData.apoderado?.apellidos || 'No registrado'}</span>}
							</div>
							<div className="detail-field">
								<label>DNI Apoderado</label>
								{isEditMode ? <input name="apoderado_dni" value={editedData.apoderado?.dni || ''} onChange={handleInputChange} /> : <span>{editedData.apoderado?.dni || 'No registrado'}</span>}
							</div>
							<div className="detail-field">
								<label>Celular</label>
								{isEditMode ? <input name="apoderado_celular" value={editedData.apoderado?.celular || ''} onChange={handleInputChange} /> : <span>{editedData.apoderado?.celular || 'No registrado'}</span>}
							</div>
						</div>
					</div>

					{/* SECCIÓN DIRECCIÓN - SIEMPRE VISIBLE */}
					<div className="detail-section" style={{marginBottom: '20px'}}>
						<h4 style={{color: '#2563eb', marginBottom: '15px'}}>Dirección Domiciliaria</h4>
						<div className="detail-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px'}}>
							<div className="detail-field">
								<label>Departamento</label>
								{isEditMode ? <input name="direccion_departamento" value={editedData.direccion?.departamento || ''} onChange={handleInputChange} /> : <span>{editedData.direccion?.departamento || 'N/A'}</span>}
							</div>
							<div className="detail-field">
								<label>Provincia</label>
								{isEditMode ? <input name="direccion_provincia" value={editedData.direccion?.provincia || ''} onChange={handleInputChange} /> : <span>{editedData.direccion?.provincia || 'N/A'}</span>}
							</div>
							<div className="detail-field">
								<label>Distrito</label>
								{isEditMode ? <input name="direccion_distrito" value={editedData.direccion?.distrito || ''} onChange={handleInputChange} /> : <span>{editedData.direccion?.distrito || 'N/A'}</span>}
							</div>
							<div className="detail-field">
								<label>Domicilio</label>
								{isEditMode ? <input name="direccion_domicilio" value={editedData.direccion?.domicilio || ''} onChange={handleInputChange} style={{gridColumn: 'span 2'}} /> : <span>{editedData.direccion?.domicilio || 'N/A'}</span>}
							</div>
						</div>
					</div>
				</div>

				<div className="modal-footer" style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
					{!isEditMode ? (
						<>
							{onEdit && <button className="edit-toggle-btn" onClick={() => setIsEditMode(true)}>Editar Todo</button>}
							{onDelete && <button className="delete-btn" onClick={() => confirm('¿Eliminar?') && onDelete(student.id)}>Eliminar</button>}
							<button className="cancel-btn" onClick={onClose}>Cerrar</button>
						</>
					) : (
						<>
							<button className="save-btn" onClick={handleSave} style={{backgroundColor: '#2563eb', color: 'white'}}>Guardar Cambios</button>
							<button className="cancel-btn" onClick={() => setIsEditMode(false)}>Cancelar</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default StudentDetailModal;
