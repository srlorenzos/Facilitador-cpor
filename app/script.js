(() => {
  'use strict';

  const FIXED_RECIPIENTS = [
    { id: 'familia', name: 'Família', email: 'familia.fotos@gmail.com' },
    { id: 'fotografo', name: 'Fotógrafo do evento', email: 'contato@estudiolente.com.br' },
    { id: 'marketing', name: 'Equipe de Marketing', email: 'marketing@novaideia.com' },
    { id: 'backup', name: 'Backup pessoal', email: 'meuarquivo@outlook.com' }
  ];

  const SECTIONS = [
    { key: 'teams', label: 'Teams' },
    { key: 'sharepoint', label: 'SharePoint' },
    { key: 'onedrive', label: 'OneDrive' },
    { key: 'apps365', label: 'Apps 365' },
    { key: 'exchange', label: 'Exchange' }
  ];

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const STORAGE_KEY = 'photomail:customRecipients';

  function loadCustomRecipients() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomRecipients(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  const state = {
    customRecipients: loadCustomRecipients(),
    selectedIds: new Set(),
    templateId: 'livre',
    livre: { message: '', files: [] }, // files: { id, name, dataUrl }
    conclusao: {
      empresa: '', dominio: '', licencas: '',
      subject: '', subjectTouched: false,
      sections: Object.fromEntries(SECTIONS.map(s => [s.key, []]))
    }
  };

  function allRecipients() {
    return [...FIXED_RECIPIENTS, ...state.customRecipients];
  }

  function defaultSubject() {
    const empresa = state.conclusao.empresa.trim();
    return `Conclusão do Projeto de Migração/Implantação do Microsoft 365 – ${empresa || '[Empresa]'}`;
  }

  // — element refs —
  const recipientListEl = document.getElementById('recipient-list');
  const newNameEl = document.getElementById('new-recipient-name');
  const newEmailEl = document.getElementById('new-recipient-email');
  const addRecipientBtnEl = document.getElementById('add-recipient-btn');
  const addRecipientErrorEl = document.getElementById('add-recipient-error');

  const templateSwitchEl = document.getElementById('template-switch');
  const templateLivreEl = document.getElementById('template-livre');
  const templateConclusaoEl = document.getElementById('template-conclusao');

  const livreMessageEl = document.getElementById('livre-message');
  const livreDropzoneEl = document.getElementById('livre-dropzone');
  const livreFileInputEl = document.getElementById('livre-file-input');
  const livrePhotoGridEl = document.getElementById('livre-photo-grid');

  const empresaEl = document.getElementById('empresa-input');
  const dominioEl = document.getElementById('dominio-input');
  const licencasEl = document.getElementById('licencas-input');
  const subjectEl = document.getElementById('subject-input');
  const sectionCardsEl = document.getElementById('section-cards');

  const fileCountEl = document.getElementById('file-count');
  const previewBtnEl = document.getElementById('preview-btn');

  const dialogBackdropEl = document.getElementById('dialog-backdrop');
  const emailPreviewEl = document.getElementById('email-preview');
  const dialogCloseEl = document.getElementById('dialog-close');
  const dialogBackEl = document.getElementById('dialog-back');

  // — recipients —
  function renderRecipients() {
    recipientListEl.innerHTML = '';
    allRecipients().forEach(r => {
      const isCustom = state.customRecipients.some(c => c.id === r.id);

      const row = document.createElement('div');
      row.className = 'recipient-row';

      const label = document.createElement('label');
      label.className = 'checkbox';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'recipient-' + r.id;
      input.checked = state.selectedIds.has(r.id);
      input.addEventListener('change', () => {
        if (input.checked) state.selectedIds.add(r.id); else state.selectedIds.delete(r.id);
        renderFooter();
      });

      const box = document.createElement('span');
      box.className = 'box';

      const textWrap = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'recipient-name';
      name.textContent = r.name || r.email;
      const email = document.createElement('span');
      email.className = 'text-muted recipient-email';
      email.textContent = r.email;
      textWrap.append(name, email);

      label.append(input, box, textWrap);
      row.appendChild(label);

      if (isCustom) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'recipient-remove';
        removeBtn.setAttribute('aria-label', 'Remover ' + r.email);
        removeBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>`;
        removeBtn.addEventListener('click', () => removeRecipient(r.id));
        row.appendChild(removeBtn);
      }

      recipientListEl.appendChild(row);
    });
  }

  function addRecipient() {
    const name = newNameEl.value.trim();
    const email = newEmailEl.value.trim();
    addRecipientErrorEl.hidden = true;

    if (!EMAIL_RE.test(email)) {
      addRecipientErrorEl.textContent = 'Informe um e-mail válido.';
      addRecipientErrorEl.hidden = false;
      return;
    }
    const exists = allRecipients().some(r => r.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      addRecipientErrorEl.textContent = 'Esse e-mail já está na lista.';
      addRecipientErrorEl.hidden = false;
      return;
    }

    const id = 'custom-' + Math.random().toString(36).slice(2);
    state.customRecipients.push({ id, name, email });
    state.selectedIds.add(id);
    saveCustomRecipients(state.customRecipients);
    newNameEl.value = '';
    newEmailEl.value = '';
    renderRecipients();
    renderFooter();
  }

  function removeRecipient(id) {
    state.customRecipients = state.customRecipients.filter(r => r.id !== id);
    state.selectedIds.delete(id);
    saveCustomRecipients(state.customRecipients);
    renderRecipients();
    renderFooter();
  }

  // — generic file helpers —
  function readFilesAsDataUrls(fileList, onEach) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const id = Math.random().toString(36).slice(2);
      const reader = new FileReader();
      reader.onload = () => onEach({ id, name: file.name, dataUrl: reader.result });
      reader.readAsDataURL(file);
    });
  }

  function renderThumbGrid(gridEl, files, onRemove, compact) {
    gridEl.innerHTML = '';
    gridEl.hidden = files.length === 0;
    files.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'photo-cell';

      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb grayscale';
      const img = document.createElement('img');
      img.src = f.dataUrl;
      img.alt = f.name;
      thumb.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'photo-remove' + (compact ? ' photo-remove-sm' : '');
      removeBtn.setAttribute('aria-label', 'Remover ' + f.name);
      removeBtn.innerHTML = `
        <svg width="${compact ? 10 : 12}" height="${compact ? 10 : 12}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>`;
      removeBtn.addEventListener('click', () => onRemove(f.id));

      cell.append(thumb, removeBtn);
      if (!compact) {
        const name = document.createElement('div');
        name.className = 'text-muted photo-name';
        name.textContent = f.name;
        cell.appendChild(name);
      }
      gridEl.appendChild(cell);
    });
  }

  // — template: mensagem livre —
  function addLivreFiles(fileList) {
    readFilesAsDataUrls(fileList, f => {
      state.livre.files.push(f);
      renderLivre();
      renderFooter();
    });
  }
  function removeLivreFile(id) {
    state.livre.files = state.livre.files.filter(f => f.id !== id);
    renderLivre();
    renderFooter();
  }
  function renderLivre() {
    renderThumbGrid(livrePhotoGridEl, state.livre.files, removeLivreFile, false);
  }

  // — template: conclusão de projeto —
  function addSectionFiles(key, fileList) {
    readFilesAsDataUrls(fileList, f => {
      state.conclusao.sections[key].push(f);
      renderSectionCards();
      renderFooter();
    });
  }
  function removeSectionFile(key, id) {
    state.conclusao.sections[key] = state.conclusao.sections[key].filter(f => f.id !== id);
    renderSectionCards();
    renderFooter();
  }

  function renderSectionCards() {
    sectionCardsEl.innerHTML = '';
    SECTIONS.forEach(({ key, label }) => {
      const files = state.conclusao.sections[key];

      const card = document.createElement('div');
      card.className = 'section-card';

      const titleRow = document.createElement('div');
      titleRow.className = 'section-card-title';
      const title = document.createElement('h4');
      title.textContent = label;
      title.style.margin = '0';
      const count = document.createElement('span');
      count.className = 'tag section-card-count';
      count.textContent = files.length === 0 ? 'Sem imagens' : `${files.length} imagem(ns)`;
      titleRow.append(title, count);

      const dz = document.createElement('div');
      dz.className = 'dropzone dropzone-compact';
      dz.tabIndex = 0;
      dz.setAttribute('role', 'button');
      dz.setAttribute('aria-label', 'Selecionar imagens de ' + label);
      dz.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12"></path>
          <path d="m17 8-5-5-5 5"></path>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        </svg>
        <div class="dropzone-title">Adicionar evidências</div>`;

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.style.display = 'none';

      const grid = document.createElement('div');
      grid.className = 'photo-grid photo-grid-compact';

      const open = () => input.click();
      dz.addEventListener('click', open);
      dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('drag-over');
        addSectionFiles(key, e.dataTransfer.files);
      });
      input.addEventListener('change', (e) => { addSectionFiles(key, e.target.files); e.target.value = ''; });

      renderThumbGrid(grid, files, (id) => removeSectionFile(key, id), true);

      card.append(titleRow, dz, input, grid);
      sectionCardsEl.appendChild(card);
    });
  }

  // — footer / preview eligibility —
  function totalFileCount() {
    if (state.templateId === 'livre') return state.livre.files.length;
    return SECTIONS.reduce((sum, s) => sum + state.conclusao.sections[s.key].length, 0);
  }

  function renderFooter() {
    const count = totalFileCount();
    fileCountEl.textContent = count === 0
      ? 'Nenhuma foto selecionada'
      : count === 1 ? '1 foto selecionada' : `${count} fotos selecionadas`;

    const hasRecipient = state.selectedIds.size > 0;
    const canPreview = state.templateId === 'livre'
      ? hasRecipient && (state.livre.files.length > 0 || state.livre.message.trim() !== '')
      : hasRecipient && state.conclusao.empresa.trim() !== '';
    previewBtnEl.disabled = !canPreview;
  }

  // — template switching —
  function setTemplate(id) {
    state.templateId = id;
    templateLivreEl.hidden = id !== 'livre';
    templateConclusaoEl.hidden = id !== 'conclusao-projeto';
    renderFooter();
  }

  // — preview rendering —
  function heading(text, extraStyle) {
    const div = document.createElement('div');
    div.className = 'email-preview-heading';
    if (extraStyle) div.style.cssText += extraStyle;
    div.textContent = text;
    return div;
  }
  function para(text) {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }
  function emptyNote(text) {
    const div = document.createElement('div');
    div.className = 'email-preview-empty';
    div.textContent = text;
    return div;
  }
  function previewThumbGrid(files) {
    const grid = document.createElement('div');
    grid.className = 'photo-grid photo-grid-compact';
    renderThumbGrid(grid, files, () => {}, true);
    // Preview is read-only: hide remove controls.
    grid.querySelectorAll('.photo-remove').forEach(b => b.remove());
    return grid;
  }

  function buildPreview() {
    emailPreviewEl.innerHTML = '';

    const recipients = allRecipients().filter(r => state.selectedIds.has(r.id));
    const meta = document.createElement('div');
    meta.className = 'email-preview-meta';
    const to = document.createElement('div');
    to.innerHTML = '<b>Para:</b>';
    const toNames = document.createElement('span');
    toNames.textContent = recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', ') || '—';
    to.appendChild(toNames);
    meta.appendChild(to);
    emailPreviewEl.appendChild(meta);

    const body = document.createElement('div');
    body.className = 'email-preview-body';

    if (state.templateId === 'livre') {
      const subject = document.createElement('h4');
      subject.className = 'email-preview-subject';
      subject.textContent = 'Fotos enviadas';
      emailPreviewEl.appendChild(subject);

      if (state.livre.message.trim()) body.appendChild(para(state.livre.message.trim()));
      body.appendChild(state.livre.files.length ? previewThumbGrid(state.livre.files) : emptyNote('Nenhuma foto anexada.'));
    } else {
      const c = state.conclusao;
      const subjectText = c.subject.trim() || defaultSubject();
      const subject = document.createElement('h4');
      subject.className = 'email-preview-subject';
      subject.textContent = subjectText;
      emailPreviewEl.appendChild(subject);

      const empresa = c.empresa.trim() || '[Empresa]';
      body.appendChild(para('Bom dia,'));
      body.appendChild(para(`Esse e-mail tem por objetivo formalizar a conclusão do projeto de Migração/Implantação do Microsoft 365 da ${empresa}.`));
      body.appendChild(para('Abaixo o descritivo de todas as etapas concluídas com sucesso.'));
      body.appendChild(para('Abaixo as informações e evidências dos produtos implementados/habilitados na Tenant:'));

      body.appendChild(heading('Informações da empresa'));
      body.appendChild(para(empresa));

      body.appendChild(heading('Domínio'));
      body.appendChild(para(c.dominio.trim() || '—'));

      body.appendChild(heading('Licenças'));
      const lic = document.createElement('div');
      lic.style.whiteSpace = 'pre-wrap';
      lic.textContent = c.licencas.trim() || '—';
      body.appendChild(lic);

      body.appendChild(heading('Relatório de uso', 'margin-top:var(--space-6);font-size:16px;'));

      SECTIONS.forEach(({ key, label }) => {
        body.appendChild(heading(label));
        const files = c.sections[key];
        body.appendChild(files.length ? previewThumbGrid(files) : emptyNote('Nenhuma evidência anexada.'));
      });
    }

    emailPreviewEl.appendChild(body);
  }

  function openPreview() {
    buildPreview();
    dialogBackdropEl.hidden = false;
  }
  function closePreview() {
    dialogBackdropEl.hidden = true;
  }

  // — wiring —
  addRecipientBtnEl.addEventListener('click', addRecipient);
  [newNameEl, newEmailEl].forEach(el => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addRecipient(); }
  }));

  templateSwitchEl.addEventListener('change', (e) => {
    if (e.target.name === 'template') setTemplate(e.target.value);
  });

  livreMessageEl.addEventListener('input', () => {
    state.livre.message = livreMessageEl.value;
    renderFooter();
  });
  livreDropzoneEl.addEventListener('click', () => livreFileInputEl.click());
  livreDropzoneEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); livreFileInputEl.click(); }
  });
  livreDropzoneEl.addEventListener('dragover', (e) => { e.preventDefault(); livreDropzoneEl.classList.add('drag-over'); });
  livreDropzoneEl.addEventListener('dragleave', () => livreDropzoneEl.classList.remove('drag-over'));
  livreDropzoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    livreDropzoneEl.classList.remove('drag-over');
    addLivreFiles(e.dataTransfer.files);
  });
  livreFileInputEl.addEventListener('change', (e) => { addLivreFiles(e.target.files); e.target.value = ''; });

  empresaEl.addEventListener('input', () => {
    state.conclusao.empresa = empresaEl.value;
    if (!state.conclusao.subjectTouched) subjectEl.value = defaultSubject();
    renderFooter();
  });
  dominioEl.addEventListener('input', () => { state.conclusao.dominio = dominioEl.value; });
  licencasEl.addEventListener('input', () => { state.conclusao.licencas = licencasEl.value; });
  subjectEl.addEventListener('input', () => {
    state.conclusao.subjectTouched = true;
    state.conclusao.subject = subjectEl.value;
  });

  previewBtnEl.addEventListener('click', openPreview);
  dialogCloseEl.addEventListener('click', closePreview);
  dialogBackEl.addEventListener('click', closePreview);
  dialogBackdropEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePreview(); });

  // — init —
  subjectEl.value = defaultSubject();
  renderRecipients();
  renderLivre();
  renderSectionCards();
  renderFooter();
})();
