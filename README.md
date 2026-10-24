# JK Down Bot — ToDus S3 Cloud Bridge (React Web Application)

Aplicación web interactiva escrita en **React 19 + TypeScript + Vite + Tailwind CSS**, reescrita a partir del bot de Telegram original de `@jakudoshy` preservando el 100% de la lógica de negocio, arquitectura de almacenamiento, cuotas, planes, cola FIFO y la estética terminal hacker cyberpunk.

## Características Principales Portadas

1. **Subida y Enlaces ToDus S3 (`s3.todus.cu/stream`)**:
   - Subida directa sin requerir cuentas, número telefónico ni contraseña de ToDus.
   - Generación de claves de objeto conformes: `users/tg_<id>/telegram/<timestamp>-<folder_id>/telegram_<file_id>_<safe_name>`.
   - Detección de MIME Types seguros (`.apk` con `application/vnd.android.package-archive` y disposición `attachment`, `.mp4` con `video/mp4`, `.zip`, etc.).
   - División de partes grandes (límite configurable de 1900 MiB por parte) en `.part001.ext` con instrucciones para recomponer con `cat archivo.part* > archivo`.
   - Generador y descargador de archivo `.txt` con los enlaces ToDus S3 para compartir fácilmente.

2. **Cola de Tareas Justa (Fair FIFO Queue)**:
   - Colas FIFO privadas por usuario con rotación justa para evitar bloqueos entre usuarios.
   - Estados: `queued`, `downloading`, `uploading`, `paused`, `completed`, `failed`.
   - Controles interactivos: Pausar, Reanudar, Cancelar y Eliminar tareas.
   - Respeto de los límites de cola según el plan del usuario (2 Gratis, 4 VIP Básico, 8 VIP Medio, 12 Premium, ∞ Creador).

3. **Sistema de Planes, Cuotas y Retención (TTL)**:
   - **Plan Gratis**: 2 GB diarios, 12 horas de retención en ToDus, 2 tareas en cola, recarga cada 2 días, 0$.
   - **VIP Básico**: 10 GB diarios, 24 horas de retención, 4 tareas en cola, recarga diaria, 250$.
   - **VIP Medio**: 15 GB diarios, 48 horas de retención, 8 tareas en cola, recarga diaria, 500$.
   - **Premium**: Ilimitado (∞ GB), 72 horas de retención, 12 tareas en cola, recarga diaria, 1000$.
   - **Creador (Owner)**: ∞ GB, 72 horas de retención, sin límite de cola.
   - Monitoreo de cuota diaria con cuenta regresiva en tiempo real al reinicio diario a las 00:00:00 UTC.

4. **Monedero Virtual y Sistema de Referidos**:
   - Saldo inicial de bienvenida de 5$.
   - Enlace personal de referidos: `https://t.me/Downfree_jk_bot?start=ref_<id>` con copia rápida.
   - Recompensas por referidos (10$ al invitar) para comprar planes VIP directamente.

5. **Historial y Purga de Nube ToDus S3**:
   - Historial de descargas con fecha de subida, tamaño, número de partes y fecha de expiración.
   - Eliminación individual de un archivo purgando el objeto de ToDus S3.
   - Vaciar todo el historial con confirmación de seguridad y mensaje de éxito: «El historial ha sido borrado con éxito».

6. **Ranking de la Comunidad (Top Usuarios)**:
   - Top 10 usuarios con más GB subidos preservando privacidad mediante máscaras (`••••1234`).
   - Contador de GB totales acumulados por la comunidad.

7. **Panel de Administración (/jkadmin)**:
   - Directorio de usuarios registrados paginado (10 usuarios por página).
   - Ficha de usuario: cambiar plan con días de duración personalizados, acreditar saldo ($) y purga de archivos.
   - Reporte acumulativo de auditoría de acciones administrativas.
   - Difusión masiva de anuncios a los usuarios registrados.
   - Motor de Respaldo y Restauración de datos compatible con el esquema JSON original.

8. **Terminal Telegram Simulator**:
   - Emulador interactivo de chat terminal cyberpunk con la tipografía Small Caps (`sc()`), tarjetas con corchetes (`┎ <b>...</b>`, `┠─...`, `┖ ⚡ <b>JK DOWN BOTꫂꤪꤨᴼᶠᶜ</b>`) y botones inline funcionales.

## Ejecución y Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Compilar para producción
npm run build
```
