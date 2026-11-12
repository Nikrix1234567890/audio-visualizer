/* Pulsefield preview helpers: the icon set (Lucide geometry, 24px grid) and a waveform filler.
   In the product, use the lucide-react package instead of this map. */
(function () {
  var P = {
    play: '<path d="M6 3l14 9-14 9V3z"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6A16.600 16.600 0 0 0 2 12s3.6 7 10 7a9.700 9.700 0 0 0 5.400-1.600M3 3l18 18M9.900 9.900a3 3 0 0 0 4.200 4.200"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.300L3 13"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.300l3 2.700"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.300-4.300"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.700l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.700l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.700zM3.300 7 12 12l8.700-5M12 22V12"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.100-3.100a2 2 0 0 0-2.800 0L6 21"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.900-3-5.500S12.500 5.500 12 3c-.500 2.500-2 4.900-4 6.500S5 13 5 15a7 7 0 0 0 7 7z"/>',
    camera: '<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M6.300 17.700l-1.400 1.400M19.100 4.900l-1.400 1.400"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    cursor: '<path d="M4 4l7.100 17 2.500-7.400L21 11.100 4 4z"/>',
    move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.700L21 8"/><path d="M21 3v5h-5"/>',
    scale: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5zM15.500 8.500a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    'volume-x': '<path d="M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.100 9a3 3 0 0 1 5.800 1c0 2-3 3-3 3M12 17h.010"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.010"/>',
    alert: '<path d="m21.700 18-8-14a2 2 0 0 0-3.400 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.700-3zM12 9v4M12 17h.010"/>',
    crown: '<path d="M2.500 6.500 7 10.500l5-7 5 7 4.500-4L19 17H5L2.500 6.500zM5 21h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.900a2 2 0 0 1-1.700-.900L9.600 3.900A2 2 0 0 0 7.900 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 12h18M3 7.500h4M17 7.500h4M3 16.500h4M17 16.500h4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    wave: '<path d="M2 12h2.500a2 2 0 0 0 1.900-1.500L8.700 2.200a.250.250 0 0 1 .500 0l5.600 19.600a.250.250 0 0 0 .500 0l2.300-8.300a2 2 0 0 1 1.900-1.500H22"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    sparkle: '<path d="M12 3l1.900 5.100L19 10l-5.100 1.900L12 17l-1.900-5.100L5 10l5.100-1.900L12 3zM19 16v4M17 18h4"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  /* Turn every <i class="pf-i" data-i="name"> under root into an icon. */
  function icons(root) {
    var list = (root || document).querySelectorAll('.pf-i[data-i]');
    for (var n = 0; n < list.length; n++) {
      if (!list[n].firstChild) list[n].innerHTML = svg(list[n].getAttribute('data-i'));
    }
  }

  /* Fill every .pf-wave with bars: a repeatable pseudo-random envelope with a kick every eighth bar. */
  function waves(root) {
    var list = (root || document).querySelectorAll('.pf-wave');
    for (var n = 0; n < list.length; n++) {
      var el = list[n];
      if (el.firstChild) continue;
      var count = Number(el.getAttribute('data-bars')) || 160;
      var played = Number(el.getAttribute('data-played')) || 0;
      var seed = 7, html = '';
      for (var k = 0; k < count; k++) {
        seed = (seed * 16807) % 2147483647;
        var noise = seed / 2147483647;
        var section = 0.45 + 0.4 * Math.sin((k / count) * Math.PI) + 0.15 * Math.sin(k / 9);
        var kick = k % 8 === 0 ? 0.35 : 0;
        var h = Math.max(0.08, Math.min(1, section * (0.45 + 0.55 * noise) + kick));
        html += '<i style="--h:' + h.toFixed(2) + '"' + (k / count < played ? ' data-p' : '') + '></i>';
      }
      el.innerHTML = html;
    }
  }

  function mount(root) { icons(root); waves(root); }

  window.Pulsefield = { icons: icons, waves: waves, mount: mount, svg: svg, names: Object.keys(P) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); });
  else mount();
})();
