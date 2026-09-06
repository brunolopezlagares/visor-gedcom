'use strict';
(async () => {
  const status = document.getElementById('estado');
  const help = document.getElementById('ayuda');
  const encodedKey = new URLSearchParams(location.hash.slice(1)).get('clave');
  if (!encodedKey) {
    status.textContent = 'El árbol está protegido.';
    help.hidden = false;
    return;
  }
  try {
    if (!/^[A-Za-z0-9_-]{43}$/.test(encodedKey)) throw new Error('invalid key');
    const keyBytes = Uint8Array.from(atob(encodedKey.replace(/-/g, '+').replace(/_/g, '/') + '='), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    const response = await fetch('arbol.enc', {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (!response.ok) throw new Error('unavailable');
    const packed = new Uint8Array(await response.arrayBuffer());
    if (packed.length < 29) throw new Error('invalid payload');
    const clear = await crypto.subtle.decrypt({name: 'AES-GCM', iv: packed.slice(0, 12), additionalData: new TextEncoder().encode('visor-gedcom-v1'), tagLength: 128}, key, packed.slice(12));
    const doc = new DOMParser().parseFromString(new TextDecoder('utf-8', {fatal:true}).decode(clear), 'text/html');
    for (const link of doc.querySelectorAll('a[href^="https://"]')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    const frame = document.getElementById('visor');
    frame.srcdoc = '<!doctype html>' + doc.documentElement.outerHTML;
    frame.hidden = false;
    document.getElementById('aviso').hidden = true;
    // No persistir la clave en cookies o almacenamiento del navegador.
  } catch (_) {
    status.textContent = 'No se ha podido abrir el árbol. Comprueba que usas el enlace completo y que tienes conexión.';
    help.hidden = false;
  }
})();
