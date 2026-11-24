export async function createNotePdf(note) {
  const { default: html2pdf } = await import('html2pdf.js');
  const page = document.createElement('div');
  page.style.cssText = 'font-family:Arial,sans-serif;color:#17263d;background:#fff;padding:4px;font-size:14px;line-height:1.55;overflow-wrap:anywhere';
  const title = document.createElement('h1');
  title.textContent = note.title || 'Note';
  title.style.cssText = 'font-size:24px;color:#17263d;margin:0 0 20px';
  page.append(title);
  const body = document.createElement('div');
  body.innerHTML = note.safeHtml;
  body.querySelectorAll('[style]').forEach(element => {
    const color = element.style.color.replace(/\s/g, '').toLowerCase();
    if (['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(color)) element.style.color = '#17263d';
  });
  page.append(body);
  if (note.items.length) {
    const heading = document.createElement('h2');
    heading.textContent = 'Verses';
    heading.style.cssText = 'font-size:18px;margin:25px 0 8px';
    page.append(heading);
    note.items.forEach(item => {
      const block = document.createElement('p');
      const reference = document.createElement('strong');
      reference.textContent = `${item.reference} (${item.version || ''})`;
      block.append(reference, document.createElement('br'), document.createTextNode(item.text || ''));
      page.append(block);
    });
  }
  return html2pdf().set({ margin: 12, filename: 'note.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } }).from(page).outputPdf('blob');
}
