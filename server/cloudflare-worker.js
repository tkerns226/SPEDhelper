// Cloudflare Worker to save decks.json and inline fallback in index.html
// Configure secrets in Cloudflare:
// - GITHUB_TOKEN: classic or fine-grained PAT with Contents: Read/Write for the repo
// - REPO_OWNER: e.g. "tkerns226"
// - REPO_NAME: e.g. "SPEDhelper"
// - BRANCH: e.g. "main" (optional, defaults to main)

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    try {
      const { json, message } = await request.json();
      if (!json || typeof json !== 'string') {
        return new Response(JSON.stringify({ ok: false, error: 'Missing json string' }), { status: 400, headers: { 'content-type': 'application/json' } });
      }

      const owner = env.REPO_OWNER;
      const repo = env.REPO_NAME;
      const branch = env.BRANCH || 'main';
      const token = env.GITHUB_TOKEN;
      if (!owner || !repo || !token) {
        return new Response(JSON.stringify({ ok: false, error: 'Server not configured (REPO_OWNER/REPO_NAME/GITHUB_TOKEN)' }), { status: 500, headers: { 'content-type': 'application/json' } });
      }

      const commitMsg = message || 'Update decks via SPEDhelper editor';

      // 1) Update assets/decks.json
      const decksPath = 'assets/decks.json';
      const decksInfo = await githubGetFile(owner, repo, decksPath, branch, token);
      await githubPutFile(owner, repo, decksPath, branch, token, b64encode(json), decksInfo.sha, commitMsg);

      // 2) Update inline JSON in index.html
      const htmlPath = 'index.html';
      const htmlInfo = await githubGetFile(owner, repo, htmlPath, branch, token);
      const htmlText = b64decode(htmlInfo.content || '');
      const updated = updateInlineTemplate(htmlText, json);
      if (!updated.ok) {
        return new Response(JSON.stringify({ ok: false, error: updated.error || 'Inline update failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
      }
      await githubPutFile(owner, repo, htmlPath, branch, token, b64encode(updated.text), htmlInfo.sha, commitMsg + ' (inline)');

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e && e.message ? e.message : 'Unknown error' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  }
}

function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64decode(b64) {
  try { return decodeURIComponent(escape(atob(b64))); } catch (e) { return atob(b64); }
}

function updateInlineTemplate(htmlText, jsonText) {
  try {
    const startTag = '<template id="decks-data">';
    const endTag = '</template>';
    const si = htmlText.indexOf(startTag);
    if (si === -1) return { ok: false, error: 'template start not found' };
    const ai = si + startTag.length;
    const ei = htmlText.indexOf(endTag, ai);
    if (ei === -1) return { ok: false, error: 'template end not found' };
    const before = htmlText.slice(0, ai);
    const indentMatch = htmlText.slice(0, si).match(/(^|\n)([ \t]*)$/);
    const indent = indentMatch ? indentMatch[2] : '';
    const between = '\n' + jsonText + '\n' + indent;
    const after = htmlText.slice(ei);
    return { ok: true, text: before + between + after };
  } catch (e) { return { ok: false, error: 'inline update error' }; }
}

async function githubGetFile(owner, repo, path, branch, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }});
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return await res.json();
}

async function githubPutFile(owner, repo, path, branch, token, contentB64, sha, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = { message, content: contentB64, branch };
  if (sha) body.sha = sha;
  const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`PUT ${path} ${res.status} ${j.message || ''}`);
  }
  return await res.json();
}

