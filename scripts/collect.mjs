/**
 * Fetches AI-related repositories, keeps a daily star snapshot, then publishes
 * the dashboard data.  Optional GITHUB_TOKEN avoids unauthenticated API limits.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const dataFile = new URL('../data/projects.json', import.meta.url);
const historyFile = new URL('../data/star-history.json', import.meta.url);
const token = process.env.GITHUB_TOKEN;
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
const today = new Date().toISOString().slice(0, 10);
// Only consider projects created during the last 3 months, then rank the
// candidates by total Stars. Star snapshots still provide the 7-day momentum.
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
const query = `topic:artificial-intelligence created:>${threeMonthsAgo.toISOString().slice(0, 10)} archived:false`;

function classify(repo) {
  const text = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  if (/image|video|audio|diffusion|comfy|vision/.test(text)) return '生成式媒体';
  if (/inference|serving|ollama|runtime|cuda|llm-engine/.test(text)) return '模型运行';
  if (/agent|rag|langchain|llamaindex|framework|sdk/.test(text)) return '开发框架';
  if (/chat|webui|copilot|assistant|application/.test(text)) return 'AI 应用';
  return 'AI 工具';
}
function summarize(repo) {
  const text = (repo.description || '一个持续增长的 AI 开源项目。').replace(/\s+/g, ' ').trim();
  return text.length > 74 ? `${text.slice(0, 73)}…` : text;
}
function tags(repo) { return (repo.topics || []).slice(0, 3).map(t => t.replace(/-/g, ' ')); }

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  return response.json();
}
async function loadHistory() {
  return existsSync(historyFile) ? JSON.parse(await readFile(historyFile, 'utf8')) : {};
}
async function main() {
  const result = await getJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`);
  const history = await loadHistory();
  const dayBeforeWindow = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const projects = result.items.map(repo => {
    const old = history[repo.full_name]?.[dayBeforeWindow];
    return { name: repo.name, url: repo.html_url, category: classify(repo), description: summarize(repo), tags: tags(repo), stars: repo.stargazers_count, growth: old == null ? 0 : Math.max(0, repo.stargazers_count - old) };
  }).filter(p => p.tags.length > 0)
    // Before the first 7-day window is available, retain GitHub's star order.
    .sort((a, b) => (b.growth - a.growth) || (b.stars - a.stars)).slice(0, 24);
  for (const repo of result.items) {
    history[repo.full_name] ??= {};
    history[repo.full_name][today] = repo.stargazers_count;
    for (const date of Object.keys(history[repo.full_name])) if (date < new Date(Date.now() - 35 * 864e5).toISOString().slice(0, 10)) delete history[repo.full_name][date];
  }
  await mkdir(new URL('../data/', root), { recursive: true });
  await writeFile(historyFile, `${JSON.stringify(history, null, 2)}\n`);
  await writeFile(dataFile, `${JSON.stringify({ updatedAt: today, projects }, null, 2)}\n`);
  console.log(`Published ${projects.length} projects for ${today}.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });

