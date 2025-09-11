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
    var editMode = false;
    var currentTeacherView = 'subject';
    var state = null; // holds current data for editor/export
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
    function markActiveTeacherByUrl(url, label){
      try {
        var btns = document.querySelectorAll('#teacher-display .teacher-btn');
        if (activeTeacherBtn && activeTeacherBtn.classList) activeTeacherBtn.classList.remove('active');
        var match = null;
        // Prefer exact match on both URL and name when provided
        if (label){
          for (var j=0;j<btns.length;j++){
            var b = btns[j];
            if (b.getAttribute('data-url') === url && (b.getAttribute('data-name')||'') === label){ match = b; break; }
          }
        }
        // Fallback: first URL match
        if (!match){
          for (var i=0;i<btns.length;i++){
            if (btns[i].getAttribute('data-url') === url){ match = btns[i]; break; }
          }
        }
        if (match){ match.classList.add('active'); activeTeacherBtn = match; }
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
      markActiveTeacherByUrl(url, label);
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
      state = { base: base, merged: merged, subjects: subjects, cohorts: cohorts };
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
            var subj = subjects[si]; // subject category (e.g., Math, Science, ...)
            var val = row[subj];
            if (!val) continue;
            // Store grouping subject as the category, and keep any finer-grained label (e.g., course name)
            var pushItem = function(name, url, label, index){ list.push({ name: name, url: url || '', cohort: cohort, subject: subj, label: label || '', _index: (typeof index==='number'? index : null) }); };
            if (Array.isArray(val)) {
              for (var vi=0; vi<val.length; vi++){
                var it = val[vi];
                if (typeof it === 'string') {
                  var trimmed = it.trim(); if (trimmed) pushItem(trimmed, '', '', vi);
                } else if (it && typeof it === 'object') {
                  pushItem(it.name || '', it.url || '', it.subject || '', vi);
                }
              }
            } else if (typeof val === 'object') {
              pushItem(val.name || '', val.url || '', val.subject || '', null);
            } else if (typeof val === 'string') {
              if (val.indexOf(',') !== -1) {
                var parts = val.split(',');
                for (var pj=0; pj<parts.length; pj++){ var nm = parts[pj].trim(); if (nm) pushItem(nm, '', '', pj); }
              } else if (val.trim()) {
                pushItem(val.trim(), '', '', null);
              }
            }
          }
        }
        return list.filter(function(x){ return x.name; });
      }

      function teacherButton(entry, simple){
        var btn = document.createElement('button'); btn.className='teacher-btn';
        btn.setAttribute('data-url', entry.url||'');
        btn.setAttribute('data-name', entry.name||'');
        btn.textContent = entry.name + ' ';
        var span = document.createElement('span');
        var tag = entry.label || entry.subject || entry.cohort || 'General';
        if (simple) { span.className='detail-tag'; span.textContent = entry.cohort + ' ' + tag; }
        else if (entry.cohort) { span.className='cohort-tag'; span.textContent = tag; }
        btn.appendChild(span);
        if (entry.url){
          btn.addEventListener('click', function(){
            openViewer(entry.url, entry.name);
            try {
              var prev = document.querySelector('#teacher-display .teacher-btn.active');
              if (prev) prev.classList.remove('active');
              btn.classList.add('active');
              activeTeacherBtn = btn;
            } catch(e){}
          });
        } else {
          btn.disabled = true; btn.title = 'No link provided';
        }
        if (editMode) {
          var edit = document.createElement('button');
          edit.type='button'; edit.className='mini-edit-btn'; edit.textContent='Edit';
          edit.addEventListener('click', function(ev){ ev.stopPropagation(); editEntry(entry); });
          btn.appendChild(edit);
        }
        return btn;
      }

      function renderTeacherView(view){
        var container = document.getElementById('teacher-display');
        if (!container) return;
        container.style.opacity = '0';
        currentTeacherView = view;
        var data = normalizeEntries();
        var bySubject = {}; var byCohort = {};
        for (var i=0;i<data.length;i++){
          var e = data[i];
          var key = e.subject || 'Other';
          if (!bySubject[key]) bySubject[key] = [];
          bySubject[key].push(e);
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
            
            subjects.forEach(function(subj){ arrc.filter(function(t){return t.subject===subj;}).forEach(function(t){ wrap2.appendChild(teacherButton(t)); }); });
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
      // Add editor controls (Edit toggle + Export)
      injectEditorControls();

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

    function editEntry(entry){
      try {
        var cohort = entry.cohort; var subj = entry.subject;
        var row = state.base.plans && state.base.plans[cohort] ? state.base.plans[cohort] : null;
        if (!row) return;
        var cell = row[subj];
        var curName = entry.name || '';
        var curLabel = entry.label || '';
        var curUrl = entry.url || '';
        var name = window.prompt('Teacher name', curName); if (name===null) return;
        var label = window.prompt('Course/label (optional)', curLabel); if (label===null) return;
        var url = window.prompt('Slide URL (Google Slides preferred)', curUrl); if (url===null) return;
        var newObj = { name: name, url: url };
        if (label) newObj.subject = label;
        if (Array.isArray(cell)){
          var idx = (typeof entry._index==='number') ? entry._index : 0;
          cell[idx] = newObj;
        } else {
          row[subj] = newObj;
        }
        // re-render table and teacher list
        render(state);
        renderTeacherView(currentTeacherView);
      } catch(e){}
    }

    function injectEditorControls(){
      var host = document.querySelector('.view-toggle-buttons');
      if (!host) return;
      var wrap = document.createElement('div'); wrap.className='editor-controls'; wrap.style.display='inline-flex'; wrap.style.gap='8px'; wrap.style.marginLeft='8px';
      var toggle = document.createElement('button'); toggle.type='button'; toggle.className='view-btn'; toggle.textContent = editMode ? 'Editing: ON' : 'Editing: OFF';
      toggle.addEventListener('click', function(){ editMode = !editMode; toggle.textContent = editMode ? 'Editing: ON' : 'Editing: OFF'; renderTeacherView(currentTeacherView); });
      var exportBtn = document.createElement('button'); exportBtn.type='button'; exportBtn.className='view-btn'; exportBtn.textContent='Export JSON';
      exportBtn.addEventListener('click', function(){ try { downloadText(JSON.stringify(state.base, null, 2)); } catch(e){} });
      var saveBtn = document.createElement('button'); saveBtn.type='button'; saveBtn.className='view-btn'; saveBtn.textContent='Save to GitHub';
      saveBtn.addEventListener('click', function(){ saveToGitHub(saveBtn); });
      var settingsBtn = document.createElement('button'); settingsBtn.type='button'; settingsBtn.className='view-btn'; settingsBtn.textContent='Settings';
      settingsBtn.addEventListener('click', function(){ openSettings(); });
      wrap.appendChild(toggle); wrap.appendChild(exportBtn); wrap.appendChild(saveBtn); wrap.appendChild(settingsBtn); host.appendChild(wrap);
    }

    function downloadText(text) {
      var blob = new Blob([text], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'decks.updated.json';
      document.body.appendChild(a); a.click(); a.remove();
    }

    // ---- GitHub Save (client-side, requires a local token) ----
    function getRepoConfig(){
      // Adjust these if the repo moves
      return { owner: 'tkerns226', repo: 'SPEDhelper', branch: 'main', path: 'assets/decks.json' };
    }
    function promptForToken(){
      try {
        var existing = localStorage.getItem('gh_token') || '';
        var v = window.prompt('Paste GitHub token (repo contents: read/write for tkerns226/SPEDhelper). It stays only in this browser.', existing);
        if (v !== null) { localStorage.setItem('gh_token', v.trim()); alert('Token saved locally to this browser.'); }
      } catch(e){}
    }
    function b64encodeUtf8(str){
      try { return btoa(unescape(encodeURIComponent(str))); } catch(e){ return btoa(str); }
    }
    function b64decodeUtf8(b64){
      try { return decodeURIComponent(escape(atob(b64))); } catch(e){ return atob(b64); }
    }
    function githubGetFile(cfg, token){
      var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path + '?ref=' + encodeURIComponent(cfg.branch);
      return fetch(url, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }})
        .then(function(res){ if (!res.ok) throw new Error('GET ' + res.status); return res.json(); })
        .then(function(json){ return { sha: json.sha || '', content: json.content || '', encoding: json.encoding || 'base64' }; });
    }
    function githubPutFile(cfg, token, contentB64, sha, message){
      var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path;
      var body = { message: message, content: contentB64, branch: cfg.branch };
      if (sha) body.sha = sha;
      return fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(res){ if (!res.ok) return res.json().then(function(j){ throw new Error('PUT ' + res.status + ' ' + (j.message||'')); }); return res.json(); });
    }
    function saveToGitHub(button){
      try {
        var cfg = getRepoConfig();
        var token = '';
        try { token = localStorage.getItem('gh_token') || ''; } catch(e){}
        if (!token){ promptForToken(); try { token = localStorage.getItem('gh_token') || ''; } catch(e){} }
        if (!token){ alert('No token set. Click Set Token and paste a fine-grained PAT.'); return; }
        var json = JSON.stringify(state.base, null, 2);
        var b64 = b64encodeUtf8(json);
        var originalText = button.textContent; button.disabled = true; button.textContent = 'Saving (1/2)...';
        // 1) Save assets/decks.json
        githubGetFile(cfg, token)
          .then(function(info){ return githubPutFile(cfg, token, b64, info.sha, 'Update decks.json via in-page editor'); })
          .then(function(){
            // 2) Save inline fallback in index.html
            button.textContent = 'Saving (2/2)...';
            var cfgHtml = { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch, path: 'index.html' };
            return githubGetFile(cfgHtml, token).then(function(info){
              var htmlText = (info.encoding === 'base64') ? b64decodeUtf8(info.content) : info.content;
              var updated = updateInlineTemplate(htmlText, json);
              if (!updated.ok) throw new Error(updated.error || 'Could not update inline fallback JSON');
              var htmlB64 = b64encodeUtf8(updated.text);
              return githubPutFile(cfgHtml, token, htmlB64, info.sha, 'Update inline fallback JSON via in-page editor');
            });
          })
          .then(function(){ button.textContent = 'Saved!'; setTimeout(function(){ button.disabled = false; button.textContent = originalText; }, 1200); })
          .catch(function(err){ console.error(err); alert('Save failed: ' + err.message); button.disabled = false; button.textContent = originalText; });
      } catch(e){ alert('Save failed. See console for details.'); try { console.error(e); } catch(_){} }
    }

    function updateInlineTemplate(htmlText, jsonText){
      try {
        var startTag = '<template id="decks-data">';
        var endTag = '</template>';
        var start = htmlText.indexOf(startTag);
        if (start === -1) return { ok:false, error: 'Inline template start not found' };
        var afterStart = start + startTag.length;
        var end = htmlText.indexOf(endTag, afterStart);
        if (end === -1) return { ok:false, error: 'Inline template end not found' };
        var before = htmlText.slice(0, afterStart);
        // Preserve indentation after the start tag if present
        var indentMatch = htmlText.slice(0, start).match(/(^|\n)([ \t]*)$/);
        var indent = indentMatch ? indentMatch[2] : '';
        var between = '\n' + jsonText + '\n' + indent;
        var after = htmlText.slice(end);
        return { ok:true, text: before + between + after };
      } catch(e){ return { ok:false, error: e && e.message ? e.message : 'update error' }; }
    }

    // ---- Settings Modal ----
    var settingsEl = null;
    function openSettings(){
      if (settingsEl){ settingsEl.style.display = 'flex'; refreshSettingsStatus(); return; }
      settingsEl = document.createElement('div');
      settingsEl.className = 'settings-overlay';
      settingsEl.setAttribute('role','dialog');
      settingsEl.setAttribute('aria-modal','true');
      // Inline basic styles to avoid CSS edits
      settingsEl.style.position='fixed'; settingsEl.style.inset='0'; settingsEl.style.background='rgba(0,0,0,0.4)';
      settingsEl.style.display='flex'; settingsEl.style.alignItems='center'; settingsEl.style.justifyContent='center'; settingsEl.style.zIndex='1000';
      var box = document.createElement('div'); box.className='settings-box';
      box.style.background='#fff'; box.style.color='#111'; box.style.minWidth='320px'; box.style.maxWidth='520px'; box.style.borderRadius='8px';
      box.style.boxShadow='0 10px 30px rgba(0,0,0,0.25)'; box.style.padding='16px'; box.style.fontSize='14px';
      var h = document.createElement('h2'); h.textContent='Settings'; h.style.margin='0 0 8px'; box.appendChild(h);
      var p = document.createElement('p'); p.textContent = 'Save to GitHub uses a token stored only in this browser. Use a fine-grained PAT limited to this repo (Contents: Read/Write). You can clear it anytime here.'; p.style.margin='0 0 8px'; box.appendChild(p);
      var status = document.createElement('div'); status.id='settings-token-status'; status.style.margin='8px 0'; box.appendChild(status);
      var row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.flexWrap='wrap';
      var setBtn = document.createElement('button'); setBtn.className='view-btn'; setBtn.textContent='Set Token'; setBtn.addEventListener('click', function(){ promptForToken(); refreshSettingsStatus(); });
      var clearBtn = document.createElement('button'); clearBtn.className='view-btn'; clearBtn.textContent='Clear Token'; clearBtn.addEventListener('click', function(){ try { localStorage.removeItem('gh_token'); } catch(e){} refreshSettingsStatus(); });
      var closeBtn = document.createElement('button'); closeBtn.className='view-btn'; closeBtn.textContent='Close'; closeBtn.addEventListener('click', function(){ closeSettings(); });
      row.appendChild(setBtn); row.appendChild(clearBtn); row.appendChild(closeBtn); box.appendChild(row);
      settingsEl.addEventListener('click', function(e){ if (e.target === settingsEl) closeSettings(); });
      settingsEl.appendChild(box);
      document.body.appendChild(settingsEl);
      refreshSettingsStatus();
    }
    function closeSettings(){ if (settingsEl) settingsEl.style.display='none'; }
    function maskToken(tok){ if (!tok) return '(not set)'; var t = tok.replace(/\s+/g,''); if (t.length<=8) return '••••'; return t.slice(0,4) + '•••' + t.slice(-4); }
    function refreshSettingsStatus(){
      try {
        var el = document.getElementById('settings-token-status'); if (!el) return;
        var tok = localStorage.getItem('gh_token') || '';
        el.textContent = tok ? ('Token: ' + maskToken(tok) + ' — stored locally in this browser') : 'Token: (not set)';
      } catch(e){}
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
