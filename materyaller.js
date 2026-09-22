/* Eğitim videoları ve çalışma notları — veriler materyaller.json dosyasından okunur */
let MATERYAL = {}, aktifMGun = -1;
const kacis = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ytKimlik(u){
  u = String(u || '').trim();
  if (/^[\w-]{11}$/.test(u)) return u;
  const m = u.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function oturumMateryal(no){
  const m = MATERYAL[String(no)] || {};
  return {
    videolar: (m.videolar || []).map(v => ({baslik: v.baslik || '', id: ytKimlik(v.youtube)})).filter(v => v.id),
    notlar: (m.notlar || []).filter(n => n && n.dosya)
  };
}
const materyalVar = m => m.videolar.length || m.notlar.length;
const IKON_V = '<svg viewBox="0 0 12 12"><path d="M3 1.5v9l7.5-4.5z"/></svg>';
const IKON_N = '<svg viewBox="0 0 12 12"><path d="M2.5 1h4.8L10 3.7V11H2.5z"/></svg>';

function rozetHtml(no){
  const m = oturumMateryal(no);
  if (!materyalVar(m)) return '';
  return '<div class="rozetler">' +
    (m.videolar.length ? '<span class="mrozet">' + IKON_V + (m.videolar.length > 1 ? m.videolar.length + ' eğitim videosu' : 'Eğitim videosu') + '</span>' : '') +
    (m.notlar.length ? '<span class="mrozet">' + IKON_N + (m.notlar.length > 1 ? m.notlar.length + ' çalışma notu' : 'Çalışma notu') + '</span>' : '') +
    '</div>';
}
function uzanti(d){ const m = String(d).split('?')[0].match(/\.([a-z0-9]{2,4})$/i); return m ? m[1].toUpperCase() : 'DOSYA'; }
function videoHtml(v, yedek){
  return '<div class="video"><button class="yt-oynat" type="button" data-yt="' + v.id + '" aria-label="Videoyu oynat: ' + kacis(v.baslik || yedek) + '" ' +
    'style="background-image:url(https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg)">' +
    '<span class="play"></span>' + (v.baslik ? '<span class="vad">' + kacis(v.baslik) + '</span>' : '') + '</button></div>';
}
function notHtml(n){
  return '<a class="not" href="' + kacis(n.dosya) + '" target="_blank" rel="noopener">' +
    '<span class="ikon">' + uzanti(n.dosya) + '</span><span class="ad">' + kacis(n.baslik || n.dosya.split('/').pop()) + '</span>' +
    '<span class="ind">Aç ↗</span></a>';
}
function materyalHtml(o){
  const m = oturumMateryal(o.no);
  if (!materyalVar(m)) return '';
  const v = m.videolar.length, n = m.notlar.length;
  return '<div class="materyal' + (v && n ? ' iki' : '') + '">' +
    (v ? '<div class="kolon"><p class="mbaslik">' + (v > 1 ? 'Eğitim videoları' : 'Eğitim videosu') + '</p>' + m.videolar.map(x => videoHtml(x, o.baslik)).join('') + '</div>' : '') +
    (n ? '<div class="kolon"><p class="mbaslik">Çalışma notları</p><div class="notlar">' + m.notlar.map(notHtml).join('') + '</div></div>' : '') +
    '</div>';
}

function materyalBolumCiz(){
  const kutu = document.getElementById('materyaller');
  const gunler = GUNLER.map((g, gi) => ({g, gi, ot: g.oturumlar.filter(o => !o.mola && materyalVar(oturumMateryal(o.no)))})).filter(x => x.ot.length);
  kutu.hidden = gunler.length === 0;
  if (!gunler.length) return;
  if (aktifMGun !== -1 && !gunler.some(x => x.gi === aktifMGun)) aktifMGun = -1;
  document.getElementById('mfiltre').innerHTML =
    '<button class="mcip' + (aktifMGun === -1 ? ' aktif' : '') + '" data-mgun="-1">Tüm günler</button>' +
    gunler.map(x => '<button class="mcip' + (aktifMGun === x.gi ? ' aktif' : '') + '" data-mgun="' + x.gi + '">' + x.g.etiket + ' · ' + x.g.tarih + '</button>').join('');
  let i = 0;
  document.getElementById('materyalListe').innerHTML = gunler.filter(x => aktifMGun === -1 || x.gi === aktifMGun).map(x =>
    x.ot.map(o => {
      const m = oturumMateryal(o.no);
      return '<article class="mkart" style="animation-delay:' + (i++ * 0.05).toFixed(2) + 's">' +
        (m.videolar.length ? videoHtml(m.videolar[0], o.baslik) : '') +
        '<div class="govdem"><div class="ks"><b>' + x.g.etiket + '</b> · ' + x.g.tarih + ' · ' + o.bas + '–' + o.bit + '</div>' +
        '<div class="kb">' + kacis(o.baslik) + '</div><div class="ke">' + kacis(o.egitmenler.join(', ')) + '</div>' +
        m.videolar.slice(1).map(v => videoHtml(v, o.baslik)).join('') +
        (m.notlar.length ? '<div class="notlar">' + m.notlar.map(notHtml).join('') + '</div>' : '') +
        '<button class="git" type="button" data-oturum="' + o.no + '" data-gun="' + x.gi + '">Programda göster</button></div></article>';
    }).join('')).join('');
}

function materyalYukle(){
  fetch('materyaller.json', {cache: 'no-cache'})
    .then(r => r.ok ? r.json() : {})
    .then(d => { MATERYAL = (d && d.oturumlar) || {}; ciz(); materyalBolumCiz(); })
    .catch(() => {});
}

document.addEventListener('click', function(e){
  const yt = e.target.closest('.yt-oynat');
  if (yt){
    const k = yt.parentElement;
    k.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + yt.dataset.yt + '?autoplay=1&rel=0" title="' + kacis(yt.getAttribute('aria-label') || 'Video') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    const gv = k.closest('.govde'); if (gv) gv.style.maxHeight = gv.scrollHeight + 'px';
    return;
  }
  const f = e.target.closest('[data-mgun]');
  if (f){ aktifMGun = +f.dataset.mgun; materyalBolumCiz(); return; }
  const mg = e.target.closest('[data-oturum]');
  if (mg){
    aktifGun = +mg.dataset.gun; aktifEgitmen = null; ciz();
    const ot = document.querySelector('.oturum[data-no="' + mg.dataset.oturum + '"]');
    if (ot){
      const u = ot.querySelector('button.ust'); if (u) u.click();
      ot.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }
});

// Sürüm imzası (imza.js): sayfanın altına "© 2026 Kapsayıcı Almanca v1.0 by bbasaran"
(function () { var s = document.createElement('script'); s.src = 'imza.js'; s.defer = true; document.head.appendChild(s); })();
