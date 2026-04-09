# Skill: Separador de Codigo

## O que e este projeto

Ferramenta web single-page (HTML + CSS + JS puro, sem frameworks) que recebe um arquivo HTML completo colado pelo usuario e separa automaticamente o HTML estrutural, o CSS e o JavaScript em areas distintas. Permite copiar cada parte individualmente ou reorganizar tudo em um novo arquivo HTML completo.

## Estrutura do projeto

```
index.html   — markup e estilos (CSS inline no <head>)
app.js       — toda a logica JavaScript (arquivo externo)
.env         — variaveis de ambiente (nao commitar)
.gitignore   — arquivos ignorados pelo git
```

## Por que o JS foi separado para app.js

O Live Server (extensao do VS Code) injeta um script de live reload no final do HTML. Quando o JS estava inline no `<script>` do proprio `index.html`, esse script injetado causava erros de sintaxe e vazamento de conteudo visivel na pagina. Mover o JS para `app.js` externo resolve o problema definitivamente.

## Funcionalidades

- Separar HTML, CSS e JS de um documento HTML completo
- Copiar cada parte separadamente para o clipboard
- Reorganizar as partes em um novo HTML completo e formatado
- Contador de linhas, blocos CSS, blocos JS e dependencias externas
- Carregar exemplo pre-definido para teste
- Toasts de feedback para todas as acoes
- Layout responsivo com visual dark moderno

## Decisoes tecnicas

- Sem dependencias externas, tudo vanilla JS
- Usa `DOMParser` para parsing do HTML colado
- Fallback com regex para casos onde o DOMParser nao extrai conteudo
- Compatibilidade ampla: usa `var`, `Array.prototype.forEach.call` e sem arrow functions para suporte a browsers antigos
- `escapeHtml` usa `&amp;`, `&lt;`, `&gt;` corretamente no arquivo `.js` externo (dentro de HTML inline essas entidades causariam problemas)
