# Sistema de Gestion Educativa

Aplicacion React + Vite con Supabase (Auth + Base de datos).

## Modulos

- Estudiantes (principal)
- Personal Docente (secundario)

## Requisitos

- Node.js v18+
- Variables de entorno de Supabase

## Variables de entorno

Crear un archivo `.env` con:

```
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Calidad

- Lint: `npm run lint`
- Build: `npm run build`
- CI en GitHub Actions: lint + build en cada Pull Request
