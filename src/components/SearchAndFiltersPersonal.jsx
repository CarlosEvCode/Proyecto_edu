import React, {useState, useRef} from 'react';
import {usePersonalContext} from '../context/PersonalContext';

export function SearchAndFiltersPersonal({onSearch, cargos, especialidades}) {
	const {filters, updateFilters, resetFilters} = usePersonalContext();
	const [showFilters, setShowFilters] = useState(false);

	const debounceRef = useRef(null);
	const handleSearchChange = (e) => {
		const value = e.target.value;
		updateFilters({search: value});

		// Debounce: esperar 300ms desde la última tecla antes de disparar onSearch
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			onSearch({...filters, search: value});
		}, 300);
	};

	const handleFilterChange = (filterName, value) => {
		const newFilters = {...filters, [filterName]: value};
		updateFilters(newFilters);
		onSearch(newFilters);
	};

	const handleClearFilters = () => {
		resetFilters();
		onSearch({
			search: '',
			cargo: '',
			especialidad: '',
			nivel: '',
			searchType: 'general',
		});
	};

	return (
		<>
			{/* Search bar */}
			<div className="search-bar">
				<span className="material-icons search-icon">search</span>
				<input
					type="text"
					placeholder="Buscar por nombre, apellido, DNI, código modular..."
					value={filters.search}
					onChange={handleSearchChange}
					className="search-input"
				/>
				<button
					onClick={() => setShowFilters(!showFilters)}
					className={`filter-toggle ${showFilters ? 'active' : ''}`}
				>
					<span className="material-icons">tune</span>
				</button>
			</div>

			{/* Filters panel */}
			{showFilters && (
				<div className="filters-panel show">
					{/* Cargo filter */}
					<div className="filter-group">
						<label>Cargo</label>
						<select
							value={filters.cargo}
							onChange={(e) => handleFilterChange('cargo', e.target.value)}
						>
							<option value="">Todos los cargos</option>
							{cargos.map((c) => (
								<option key={c.id} value={c.id}>
									{c.nombre}
								</option>
							))}
						</select>
					</div>

					{/* Especialidad filter */}
					<div className="filter-group">
						<label>Especialidad</label>
						<select
							value={filters.especialidad}
							onChange={(e) => handleFilterChange('especialidad', e.target.value)}
						>
							<option value="">Todas las especialidades</option>
							{especialidades.map((e) => (
								<option key={e.id} value={e.id}>
									{e.nombre}
								</option>
							))}
						</select>
					</div>

					{/* Search type filter */}
					<div className="filter-group">
						<label>Tipo de búsqueda</label>
						<select
							value={filters.searchType}
							onChange={(e) => handleFilterChange('searchType', e.target.value)}
						>
							<option value="general">General</option>
							<option value="personal">Solo personal</option>
							<option value="dni">Por DNI</option>
							<option value="codigo">Por Código Modular</option>
						</select>
					</div>

					{/* Clear filters button */}
					<button onClick={handleClearFilters} className="clear-filters">
						<span className="material-icons">clear</span>
						Limpiar filtros
					</button>
				</div>
			)}
		</>
	);
}
