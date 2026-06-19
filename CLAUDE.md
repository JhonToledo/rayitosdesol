# Rayitos de Sol v2 — Guía del Proyecto

## Stack
- **Backend:** Python 3 / Flask
- **Contenido:** `content.json` (fuente única de verdad, excluido de git)
- **Contenido por defecto:** `content_default.json` (incluido en git, sin credenciales)
- **Hosting:** Railway (`rayitosdesol-production.up.railway.app`)
- **Dominio:** `rayitosdesolec.com` (Cloudflare)
- **Repositorio:** `https://github.com/JhonToledo/rayitosdesol`

---

## Cuentas y accesos

| Servicio | Usuario | Notas |
|---|---|---|
| Railway | GitHub OAuth (JhonToledo) | Plan trial 30 días / luego Hobby $5/mes |
| Cloudflare | — | Dominio `rayitosdesolec.com`, proxy activo |
| GitHub | JhonToledo | Repo público `rayitosdesol` |
| PythonAnywhere | jtoledoc | Backup del sitio, webapp expirada |

---

## Flujo de deploy (Railway + GitHub)

**Cada cambio en el código se despliega así:**

1. Editar los archivos localmente
2. Hacer commit y push a GitHub:
   ```
   git add <archivos>
   git commit -m "descripción del cambio"
   git push https://JhonToledo:<TOKEN>@github.com/JhonToledo/rayitosdesol.git master
   ```
3. Railway detecta el push automáticamente y redespliega en ~1-2 minutos
4. Verificar en `https://rayitosdesolec.com`

**No se necesita tocar Railway manualmente para deploys normales.**

---

## Variables de entorno en Railway

| Variable | Descripción |
|---|---|
| `EMAIL_PASSWORD` | Contraseña de app Gmail para envío de correos |
| `SECRET_KEY` | Clave secreta de sesión Flask |

Para cambiarlas: Railway → proyecto `zucchini-solace` → servicio `rayitosdesol` → Variables.

---

## Archivos importantes

| Archivo | Descripción |
|---|---|
| `app.py` | Aplicación Flask principal con todas las rutas |
| `content.json` | Contenido editable del sitio (excluido de git) |
| `content_default.json` | Contenido inicial sin credenciales (incluido en git) |
| `Procfile` | Comando de arranque: `web: gunicorn app:app` |
| `requirements.txt` | Dependencias: flask, gunicorn |
| `static/css/editor.css` | Estilos del editor visual inline |
| `static/js/editor.js` | Editor visual (panel admin flotante) |
| `static/css/admin.css` | Estilos del panel admin `/admin/` |
| `templates/admin/` | Plantillas del panel de administración |

---

## Panel de administración

- **URL:** `https://rayitosdesolec.com/admin/login`
- **Contraseña por defecto:** `admin123` (cambiarla desde `/admin/seguridad`)
- **Editor visual:** iniciar sesión y navegar el sitio → botones de edición aparecen al pasar el mouse

---

## DNS (Cloudflare)

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | @ | `33r17smo.up.railway.app` |
| CNAME | www | `rayitosdesolec.com` |
| TXT | _railway-verify | `railway-verify=7cf84992...` |

SSL: modo **Flexible** (Cloudflare → Railway).

---

## Reglas del proyecto

1. **`content.json` nunca va a git** — contiene la contraseña de Gmail. Railway lo crea automáticamente desde `content_default.json` al primer inicio.
2. **`static/img/uploads/` nunca va a git** — fotos subidas por el admin.
3. **Cada cambio de código se sube a GitHub** — Railway redespliega solo.
4. **Los cambios de contenido hechos desde el admin NO persisten entre redeploys** — solo persisten hasta que se haga un nuevo push. Para cambios permanentes de contenido, editar `content_default.json`.
5. **Para subir el token de GitHub**, usar siempre un token clásico (`ghp_...`) con scope `repo`.

---

## Registro de cambios

| Fecha | Descripción |
|---|---|
| 2026-06-19 | Setup inicial del proyecto en Railway + dominio rayitosdesolec.com |
| 2026-06-19 | Subida de todos los archivos: app.py, editor visual, panel admin, content_default.json, Procfile |
| 2026-06-19 | Fix mobile: hero-bg cambiado a `position: absolute` en pantallas ≤900px para evitar que los blobs se filtren detrás de otras secciones |
| 2026-06-19 | Fix precio CTA: botón centrado en mobile |
| 2026-06-19 | DNS Cloudflare configurado: CNAME @ → Railway, CNAME www → dominio raíz |
| 2026-06-19 | Puerto de desarrollo local cambiado de 5000 a 5001 |
