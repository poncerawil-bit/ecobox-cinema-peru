# Ecobox Cinema Peru — Prototipo Web (listo para desplegar)

Este paquete contiene un prototipo **listo para desplegar** (frontend React + backend Express mínimo).
Las funcionalidades de **QR**, **reservas** y **snacks** están activas en el frontend (modo demo si no configuras Firebase).

## Qué incluye
- Frontend React (`src/`)
- Backend Express (`server/index.js`) — para Stripe y webhooks
- `.env.example` con variables necesarias
- `package.json` con scripts

## Cómo probar localmente (opcional)
1. Descomprime el ZIP en tu PC.
2. Abre una terminal en la carpeta del proyecto.
3. Ejecuta:
   ```bash
   npm install
   npm run start:all
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4242

> Si no quieres instalar nada, salta a la sección *Desplegar en Netlify (fácil)*.

## Desplegar en Vercel (recomendado)
Opción A — usando GitHub (recomendado, paso a paso):
1. Crea una cuenta en https://github.com y sube el contenido a un repositorio nuevo (arrastra y suelta los archivos).
2. Ve a https://vercel.com, crea cuenta y conecta tu repositorio.
3. Vercel detectará el proyecto React. Selecciona 'Deploy'.
4. En Settings > Environment Variables agrega las variables de `.env.example` que necesites (solo las de frontend empiezan por REACT_APP_).
5. Para el backend (si vas a usar Stripe) puedes desplegar `server/` en Render, Railway o Heroku y configurar las variables de entorno allí.

Opción B — si NO quieres usar Git:
- Vercel recomienda conectar repositorios, pero si prefieres evitar Git puedes usar **Netlify Drop** (siguiente sección).

## Desplegar en Netlify (muy fácil — sin Git)
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `build` resultante (si no tienes `build`, primero ejecuta `npm run build` localmente y usa la carpeta `build`).
3. Netlify hará el resto y te dará una URL pública.

## Notas importantes
- NUNCA expongas **claves secretas** (Stripe secret) en el frontend.
- Si quieres que yo haga el despliegue por ti, puedo guiarte paso a paso o preparar el repo en GitHub y conectar a Vercel.

## Soporte
Dime si quieres:
- Que genere el ZIP con todo (ya está listo en este paquete) y te lo entregue.
- O que suba el repo a GitHub y lo conecte a Vercel por ti (necesitaré acceso o que me compartas permisos).
