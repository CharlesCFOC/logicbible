export const documentTypes = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  txt: 'text/plain', md: 'text/markdown', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf', odt: 'application/vnd.oasis.opendocument.text',
};
export function validateSessionDocuments(files) {
  if (!Array.isArray(files) || !files.length || files.length > 10) throw Object.assign(new Error('Choisissez de 1 à 10 documents.'), {status:400});
  let total = 0;
  return files.map(file => {
    const fileName = String(file.fileName || 'document').slice(0,180);
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeType = documentTypes[extension] || (Object.values(documentTypes).includes(file.mimeType) ? file.mimeType : '');
    const data = String(file.data || '');
    if (!mimeType || !data || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) throw Object.assign(new Error(`Document invalide ou format non pris en charge : ${fileName}`), {status:400});
    total += Buffer.byteLength(data, 'base64');
    if (total > 2500000) throw Object.assign(new Error('Les documents doivent totaliser au maximum 2,5 Mo.'), {status:413});
    return {fileName, mimeType, data, extension: Object.keys(documentTypes).find(key => documentTypes[key] === mimeType)};
  });
}
