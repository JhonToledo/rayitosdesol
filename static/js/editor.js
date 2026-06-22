/* ── RAYITOS DE SOL · VISUAL EDITOR ── */
(function () {
  'use strict';

  let currentSection = null;
  let drawerEl, overlayEl;

  /* ── Helpers ── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setText(sel, value) {
    $$(sel).forEach(el => { el.textContent = value; });
  }

  function val(key) {
    const el = drawerEl.querySelector(`[data-key="${key}"]`);
    return el ? el.value : '';
  }

  function setIndicator(state, msg) {
    const el = $('#saveIndicator');
    if (!el) return;
    el.className = 'save-indicator ' + state;
    el.textContent = msg;
  }

  /* ══════════════════════════════════════
     SECTIONS CONFIG
  ══════════════════════════════════════ */
  const SECTIONS = {

    /* ── HERO ── */
    hero: {
      label: '✨ Hero / Portada',
      selector: '#inicio',
      renderForm(d) {
        return `
          <div class="df"><label>Badge de anuncio</label>
            <input type="text" data-key="badge" value="${esc(d.badge)}"/></div>
          <div class="two-col">
            <div class="df" style="margin:0"><label>Título línea 1</label>
              <input type="text" data-key="title_line1" value="${esc(d.title_line1)}"/></div>
            <div class="df" style="margin:0"><label>Título resaltado</label>
              <input type="text" data-key="title_highlight" value="${esc(d.title_highlight)}"/></div>
          </div>
          <div class="df"><label>Subtítulo</label>
            <textarea data-key="subtitle" rows="3">${esc(d.subtitle)}</textarea></div>
          <div class="drawer-sep">Estadísticas (3 números)</div>
          ${d.stats.map((s, i) => `
          <div class="two-col" style="margin-bottom:8px;">
            <div class="df" style="margin:0"><label>Número ${i+1}</label>
              <input type="text" data-key="stats_${i}_num" value="${esc(s.num)}"/></div>
            <div class="df" style="margin:0"><label>Etiqueta ${i+1}</label>
              <input type="text" data-key="stats_${i}_label" value="${esc(s.label)}"/></div>
          </div>`).join('')}`;
      },
      onInput(key, v) {
        if (key === 'badge')           setText('[data-field="hero.badge"]', v);
        if (key === 'title_line1')     setText('[data-field="hero.title_line1"]', v);
        if (key === 'title_highlight') setText('[data-field="hero.title_highlight"]', v);
        if (key === 'subtitle')        setText('[data-field="hero.subtitle"]', v);
        const m = key.match(/^stats_(\d+)_(num|label)$/);
        if (m) setText(`[data-field="hero.stats.${m[1]}.${m[2]}"]`, v);
      },
      collectData() {
        const stats = window.SITE_CONTENT.hero.stats.map((_, i) => ({
          num:   val(`stats_${i}_num`),
          label: val(`stats_${i}_label`)
        }));
        return { badge: val('badge'), title_line1: val('title_line1'),
                 title_highlight: val('title_highlight'), subtitle: val('subtitle'), stats };
      }
    },

    /* ── PRECIOS ── */
    precios: {
      label: '💰 Precios / Banner',
      selector: '.precio-banner',
      renderForm(d) {
        return `
          <div class="two-col">
            <div class="df" style="margin:0"><label>Matrícula</label>
              <input type="text" data-key="matricula" value="${esc(d.matricula)}"/></div>
            <div class="df" style="margin:0"><label>Mensualidad</label>
              <input type="text" data-key="mensualidad" value="${esc(d.mensualidad)}"/></div>
          </div>
          <div class="two-col" style="margin-top:10px;">
            <div class="df" style="margin:0"><label>Horario</label>
              <input type="text" data-key="horario" value="${esc(d.horario)}"/></div>
            <div class="df" style="margin:0"><label>Inicio de clases</label>
              <input type="text" data-key="inicio" value="${esc(d.inicio)}"/></div>
          </div>`;
      },
      onInput(key, v) {
        const map = { matricula: 'precios.matricula', mensualidad: 'precios.mensualidad',
                      horario: 'precios.horario', inicio: 'precios.inicio' };
        if (map[key]) setText(`[data-field="${map[key]}"]`, v);
      },
      collectData() {
        return { matricula: val('matricula'), mensualidad: val('mensualidad'),
                 horario: val('horario'), inicio: val('inicio') };
      }
    },

    /* ── NOSOTROS ── */
    nosotros: {
      label: '🏫 Nosotros',
      selector: '.nosotros',
      renderForm(d) {
        return `
          <div class="df"><label>Párrafo 1</label>
            <textarea data-key="text1" rows="4">${esc(d.text1)}</textarea></div>
          <div class="df"><label>Párrafo 2</label>
            <textarea data-key="text2" rows="4">${esc(d.text2)}</textarea></div>
          <div class="drawer-sep">Checkmarks</div>
          <div class="checks-wrap" id="checksWrap">
            ${d.checks.map((c, i) => `
            <div class="brow">
              <input type="text" data-key="check_${i}" value="${esc(c)}"/>
              <button type="button" class="btn-rem-b" onclick="this.parentElement.remove()">✕</button>
            </div>`).join('')}
          </div>
          <button type="button" class="btn-add-b" onclick="addCheck()">+ Agregar punto</button>`;
      },
      onInput(key, v) {
        if (key === 'text1') setText('[data-field="nosotros.text1"]', v);
        if (key === 'text2') setText('[data-field="nosotros.text2"]', v);
        const m = key.match(/^check_(\d+)$/);
        if (m) setText(`[data-field="nosotros.checks.${m[1]}"]`, v);
      },
      collectData() {
        const checks = [];
        drawerEl.querySelectorAll('[data-key^="check_"]').forEach(el => {
          if (el.value.trim()) checks.push(el.value.trim());
        });
        return { text1: val('text1'), text2: val('text2'), checks };
      },
      onSave(data) {
        const list = $('.check-list');
        if (list) list.innerHTML = data.checks.map((c, i) =>
          `<div class="check-item"><span>✅</span> <span data-field="nosotros.checks.${i}">${c}</span></div>`
        ).join('');
      }
    },

    /* ── PROGRAMAS ── */
    programas: {
      label: '🎒 Programas',
      selector: '.programas',
      renderForm(d) {
        return `
          <div id="progsWrap">
            ${d.map((p, i) => renderProgCard(p, i)).join('')}
          </div>
          <button type="button" class="btn-add-dcard" onclick="addProgCard()">+ Agregar programa</button>`;
      },
      onInput() {},
      collectData() {
        return collectPrograms();
      },
      onSave(data) {
        const grid = $('.programas-grid');
        if (grid) grid.innerHTML = data.map(p => `
          <div class="programa-card" style="--c:${p.color}">
            <div class="prog-icon">${p.icon}</div>
            <h3>${p.nombre}</h3>
            <p class="prog-age">${p.edad}</p>
            <p>${p.descripcion}</p>
            <ul>${p.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          </div>`).join('');
        // Update contact form dropdown
        const sel = $('#f-nivel');
        if (sel) {
          const first = sel.options[0];
          sel.innerHTML = '';
          sel.appendChild(first);
          data.forEach(p => {
            const opt = document.createElement('option');
            opt.textContent = p.nombre + (p.edad ? ` (${p.edad})` : '');
            sel.appendChild(opt);
          });
        }
      }
    },

    /* ── SERVICIOS ── */
    servicios: {
      label: '⭐ Servicios',
      selector: '.servicios',
      renderForm(d) {
        return `
          <div id="svcsWrap">
            ${d.map((s, i) => renderSvcCard(s, i)).join('')}
          </div>
          <button type="button" class="btn-add-dcard" onclick="addSvcCard()">+ Agregar servicio</button>`;
      },
      onInput() {},
      collectData() { return collectServices(); },
      onSave(data) {
        const grid = $('.servicios-grid');
        if (grid) grid.innerHTML = data.map(s => `
          <div class="servicio-card">
            <div class="serv-icon">${s.icon}</div>
            <h3>${s.nombre}</h3>
            <p>${s.descripcion}</p>
          </div>`).join('');
      }
    },

    /* ── GALERÍA ── */
    galeria: {
      label: '📸 Galería',
      selector: '.galeria',
      renderForm(d) {
        return `
          <div class="upload-zone" id="uploadZone" onclick="$('#photoFileInput').click()">
            <input type="file" id="photoFileInput" accept="image/*" multiple/>
            <div class="upload-zone-icon">📸</div>
            <div class="upload-zone-text">Haz clic o arrastra fotos aquí</div>
            <div class="upload-zone-sub">JPG, PNG, WEBP · Máximo 16 MB</div>
            <div class="upload-progress" id="uploadProgress"></div>
          </div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:10px;">${d.length} foto${d.length!==1?'s':''} · pasa el cursor sobre una foto para eliminarla</div>
          <div class="drawer-gal-grid" id="drawerGalGrid">
            ${d.map(f => galThumb(f)).join('')}
          </div>`;
      },
      onInput() {},
      collectData() { return null; }
    },

    /* ── PUBLICIDAD ── */
    publicidad: {
      label: '📢 Publicidad / Anuncios',
      selector: null,
      renderForm(d) {
        return `
          <div class="toggle-row">
            <label class="dtoggle">
              <input type="checkbox" data-key="activa" ${d.activa?'checked':''}
                     onchange="updatePubPrev()"/>
              <span class="dtoggle-slider"></span>
            </label>
            <span class="toggle-lbl" id="pubLbl">${d.activa?'Banner ACTIVO':'Banner INACTIVO'}</span>
          </div>
          <div class="df"><label>Título (en negrita)</label>
            <input type="text" data-key="titulo" value="${esc(d.titulo)}" oninput="updatePubPrev()"/></div>
          <div class="df"><label>Texto del anuncio</label>
            <input type="text" data-key="texto" value="${esc(d.texto)}" oninput="updatePubPrev()"/></div>
          <div class="df"><label>Link (opcional)</label>
            <input type="url" data-key="link" value="${esc(d.link)}" placeholder="https://..."/></div>
          <div class="two-col">
            <div class="df" style="margin:0"><label>Color fondo</label>
              <input type="color" data-key="color_fondo" value="${esc(d.color_fondo)}" oninput="updatePubPrev()"/></div>
            <div class="df" style="margin:0"><label>Color texto</label>
              <input type="color" data-key="color_texto" value="${esc(d.color_texto)}" oninput="updatePubPrev()"/></div>
          </div>
          <div class="drawer-sep">Vista previa</div>
          <div class="pub-prev" id="pubPrev"
               style="background:${esc(d.color_fondo)};color:${esc(d.color_texto)}">
            <span>📢</span>
            <span><strong id="ppTitulo">${esc(d.titulo)}</strong> — <span id="ppTexto">${esc(d.texto)}</span></span>
          </div>`;
      },
      onInput() {},
      collectData() {
        return { activa: drawerEl.querySelector('[data-key="activa"]').checked,
                 titulo: val('titulo'), texto: val('texto'), link: val('link'),
                 color_fondo: val('color_fondo'), color_texto: val('color_texto') };
      },
      onSave(data) { applyPubBanner(data); }
    },

    /* ── VALORES ── */
    valores: {
      label: '💛 ¿Por qué elegirnos?',
      selector: '.valores',
      renderForm(d) {
        return d.map((v, i) => `
          <div class="d-card">
            <div class="d-card-head" onclick="toggleDCard(this)">
              <span class="d-card-label">${esc(v.icon)} ${esc(v.titulo)}</span>
              <span class="d-card-toggle">▼</span>
            </div>
            <div class="d-card-body ${i===0?'open':''}">
              <div class="two-col" style="margin-bottom:8px;">
                <div class="df" style="margin:0"><label>Icono</label>
                  <input type="text" data-vi="${i}" data-vk="icon" value="${esc(v.icon)}"/></div>
                <div class="df" style="margin:0"><label>Título</label>
                  <input type="text" data-vi="${i}" data-vk="titulo" value="${esc(v.titulo)}"/></div>
              </div>
              <div class="df"><label>Texto</label>
                <textarea data-vi="${i}" data-vk="texto" rows="2">${esc(v.texto)}</textarea></div>
            </div>
          </div>`).join('');
      },
      onInput() {},
      collectData() {
        const cards = [];
        drawerEl.querySelectorAll('[data-vi]').forEach(el => {
          const i = parseInt(el.dataset.vi);
          if (!cards[i]) cards[i] = {};
          cards[i][el.dataset.vk] = el.value;
        });
        return cards;
      }
    },

    /* ── SEDES ── */
    sedes: {
      label: '📍 Nuestras Sedes',
      selector: '.sedes',
      _openAs: 'contacto'
    },

    /* ── CONTACTO ── */
    contacto: {
      label: '📞 Contacto',
      selector: '.contacto',
      renderForm(d) {
        return `
          <div class="two-col">
            <div class="df" style="margin:0"><label>Sede Matriz</label>
              <input type="text" data-key="sede_matriz" value="${esc(d.sede_matriz)}"/></div>
            <div class="df" style="margin:0"><label>Sede Milagro</label>
              <input type="text" data-key="sede_milagro" value="${esc(d.sede_milagro)}"/></div>
          </div>
          <div class="df"><label>Teléfono / WhatsApp</label>
            <input type="text" data-key="telefono" value="${esc(d.telefono)}"/></div>
          <div class="df"><label>Horario de atención</label>
            <input type="text" data-key="horario" value="${esc(d.horario)}"/></div>
          <div class="df"><label>Texto inicio de clases</label>
            <input type="text" data-key="inicio_clases" value="${esc(d.inicio_clases)}"/></div>
          <div class="drawer-sep">Redes sociales</div>
          <div class="df"><label>Link Instagram</label>
            <input type="url" data-key="instagram" value="${esc(d.instagram)}"/></div>
          <div class="df"><label>Link WhatsApp</label>
            <input type="url" data-key="whatsapp" value="${esc(d.whatsapp)}"/></div>`;
      },
      onInput(key, v) {
        const map = { sede_matriz: 'contacto.sede_matriz', sede_milagro: 'contacto.sede_milagro',
                      telefono: 'contacto.telefono', horario: 'contacto.horario',
                      inicio_clases: 'contacto.inicio_clases' };
        if (map[key]) setText(`[data-field="${map[key]}"]`, v);
      },
      collectData() {
        return { sede_matriz: val('sede_matriz'), sede_milagro: val('sede_milagro'),
                 telefono: val('telefono'), horario: val('horario'),
                 inicio_clases: val('inicio_clases'), instagram: val('instagram'),
                 whatsapp: val('whatsapp'),
                 email_destino: window.SITE_CONTENT.contacto.email_destino };
      }
    }
  };

  /* ══════════════════════════════════════
     CARD RENDERERS
  ══════════════════════════════════════ */
  function renderProgCard(p, i) {
    return `
      <div class="d-card">
        <div class="d-card-head" onclick="toggleDCard(this)">
          <span class="d-card-label" id="plabel_${i}">${esc(p.icon)} ${esc(p.nombre)}</span>
          <span class="d-card-toggle">▼</span>
        </div>
        <div class="d-card-body ${i===0?'open':''}">
          <div class="two-col" style="margin-bottom:10px;">
            <div class="df" style="margin:0"><label>Icono</label>
              <input type="text" data-prog="${i}" data-pkey="icon" value="${esc(p.icon)}"
                     oninput="syncProgLabel(${i})"/></div>
            <div class="df" style="margin:0"><label>Color</label>
              <input type="color" data-prog="${i}" data-pkey="color" value="${esc(p.color)}"/></div>
          </div>
          <div class="df"><label>Nombre</label>
            <input type="text" data-prog="${i}" data-pkey="nombre" value="${esc(p.nombre)}"
                   oninput="syncProgLabel(${i})"/></div>
          <div class="df"><label>Rango de edad</label>
            <input type="text" data-prog="${i}" data-pkey="edad" value="${esc(p.edad)}"/></div>
          <div class="df"><label>Descripción</label>
            <textarea data-prog="${i}" data-pkey="descripcion" rows="2">${esc(p.descripcion)}</textarea></div>
          <div class="df"><label>Bullets</label>
            <div class="bullets-wrap" id="bulls_${i}">
              ${p.bullets.map((b,j)=>`
              <div class="brow">
                <input type="text" data-prog="${i}" data-bull="${j}" value="${esc(b)}" placeholder="Punto..."/>
                <button type="button" class="btn-rem-b" onclick="this.parentElement.remove()">✕</button>
              </div>`).join('')}
            </div>
            <button type="button" class="btn-add-b" onclick="addBullet('${i}')">+ Bullet</button>
          </div>
          <div style="text-align:right;margin-top:4px;">
            <button type="button" class="btn-rem-card" onclick="remProgCard(this)">🗑️ Eliminar programa</button>
          </div>
        </div>
      </div>`;
  }

  function renderSvcCard(s, i) {
    return `
      <div class="d-card">
        <div class="d-card-head" onclick="toggleDCard(this)">
          <span class="d-card-label">${esc(s.icon)} ${esc(s.nombre)}</span>
          <span class="d-card-toggle">▼</span>
        </div>
        <div class="d-card-body ${i===0?'open':''}">
          <div class="three-col" style="margin-bottom:10px;">
            <div class="df" style="margin:0"><label>Icono</label>
              <input type="text" data-svc="${i}" data-skey="icon" value="${esc(s.icon)}"/></div>
            <div class="df" style="margin:0"><label>Nombre</label>
              <input type="text" data-svc="${i}" data-skey="nombre" value="${esc(s.nombre)}"/></div>
          </div>
          <div class="df"><label>Descripción</label>
            <textarea data-svc="${i}" data-skey="descripcion" rows="2">${esc(s.descripcion)}</textarea></div>
          <div style="text-align:right;">
            <button type="button" class="btn-rem-card" onclick="remSvcCard(this)">🗑️ Eliminar servicio</button>
          </div>
        </div>
      </div>`;
  }

  function galThumb(f) {
    return `
      <div class="dgal-item" data-path="${esc(f)}">
        <img src="/static/${esc(f)}" loading="lazy"/>
        <div class="dgal-del">
          <button type="button" class="btn-del-p"
                  onclick="deletePhoto('${esc(f)}',this)">🗑️ Eliminar</button>
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════
     COLLECT DATA
  ══════════════════════════════════════ */
  function collectPrograms() {
    const result = [];
    drawerEl.querySelectorAll('#progsWrap .d-card').forEach(card => {
      const get = k => { const el = card.querySelector(`[data-pkey="${k}"]`); return el ? el.value : ''; };
      const bullets = [];
      card.querySelectorAll('[data-bull]').forEach(el => { if (el.value.trim()) bullets.push(el.value.trim()); });
      result.push({ icon: get('icon'), nombre: get('nombre'), edad: get('edad'),
                    descripcion: get('descripcion'), color: get('color'), bullets });
    });
    return result;
  }

  function collectServices() {
    const result = [];
    drawerEl.querySelectorAll('#svcsWrap .d-card').forEach(card => {
      const get = k => { const el = card.querySelector(`[data-skey="${k}"]`); return el ? el.value : ''; };
      result.push({ icon: get('icon'), nombre: get('nombre'), descripcion: get('descripcion') });
    });
    return result;
  }

  /* ══════════════════════════════════════
     ADMIN BAR
  ══════════════════════════════════════ */
  function injectAdminBar() {
    const bar = document.createElement('div');
    bar.className = 'editor-admin-bar';
    bar.innerHTML = `
      <div class="admin-bar-left">
        <div class="admin-bar-dot"></div>
        <span>☀️ Modo Edición</span>
      </div>
      <div class="admin-bar-right">
        <button class="abar-btn muted" onclick="openDrawer('publicidad')">📢 Publicidad</button>
        <span class="save-indicator idle" id="saveIndicator"></span>
        <a href="/admin/" class="abar-btn muted">⚙️ Panel admin</a>
        <a href="/admin/logout" class="abar-btn danger">✕ Salir</a>
      </div>`;
    document.body.prepend(bar);
  }

  /* ══════════════════════════════════════
     DRAWER
  ══════════════════════════════════════ */
  function injectDrawer() {
    overlayEl = document.createElement('div');
    overlayEl.className = 'editor-overlay';
    overlayEl.addEventListener('click', closeDrawer);

    drawerEl = document.createElement('div');
    drawerEl.className = 'editor-drawer';
    drawerEl.innerHTML = `
      <div class="drawer-header">
        <span class="drawer-title" id="drawerTitle"></span>
        <button class="drawer-close" onclick="closeDrawer()">✕</button>
      </div>
      <div class="drawer-body" id="drawerBody"></div>
      <div class="drawer-footer">
        <button class="drawer-cancel-btn" onclick="closeDrawer()">Cancelar</button>
        <button class="drawer-save-btn" id="drawerSaveBtn"
                onclick="saveCurrentSection()">💾 Guardar cambios</button>
      </div>`;

    document.body.appendChild(overlayEl);
    document.body.appendChild(drawerEl);
  }

  /* ══════════════════════════════════════
     SECTION EDIT BUTTONS
  ══════════════════════════════════════ */
  function setupEditButtons() {
    Object.entries(SECTIONS).forEach(([key, sec]) => {
      if (!sec.selector) return;
      const el = $(sec.selector);
      if (!el) return;
      el.setAttribute('data-section', key);
      const btn = document.createElement('button');
      btn.className = 'sec-edit-btn';
      btn.type = 'button';
      btn.innerHTML = `✏️ Editar sección`;
      btn.addEventListener('click', e => { e.stopPropagation(); openDrawer(sec._openAs || key); });
      el.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════
     OPEN / CLOSE DRAWER
  ══════════════════════════════════════ */
  window.openDrawer = function (sectionName) {
    const sec = SECTIONS[sectionName];
    if (!sec) return;
    currentSection = sectionName;
    const data = window.SITE_CONTENT[sectionName];
    $('#drawerTitle').textContent = sec.label;
    $('#drawerBody').innerHTML = sec.renderForm(data);

    // Live preview listeners
    drawerEl.querySelectorAll('[data-key]').forEach(input => {
      input.addEventListener('input', () => sec.onInput(input.dataset.key, input.value));
    });

    // Gallery: wire up upload zone
    if (sectionName === 'galeria') {
      const fileInput = $('#photoFileInput');
      const zone = $('#uploadZone');
      if (fileInput) fileInput.addEventListener('change', () => uploadPhotos(fileInput.files));
      if (zone) {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', e => {
          e.preventDefault(); zone.classList.remove('drag-over');
          uploadPhotos(e.dataTransfer.files);
        });
      }
    }

    overlayEl.classList.add('open');
    drawerEl.classList.add('open');
  };

  window.closeDrawer = function () {
    overlayEl.classList.remove('open');
    drawerEl.classList.remove('open');
    currentSection = null;
  };

  /* ══════════════════════════════════════
     SAVE
  ══════════════════════════════════════ */
  window.saveCurrentSection = async function () {
    if (!currentSection) return;
    const sec = SECTIONS[currentSection];
    const saveBtn = $('#drawerSaveBtn');
    const data = sec.collectData();

    if (data === null) { closeDrawer(); return; } // galería - already saved per action

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
    setIndicator('saving', '⏳ Guardando...');

    try {
      const res = await fetch('/admin/save-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: currentSection, data })
      });
      const json = await res.json();
      if (!json.ok) throw new Error();

      window.SITE_CONTENT[currentSection] = data;
      if (sec.onSave) sec.onSave(data);

      setIndicator('saved', '✓ Guardado');
      saveBtn.textContent = '✓ Listo';
      setTimeout(() => {
        setIndicator('idle', '');
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Guardar cambios';
        closeDrawer();
      }, 900);
    } catch {
      setIndicator('error', '⚠️ Error');
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Guardar cambios';
      alert('Error al guardar. Intenta de nuevo.');
    }
  };

  /* ══════════════════════════════════════
     GALLERY ACTIONS
  ══════════════════════════════════════ */
  async function uploadPhotos(files) {
    if (!files || files.length === 0) return;
    const zone = $('#uploadZone');
    const prog = $('#uploadProgress');
    const grid = $('#drawerGalGrid');
    zone.classList.add('uploading');
    prog.style.display = 'block';
    prog.textContent = `Subiendo ${files.length} foto(s)...`;
    let count = 0;
    for (const file of files) {
      const fd = new FormData();
      fd.append('foto', file);
      try {
        const res = await fetch('/admin/upload-photo', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.ok) {
          window.SITE_CONTENT.galeria.push(json.path);
          grid.insertAdjacentHTML('beforeend', galThumb(json.path));
          count++;
        }
      } catch { /* skip bad file */ }
    }
    zone.classList.remove('uploading');
    prog.textContent = `✓ ${count} foto(s) subidas`;
    rerenderGaleria(window.SITE_CONTENT.galeria);
    setIndicator('saved', '✓ Guardado');
    setTimeout(() => { prog.style.display = 'none'; setIndicator('idle', ''); }, 3000);
  }

  window.deletePhoto = async function (path, btn) {
    if (!confirm('¿Eliminar esta foto de la galería?')) return;
    try {
      const res = await fetch('/admin/delete-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const json = await res.json();
      if (json.ok) {
        const idx = window.SITE_CONTENT.galeria.indexOf(path);
        if (idx > -1) window.SITE_CONTENT.galeria.splice(idx, 1);
        btn.closest('.dgal-item').remove();
        rerenderGaleria(window.SITE_CONTENT.galeria);
        setIndicator('saved', '✓ Foto eliminada');
        setTimeout(() => setIndicator('idle', ''), 2000);
      }
    } catch { alert('Error al eliminar.'); }
  };

  function rerenderGaleria(galeria) {
    const grid = $('.galeria-grid');
    if (!grid) return;
    grid.innerHTML = galeria.map((f, i) => `
      <div class="gal-item${i%7===0?' g-tall':i%7===3?' g-wide':''}">
        <img src="/static/${f}" alt="Rayitos de Sol" loading="lazy"/>
      </div>`).join('');
  }

  /* ══════════════════════════════════════
     PUBLICIDAD BANNER
  ══════════════════════════════════════ */
  function applyPubBanner(pub) {
    let banner = $('.pub-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'pub-banner';
      const navbar = $('.navbar');
      if (navbar) navbar.insertAdjacentElement('beforebegin', banner);
    }
    if (pub.activa) {
      banner.style.cssText = `display:flex;background:${pub.color_fondo};color:${pub.color_texto}`;
      const link = pub.link
        ? `<a href="${pub.link}" target="_blank" style="color:${pub.color_texto};font-weight:700;text-decoration:underline">Ver más →</a>`
        : '';
      banner.innerHTML = `<span>📢</span><span><strong>${pub.titulo}</strong> — ${pub.texto}</span>${link}`;
    } else {
      banner.style.display = 'none';
    }
  }

  window.updatePubPrev = function () {
    const preview = $('#pubPrev');
    if (!preview) return;
    const checked = drawerEl.querySelector('[data-key="activa"]').checked;
    preview.style.background = val('color_fondo');
    preview.style.color      = val('color_texto');
    const t = $('#ppTitulo'); if (t) t.textContent = val('titulo');
    const x = $('#ppTexto');  if (x) x.textContent = val('texto');
    const lbl = $('#pubLbl'); if (lbl) lbl.textContent = checked ? 'Banner ACTIVO' : 'Banner INACTIVO';
  };

  /* ══════════════════════════════════════
     CARD HELPERS
  ══════════════════════════════════════ */
  window.toggleDCard = function (head) {
    const body = head.nextElementSibling;
    body.classList.toggle('open');
    head.querySelector('.d-card-toggle').textContent = body.classList.contains('open') ? '▼' : '▶';
  };

  window.syncProgLabel = function (i) {
    const card = drawerEl.querySelector(`[data-prog="${i}"][data-pkey="icon"]`)?.closest('.d-card');
    if (!card) return;
    const icon   = card.querySelector('[data-pkey="icon"]')?.value || '';
    const nombre = card.querySelector('[data-pkey="nombre"]')?.value || '';
    const lbl = card.querySelector('.d-card-label');
    if (lbl) lbl.textContent = `${icon} ${nombre}`;
  };

  window.remProgCard = function (btn) {
    if (drawerEl.querySelectorAll('#progsWrap .d-card').length <= 1) return;
    btn.closest('.d-card').remove();
  };

  window.addProgCard = function () {
    const i = Date.now();
    const html = renderProgCard(
      { icon:'🎓', nombre:'Nuevo programa', edad:'', descripcion:'', bullets:[''], color:'#6B2FA0' }, i
    );
    $('#progsWrap').insertAdjacentHTML('beforeend', html);
  };

  window.addBullet = function (progIdx) {
    const wrap = $(`#bulls_${progIdx}`);
    if (!wrap) return;
    const j = wrap.querySelectorAll('.brow').length;
    wrap.insertAdjacentHTML('beforeend', `
      <div class="brow">
        <input type="text" data-bull="${j}" placeholder="Punto..."/>
        <button type="button" class="btn-rem-b" onclick="this.parentElement.remove()">✕</button>
      </div>`);
  };

  window.remSvcCard = function (btn) {
    if (drawerEl.querySelectorAll('#svcsWrap .d-card').length <= 1) return;
    btn.closest('.d-card').remove();
  };

  window.addSvcCard = function () {
    const i = Date.now();
    $('#svcsWrap').insertAdjacentHTML('beforeend',
      renderSvcCard({ icon:'⭐', nombre:'Nuevo servicio', descripcion:'' }, i)
    );
  };

  window.addCheck = function () {
    const wrap = $('#checksWrap');
    if (!wrap) return;
    const n = wrap.querySelectorAll('.brow').length;
    const row = document.createElement('div');
    row.className = 'brow';
    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.key = `check_${n}`;
    input.placeholder = 'Nueva característica...';
    input.addEventListener('input', () => SECTIONS.nosotros.onInput(input.dataset.key, input.value));
    const remBtn = document.createElement('button');
    remBtn.type = 'button';
    remBtn.className = 'btn-rem-b';
    remBtn.textContent = '✕';
    remBtn.onclick = () => row.remove();
    row.appendChild(input);
    row.appendChild(remBtn);
    wrap.appendChild(row);
  };

  /* ══════════════════════════════════════
     INIT
  ══════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('admin-mode');
    injectAdminBar();
    injectDrawer();
    setupEditButtons();
  });

})();
