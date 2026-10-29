/* AEC-CT2 case viewer embed: the modal styles and the open/close logic for the post figure.
   Load it once, after the figure and the dialog markup. */
(function () {
  var css = '#aec-ct2-dialog { width: 90vw; height: 90vh; max-width: none; max-height: none; padding: 0; border: 0; border-radius: 10px; overflow: hidden; background: #f4f5f7; }\n' +
    '#aec-ct2-dialog::backdrop { background: rgba(0, 0, 0, .65); }\n' +
    '#aec-ct2-full { display: block; width: 100%; height: 100%; border: 0; }\n' +
    '#aec-ct2-close { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 1; width: 36px; height: 36px;\n' +
    '  border-radius: 50%; border: 1px solid rgba(128, 128, 128, .5); background: rgba(255, 255, 255, .92); color: #1d1f24; font-size: 16px; line-height: 1; cursor: pointer; }\n' +
    '@media (prefers-color-scheme: dark) {\n' +
    '  #aec-ct2-dialog { background: #15171c; }\n' +
    '  #aec-ct2-close { background: rgba(30, 33, 40, .92); color: #e8e9ec; }\n' +
    '}\n' +
    '@media (max-width: 600px) {\n' +
    '  #aec-ct2-dialog { width: 100vw; height: 100dvh; border-radius: 0; margin: 0; }\n' +
    '  #aec-ct2-dialog[open] { display: flex; flex-direction: column; }\n' +
    '  #aec-ct2-close { position: static; transform: none; align-self: flex-end; margin: 6px 8px; flex: none; }\n' +
    '  #aec-ct2-full { flex: 1; height: auto; min-height: 0; }\n' +
    '}\n' +
    'html.aec-ct2-lock, html.aec-ct2-lock body { overflow: hidden; }';
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  var preview = document.getElementById("aec-ct2-preview");
  var dialog = document.getElementById("aec-ct2-dialog");
  var full = document.getElementById("aec-ct2-full");
  var closeBtn = document.getElementById("aec-ct2-close");
  if (!preview || !dialog || typeof dialog.showModal !== "function") return;   // old browser: the preview opens its own full mode
  function tell(type) { if (preview.contentWindow) preview.contentWindow.postMessage({ type: type }, location.origin); }
  preview.addEventListener("load", function () { tell("aec-ct2-viewer:host"); });
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.source === full.contentWindow && e.data.type === "aec-ct2-viewer:close") { dialog.close(); return; }   // Esc pressed inside the viewer
    if (e.source !== preview.contentWindow || e.data.type !== "aec-ct2-viewer:open" || dialog.open) return;
    full.src = dialog.getAttribute("data-src");
    document.documentElement.classList.add("aec-ct2-lock");
    tell("aec-ct2-viewer:pause");
    dialog.showModal();
    full.focus();
  });
  closeBtn.addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });   // a click on the dimmed backdrop
  dialog.addEventListener("close", function () {
    full.src = "about:blank";                         // stop the full viewer; the next open loads it fresh
    document.documentElement.classList.remove("aec-ct2-lock");
    tell("aec-ct2-viewer:resume");
    preview.focus();
  });
})();
