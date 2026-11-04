const state = { category: '全部', term: '', projects: [] };
const fmt = new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 });
const els = { tabs: document.querySelector('#tabs'), projects: document.querySelector('#projects'), empty: document.querySelector('#empty'), summary: document.querySelector('#summary'), updated: document.querySelector('#updated'), template: document.querySelector('#project-card') };

function render() {
  const categories = ['全部', ...new Set(state.projects.map(p => p.category))];
  els.tabs.replaceChildren(...categories.map(category => {
    const button = document.createElement('button'); button.className = `tab ${state.category === category ? 'active' : ''}`; button.textContent = category;
    button.onclick = () => { state.category = category; render(); }; return button;
  }));
  const term = state.term.trim().toLowerCase();
  const list = state.projects.filter(p => (state.category === '全部' || p.category === state.category) && (!term || [p.name,p.description,p.category,...p.tags].join(' ').toLowerCase().includes(term)));
  els.summary.innerHTML = `追踪 <strong>${state.projects.length}</strong> 个 AI 项目，当前显示 <strong>${list.length}</strong> 个`;
  els.projects.replaceChildren(...list.map(project => card(project)));
  els.empty.hidden = list.length > 0;
}
function card(project) {
  const node = els.template.content.cloneNode(true);
  node.querySelector('.category').textContent = project.category;
  const link = node.querySelector('.repo-link'); link.href = project.url;
  node.querySelector('h2').textContent = project.name;
  node.querySelector('.description').textContent = project.description;
  node.querySelector('.tags').replaceChildren(...project.tags.slice(0,3).map(tag => { const t = document.createElement('span'); t.className='tag'; t.textContent=tag; return t; }));
  node.querySelector('.growth').textContent = `+${fmt.format(project.growth)}`;
  node.querySelector('.stars').textContent = fmt.format(project.stars);
  return node;
}
document.querySelector('#search').addEventListener('input', event => { state.term = event.target.value; render(); });
fetch('data/projects.json').then(r => r.json()).then(data => { state.projects = data.projects.sort((a,b) => b.growth - a.growth); els.updated.textContent = `更新于 ${data.updatedAt}`; render(); }).catch(() => { els.updated.textContent = '数据暂不可用'; });

