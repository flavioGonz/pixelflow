# Guía de Instalación en Producción (Debian 13 LXC / Proxmox)

Este documento detalla los pasos para desplegar **PixelFlow** en un contenedor LXC con Debian 13.

## 1. Preparación del Contenedor en Proxmox
- **Imagen:** Debian 13 (Trixie).
- **Recursos recomendados:**
  - CPU: 2 cores.
  - RAM: 2GB (mínimo 1GB).
  - Disco: 20GB+.
- **Nesting:** Habilitar en las opciones del contenedor si es necesario (aunque para esta instalación estándar no es obligatorio).

## 2. Instalación Automática
Una vez dentro del contenedor, ejecuta los siguientes comandos:

```bash
# Actualizar e instalar git
apt update && apt install -y git

# Clonar el repositorio
git clone https://github.com/flavioGonz/pixelflow.git
cd pixelflow

# Ejecutar el script de configuración (instala Node.js, MongoDB y PM2)
sudo bash scripts/setup_debian.sh
```

## 2.1. Crear Usuario Administrador (IMPORTANTE)
Antes de iniciar la aplicación por primera vez, debes crear el usuario administrador por defecto:
```bash
# Crear usuario admin@pixelflow.com / admin123
node seed-admin.js
```

## 3. Configuración del Proyecto
```bash
# Instalar dependencias de Node
npm install

# Construir la aplicación (Next.js)
npm run build

# Crear el archivo .env
cp .env.example .env # Si existe, o créalo manualmente
nano .env
```
*Asegúrate de configurar `MONGODB_URI` a `mongodb://localhost:27017/pixelflow`.*

## 4. Lanzamiento con PM2
Utilizamos PM2 para que la aplicación se reinicie automáticamente si falla o si se reinicia el contenedor.

```bash
# Iniciar con perfil de producción
pm2 start ecosystem.config.js --env production

# Configurar inicio automático al boot
pm2 save
pm2 startup
# (Ejecuta el comando que te devuelva el comando anterior)
```

## 5. Actualizaciones Futuras
Para actualizar la versión en el cliente:
```bash
git pull origin main
npm install
npm run build
pm2 restart pixelflow
```
