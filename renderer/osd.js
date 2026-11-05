// Kleine Anzeige über Spielen und Apps (Mikro stumm, Sprechtaste, Profilwechsel, Lautstärke)
(function () {
  var I = {
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
    micOff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7M3 3l18 18"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12.5l9 5 9-5M3 17l9 5 9-5"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    warn: '<path d="M12 3.5l9.5 17h-19L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    duck: '<path d="M3 9.5v5h3.2l4.3 3.6V5.9L6.2 9.5H3z"/><path d="M17.5 5.5v10M14 12.5l3.5 3.5 3.5-3.5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>'
  };
  var pill = document.getElementById('pill');
  window.fx.onOsd(function (d) {
    if (d.hide) { pill.classList.remove('on'); return; }
    if (d.theme) { var r = document.documentElement.style; r.setProperty('--acc', d.theme.accent); r.setProperty('--acc2', d.theme.accent2); r.setProperty('--voice', d.theme.voice); }
    pill.className = 'pill ' + (d.tone || '');
    document.getElementById('ico').innerHTML = '<svg viewBox="0 0 24 24">' + (I[d.icon] || I.mic) + '</svg>';
    document.getElementById('t').textContent = d.title || '';
    document.getElementById('s').textContent = d.sub || '';
    var bar = document.getElementById('bar');
    bar.hidden = d.value == null;
    if (d.value != null) document.getElementById('bari').style.width = Math.max(0, Math.min(100, d.value)) + '%';
    requestAnimationFrame(function () { pill.classList.add('on'); });
  });
})();
