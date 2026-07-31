# PixelFlow para LG WebOS — Guía de instalación

## Qué es esto

`pixelflow_1.0.0_all.ipk` es la app PixelFlow empaquetada como app nativa WebOS para tu **LG Smart Monitor Swing 32U889SA-W** (u otro monitor/TV LG con WebOS 3.0+).

Al instalarla, aparece un ícono **PixelFlow** en el launcher del monitor. Al abrirlo:

1. **Primera vez** → muestra una lista de todas las pantallas registradas en el server (con estado online/offline). Tocás la que corresponde y queda memorizada.
2. **Siguientes veces** → arranca directo al player en fullscreen, sin barras del navegador.

Ideal para 4-10 pantallas: instalás el mismo `.ipk` en cada monitor, y en cada uno elegís su pantalla del selector.

**Truco escondido:** para resetear la pantalla asignada (si mezclaste dos monitores), mantené el dedo apretado 5 segundos en la esquina superior izquierda.

---

## Paso 1 — Activar Developer Mode en el monitor

1. En el monitor, abrí el launcher (botón "casita" del control remoto o botón principal del monitor).
2. Andá a **Content Store / Apps** → buscá **"Developer Mode"** → instalá (gratis).
3. Abrí la app Developer Mode.
4. Registrate en https://webostv.developer.lge.com/ (cuenta gratis con email).
5. Iniciá sesión desde la app Developer Mode del monitor con esa cuenta.
6. Activá **"Dev Mode Status"**. Reiniciá el monitor si te lo pide.
7. Anotá la **IP del monitor** y el **PIN** que muestra la app Developer Mode. Los vas a necesitar.

> ⚠️ La sesión de Developer Mode **expira cada 50 horas**. Volvés a la app y tocás "renovar". No pasa nada — la app instalada sigue andando incluso con Dev Mode desactivado, sólo no podés instalar más apps hasta renovarlo.

---

## Paso 2 — Instalar el `.ipk` en el monitor

Tenés **tres formas** de instalar. Elegí la más cómoda:

### Opción A — Con `ares-install` desde tu PC (recomendada)

En tu PC (Windows/Mac/Linux):

```bash
# Instalar ares-cli (una vez)
npm install -g @webosose/ares-cli

# Registrar el monitor (una vez)
ares-setup-device --add lgtv --info "host=IP_DEL_MONITOR port=9922 username=prisoner passphrase=PIN_DEL_MONITOR"

# Instalar el .ipk
ares-install --device lgtv pixelflow_1.0.0_all.ipk
```

Cuando termine, el ícono **PixelFlow** aparece en el launcher del monitor.

### Opción B — Con USB pendrive

1. Copiá `pixelflow_1.0.0_all.ipk` a la raíz de un pendrive FAT32.
2. Enchufá el pendrive al monitor.
3. Desde el launcher, buscá **File Manager** (o "Almacenamiento") → USB → tocá el `.ipk` → **Instalar**.
4. Si no aparece la opción "Instalar", tu WebOS es una versión que requiere Developer Mode activo (Opción A).

### Opción C — Con el WebOS Dev Manager (interfaz gráfica)

1. En tu PC, descargá **WebOS Dev Manager**: https://webostv.developer.lge.com/develop/tools/dev-manager-desktop/
2. Abrí la app, agregá tu monitor con IP+PIN.
3. Menú **"Install app from package (.ipk)"** → seleccionás `pixelflow_1.0.0_all.ipk` → clic.
4. Aparece PixelFlow en el launcher.

---

## Paso 3 — Configurar auto-arranque (opcional pero recomendado)

Para que el monitor abra PixelFlow apenas se enciende, en vez de mostrar el launcher:

1. En el launcher del monitor: **Config** → **General** → **App al iniciar** (nombre puede variar) → **PixelFlow**.
2. Si tu WebOS no tiene esa opción, activá **"Simplink"** y **"Auto-encendido HDMI"** → cada vez que se prende el monitor arranca directo.

En **LG Signage/consumer** más nuevos también hay: **Config** → **Sistema** → **App autoarranque** → PixelFlow.

---

## Paso 4 — Probar

1. Abrí **PixelFlow** desde el launcher.
2. Aparece el splash "PixelFlow · Digital Signage".
3. Después de ~1 segundo, muestra la lista de pantallas registradas.
4. Tocá la que corresponde (ej: "pantalla-01") → se abre el player en fullscreen.

Si el monitor no aparece registrado todavía, abrí el player desde el admin (`https://altosdelarapey.infratec.com.uy/admin/screens` → "Copiar URL") una vez desde el navegador web para que se registre, después reabrí la app y ya aparece.

---

## Actualizar la app

Cuando salga una nueva versión (`pixelflow_1.1.0_all.ipk`, etc):

```bash
ares-install --device lgtv pixelflow_1.1.0_all.ipk
```

Se reemplaza en el monitor. El screenId asignado se conserva (queda en localStorage de WebOS).

> **Nota importante:** el .ipk es sólo un contenedor liviano de <10KB que apunta a `https://altosdelarapey.infratec.com.uy/player/<id>`. Todos los cambios que hago al player (transiciones, widgets, media, etc.) se aplican **automáticamente sin reinstalar** — el monitor levanta la última versión al recargar. Sólo re-instalás el .ipk si cambia la URL del servidor o el flujo de setup.

---

## Cambiar la URL del servidor

Si movés el servidor a otro dominio, hay que rebuild el .ipk. Editás en `index.html` la línea:

```js
var SERVER_URL = 'https://altosdelarapey.infratec.com.uy';
```

Y lo empaquetás de nuevo. O me pedís que te genere el `.ipk` nuevo.

---

## Fallback si nada funciona en tu monitor

Si por algún motivo el monitor no acepta el `.ipk` (versión de WebOS muy nueva o restricciones raras):

**Opción manual sin instalación:** abrís el **Web Browser** del monitor y navegás a:

```
https://altosdelarapey.infratec.com.uy/player/<screenId>
```

Después → menú del navegador → **Agregar a favoritos**. No es fullscreen kiosko real (sale con el botón Home del control) pero funciona sin instalar nada.

---

## Soporte

Si algo no anda, corré desde tu PC:

```bash
ares-inspect --device lgtv --app uy.com.infratec.pixelflow
```

Y me pasás el log — puedo diagnosticar remoto.
