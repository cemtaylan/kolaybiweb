// Kullanım videoları: kart tıklanınca video sayfadaki pencerede oynar.
// YouTube oynatıcısı yalnızca açılınca yüklenir (youtube-nocookie), kapanınca kaldırılır.
// JS yoksa ya da Ctrl/Cmd/orta tıkta bağlantı YouTube'u yeni sekmede açar.
// Altyazı: izleyicinin YouTube tercihi açık olsa da video altyazısız başlar (CC düğmesiyle açılabilir).
(function () {
  const dlg = document.querySelector('.vd-modal');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const frame = dlg.querySelector('.vd-m-frame'), title = dlg.querySelector('#vd-m-title'), yt = dlg.querySelector('.vd-m-yt');
  let opener = null, ccOff = 0;
  const send = (f, msg) => f.contentWindow && f.contentWindow.postMessage(JSON.stringify(msg), '*');
  const cmd = (f, func, args) => send(f, { event: 'command', func, args: args || [] });

  // Oynatıcı hazır olunca, altyazı modülü yüklenince ve oynatma başlayınca altyazıyı kapat; birkaç kez, sonra kullanıcıya bırak
  window.addEventListener('message', e => {
    const f = frame.querySelector('iframe');
    if (!f || e.source !== f.contentWindow || !/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
    let d; try { d = JSON.parse(e.data); } catch (x) { return; }
    const playing = d.event === 'onStateChange' ? d.info === 1 : d.info && d.info.playerState === 1;
    if ((d.event === 'onReady' || d.event === 'apiInfoDelivery' || playing) && ccOff < 4) {
      ccOff++;
      cmd(f, 'unloadModule', ['captions']);
      cmd(f, 'unloadModule', ['cc']);
    }
  });

  document.querySelectorAll('a.vd[data-vid]').forEach(a => {
    a.setAttribute('aria-haspopup', 'dialog');
    a.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      opener = a;
      const id = a.dataset.vid, name = a.querySelector('.vd-body b').textContent.trim();
      title.textContent = name;
      yt.href = 'https://www.youtube.com/watch?v=' + id;
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&cc_load_policy=0&hl=tr&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
      f.addEventListener('load', () => send(f, { event: 'listening', id: 1 }));
      ccOff = 0;
      f.title = name;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.replaceChildren(f);
      document.body.classList.add('vd-lock');
      dlg.showModal();
    });
  });

  const close = () => dlg.open && dlg.close(); // ✕ düğmesi yerel <form method="dialog"> ile kapatır
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); // pencere dışına tıklama
  dlg.addEventListener('close', () => {
    frame.replaceChildren(); // oynatmayı durdur
    document.body.classList.remove('vd-lock');
    opener && opener.focus();
  });
})();
