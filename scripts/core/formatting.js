// Legacy core/formatting: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function containsPersonalContactInfo(value) {
  const text = String(value || "");
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\d().\-\s]{6,}\d)/;
  return email.test(text) || phone.test(text);
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderInlineRichText(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  return html;
}

function renderRichText(text) {
  const source = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!source) {
    return "<p>No response text returned.</p>";
  }

  const lines = source.split("\n");
  const blocks = [];
  let paragraph = [];
  let quote = [];
  let listItems = [];
  let listType = "";
  let orderedListStart = 1;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(`<p>${renderInlineRichText(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    const content = quote
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => `<p>${renderInlineRichText(entry)}</p>`)
      .join("");
    blocks.push(`<blockquote>${content}</blockquote>`);
    quote = [];
  }

  function flushList() {
    if (!listItems.length || !listType) return;
    const items = listItems.map((item) => `<li>${renderInlineRichText(item)}</li>`).join("");
    if (listType === "ol") {
      const startAttr = orderedListStart > 1 ? ` start="${orderedListStart}"` : "";
      blocks.push(`<ol${startAttr}>${items}</ol>`);
    } else {
      blocks.push(`<ul>${items}</ul>`);
    }
    listItems = [];
    listType = "";
    orderedListStart = 1;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushQuote();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushQuote();
      flushList();
      const level = Math.min(4, headingMatch[1].length + 1);
      blocks.push(`<h${level}>${renderInlineRichText(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const boldHeadingMatch = line.match(/^\*\*([^*]+)\*\*$/);
    if (boldHeadingMatch) {
      flushParagraph();
      flushQuote();
      flushList();
      blocks.push(`<h4>${renderInlineRichText(boldHeadingMatch[1].trim())}</h4>`);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") flushList();
      if (!listItems.length) {
        orderedListStart = Number(orderedMatch[1]) || 1;
      }
      listType = "ol";
      listItems.push(orderedMatch[2].trim());
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unorderedMatch[1].trim());
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushQuote();
  flushList();

  return blocks.join("");
}
