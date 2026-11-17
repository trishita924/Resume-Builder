const $ = (id) => document.getElementById(id);
const state = { education: [], experience: [], project: [] };
let toastTimer;

const fieldDefinitions = {
  education: [
    { key: 'institution', label: 'Institution', placeholder: 'University or college' },
    { key: 'degree', label: 'Degree / Course', placeholder: 'B.Tech in Computer Science' },
    { key: 'date', label: 'Duration', placeholder: '2024 – 2028' },
    { key: 'detail', label: 'Grade / Details', placeholder: 'CGPA, percentage or coursework' }
  ],
  experience: [
    { key: 'role', label: 'Role', placeholder: 'Software Developer Intern' },
    { key: 'organization', label: 'Organization', placeholder: 'Company or organization' },
    { key: 'date', label: 'Duration', placeholder: 'Jun 2025 – Aug 2025' },
    { key: 'description', label: 'Description', placeholder: 'Describe your contributions and impact.', full: true, textarea: true }
  ],
  project: [
    { key: 'name', label: 'Project name', placeholder: 'Project title' },
    { key: 'date', label: 'Date / Duration', placeholder: '2025' },
    { key: 'tech', label: 'Technologies', placeholder: 'HTML, CSS, JavaScript', full: true },
    { key: 'description', label: 'Description', placeholder: 'What does the project do? What did you build?', full: true, textarea: true }
  ]
};

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function createItem(type, values = {}) {
  const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state[type].push({ id, ...values });
  renderEditorList(type);
  renderPreview();
}

function renderEditorList(type) {
  const container = $(`${type}List`);
  container.innerHTML = '';
  state[type].forEach((item, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'repeat-item';
    const head = document.createElement('div');
    head.className = 'repeat-item-head';
    const title = document.createElement('strong');
    title.textContent = `${type === 'project' ? 'Project' : type[0].toUpperCase() + type.slice(1)} ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      state[type] = state[type].filter((entry) => entry.id !== item.id);
      renderEditorList(type); renderPreview();
    });
    head.append(title, remove);
    const grid = document.createElement('div'); grid.className = 'repeat-grid';
    fieldDefinitions[type].forEach((definition) => {
      const label = document.createElement('label'); label.className = 'field';
      if (definition.full) label.style.gridColumn = '1 / -1';
      label.append(document.createTextNode(definition.label));
      const input = definition.textarea ? document.createElement('textarea') : document.createElement('input');
      input.placeholder = definition.placeholder;
      if (definition.textarea) input.rows = 3;
      input.value = item[definition.key] || '';
      input.addEventListener('input', () => { item[definition.key] = input.value; renderPreview(); });
      label.append(input); grid.append(label);
    });
    wrapper.append(head, grid); container.append(wrapper);
  });
}

function getFormData() {
  const data = {};
  $('resumeForm').querySelectorAll('[name]').forEach((field) => data[field.name] = field.value);
  return { ...data, template: $('templateSelect').value, education: state.education, experience: state.experience, project: state.project };
}

function setText(selector, value, fallback) {
  const node = document.querySelector(selector);
  node.textContent = value.trim() || fallback;
}

function renderPreview() {
  const data = getFormData();
  $('resumePreview').className = `resume-paper template-${data.template}`;
  setText('[data-preview="fullName"]', data.fullName || '', 'Your Name');
  setText('[data-preview="jobTitle"]', data.jobTitle || '', 'Your professional title');
  const contact = [data.email, data.phone, data.location, data.website].filter(Boolean);
  $('previewContact').innerHTML = contact.length ? contact.map((item) => `<span>${escapeHtml(item)}</span>`).join('') : '<span>Email · Phone · Location · Portfolio</span>';
  $('previewSummary').textContent = data.summary.trim() || 'Your professional summary will appear here. Add a few sentences about your experience, interests and strengths.';

  renderEntries('experience', 'previewExperience', (item) => ({ title: item.role, subtitle: item.organization, date: item.date, description: item.description }));
  renderEntries('education', 'previewEducation', (item) => ({ title: item.degree, subtitle: item.institution, date: item.date, description: item.detail }));
  renderEntries('project', 'previewProjects', (item) => ({ title: item.name, subtitle: item.tech, date: item.date, description: item.description }));

  const skills = data.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  $('previewSkills').innerHTML = skills.length ? skills.map((skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`).join('') : '<span class="empty-preview">Your skills will appear here.</span>';
  const achievements = data.achievements.split('\n').map((item) => item.trim()).filter(Boolean);
  $('previewAchievements').innerHTML = achievements.length ? achievements.map((item) => `<li>${escapeHtml(item)}</li>`).join('') : '<li class="empty-preview">Your achievements will appear here.</li>';
  toggleSection('summarySection', Boolean(data.summary.trim()));
  toggleSection('previewExperienceSection', state.experience.some(hasContent));
  toggleSection('previewEducationSection', state.education.some(hasContent));
  toggleSection('previewProjectsSection', state.project.some(hasContent));
  toggleSection('previewSkillsSection', skills.length > 0);
  toggleSection('previewAchievementsSection', achievements.length > 0);
}

function hasContent(item) { return Object.values(item).some((value) => typeof value === 'string' && value.trim()); }
function toggleSection(id, visible) { $(id).style.display = visible ? '' : 'none'; }

function renderEntries(type, targetId, mapItem) {
  const items = state[type].filter(hasContent).map(mapItem).filter((item) => item.title || item.subtitle || item.description || item.date);
  $(targetId).innerHTML = items.length ? items.map((item) => `
    <div class="resume-entry">
      <div class="entry-top"><span class="entry-title">${escapeHtml(item.title || '')}</span><span class="entry-date">${escapeHtml(item.date || '')}</span></div>
      ${item.subtitle ? `<div class="entry-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
      ${item.description ? `<div class="entry-description">${escapeHtml(item.description)}</div>` : ''}
    </div>`).join('') : `<p class="empty-preview">Your ${type === 'project' ? 'projects' : type} will appear here.</p>`;
}

function loadData(data) {
  $('resumeForm').querySelectorAll('[name]').forEach((field) => { field.value = data[field.name] || ''; });
  $('templateSelect').value = data.template || 'modern';
  ['education', 'experience', 'project'].forEach((type) => {
    state[type] = Array.isArray(data[type]) ? data[type].map((item) => ({ id: item.id || `${type}-${Date.now()}-${Math.random()}`, ...item })) : [];
    renderEditorList(type);
  });
  renderPreview();
}

function saveDraft(showMessage = true) {
  try {
    localStorage.setItem('resumeStudioDraft', JSON.stringify(getFormData()));
    $('saveStatus').textContent = 'Draft saved in this browser';
    if (showMessage) showToast('Your draft has been saved on this device.');
  } catch (error) {
    showToast('Could not save draft. Browser storage may be unavailable.');
  }
}

function downloadPdf() {
  renderPreview();
  window.print();
}

$('resumeForm').addEventListener('input', renderPreview);
$('templateSelect').addEventListener('change', renderPreview);
document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => createItem(button.dataset.add)));
$('saveDraftBtn').addEventListener('click', () => saveDraft(true));
$('downloadBtn').addEventListener('click', downloadPdf);
$('bottomDownloadBtn').addEventListener('click', downloadPdf);
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Start over and clear all resume details? This will not delete a previously saved draft.')) return;
  $('resumeForm').reset();
  $('templateSelect').value = 'modern';
  Object.keys(state).forEach((type) => { state[type] = []; renderEditorList(type); });
  renderPreview();
  $('saveStatus').textContent = 'Your work stays in this browser';
  showToast('The editor has been cleared.');
});

try {
  const saved = localStorage.getItem('resumeStudioDraft');
  if (saved) {
    loadData(JSON.parse(saved));
    $('saveStatus').textContent = 'Saved draft restored';
    showToast('Your saved draft has been restored.');
  } else {
    createItem('education');
    renderPreview();
  }
} catch (error) {
  createItem('education');
  renderPreview();
}
