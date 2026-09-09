/**
 * Builds a CSV from real rows and hands it to the browser as a download.
 *
 * Excel treats a leading =, +, - or @ as a formula, so any cell starting with
 * one is prefixed with a single quote. Without that, a note field containing
 * "=cmd|..." becomes an executable cell the moment someone opens the export —
 * a real attack against finance teams, not a theoretical one.
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';

  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * @param {string} filename  without extension
 * @param {Array<{key: string, label: string, format?: Function}>} columns
 * @param {Array<object>} rows
 */
export function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');

  const body = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.key.split('.').reduce((acc, part) => acc?.[part], row);
        return escapeCell(c.format ? c.format(raw, row) : raw);
      })
      .join(',')
  );

  // BOM so Excel reads the naira sign and any Yoruba/Igbo/Hausa names correctly.
  const blob = new Blob(['\uFEFF', [header, ...body].join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}