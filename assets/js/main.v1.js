/* ИП Дрозд А.Н. — меню, разметка стены, диагностика, заявка */
(function () {
  'use strict';
  var WA = 'https://wa.me/375333043568';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- шапка ---------- */
  var head = document.querySelector('.head');
  function onScroll() {
    if (!head) return;
    head.classList.toggle('is-stuck', window.scrollY > 30 || head.classList.contains('head--solid'));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- меню ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var closeBtn = document.getElementById('drawer-close');
  var lastFocus = null;
  function focusables() {
    if (!drawer) return [];
    return Array.prototype.slice.call(drawer.querySelectorAll('a[href],button:not([disabled]),input,select,textarea'))
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add('is-locked');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    var f = focusables(); if (f.length) f[0].focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.hidden = true;
    document.body.classList.remove('is-locked');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (burger) burger.addEventListener('click', function () { (drawer && drawer.hidden) ? openDrawer() : closeDrawer(); });
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (drawer) {
    drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('is-locked');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && !drawer.hidden) closeDrawer();
  });

  /* ---------- появление ---------- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('is-in'); }); }

  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }

  /* ---------- разметка стены ---------- */
  var svg = document.getElementById('wallSvg');
  if (svg) {
    var IN = {
      len: document.getElementById('wLen'), sock: document.getElementById('wSock'),
      sw: document.getElementById('wSw'), light: document.getElementById('wLight')
    };
    var OUT = {
      len: document.getElementById('wLenOut'), sock: document.getElementById('wSockOut'),
      sw: document.getElementById('wSwOut'), light: document.getElementById('wLightOut')
    };
    var oBoxes = document.getElementById('o-boxes'), oGroove = document.getElementById('o-groove');
    var oCable = document.getElementById('o-cable'), oGroups = document.getElementById('o-groups');
    var oVerdict = document.getElementById('o-verdict'), oRouteLabel = document.getElementById('o-route-label');
    var send = document.getElementById('wall-send');
    var route = 'groove';

    var CEIL = 2.7, H_SOCK = 0.3, H_SW = 0.9;

    function drawWall() {
      var L = parseFloat(IN.len.value), n = parseFloat(IN.sock.value);
      var m = parseFloat(IN.sw.value), k = parseFloat(IN.light.value);
      var s = Math.min(320 / CEIL, 510 / L);
      var wallW = L * s, wallH = CEIL * s;
      var x0 = (640 - wallW) / 2, y1 = 356, y0 = y1 - wallH;
      var ySock = y1 - H_SOCK * s, ySw = y1 - H_SW * s;

      while (svg.firstChild) svg.removeChild(svg.firstChild);

      /* стена */
      svg.appendChild(el('rect', { x: x0, y: y0, width: wallW, height: wallH, fill: '#212823', stroke: 'rgba(233,231,226,.35)', 'stroke-width': 1.2 }));
      svg.appendChild(el('rect', { x: x0, y: y1, width: wallW, height: 8, fill: '#2E3630' }));
      svg.appendChild(el('line', { x1: 20, y1: y1 + 8, x2: 620, y2: y1 + 8, stroke: 'rgba(233,231,226,.35)', 'stroke-width': 1.4 }));

      /* лазерный уровень */
      svg.appendChild(el('line', { x1: x0 - 14, y1: y1 - 1.0 * s, x2: x0 + wallW + 14, y2: y1 - 1.0 * s, stroke: '#2FBF71', 'stroke-width': 1.2, opacity: '.85' }));
      svg.appendChild(el('text', { x: x0 + 6, y: y1 - 1.0 * s - 8 }, '0,00 · лазерный уровень'));

      /* точки */
      function socket(x) {
        var g = el('g');
        g.appendChild(el('rect', { x: x - 7, y: ySock - 7, width: 14, height: 14, rx: 2, fill: '#E9E7E2', stroke: '#0E130F', 'stroke-width': 1 }));
        g.appendChild(el('circle', { cx: x - 3, cy: ySock, r: 1.2, fill: '#161A17' }));
        g.appendChild(el('circle', { cx: x + 3, cy: ySock, r: 1.2, fill: '#161A17' }));
        svg.appendChild(g);
      }
      function switcher(x) {
        var g = el('g');
        g.appendChild(el('rect', { x: x - 7, y: ySw - 7, width: 14, height: 14, rx: 2, fill: '#161A17', stroke: '#2FBF71', 'stroke-width': 1.4 }));
        g.appendChild(el('line', { x1: x - 3, y1: ySw, x2: x + 3, y2: ySw, stroke: '#2FBF71', 'stroke-width': 1.4 }));
        svg.appendChild(g);
      }

      var xs = [];
      if (n > 0) {
        var step = n > 1 ? (wallW * 0.82) / (n - 1) : 0;
        var startX = x0 + wallW * 0.09;
        for (var i = 0; i < n; i++) xs.push(startX + step * i);
      }

      /* ствол линии по розеткам */
      if (route === 'groove') {
        if (xs.length) {
          svg.appendChild(el('line', { x1: x0 + 6, y1: ySock, x2: xs[xs.length - 1], y2: ySock, stroke: '#2FBF71', 'stroke-width': 2, opacity: '.75' }));
          svg.appendChild(el('line', { x1: x0 + 6, y1: ySock, x2: x0 + 6, y2: y0 + 8, stroke: '#2FBF71', 'stroke-width': 2, opacity: '.6', 'stroke-dasharray': '5 4' }));
        }
        xs.forEach(socket);
        var swX = [];
        if (m > 0) {
          var sStep = m > 1 ? (wallW * 0.5) / (m - 1) : 0;
          var sStart = x0 + wallW * 0.14;
          for (var j = 0; j < m; j++) swX.push(sStart + sStep * j);
        }
        swX.forEach(function (x) {
          svg.appendChild(el('line', { x1: x, y1: y0 + 8, x2: x, y2: ySw - 7, stroke: '#2FBF71', 'stroke-width': 1.6, opacity: '.55', 'stroke-dasharray': '5 4' }));
          switcher(x);
        });
        xs.forEach(function (x) {
          svg.appendChild(el('line', { x1: x, y1: y0 + 8, x2: x, y2: ySock - 7, stroke: '#2FBF71', 'stroke-width': 1.6, opacity: '.55', 'stroke-dasharray': '5 4' }));
        });
      } else {
        /* кабель-канал по плинтусу */
        svg.appendChild(el('rect', { x: x0 + 4, y: y1 - 9, width: wallW - 8, height: 9, fill: 'rgba(47,191,113,.35)', stroke: '#2FBF71', 'stroke-width': 1 }));
        xs.forEach(function (x) {
          svg.appendChild(el('line', { x1: x, y1: y1 - 9, x2: x, y2: ySock + 7, stroke: '#2FBF71', 'stroke-width': 1.6, opacity: '.6' }));
          socket(x);
        });
        if (m > 0) {
          var sStep2 = m > 1 ? (wallW * 0.5) / (m - 1) : 0;
          for (var q = 0; q < m; q++) {
            var sx = x0 + wallW * 0.14 + sStep2 * q;
            svg.appendChild(el('line', { x1: sx, y1: y1 - 9, x2: sx, y2: ySw + 7, stroke: '#2FBF71', 'stroke-width': 1.6, opacity: '.6' }));
            switcher(sx);
          }
        }
      }

      /* свет */
      for (var t = 0; t < k; t++) {
        var lx = x0 + wallW * ((t + 1) / (k + 1));
        svg.appendChild(el('circle', { cx: lx, cy: y0 - 10, r: 7, fill: 'none', stroke: '#2FBF71', 'stroke-width': 1.4 }));
        svg.appendChild(el('line', { x1: lx, y1: y0 - 3, x2: lx, y2: y0 + 4, stroke: '#2FBF71', 'stroke-width': 1.4 }));
      }

      /* размеры */
      var dy = y1 + 34;
      svg.appendChild(el('line', { x1: x0, y1: dy, x2: x0 + wallW, y2: dy, stroke: 'rgba(233,231,226,.45)', 'stroke-width': 1 }));
      [x0, x0 + wallW].forEach(function (x) {
        svg.appendChild(el('line', { x1: x, y1: dy - 6, x2: x, y2: dy + 6, stroke: '#2FBF71', 'stroke-width': 1.3 }));
      });
      svg.appendChild(el('text', { x: x0 + wallW / 2, y: dy + 18, 'text-anchor': 'middle' }, 'длина стены ' + L + ' м'));

      svg.appendChild(el('text', { x: 20, y: ySock + 3 }, '300'));
      svg.appendChild(el('text', { x: 20, y: ySw + 3 }, '900'));
      var hv = el('text', { x: 14, y: (y0 + y1) / 2, 'text-anchor': 'middle' }, '2 700');
      hv.setAttribute('transform', 'rotate(-90 14 ' + ((y0 + y1) / 2) + ')');
      svg.appendChild(hv);
      svg.appendChild(el('text', { x: x0, y: y0 - 20 }, 'потолок'));

      /* расчёт */
      var boxes = n + m;
      var run = n * (CEIL - H_SOCK) + m * (CEIL - H_SW) + L;
      var groove = route === 'groove' ? run : 0;
      var cable = run * 1.12 + k * 2.5;
      var groups = Math.ceil(n / 6) + (m > 0 ? 1 : 0) + (k > 0 ? 1 : 0);
      if (groups < 1) groups = 1;

      OUT.len.textContent = L + ' м';
      OUT.sock.textContent = n;
      OUT.sw.textContent = m;
      OUT.light.textContent = k;
      oBoxes.textContent = boxes;
      oRouteLabel.textContent = route === 'groove' ? 'штроба' : 'кабель-канал';
      oGroove.textContent = route === 'groove' ? Math.round(groove) + ' м' : Math.round(L) + ' м';
      oCable.textContent = Math.round(cable) + ' м';
      oGroups.textContent = groups;

      function pl(num, one, few, many) {
        var a = Math.abs(num) % 100, b = a % 10;
        if (a > 10 && a < 20) return many;
        if (b > 1 && b < 5) return few;
        if (b === 1) return one;
        return many;
      }
      var way = route === 'groove' ? 'около ' + Math.round(groove) + ' м штробы' : 'кабель-канал ' + Math.round(L) + ' м';
      var grp = groups + ' ' + pl(groups, 'группа', 'группы', 'групп') + ' в щите';
      var v;
      if (boxes === 0 && k === 0) {
        v = 'Пока ничего не размечено. Добавьте розетки, выключатели или свет.';
      } else if (boxes === 0) {
        v = 'Только свет: ' + k + ' ' + pl(k, 'светильник', 'светильника', 'светильников') + ', ' + way + ', ' + grp + '.';
      } else {
        var parts = [];
        if (n > 0) parts.push(n + ' ' + pl(n, 'розетка', 'розетки', 'розеток'));
        if (m > 0) parts.push(m + ' ' + pl(m, 'выключатель', 'выключателя', 'выключателей'));
        v = parts.join(' и ') + ': ' + boxes + ' ' + pl(boxes, 'подрозетник', 'подрозетника', 'подрозетников') + ', ' + way + ', ' + grp + '.';
      }
      oVerdict.textContent = v;

      send.href = WA + '?text=' + encodeURIComponent(
        'Разметка со сайта\nСтена: ' + L + ' м, высота потолка 2,7 м' +
        '\nРозетки: ' + n + '\nВыключатели: ' + m + '\nСветильники: ' + k +
        '\nСпособ: ' + (route === 'groove' ? 'штроба в стене' : 'кабель-канал') +
        '\nПо расчёту: ' + boxes + ' подрозетников, ' + Math.round(cable) + ' м кабеля, ' + groups + ' групп' +
        '\nХочу уточнить стоимость работ.');
    }

    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-route]'));
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        route = b.getAttribute('data-route');
        drawWall();
      });
    });
    Object.keys(IN).forEach(function (key) {
      if (IN[key]) IN[key].addEventListener('input', drawWall);
    });
    drawWall();
  }

  /* ---------- диагностика ---------- */
  var DIAG = [
    { t: 'Выбивает автомат',
      c: 'Чаще всего перегрузка линии или короткое замыкание в кабеле или розетке. Реже — неисправный автомат или повреждение изоляции в стене.',
      todo: ['Смотрю, на какой линии срабатывает и что было включено', 'Проверяю розетки и подвод к ним на этой линии', 'Измеряю нагрузку и при необходимости делю линию на группы'],
      warn: 'Не ставьте автомат на больший номинал: защита не справится, а кабель нагреется.' },
    { t: 'Искрит или щёлкает розетка',
      c: 'Плохой контакт в клеммах: провод ослаб, подгорел или жила перекушена. Такая розетка греется даже при небольшой нагрузке.',
      todo: ['Отключаю линию в щите, пока не разобрались', 'Снимаю розетку и смотрю клеммы и жилы', 'Перезачищаю провода, меняю розетку при подгорании'],
      warn: 'Если клеммы потемнели, розетку лучше заменить, а не подтягивать.' },
    { t: 'Пахнет горелой пластмассой',
      c: 'Перегрев розетки, вилки или проводки в стене. Самый опасный симптом: он не всегда сопровождается искрами.',
      todo: ['Обесточиваю ввод или эту линию', 'Ищу место нагрева: розетки, тройники, распаечные коробки', 'Меняю повреждённый участок и проверяю нагрузку'],
      warn: 'Не оставляйте такую линию включённой и не нагружайте её снова.' },
    { t: 'Мигает или тускнеет свет',
      c: 'Плохой контакт в щите, ослабленный ноль или перегрузка. Иногда дело в лампах, но если мигает вся квартира — ищите контакты.',
      todo: ['Проверяю контакты в щите и на вводе', 'Смотрю соединения в распаечных коробках', 'Проверяю, не перегружена ли линия света'],
      warn: '' },
    { t: 'Не работает часть розеток',
      c: 'Отгорел контакт в распаечной коробке, перегорел участок линии или сработало УЗО на группе. Локализую по тому, что именно не работает.',
      todo: ['Проверяю автоматы и УЗО в щите', 'Ищу коробку и соединения на этой линии', 'Восстанавливаю контакт и проверяю нагрузку'],
      warn: '' },
    { t: 'Розетка греется, плавится вилка',
      c: 'Перегрузка или ослабленный контакт. Вилка и розетка должны быть рассчитаны на ток прибора: чайник, обогреватель, плита.',
      todo: ['Считаю мощность прибора и ток', 'Меняю розетку на рассчитанную под нагрузку', 'При необходимости тяну отдельную линию от щита'],
      warn: 'Для обогревателей и плит лучше отдельная линия, а не тройник.' }
  ];

  var diagButtons = document.querySelectorAll('[data-diag]');
  if (diagButtons.length) {
    var dTitle = document.getElementById('diag-title');
    var dCause = document.getElementById('diag-cause');
    var dTodo = document.getElementById('diag-todo');
    var dWarn = document.getElementById('diag-warn');
    var dSend = document.getElementById('diag-send');
    var current = 0;

    function paintDiag(i) {
      current = i;
      var d = DIAG[i];
      dTitle.textContent = d.t;
      dCause.textContent = d.c;
      while (dTodo.firstChild) dTodo.removeChild(dTodo.firstChild);
      d.todo.forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line;
        dTodo.appendChild(li);
      });
      if (d.warn) { dWarn.hidden = false; dWarn.textContent = d.warn; } else { dWarn.hidden = true; }
      dSend.href = WA + '?text=' + encodeURIComponent('Здравствуйте. Проблема: ' + d.t.toLowerCase() + '. Подскажите, что делать и сколько будет стоить.');
      Array.prototype.forEach.call(diagButtons, function (b, idx) {
        b.setAttribute('aria-pressed', idx === i ? 'true' : 'false');
      });
    }
    Array.prototype.forEach.call(diagButtons, function (b) {
      b.addEventListener('click', function () { paintDiag(parseInt(b.getAttribute('data-diag'), 10)); });
    });
    paintDiag(0);
  }

  /* ---------- заявка ---------- */
  var form = document.getElementById('lead');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (sel) { var f = form.querySelector(sel); return f ? f.value : ''; };
      var name = g('#f-name'), phone = g('#f-phone'), obj = g('#f-obj'), what = g('#f-what'), note = g('#f-note');
      var ok = form.querySelector('.form__ok');
      if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 9) {
        if (ok) { ok.hidden = false; ok.textContent = 'Укажите имя и телефон, чтобы я мог ответить.'; }
        return;
      }
      var text = 'Заявка на осмотр\nИмя: ' + name.trim() + '\nТелефон: ' + phone.trim() +
        (obj ? '\nОбъект: ' + obj : '') + (what ? '\nЧто нужно: ' + what : '') +
        (note.trim() ? '\nКомментарий: ' + note.trim() : '');
      var url = WA + '?text=' + encodeURIComponent(text);
      if (ok) {
        ok.hidden = false;
        ok.innerHTML = 'Заявка собрана. Если WhatsApp не открылся, <a href="' + url + '" target="_blank" rel="noopener">нажмите здесь</a>.';
      }
      window.open(url, '_blank', 'noopener');
    });
  }
})();
