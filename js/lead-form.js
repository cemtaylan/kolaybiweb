// Başvuru ve iletişim formları (ör. /kolaybi-bilink-formu, /iletisim): Türkçe doğrulama + gönderim.
// Başvurular formun data-endpoint adresine POST edilir (FormData). Adres boşsa başvuru
// gönderilmiş gibi gösterilmez; kullanıcıya telefonla ulaşma seçeneği sunulur.
(function () {
  document.querySelectorAll('form.lf-form').forEach(form => {
    const err = form.querySelector('.lf-error');
    const done = form.parentElement.querySelector('.lf-done');
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.firstChild.textContent; // düğmenin kendi metni (ör. "Mesajımı Gönder")
    const FAIL = 'Form şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin ya da hafta içi 09:00–18:00 arası <a href="tel:08503030667">0 (850) 303 06 67</a> numarasından bize ulaşın.';
    const showError = (html, field) => {
      err.innerHTML = html; err.hidden = false;
      form.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
    };
    // Telefon: boşluk/tire temizlenir, baştaki 0 atılır; 10 hane ve 5 ile başlamalı (cep)
    const phoneDigits = v => { let d = v.replace(/\D/g, ''); if (d.length === 11 && d[0] === '0') d = d.slice(1); return d; };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = form.elements, name = f.name, phone = f.phone;
      if (name.value.trim().length < 3) return showError('Lütfen adınızı ve soyadınızı yazın.', name);
      if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) return showError('Lütfen geçerli bir e-posta adresi yazın (ör. ad@firma.com).', f.email);
      if (f.subject && f.subject.required && f.subject.value.trim().length < 3) return showError('Lütfen mesajınızın konusunu yazın.', f.subject);
      // Telefon zorunluysa ya da yazılmışsa doğrulanır
      const digits = phone ? phoneDigits(phone.value) : '';
      if (phone && (phone.required || digits) && !/^5\d{9}$/.test(digits)) return showError('Lütfen 10 haneli cep telefonu numaranızı yazın (ör. 5XX XXX XX XX).', phone);
      if (f.message && f.message.value.trim().length < 10) return showError('Lütfen mesajınızı birkaç cümleyle yazın.', f.message);
      if (f.consent && !f.consent.checked) return showError('Devam etmek için aydınlatma metnini onaylayın.', f.consent);
      err.hidden = true;

      const endpoint = form.dataset.endpoint;
      if (!endpoint) { console.warn('lead-form: data-endpoint tanımlı değil, başvuru gönderilmedi.'); return showError(FAIL); }
      const data = new FormData(form);
      if (phone) data.set('phone', digits);
      data.set('source', location.pathname);
      btn.disabled = true; btn.firstChild.textContent = 'Lütfen bekleyin…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.hidden = true; done.hidden = false; done.focus && done.setAttribute('tabindex', '-1'); done.focus();
      } catch (x) {
        showError(FAIL);
      } finally {
        btn.disabled = false; btn.firstChild.textContent = label;
      }
    });
  });
})();
