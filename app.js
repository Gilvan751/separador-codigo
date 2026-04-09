(function () {
  "use strict";

  var els = {
    entrada: document.getElementById("codigoCompleto"),
    html: document.getElementById("htmlSeparado"),
    css: document.getElementById("cssSeparado"),
    js: document.getElementById("jsSeparado"),
    reorganizado: document.getElementById("codigoReorganizado"),
    linhas: document.getElementById("linhasEntrada"),
    blocosCss: document.getElementById("blocosCss"),
    blocosJs: document.getElementById("blocosJs"),
    deps: document.getElementById("depsExternas")
  };

  var state = {
    title: "Documento Reorganizado",
    htmlAttrs: 'lang="pt-BR"',
    bodyAttrs: "",
    headExtras: "",
    externalCss: [],
    externalJs: []
  };

  function createStyleRegex() {
    return new RegExp("<style\\b[^>]*>([\\s\\S]*?)<\\/style>", "gi");
  }

  function createScriptRegex() {
    return new RegExp("<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>", "gi");
  }

  function toast(message, type) {
    var wrap = document.getElementById("toastWrap");
    var item = document.createElement("div");
    item.className = "toast " + (type || "info");
    item.textContent = message;
    wrap.appendChild(item);
    setTimeout(function () {
      item.style.opacity = "0";
      item.style.transform = "translateY(10px)";
      item.style.transition = "0.3s ease";
    }, 2400);
    setTimeout(function () {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 2900);
  }

  function updateLineCount() {
    var value = els.entrada.value.trim();
    els.linhas.textContent = value ? String(value.split(/\r?\n/).length) : "0";
  }

  function attrsToString(node) {
    if (!node || !node.attributes) return "";
    var arr = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var attr = node.attributes[i];
      arr.push(attr.name + '="' + attr.value + '"');
    }
    return arr.join(" ").trim();
  }

  function indent(text, spaces) {
    var pad = new Array(spaces + 1).join(" ");
    return String(text).split("\n").map(function (line) {
      return line ? pad + line : line;
    }).join("\n");
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function clearOutputs(resetStats) {
    els.html.value = "";
    els.css.value = "";
    els.js.value = "";
    els.reorganizado.value = "";
    if (resetStats !== false) {
      els.blocosCss.textContent = "0";
      els.blocosJs.textContent = "0";
      els.deps.textContent = "0";
    }
  }

  function extractMatches(raw, regex) {
    var result = [];
    var match;
    while ((match = regex.exec(raw)) !== null) {
      result.push((match[1] || "").trim());
    }
    return result.filter(function (item) { return item !== ""; });
  }

  function extractFallback(raw) {
    var cssRegex = createStyleRegex();
    var jsRegex = createScriptRegex();
    var cssList = extractMatches(raw, cssRegex);
    var jsList = extractMatches(raw, jsRegex);
    var html = raw
      .replace(createStyleRegex(), "")
      .replace(createScriptRegex(), "")
      .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
      .trim();
    return { html: html, css: cssList.join("\n\n"), js: jsList.join("\n\n") };
  }

  function splitCode() {
    var raw = els.entrada.value.trim();
    if (!raw) { toast("Cole um codigo HTML antes de separar.", "error"); return; }
    clearOutputs(false);
    updateLineCount();
    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(raw, "text/html");
      var styleTags = Array.prototype.slice.call(doc.querySelectorAll("style"));
      var inlineScriptTags = Array.prototype.slice.call(doc.querySelectorAll("script:not([src])"));
      var externalCssTags = Array.prototype.slice.call(doc.querySelectorAll('link[rel="stylesheet"][href]'));
      var externalScriptTags = Array.prototype.slice.call(doc.querySelectorAll("script[src]"));
      var titleEl = doc.querySelector("title");
      state.title = titleEl ? titleEl.textContent.trim() : "Documento Reorganizado";
      var htmlAttrs = attrsToString(doc.documentElement);
      state.htmlAttrs = htmlAttrs || 'lang="pt-BR"';
      state.bodyAttrs = attrsToString(doc.body);
      var headChildren = doc.head ? Array.prototype.slice.call(doc.head.children) : [];
      state.headExtras = headChildren.filter(function (el) {
        var tag = el.tagName.toLowerCase();
        if (tag === "title") return false;
        if (tag === "style") return false;
        if (tag === "script") return false;
        if (tag === "link" && ((el.getAttribute("rel") || "").toLowerCase() === "stylesheet")) return false;
        if (tag === "meta" && el.hasAttribute("charset")) return false;
        if (tag === "meta" && ((el.getAttribute("name") || "").toLowerCase() === "viewport")) return false;
        return true;
      }).map(function (el) { return el.outerHTML; }).join("\n");
      state.externalCss = externalCssTags.map(function (el) { return el.outerHTML; });
      state.externalJs = externalScriptTags.map(function (el) { return el.outerHTML; });
      var cssContent = styleTags.map(function (tag) { return (tag.textContent || "").trim(); }).filter(function (item) { return item !== ""; }).join("\n\n");
      var jsContent = inlineScriptTags.map(function (tag) { return (tag.textContent || "").trim(); }).filter(function (item) { return item !== ""; }).join("\n\n");
      var htmlContent = "";
      var hasDocumentStructure = /<html[\s>]/i.test(raw) || /<body[\s>]/i.test(raw);
      if (hasDocumentStructure && doc.body) {
        var bodyClone = doc.body.cloneNode(true);
        var removeList = bodyClone.querySelectorAll("script, style, link[rel='stylesheet']");
        Array.prototype.forEach.call(removeList, function (node) {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        htmlContent = bodyClone.innerHTML.trim();
      } else {
        htmlContent = raw
          .replace(createStyleRegex(), "")
          .replace(createScriptRegex(), "")
          .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
          .trim();
      }
      if (!htmlContent && !cssContent && !jsContent) {
        var fallback = extractFallback(raw);
        els.html.value = fallback.html;
        els.css.value = fallback.css;
        els.js.value = fallback.js;
        els.blocosCss.textContent = fallback.css ? "1" : "0";
        els.blocosJs.textContent = fallback.js ? "1" : "0";
        els.deps.textContent = "0";
        toast("Separacao feita em modo alternativo.", "info");
        return;
      }
      els.html.value = htmlContent;
      els.css.value = cssContent;
      els.js.value = jsContent;
      els.blocosCss.textContent = String(styleTags.length);
      els.blocosJs.textContent = String(inlineScriptTags.length);
      els.deps.textContent = String(externalCssTags.length + externalScriptTags.length);
      toast("Codigo separado com sucesso.", "success");
    } catch (e) {
      var fallback2 = extractFallback(raw);
      els.html.value = fallback2.html;
      els.css.value = fallback2.css;
      els.js.value = fallback2.js;
      els.blocosCss.textContent = fallback2.css ? "1" : "0";
      els.blocosJs.textContent = fallback2.js ? "1" : "0";
      els.deps.textContent = "0";
      toast("Separacao concluida com fallback.", "info");
    }
  }

  function rebuildCode() {
    var htmlPart = els.html.value.trim();
    var cssPart = els.css.value.trim();
    var jsPart = els.js.value.trim();
    var lines = [];
    lines.push("<!DOCTYPE html>");
    lines.push("<html" + (state.htmlAttrs ? " " + state.htmlAttrs : ' lang="pt-BR"') + ">");
    lines.push("<head>");
    lines.push('  <meta charset="UTF-8">');
    lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    lines.push("  <title>" + escapeHtml(state.title || "Documento Reorganizado") + "</title>");
    if (state.headExtras) { lines.push(indent(state.headExtras, 2)); }
    if (state.externalCss.length) { lines.push(indent(state.externalCss.join("\n"), 2)); }
    if (cssPart) {
      lines.push("  <style>");
      lines.push(indent(cssPart, 4));
      lines.push("  </style>");
    }
    lines.push("</head>");
    lines.push("<body" + (state.bodyAttrs ? " " + state.bodyAttrs : "") + ">");
    if (htmlPart) { lines.push(indent(htmlPart, 2)); }
    if (state.externalJs.length) { lines.push(indent(state.externalJs.join("\n"), 2)); }
    if (jsPart) {
      lines.push("  <script>");
      lines.push(indent(jsPart, 4));
      lines.push("  <" + "/script>");
    }
    lines.push("</body>");
    lines.push("</html>");
    els.reorganizado.value = lines.join("\n").trim();
    toast("Codigo reorganizado com sucesso.", "success");
  }

  function copyText(text, label) {
    if (!text.trim()) { toast("Nao ha " + label.toLowerCase() + " para copiar.", "error"); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(label + " copiado com sucesso.", "success");
      }).catch(function () { legacyCopy(text, label); });
    } else {
      legacyCopy(text, label);
    }
  }

  function legacyCopy(text, label) {
    var helper = document.createElement("textarea");
    helper.value = text;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    document.body.removeChild(helper);
    toast(label + " copiado com sucesso.", "success");
  }

  function loadExample() {
    var example = [
      "<!DOCTYPE html>",
      '<html lang="pt-BR">',
      "<head>",
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "  <title>Exemplo</title>",
      "  <style>",
      "    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; background: linear-gradient(135deg, #111827, #1f2937); color: white; }",
      "    .box { background: rgba(255,255,255,0.08); padding: 32px; border-radius: 18px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }",
      "    button { margin-top: 16px; padding: 12px 18px; border: none; border-radius: 10px; background: #7c5cff; color: white; cursor: pointer; }",
      "  </style>",
      "</head>",
      "<body>",
      '  <div class="box">',
      "    <h1>Ola mundo</h1>",
      "    <p>Exemplo para testar o separador.</p>",
      '    <button id="btnTeste">Clique aqui</button>',
      "  </div>",
      "  <script>",
      '    document.getElementById("btnTeste").addEventListener("click", function () { alert("Funcionando corretamente!"); });',
      "  <\/script>",
      "</body>",
      "</html>"
    ].join("\n");
    els.entrada.value = example;
    updateLineCount();
    toast("Exemplo carregado.", "info");
  }

  document.getElementById("btnSeparar").addEventListener("click", splitCode);
  document.getElementById("btnLimparEntrada").addEventListener("click", function () {
    els.entrada.value = "";
    updateLineCount();
    toast("Campo principal limpo.", "info");
  });
  document.getElementById("btnExemplo").addEventListener("click", loadExample);
  document.getElementById("btnReorganizar").addEventListener("click", rebuildCode);
  document.getElementById("btnCopiarReorganizado").addEventListener("click", function () {
    copyText(els.reorganizado.value, "Codigo reorganizado");
  });
  document.getElementById("btnLimparSaidas").addEventListener("click", function () {
    clearOutputs(true);
    toast("Saidas limpas com sucesso.", "info");
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (button) {
    button.addEventListener("click", function () {
      var targetId = button.getAttribute("data-copy");
      var field = document.getElementById(targetId);
      var labelMap = { htmlSeparado: "HTML", cssSeparado: "CSS", jsSeparado: "JavaScript" };
      copyText(field.value, labelMap[targetId] || "Conteudo");
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-clear]"), function (button) {
    button.addEventListener("click", function () {
      var targetId = button.getAttribute("data-clear");
      var field = document.getElementById(targetId);
      field.value = "";
      toast("Area limpa com sucesso.", "info");
    });
  });

  els.entrada.addEventListener("input", updateLineCount);
  updateLineCount();
})();
