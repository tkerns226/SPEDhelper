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
    // Row header with Open Team button
    var thWrap = document.createElement('div');
    thWrap.style.display = 'flex';
    thWrap.style.alignItems = 'center';
    thWrap.style.gap = '6px';
    var thLabel = document.createElement('span'); thLabel.textContent = cohort; thWrap.appendChild(thLabel);
    var teamBtn = document.createElement('button'); teamBtn.type='button'; teamBtn.className='open-team-btn'; teamBtn.textContent='Open Team'; teamBtn.setAttribute('data-cohort', cohort);
    thWrap.appendChild(teamBtn);
    th.appendChild(thWrap);
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

  // (Removed local edit helpers: deepMerge/addLinkButton) — links are managed via decks.json only.

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
        // Support arrays of entries (stacked items)
        if (Array.isArray(value)) {
          var wrap = document.createElement('div'); wrap.className = 'cell-stack';
          for (var ai = 0; ai < value.length; ai++) {
            var item = value[ai];
            if (typeof item === 'string') {
              var str = item.trim(); if (!str) continue;
              var sp = document.createElement('span'); sp.className='cell-name'; sp.textContent = str; wrap.appendChild(sp);
            } else if (item && typeof item === 'object') {
              var iname = item.name || '';
              var iurl = item.url || '';
              if (iurl) {
                var la = document.createElement('a'); la.className='cell-link'; la.href=iurl; la.textContent = iname || 'Open'; wrap.appendChild(la);
              } else if (iname) {
                var isp = document.createElement('span'); isp.className='cell-name'; isp.textContent = iname; wrap.appendChild(isp);
              }
            }
          }
          td = createCell(wrap);
          tr.appendChild(td);
          continue;
        }
        if (value && typeof value === 'object') {
          var name = value.name || '';
          var url = value.url || '';
          if (url) {
            var a = document.createElement('a'); a.className='cell-link'; a.href=url; a.textContent = name || 'Open';
            td = createCell(a);
          } else if (name) {
            // Support comma-separated names by stacking vertically
            if (name.indexOf(',') !== -1) {
              var wrapper = document.createElement('div');
              wrapper.className = 'cell-stack';
              var parts = name.split(',');
              for (var pi = 0; pi < parts.length; pi++) {
                var n = parts[pi].trim(); if (!n) continue;
                var s = document.createElement('span'); s.className = 'cell-name'; s.textContent = n; wrapper.appendChild(s);
              }
              td = createCell(wrapper);
            } else {
              var span = document.createElement('span'); span.className='cell-name'; span.textContent=name; td = createCell(span);
            }
          } else {
            td = createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' });
          }
        } else if (typeof value === 'string') {
          if (/^https?:\/\//i.test(value)) {
            var a2 = document.createElement('a'); a2.className='cell-link'; a2.href=value; a2.textContent='Open';
            td = createCell(a2);
          } else if (value.trim().length) {
            var trimmed = value.trim();
            if (trimmed.indexOf(',') !== -1) {
              var wrap2 = document.createElement('div'); wrap2.className='cell-stack';
              var parts2 = trimmed.split(',');
              for (var pj = 0; pj < parts2.length; pj++) {
                var n2 = parts2[pj].trim(); if (!n2) continue;
                var s2 = document.createElement('span'); s2.className='cell-name'; s2.textContent = n2; wrap2.appendChild(s2);
              }
              td = createCell(wrap2);
            } else {
              var span2 = document.createElement('span'); span2.className='cell-name'; span2.textContent=trimmed; td = createCell(span2);
            }
          } else {
            td = createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' });
          }
        } else {
          td = createCell('-', { className: 'cell-empty', ariaLabel: cohort + ' ' + subject + ' plan not set' });
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

    var activeCell = null;
    var activeTeacherBtn = null;
    function markActiveCellByUrl(url){
      try {
        var links = document.querySelectorAll('#plans a.cell-link');
        var matchTd = null;
        for (var i=0;i<links.length;i++){
          if (links[i].getAttribute('href') === url){ matchTd = links[i].closest ? links[i].closest('td') : links[i].parentNode; break; }
        }
        if (activeCell && activeCell.classList) activeCell.classList.remove('active-cell');
        if (matchTd && matchTd.classList){ matchTd.classList.add('active-cell'); activeCell = matchTd; }
      } catch(e) {}
    }
    function markActiveTeacherByUrl(url){
      try {
        var btns = document.querySelectorAll('#teacher-display .teacher-btn');
        if (activeTeacherBtn && activeTeacherBtn.classList) activeTeacherBtn.classList.remove('active');
        for (var i=0;i<btns.length;i++){
          if (btns[i].getAttribute('data-url') === url){ btns[i].classList.add('active'); activeTeacherBtn = btns[i]; break; }
        }
      } catch(e){}
    }

    function openViewer(url, label) {
      var frame = document.getElementById('viewer-frame');
      var title = document.getElementById('viewer-title');
      var open = document.getElementById('viewer-open');
      var loading = document.getElementById('viewer-loading');
      if (!frame || !title || !open) return;
      var embed = toEmbedUrl(url);
      try { if (loading) loading.classList.add('active'); } catch(e){}
      frame.src = embed;
      title.textContent = 'Currently viewing: ' + (label || 'Preview');
      open.href = url;
      open.style.display = 'inline';
      try {
        localStorage.setItem('last_view_url', url);
        localStorage.setItem('last_view_label', label || 'Preview');
      } catch (e) {}
      addOrActivateTab(url, label || 'Slides');
      markActiveCellByUrl(url);
      markActiveTeacherByUrl(url);
      // load/timeout handling
      var handled = false;
      var clear = function(){ if (handled) return; handled = true; try { if (loading) loading.classList.remove('active'); } catch(e){} };
      frame.onload = clear;
      setTimeout(function(){
        if (!handled){
          clear();
          // Show a small message if needed
          try {
            var l = document.getElementById('viewer-loading');
            if (l){ l.innerHTML = '<div class="viewer-error">If the preview is blank, click \'Open in new tab\'.</div>'; l.classList.add('active'); setTimeout(function(){ l.classList.remove('active'); l.innerHTML = '<div class="spinner"></div>'; }, 3500); }
          } catch(e){}
        }
      }, 8000);
    }

    // Tabs management
    var tabs = [];
    function renderTabs(activeUrl) {
      var bar = document.getElementById('viewer-tabs');
      if (!bar) return;
      bar.innerHTML = '';
      for (var i=0;i<tabs.length;i++) {
        var t = tabs[i];
        var el = document.createElement('div'); el.className = 'tab' + (t.url===activeUrl?' active':''); el.setAttribute('data-url', t.url);
        var span = document.createElement('span'); span.className='tab-title'; span.textContent = t.title; el.appendChild(span);
        var close = document.createElement('button'); close.className='tab-close'; close.type='button'; close.textContent='×'; el.appendChild(close);
        bar.appendChild(el);
      }
    }
    function addOrActivateTab(url, title){
      // check existing
      for (var i=0;i<tabs.length;i++){ if (tabs[i].url===url){ renderTabs(url); return; } }
      tabs.push({ url:url, title:title });
      renderTabs(url);
    }
    function closeTab(url){
      tabs = tabs.filter(function(t){ return t.url!==url; });
      renderTabs((tabs[0]||{}).url || '');
      if (tabs.length){ openViewer(tabs[tabs.length-1].url, tabs[tabs.length-1].title); }
    }

    function proceed(base) {
      var subjects = (base.order && base.order.subjects && base.order.subjects.length) ? base.order.subjects : DEFAULT_SUBJECTS;
      var cohorts = (base.order && base.order.cohorts && base.order.cohorts.length) ? base.order.cohorts : DEFAULT_COHORTS;
      var merged = base; // no local overrides
      var state = { base: base, merged: merged, subjects: subjects, cohorts: cohorts };
      render(state);

      // Intercept table link clicks to open in the side viewer
      var plansRoot = document.getElementById('plans');
      if (plansRoot) {
        plansRoot.addEventListener('click', function (e) {
          var el = e.target || e.srcElement;
          if (el && el.tagName === 'A' && /\bcell-link\b/.test(el.className)) {
            e.preventDefault();
            openViewer(el.getAttribute('href'), el.textContent || 'Slides');
            return;
          }
          if (el && /\bopen-team-btn\b/.test(el.className)) {
            var cohort = el.getAttribute('data-cohort');
            var rowPlans = merged.plans && merged.plans[cohort] ? merged.plans[cohort] : {};
            var added = 0;
            for (var si=0; si<subjects.length; si++){
              var subj = subjects[si];
              var val = rowPlans[subj];
              if (!val) continue;
              if (Array.isArray(val)) {
                for (var vi=0; vi<val.length; vi++){
                  var item = val[vi];
                  if (item && typeof item === 'object' && item.url){ addOrActivateTab(item.url, (item.name||subj)); added++; }
                  else if (typeof item === 'string' && /^https?:\/\//i.test(item)) { addOrActivateTab(item, subj); added++; }
                }
              } else if (typeof val === 'object' && val.url) { addOrActivateTab(val.url, (val.name||subj)); added++; }
              else if (typeof val === 'string' && /^https?:\/\//i.test(val)) { addOrActivateTab(val, subj); added++; }
            }
            if (added>0){ var last = tabs[tabs.length-1]; openViewer(last.url, last.title); }
          }
        });
      }

      var tabsBar = document.getElementById('viewer-tabs');
      if (tabsBar){
        tabsBar.addEventListener('click', function(e){
          var el = e.target || e.srcElement;
          var tabEl = el.closest ? el.closest('.tab') : null;
          if (!tabEl) return;
          var url = tabEl.getAttribute('data-url');
          if (el.className && /\btab-close\b/.test(el.className)) { closeTab(url); return; }
          // activate
          for (var i=0;i<tabs.length;i++){ if (tabs[i].url===url){ openViewer(tabs[i].url, tabs[i].title); break; } }
        });
      }

      // ------ Teacher List Views ------
      function normalizeEntries() {
        var list = [];
        for (var ci=0; ci<cohorts.length; ci++){
          var cohort = cohorts[ci];
          var row = merged.plans && merged.plans[cohort] ? merged.plans[cohort] : {};
          for (var si=0; si<subjects.length; si++){
            var subj = subjects[si];
            var val = row[subj];
            if (!val) continue;
            var pushItem = function(name, url, actualSubj){ list.push({ name:name, url:url||'', cohort:cohort, subject:actualSubj||subj }); };
            if (Array.isArray(val)) {
              for (var vi=0; vi<val.length; vi++){
                var it = val[vi];
                if (typeof it === 'string') { if (it.trim()) pushItem(it.trim(), ''); }
                else if (it && typeof it === 'object') pushItem(it.name||'', it.url||'', it.subject||'');
              }
            } else if (typeof val === 'object') {
              pushItem(val.name||'', val.url||'', val.subject||'');
            } else if (typeof val === 'string') {
              if (val.indexOf(',') !== -1) {
                var parts = val.split(',');
                for (var pj=0; pj<parts.length; pj++){ var nm = parts[pj].trim(); if (nm) pushItem(nm, ''); }
              } else if (val.trim()) {
                pushItem(val.trim(), '');
              }
            }
          }
        }
        return list.filter(function(x){ return x.name; });
      }

      function teacherButton(entry, simple){
        var btn = document.createElement('button'); btn.className='teacher-btn';
        btn.setAttribute('data-url', entry.url||'');
        btn.textContent = entry.name + ' ';
        var span = document.createElement('span');
        if (simple) { span.className='detail-tag'; span.textContent = entry.cohort + ' ' + (entry.subject || 'General'); }
        else if (entry.cohort) { span.className='cohort-tag'; span.textContent = entry.subject || entry.cohort; }
        btn.appendChild(span);
        if (entry.url){
          btn.addEventListener('click', function(){ openViewer(entry.url, entry.name); });
        } else {
          btn.disabled = true; btn.title = 'No link provided';
        }
        return btn;
      }

      function renderTeacherView(view){
        var container = document.getElementById('teacher-display');
        if (!container) return;
        container.style.opacity = '0';
        var data = normalizeEntries();
        var bySubject = {}; var byCohort = {};
        for (var i=0;i<data.length;i++){
          var e = data[i];
          if (!bySubject[e.subject]) bySubject[e.subject] = [];
          bySubject[e.subject].push(e);
          if (!byCohort[e.cohort]) byCohort[e.cohort] = [];
          byCohort[e.cohort].push(e);
        }
        var out = document.createElement('div');
        if (view === 'subject'){
          for (var s=0;s<subjects.length;s++){
            var subj = subjects[s]; var arr = bySubject[subj] || [];
            if (!arr.length) continue;
            var sec = document.createElement('div'); sec.className='subject-section';
            var h = document.createElement('h3'); h.className='subject-header'; h.textContent=subj; sec.appendChild(h);
            var wrap = document.createElement('div'); wrap.className='teacher-list-vertical';
            arr.forEach(function(t){ wrap.appendChild(teacherButton(t)); });
            sec.appendChild(wrap); out.appendChild(sec);
          }
        } else if (view === 'cohort'){
          for (var c=0;c<cohorts.length;c++){
            var coh = cohorts[c]; var arrc = byCohort[coh] || [];
            if (!arrc.length) continue;
            var sec2 = document.createElement('div'); sec2.className='cohort-section';
            var h2 = document.createElement('h3'); h2.className='cohort-header'; h2.textContent=coh + ' Teachers'; sec2.appendChild(h2);
            var wrap2 = document.createElement('div'); wrap2.className='teacher-list-vertical';
            // Add Open All Team button for this cohort
            var openAllBtn = document.createElement('button');
            openAllBtn.className = 'teacher-btn open-all-team-btn';
            openAllBtn.textContent = 'Open All ' + coh + ' Team ';
            openAllBtn.setAttribute('data-cohort', coh);
            var openAllSpan = document.createElement('span');
            openAllSpan.className = 'cohort-tag';
            openAllSpan.textContent = 'ALL';
            openAllBtn.appendChild(openAllSpan);
            openAllBtn.addEventListener('click', function(){
              // Open all teachers with links for this cohort
              var cohortTeachers = arrc.filter(function(t){ return t.url; });
              for(var i=0; i<cohortTeachers.length; i++){
                addOrActivateTab(cohortTeachers[i].url, cohortTeachers[i].name);
              }
              if(cohortTeachers.length > 0){
                var last = tabs[tabs.length-1];
                openViewer(last.url, last.title);
              }
            });
            wrap2.appendChild(openAllBtn);
            
            subjects.forEach(function(subj){ arrc.filter(function(t){return t.subject===subj || (t.subject === '' && t.cohort && t.cohort.indexOf(subj) > -1);}).forEach(function(t){ wrap2.appendChild(teacherButton(t)); }); });
            sec2.appendChild(wrap2); out.appendChild(sec2);
          }
        } else {
          var list = data.slice();
          list.sort(function(a,b){ function last(n){ var p=n.trim().split(/\s+/); return p[p.length-1].toLowerCase(); } var la=last(a.name), lb=last(b.name); return la<lb?-1:la>lb?1:0; });
          var wrap3 = document.createElement('div'); wrap3.className='simple-list';
          
          // Add Open All Teachers button at top
          var openAllBtn = document.createElement('button');
          openAllBtn.className = 'teacher-btn open-all-teachers-btn';
          openAllBtn.textContent = 'Open All Available Slides ';
          var openAllSpan = document.createElement('span');
          openAllSpan.className = 'detail-tag';
          openAllSpan.textContent = 'ALL SLIDES';
          openAllBtn.appendChild(openAllSpan);
          openAllBtn.addEventListener('click', function(){
            var teachersWithLinks = list.filter(function(t){ return t.url; });
            for(var i=0; i<teachersWithLinks.length; i++){
              addOrActivateTab(teachersWithLinks[i].url, teachersWithLinks[i].name);
            }
            if(teachersWithLinks.length > 0){
              var last = tabs[tabs.length-1];
              openViewer(last.url, last.title);
            }
          });
          wrap3.appendChild(openAllBtn);
          
          list.forEach(function(t){ wrap3.appendChild(teacherButton(t, true)); });
          out.appendChild(wrap3);
        }
        container.innerHTML = '';
        container.appendChild(out);
        requestAnimationFrame(function(){ container.style.opacity = '1'; });
      }

      // Attach toggle handlers
      var toggleWrap = document.querySelector('.view-toggle-buttons');
      if (toggleWrap){
        var buttons = toggleWrap.querySelectorAll('.view-btn');
        buttons.forEach(function(b){
          b.addEventListener('click', function(){
            buttons.forEach(function(x){ x.classList.remove('active'); });
            this.classList.add('active');
            var view = this.getAttribute('data-view');
            renderTeacherView(view);
            try { localStorage.setItem('teacherViewPreference', view); } catch(e){}
          });
        });
        var saved = 'subject';
        try { saved = localStorage.getItem('teacherViewPreference') || 'subject'; } catch(e){}
        buttons.forEach(function(x){ if (x.getAttribute('data-view')===saved) x.classList.add('active'); else x.classList.remove('active'); });
        renderTeacherView(saved);
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

      // Export button removed: edits happen via decks.json commits only.

      // Fallback: ensure teacher list renders at least once
      var disp = document.getElementById('teacher-display');
      if (disp && !disp.firstChild) {
        try {
          var defaultView = localStorage.getItem('teacherViewPreference') || 'subject';
          renderTeacherView(defaultView);
        } catch(e) { renderTeacherView('subject'); }
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
