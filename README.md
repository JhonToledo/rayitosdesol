# 🌟 Rayitos de Sol – Sitio Web

Proyecto Flask del Instituto de Educación Inicial **Rayitos de Sol**.

## Estructura del proyecto

```
rayitos_de_sol/
├── app.py                  ← Archivo principal Flask
├── requirements.txt        ← Dependencias
├── templates/
│   └── index.html          ← Página principal
└── static/
    ├── css/
    │   └── style.css       ← Estilos
    └── js/
        └── main.js         ← Interactividad
```

## Cómo correr en PyCharm

1. **Abre el proyecto** en PyCharm (File → Open → selecciona la carpeta `rayitos_de_sol`)

2. **Crea un entorno virtual** (recomendado):
   - Ve a File → Settings → Python Interpreter
   - Haz clic en el engranaje → Add → Virtualenv Environment → OK

3. **Instala las dependencias** en la terminal integrada:
   ```bash
   pip install -r requirements.txt
   ```

4. **Corre la aplicación**:
   - Haz clic derecho en `app.py` → Run 'app'
   - O en la terminal: `python app.py`

5. **Abre en el navegador**: http://127.0.0.1:5000

## Cómo personalizar

Edita directamente estos archivos:

| Qué cambiar | Dónde |
|---|---|
| Textos, secciones | `templates/index.html` |
| Colores, fuentes, tamaños | `static/css/style.css` |
| Teléfono, dirección, correo | Busca en `index.html` los campos de contacto |
| Instagram/WhatsApp | Busca `href` con instagram.com o wa.me |

## Cómo subir a Internet (deploy)

### Opción 1 – PythonAnywhere (gratis, fácil)
1. Crea cuenta en https://www.pythonanywhere.com
2. Sube la carpeta del proyecto
3. Configura una web app Flask → apunta a `app.py`

### Opción 2 – Render.com (gratis)
1. Sube el proyecto a GitHub
2. Conéctalo en https://render.com
3. Selecciona Python + `python app.py` como comando

### Opción 3 – Hosting compartido cPanel
1. Instala Python en cPanel
2. Sube los archivos por FTP
3. Configura WSGI apuntando a `app.py`
