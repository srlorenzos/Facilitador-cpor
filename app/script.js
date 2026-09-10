(() => {
  'use strict';

  // Same fixed recipient list as the design prototype.
  const recipients = [
    { id: 'familia', name: 'Família', email: 'familia.fotos@gmail.com' },
    { id: 'fotografo', name: 'Fotógrafo do evento', email: 'contato@estudiolente.com.br' },
    { id: 'marketing', name: 'Equipe de Marketing', email: 'marketing@novaideia.com' },
    { id: 'backup', name: 'Backup pessoal', email: 'meuarquivo@outlook.com' }
  ];

  const state = {
    selectedId: null,
    files: [], // { id, name, dataUrl }
    dragOver: false,
    sending: false
  };

  const recipientListEl = document.getElementById('recipient-list');
  const dropzoneEl = document.getElementById('dropzone');
  const fileInputEl = document.getElementById('file-input');
  const photoGridEl = document.getElementById('photo-grid');
  const fileCountEl = document.getElementById('file-count');
  const sendBtnEl = document.getElementById('send-btn');
  const sendSpinnerEl = document.getElementById('send-spinner');
  const sendIconEl = document.getElementById('send-icon');
  const sendLabelEl = document.getElementById('send-label');
  const dialogBackdropEl = document.getElementById('dialog-backdrop');
  const dialogBodyEl = document.getElementById('dialog-body');
  const dialogOkEl = document.getElementById('dialog-ok');

  function renderRecipients() {
    recipientListEl.innerHTML = '';
    recipients.forEach(r => {
      const label = document.createElement('label');
      label.className = 'radio';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'recipient';
      input.checked = r.id === state.selectedId;
      input.addEventListener('change', () => {
        state.selectedId = r.id;
        renderSendButton();
      });

      const dot = document.createElement('span');
      dot.className = 'dot';

      const textWrap = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'radio-name';
      name.textContent = r.name;
      const email = document.createElement('span');
      email.className = 'text-muted radio-email';
      email.textContent = r.email;
      textWrap.append(name, email);

      label.append(input, dot, textWrap);
      recipientListEl.appendChild(label);
    });
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const id = Math.random().toString(36).slice(2);
      const reader = new FileReader();
      reader.onload = () => {
        state.files.push({ id, name: file.name, dataUrl: reader.result });
        renderPhotos();
        renderSendButton();
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(id) {
    state.files = state.files.filter(f => f.id !== id);
    renderPhotos();
    renderSendButton();
  }

  function renderPhotos() {
    photoGridEl.innerHTML = '';
    photoGridEl.hidden = state.files.length === 0;

    state.files.forEach(f => {
      const cell = document.createElement('div');
      cell.className = 'photo-cell';

      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb grayscale';
      const img = document.createElement('img');
      img.src = f.dataUrl;
      thumb.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'photo-remove';
      removeBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>`;
      removeBtn.addEventListener('click', () => removeFile(f.id));

      const name = document.createElement('div');
      name.className = 'text-muted photo-name';
      name.textContent = f.name;

      cell.append(thumb, removeBtn, name);
      photoGridEl.appendChild(cell);
    });

    fileCountEl.textContent = state.files.length === 0
      ? 'Nenhuma foto selecionada'
      : state.files.length === 1
        ? '1 foto selecionada'
        : `${state.files.length} fotos selecionadas`;
  }

  function renderSendButton() {
    const canSend = !!state.selectedId && state.files.length > 0 && !state.sending;
    sendBtnEl.disabled = !canSend;
    sendSpinnerEl.hidden = !state.sending;
    sendIconEl.hidden = state.sending;
    sendLabelEl.textContent = state.sending ? 'Enviando...' : 'Enviar fotos';
  }

  function setDragOver(on) {
    if (state.dragOver === on) return;
    state.dragOver = on;
    dropzoneEl.classList.toggle('drag-over', on);
  }

  function openPicker() { fileInputEl.click(); }

  function send() {
    const recipient = recipients.find(r => r.id === state.selectedId);
    if (!recipient || state.files.length === 0 || state.sending) return;
    const count = state.files.length;
    state.sending = true;
    renderSendButton();
    // Prototype only: sending is simulated, no photos actually leave the browser.
    setTimeout(() => {
      state.sending = false;
      renderSendButton();
      dialogBodyEl.textContent = `${count} foto(s) enviada(s) para ${recipient.email}.`;
      dialogBackdropEl.hidden = false;
    }, 1400);
  }

  function closeDialog() {
    dialogBackdropEl.hidden = true;
    state.files = [];
    renderPhotos();
    renderSendButton();
  }

  dropzoneEl.addEventListener('click', openPicker);
  dropzoneEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  });
  dropzoneEl.addEventListener('dragover', (e) => { e.preventDefault(); setDragOver(true); });
  dropzoneEl.addEventListener('dragleave', () => setDragOver(false));
  dropzoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  });

  fileInputEl.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });

  sendBtnEl.addEventListener('click', send);
  dialogOkEl.addEventListener('click', closeDialog);

  renderRecipients();
  renderPhotos();
  renderSendButton();
})();
