const DNI_REGEX = /^\d{8}$/;
const MODULAR_CODE_REGEX = /^[A-Za-z0-9-]{4,20}$/;

export function cleanText(value) {
	if (typeof value !== 'string') return '';
	return value.trim().replace(/\s+/g, ' ');
}

export function normalizeNullableText(value) {
	const cleaned = cleanText(value);
	return cleaned || null;
}

export function isValidDni(value) {
	return DNI_REGEX.test(String(value || '').trim());
}

export function isValidModularCode(value) {
	return MODULAR_CODE_REGEX.test(String(value || '').trim());
}

export function isValidDateString(value) {
	if (!value) return true;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00`);
	return !Number.isNaN(date.getTime());
}

export function isFutureDate(value) {
	if (!isValidDateString(value)) return false;
	const date = new Date(`${value}T00:00:00`);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return date > today;
}

export function assertRequired(fields, payload) {
	const missing = fields.filter((field) => !cleanText(payload[field]));
	if (missing.length > 0) {
		throw new Error(`Campos obligatorios: ${missing.join(', ')}`);
	}
}

export function assertValidDni(value, label = 'DNI') {
	if (!isValidDni(value)) {
		throw new Error(`${label} inválido. Debe tener 8 dígitos`);
	}
}

export function assertValidBirthDate(value, label = 'Fecha de nacimiento') {
	if (!value) return;
	if (!isValidDateString(value)) {
		throw new Error(`${label} inválida`);
	}
	if (isFutureDate(value)) {
		throw new Error(`${label} no puede ser futura`);
	}
}

export function assertValidModularCode(value) {
	if (!isValidModularCode(value)) {
		throw new Error('Código modular inválido');
	}
}
