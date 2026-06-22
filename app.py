import json
import os
import uuid
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import resend

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'rayitos-sol-admin-2026-xK9mN2pQ7r')

BASE_DIR      = os.path.dirname(__file__)
ALLOWED_EXT   = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

# Si DATA_DIR está definido (Railway con volumen), usar disco persistente
_DATA_DIR = os.environ.get('DATA_DIR', '')
if _DATA_DIR:
    CONTENT_FILE  = os.path.join(_DATA_DIR, 'content.json')
    UPLOAD_FOLDER = os.path.join(_DATA_DIR, 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    # Symlink static/img/uploads → volumen persistente
    _static_uploads = os.path.join(BASE_DIR, 'static', 'img', 'uploads')
    if not os.path.exists(_static_uploads):
        os.symlink(UPLOAD_FOLDER, _static_uploads)
else:
    CONTENT_FILE  = os.path.join(BASE_DIR, 'content.json')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'img', 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


# ── HELPERS ──

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

def load_content():
    default_path = os.path.join(BASE_DIR, 'content_default.json')
    with open(default_path, 'r', encoding='utf-8') as f:
        defaults = json.load(f)

    if not os.path.exists(CONTENT_FILE):
        save_content(defaults)
        return defaults

    with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Agrega keys nuevas de content_default que falten (migraciones)
    changed = False
    for key, val in defaults.items():
        if key not in data:
            data[key] = val
            changed = True
    if changed:
        save_content(data)

    return data

def save_content(data):
    with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated


# Inicializar contraseña por defecto si content.json no tiene hash
def init_admin_password():
    c = load_content()
    if not c['admin'].get('password_hash'):
        c['admin']['password_hash'] = generate_password_hash('admin123')
        save_content(c)

init_admin_password()


# ── RUTAS PÚBLICAS ──

@app.route('/')
def index():
    c = load_content()
    is_admin = session.get('admin_logged_in', False)
    return render_template('index.html', c=c, is_admin=is_admin)


@app.route('/contacto', methods=['POST'])
def contacto():
    c = load_content()
    data     = request.get_json()
    nombre   = data.get('nombre', '')
    telefono = data.get('telefono', '')
    nivel    = data.get('nivel', '')
    sede     = data.get('sede', '')
    mensaje  = data.get('mensaje', '')

    wa_num = telefono.replace(' ', '').replace('-', '').lstrip('0')

    html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f0ff; margin: 0; padding: 20px; }}
  .wrapper {{ max-width: 600px; margin: 0 auto; }}
  .header {{
    background: linear-gradient(135deg, #6B2FA0, #9B59B6);
    border-radius: 20px 20px 0 0;
    padding: 32px 36px;
    text-align: center;
  }}
  .header h1 {{ color: #FFD000; font-size: 22px; margin: 0; letter-spacing: 1px; }}
  .header p {{ color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }}
  .body {{
    background: #ffffff;
    padding: 32px 36px;
    border-left: 1px solid #e8d5ff;
    border-right: 1px solid #e8d5ff;
  }}
  .alert-badge {{
    background: #FFD000; color: #1A0A2E;
    font-weight: 800; font-size: 13px;
    padding: 8px 18px; border-radius: 999px;
    display: inline-block; margin-bottom: 20px;
  }}
  .title {{ color: #4A1D6E; font-size: 20px; font-weight: 700; margin: 0 0 6px; }}
  .subtitle {{ color: #888; font-size: 13px; margin: 0 0 24px; }}
  .card {{
    background: #faf5ff;
    border-radius: 14px;
    border-left: 4px solid #6B2FA0;
    padding: 18px 22px;
    margin-bottom: 14px;
  }}
  .card-label {{ font-size: 11px; font-weight: 700; color: #9B59B6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }}
  .card-value {{ font-size: 16px; font-weight: 700; color: #1A0A2E; }}
  .card.teal {{ border-left-color: #00B4C5; }}
  .card.teal .card-label {{ color: #00B4C5; }}
  .card.yellow {{ border-left-color: #C9A000; }}
  .card.yellow .card-label {{ color: #C9A000; }}
  .card.pink {{ border-left-color: #FF4FA3; }}
  .card.pink .card-label {{ color: #FF4FA3; }}
  .mensaje-box {{
    background: #f0fff8; border-radius: 14px;
    border: 1px dashed #4CAF7D;
    padding: 18px 22px; margin-top: 6px;
    color: #2D5A3D; font-size: 15px; line-height: 1.6;
  }}
  .cta {{ text-align: center; margin: 28px 0 8px; }}
  .cta a {{
    background: linear-gradient(135deg, #6B2FA0, #9B59B6);
    color: white; text-decoration: none;
    padding: 14px 32px; border-radius: 999px;
    font-weight: 700; font-size: 15px;
    display: inline-block;
  }}
  .footer {{
    background: #4A1D6E;
    border-radius: 0 0 20px 20px;
    padding: 20px 36px;
    text-align: center;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    line-height: 1.8;
  }}
  .footer strong {{ color: #FFD000; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>☀️ Rayitos de Sol</h1>
    <p>Centro de Desarrollo Infantil · Nueva solicitud de información</p>
  </div>
  <div class="body">
    <span class="alert-badge">🔔 Nueva solicitud recibida</span>
    <p class="title">¡Tienes un nuevo interesado!</p>
    <p class="subtitle">Un padre/madre de familia completó el formulario de contacto en tu sitio web.</p>
    <div class="card">
      <div class="card-label">👤 Nombre</div>
      <div class="card-value">{nombre}</div>
    </div>
    <div class="card teal">
      <div class="card-label">📞 Teléfono / WhatsApp</div>
      <div class="card-value">{telefono}</div>
    </div>
    <div class="card yellow">
      <div class="card-label">🎒 Nivel de interés</div>
      <div class="card-value">{nivel if nivel else 'No especificado'}</div>
    </div>
    <div class="card pink">
      <div class="card-label">📍 Sede de interés</div>
      <div class="card-value">{sede if sede else 'No especificada'}</div>
    </div>
    {'<p style="font-weight:700;color:#4A1D6E;margin:20px 0 8px;">💬 Mensaje del cliente:</p><div class="mensaje-box">' + mensaje + '</div>' if mensaje else ''}
    <div class="cta">
      <a href="https://wa.me/593{wa_num}">💬 Responder por WhatsApp</a>
    </div>
  </div>
  <div class="footer">
    <strong>Rayitos de Sol · Centro de Desarrollo Infantil</strong><br/>
    📍 {c['contacto']['sede_matriz']} &nbsp;|&nbsp; {c['contacto']['sede_milagro']}, Milagro<br/>
    📞 {c['contacto']['telefono']} &nbsp;|&nbsp; 📸 @rayitosdesol_ec<br/><br/>
    Este correo fue generado automáticamente desde tu sitio web.
  </div>
</div>
</body>
</html>
"""

    try:
        resend.api_key = os.environ.get('RESEND_API_KEY', '')
        resend.Emails.send({
            'from': 'Rayitos de Sol <noreply@rayitosdesolec.com>',
            'to': [c['contacto']['email_destino']],
            'subject': f'☀️ Nueva solicitud de {nombre} — Rayitos de Sol',
            'html': html
        })
        return jsonify({'ok': True})
    except Exception as e:
        print(f"Error email: {e}")
        return jsonify({'ok': False, 'error': str(e)})


# ── ADMIN: AUTH ──

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))
    error = None
    if request.method == 'POST':
        password = request.form.get('password', '')
        c = load_content()
        if check_password_hash(c['admin']['password_hash'], password):
            session['admin_logged_in'] = True
            return redirect(url_for('index'))
        error = 'Contraseña incorrecta. Intenta de nuevo.'
    return render_template('admin/login.html', error=error)

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))


# ── ADMIN: DASHBOARD ──

@app.route('/admin/')
@login_required
def admin_dashboard():
    c = load_content()
    return render_template('admin/dashboard.html', c=c)


# ── ADMIN: HERO ──

@app.route('/admin/hero', methods=['GET', 'POST'])
@login_required
def admin_hero():
    c = load_content()
    if request.method == 'POST':
        c['hero']['badge']          = request.form.get('badge', '')
        c['hero']['title_line1']    = request.form.get('title_line1', '')
        c['hero']['title_highlight'] = request.form.get('title_highlight', '')
        c['hero']['subtitle']       = request.form.get('subtitle', '')
        stats = []
        for i in range(3):
            stats.append({
                'num':   request.form.get(f'stat_num_{i}', ''),
                'label': request.form.get(f'stat_label_{i}', '')
            })
        c['hero']['stats'] = stats
        save_content(c)
        flash('Hero actualizado correctamente', 'success')
        return redirect(url_for('admin_hero'))
    return render_template('admin/hero.html', c=c)


# ── ADMIN: PRECIOS ──

@app.route('/admin/precios', methods=['GET', 'POST'])
@login_required
def admin_precios():
    c = load_content()
    if request.method == 'POST':
        for key in ['matricula', 'mensualidad', 'horario', 'inicio']:
            c['precios'][key] = request.form.get(key, '')
        save_content(c)
        flash('Precios actualizados correctamente', 'success')
        return redirect(url_for('admin_precios'))
    return render_template('admin/precios.html', c=c)


# ── ADMIN: NOSOTROS ──

@app.route('/admin/nosotros', methods=['GET', 'POST'])
@login_required
def admin_nosotros():
    c = load_content()
    if request.method == 'POST':
        c['nosotros']['text1'] = request.form.get('text1', '')
        c['nosotros']['text2'] = request.form.get('text2', '')
        checks = []
        for i in range(10):
            val = request.form.get(f'check_{i}', '').strip()
            if val:
                checks.append(val)
        c['nosotros']['checks'] = checks
        save_content(c)
        flash('Sección "Nosotros" actualizada', 'success')
        return redirect(url_for('admin_nosotros'))
    return render_template('admin/nosotros.html', c=c)


# ── ADMIN: PROGRAMAS ──

@app.route('/admin/programas', methods=['GET', 'POST'])
@login_required
def admin_programas():
    c = load_content()
    if request.method == 'POST':
        programas = []
        i = 0
        while f'nombre_{i}' in request.form:
            bullets = []
            for j in range(5):
                b = request.form.get(f'bullet_{i}_{j}', '').strip()
                if b:
                    bullets.append(b)
            programas.append({
                'icon':        request.form.get(f'icon_{i}', ''),
                'nombre':      request.form.get(f'nombre_{i}', ''),
                'edad':        request.form.get(f'edad_{i}', ''),
                'descripcion': request.form.get(f'descripcion_{i}', ''),
                'bullets':     bullets,
                'color':       request.form.get(f'color_{i}', '#6B2FA0')
            })
            i += 1
        c['programas'] = programas
        save_content(c)
        flash('Programas actualizados', 'success')
        return redirect(url_for('admin_programas'))
    return render_template('admin/programas.html', c=c)


# ── ADMIN: SERVICIOS ──

@app.route('/admin/servicios', methods=['GET', 'POST'])
@login_required
def admin_servicios():
    c = load_content()
    if request.method == 'POST':
        servicios = []
        i = 0
        while f'nombre_{i}' in request.form:
            servicios.append({
                'icon':        request.form.get(f'icon_{i}', ''),
                'nombre':      request.form.get(f'nombre_{i}', ''),
                'descripcion': request.form.get(f'descripcion_{i}', '')
            })
            i += 1
        c['servicios'] = servicios
        save_content(c)
        flash('Servicios actualizados', 'success')
        return redirect(url_for('admin_servicios'))
    return render_template('admin/servicios.html', c=c)


# ── ADMIN: GALERÍA ──

@app.route('/admin/galeria', methods=['GET', 'POST'])
@login_required
def admin_galeria():
    c = load_content()
    if request.method == 'POST':
        file = request.files.get('foto')
        if file and file.filename and allowed_file(file.filename):
            ext      = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            c['galeria'].append(f'img/uploads/{filename}')
            save_content(c)
            flash('Foto agregada correctamente', 'success')
        else:
            flash('Archivo no válido. Usa JPG, PNG o WEBP.', 'error')
    return render_template('admin/galeria.html', c=c)

@app.route('/admin/galeria/delete', methods=['POST'])
@login_required
def admin_galeria_delete():
    c    = load_content()
    path = request.form.get('path', '')
    if path in c['galeria']:
        c['galeria'].remove(path)
        if path.startswith('img/uploads/'):
            full = os.path.join(BASE_DIR, 'static', path)
            if os.path.exists(full):
                os.remove(full)
        save_content(c)
        flash('Foto eliminada', 'success')
    return redirect(url_for('admin_galeria'))


# ── ADMIN: PUBLICIDAD ──

@app.route('/admin/publicidad', methods=['GET', 'POST'])
@login_required
def admin_publicidad():
    c = load_content()
    if request.method == 'POST':
        c['publicidad']['activa']      = 'activa' in request.form
        c['publicidad']['titulo']      = request.form.get('titulo', '')
        c['publicidad']['texto']       = request.form.get('texto', '')
        c['publicidad']['link']        = request.form.get('link', '')
        c['publicidad']['color_fondo'] = request.form.get('color_fondo', '#6B2FA0')
        c['publicidad']['color_texto'] = request.form.get('color_texto', '#ffffff')
        save_content(c)
        flash('Publicidad actualizada', 'success')
        return redirect(url_for('admin_publicidad'))
    return render_template('admin/publicidad.html', c=c)


# ── ADMIN: CONTACTO ──

@app.route('/admin/contacto', methods=['GET', 'POST'])
@login_required
def admin_contacto():
    c = load_content()
    if request.method == 'POST':
        for key in ['sede_matriz', 'sede_milagro', 'telefono', 'horario',
                    'inicio_clases', 'instagram', 'whatsapp', 'email_destino']:
            c['contacto'][key] = request.form.get(key, '')
        c['email']['email_remitente'] = request.form.get('email_remitente', '')
        c['email']['email_password']  = request.form.get('email_password', '')
        save_content(c)
        flash('Datos de contacto actualizados', 'success')
        return redirect(url_for('admin_contacto'))
    return render_template('admin/contacto.html', c=c)


# ── ADMIN: SEGURIDAD ──

@app.route('/admin/seguridad', methods=['GET', 'POST'])
@login_required
def admin_seguridad():
    c     = load_content()
    error = None
    if request.method == 'POST':
        current  = request.form.get('current_password', '')
        new_pass = request.form.get('new_password', '')
        confirm  = request.form.get('confirm_password', '')
        if not check_password_hash(c['admin']['password_hash'], current):
            error = 'La contraseña actual es incorrecta'
        elif new_pass != confirm:
            error = 'Las contraseñas nuevas no coinciden'
        elif len(new_pass) < 6:
            error = 'La contraseña debe tener al menos 6 caracteres'
        else:
            c['admin']['password_hash'] = generate_password_hash(new_pass)
            save_content(c)
            flash('Contraseña actualizada correctamente', 'success')
            return redirect(url_for('admin_seguridad'))
    return render_template('admin/seguridad.html', c=c, error=error)


# ── VISUAL EDITOR API ──

@app.route('/admin/save-section', methods=['POST'])
@login_required
def admin_save_section():
    data    = request.get_json()
    section = data.get('section')
    values  = data.get('data')
    c = load_content()
    if section not in c:
        return jsonify({'ok': False, 'error': 'Sección no encontrada'}), 400
    if isinstance(c[section], list):
        c[section] = values
    else:
        c[section].update(values)
    save_content(c)
    return jsonify({'ok': True})


@app.route('/admin/upload-photo', methods=['POST'])
@login_required
def admin_upload_photo():
    file = request.files.get('foto')
    if not file or not file.filename or not allowed_file(file.filename):
        return jsonify({'ok': False, 'error': 'Archivo no válido'}), 400
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    path = f'img/uploads/{filename}'
    c = load_content()
    c['galeria'].append(path)
    save_content(c)
    return jsonify({'ok': True, 'path': path, 'url': f'/static/{path}'})


@app.route('/admin/delete-photo', methods=['POST'])
@login_required
def admin_delete_photo():
    data = request.get_json()
    path = data.get('path', '')
    c = load_content()
    if path not in c['galeria']:
        return jsonify({'ok': False}), 400
    c['galeria'].remove(path)
    if path.startswith('img/uploads/'):
        full = os.path.join(BASE_DIR, 'static', path)
        if os.path.exists(full):
            os.remove(full)
    save_content(c)
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(debug=True, port=5001)
