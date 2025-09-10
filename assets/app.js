/* ES5-compatible script for broad browser support */
(function () {
  var DEFAULT_SUBJECTS = ["Math", "Science", "STEM", "ELA", "SS", "Humanities"];
  var DEFAULT_COHORTS = ["7A", "7B", "7C", "Other"];

  function createCell(content, opts) {
    opts = opts || {};
    var td = document.createElement('td');
    if (opts.className) td.className = opts.className;
    if (opts.ariaLabel) td.setAttribute('aria-label', opts.ariaLabel);
    if (content && content.nodeType === 1) td.appendChild(content);
    else td.textContent = content;
    return td;
  }

  function buildHeaderRow(subjects) {
    var tr = document.createElement('tr');
    var thCohort = document.createElement('th');
    thCohort.scope = 'col';
    thCohort.textContent = 'Cohort';
    tr.appendChild(thCohort);
    for (var i = 0; i < subjects.length; i++) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = subjects[i];
      tr.appendChild(th);
    }
    return tr;
  }

  function buildRow(cohort, subjects, plansForCohort) {
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.scope = 'row';
    th.textContent = cohort;
    tr.appendChild(th);

    for (var i = 0; i < subjects.length; i++) {
      var subject = subjects[i];
      var value = plansForCohort ? plansForCohort[subject] : null;
      if (value && typeof value === 'object') {
        var name = value.name || '';
        var url = value.url || '';
        if (url) {
          var a = document.createElement('a');
          a.className = 'cell-link';
          a.href = url;
          a.textContent = name || 'Open';
          a.setAttribute('aria-label', cohort + ' ' + subject + (name ? ' - ' + name : ''));
          tr.appendChild(createCell(a));
        } else if (name) {
          var span = document.createElement('span');
          span.className = 'cell-name';
          span.textContent = name;
          tr.appendChild(createCell(span));
        } else {
          tr.appendChild(createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' }));
        }
        continue;
      }

      if (typeof value === 'string') {
        if (/^https?:\/\//i.test(value)) {
          var a2 = document.createElement('a');
          a2.className = 'cell-link';
          a2.href = value;
          a2.textContent = 'Open';
          tr.appendChild(createCell(a2));
        } else if (value.trim().length) {
          var span2 = document.createElement('span');
          span2.className = 'cell-name';
          span2.textContent = value;
          tr.appendChild(createCell(span2));
        } else {
          tr.appendChild(createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' }));
        }
        continue;
      }

      tr.appendChild(createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' }));
    }
    return tr;
  }

  function deepClone(o){ return JSON.parse(JSON.stringify(o)); }

  function deepMerge(base, override) {
    var out = Array.isArray(base) ? [] : {};
    var obj = {};
    var k;
    base = base || {};
    override = override || {};
    for (k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) obj[k] = true; }
    for (k in override) { if (Object.prototype.hasOwnProperty.call(override, k)) obj[k] = true; }
    for (k in obj) {
      var bv = base[k];
      var ov = override[k];
      if (typeof ov === 'undefined') out[k] = deepClone(bv);
      else if (bv && typeof bv === 'object' && ov && typeof ov === 'object' && !Array.isArray(bv) && !Array.isArray(ov)) {
        out[k] = deepMerge(bv, ov);
      } else {
        out[k] = deepClone(ov);
      }
    }
    return out;
  }

  function addLinkButton(td, cohort, subject, state) {
    var actions = document.createElement('div');
    actions.className = 'cell-actions';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell-add-link';
    btn.textContent = 'Add link';
    btn.addEventListener('click', function () {
      var url = prompt('Enter URL for ' + cohort + ' - ' + subject);
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) { alert('Please enter a valid http(s) URL.'); return; }
      var curPlanCohort = (state.overrides.plans && state.overrides.plans[cohort]) ? state.overrides.plans[cohort] : null;
      var current = (curPlanCohort && curPlanCohort[subject]) ? curPlanCohort[subject]
                   : (state.merged.plans && state.merged.plans[cohort] ? state.merged.plans[cohort][subject] : {});
      var name = (current && typeof current === 'object' && current.name) ? current.name : (typeof current === 'string' ? '' : '');
      if (!state.overrides.plans) state.overrides.plans = {};
      if (!state.overrides.plans[cohort]) state.overrides.plans[cohort] = {};
      state.overrides.plans[cohort][subject] = name ? { name: name, url: url } : url;
      localStorage.setItem('plans_overrides', JSON.stringify(state.overrides));
      state.merged = deepMerge(state.base, state.overrides);
      render(state);
    });
    actions.appendChild(btn);
    td.appendChild(actions);
  }

  function render(state) {
    var thead = document.getElementById('plans-head');
    var tbody = document.getElementById('plans-body');
    if (!thead || !tbody) return;

    var subjects = state.subjects;
    var cohorts = state.cohorts;
    var merged = state.merged;

    thead.innerHTML = '';
    thead.appendChild(buildHeaderRow(subjects));

    tbody.innerHTML = '';
    for (var c = 0; c < cohorts.length; c++) {
      var cohort = cohorts[c];
      var tr = document.createElement('tr');
      var th = document.createElement('th'); th.scope='row'; th.textContent = cohort; tr.appendChild(th);
      for (var s = 0; s < subjects.length; s++) {
        var subject = subjects[s];
        var row = merged.plans && merged.plans[cohort] ? merged.plans[cohort] : {};
        var value = row[subject];
        var td;
        if (value && typeof value === 'object') {
          var name = value.name || '';
          var url = value.url || '';
          if (url) {
            var a = document.createElement('a'); a.className='cell-link'; a.href=url; a.textContent = name || 'Open';
            td = createCell(a);
          } else if (name) {
            var span = document.createElement('span'); span.className='cell-name'; span.textContent=name; td = createCell(span); addLinkButton(td, cohort, subject, state);
          } else {
            td = createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' }); addLinkButton(td, cohort, subject, state);
          }
        } else if (typeof value === 'string') {
          if (/^https?:\/\//i.test(value)) {
            var a2 = document.createElement('a'); a2.className='cell-link'; a2.href=value; a2.textContent='Open';
            td = createCell(a2);
          } else if (value.trim().length) {
            var span2 = document.createElement('span'); span2.className='cell-name'; span2.textContent=value; td = createCell(span2); addLinkButton(td, cohort, subject, state);
          } else {
            td = createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' }); addLinkButton(td, cohort, subject, state);
          }
        } else {
          td = createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' }); addLinkButton(td, cohort, subject, state);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  function init() {
    var table = document.getElementById('plans-table');
    var thead = document.getElementById('plans-head');
    var tbody = document.getElementById('plans-body');
    if (!table || !thead || !tbody) return;

    function toEmbedUrl(url) {
      try {
        var m = url.match(/https?:\/\/docs\.google\.com\/presentation\/d\/([^\/?#]+)\//i);
        if (m && m[1]) {
          return 'https://docs.google.com/presentation/d/' + m[1] + '/embed?start=false&loop=false&delayms=3000';
        }
      } catch (e) {}
      return url;
    }

    function openViewer(url, label) {
      var frame = document.getElementById('viewer-frame');
      var title = document.getElementById('viewer-title');
      var open = document.getElementById('viewer-open');
      if (!frame || !title || !open) return;
      var embed = toEmbedUrl(url);
      frame.src = embed;
      title.textContent = label || 'Preview';
      open.href = url;
      open.style.display = 'inline';
      try {
        localStorage.setItem('last_view_url', url);
        localStorage.setItem('last_view_label', label || 'Preview');
      } catch (e) {}
    }

    function proceed(base) {
      var subjects = (base.order && base.order.subjects && base.order.subjects.length) ? base.order.subjects : DEFAULT_SUBJECTS;
      var cohorts = (base.order && base.order.cohorts && base.order.cohorts.length) ? base.order.cohorts : DEFAULT_COHORTS;
      var overrides = {};
      try { overrides = JSON.parse(localStorage.getItem('plans_overrides') || '{}') || {}; } catch (e) {}
      var merged = deepMerge(base, overrides);
      var state = { base: base, overrides: overrides, merged: merged, subjects: subjects, cohorts: cohorts };
      render(state);

      // Intercept table link clicks to open in the side viewer
      var plansRoot = document.getElementById('plans');
      if (plansRoot) {
        plansRoot.addEventListener('click', function (e) {
          var el = e.target || e.srcElement;
          if (el && el.tagName === 'A' && /\bcell-link\b/.test(el.className)) {
            e.preventDefault();
            openViewer(el.getAttribute('href'), el.textContent || 'Slides');
          }
        });
      }

      // Auto-open last viewed or first available link in the viewer
      var lastUrl = null, lastLabel = null;
      try {
        lastUrl = localStorage.getItem('last_view_url');
        lastLabel = localStorage.getItem('last_view_label');
      } catch (e) {}
      if (lastUrl) {
        openViewer(lastUrl, lastLabel || 'Slides');
      } else {
        var first = document.querySelector('#plans a.cell-link');
        if (first) openViewer(first.getAttribute('href'), first.textContent || 'Slides');
      }

      var exportBtn = document.getElementById('export-json');
      var clearBtn = document.getElementById('clear-local');
      if (exportBtn) {
        exportBtn.addEventListener('click', function () {
          var mergedOut = deepMerge(state.base, state.overrides);
          var text = JSON.stringify(mergedOut, null, 2);
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(function(){ alert('Copied updated JSON to clipboard. Paste into assets/decks.json to persist.'); })
              .catch(function(){ downloadText(text); });
            } else {
              downloadText(text);
            }
          } catch (e) {
            downloadText(text);
          }
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          if (!confirm('Clear local changes? This does not modify decks.json until you export and replace it.')) return;
          localStorage.removeItem('plans_overrides');
          state.overrides = {};
          state.merged = deepMerge(state.base, state.overrides);
          render(state);
        });
      }
    }

    function downloadText(text) {
      var blob = new Blob([text], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'decks.updated.json';
      document.body.appendChild(a); a.click(); a.remove();
    }

    // Try fetch; on failure (file://), use inline template
    if (window.fetch) {
      fetch('assets/decks.json', { cache: 'no-store' })
        .then(function (res) { if (!res.ok) throw new Error('' + res.status); return res.json(); })
        .then(function (base) { proceed(base); })
        .catch(function () {
          var tpl = document.getElementById('decks-data');
          if (tpl && tpl.textContent) {
            try { proceed(JSON.parse(tpl.textContent)); } catch (e) { /* leave fallback */ }
          }
        });
    } else {
      var tpl = document.getElementById('decks-data');
      if (tpl && tpl.textContent) {
        try { proceed(JSON.parse(tpl.textContent)); } catch (e) { /* leave fallback */ }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
