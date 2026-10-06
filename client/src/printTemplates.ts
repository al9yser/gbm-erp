function formatDocLine(item: any): string {
  return `- ${item.productName || item.name}: ${item.qty} x ${item.unitPrice} = ${item.qty * item.unitPrice}`;
}

export function buildInvoiceHtml(doc: any, settings: any) {
  const rows = doc.items.map((item: any, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.productName || 'منتج'}</td>
      <td>${item.description || ''}</td>
      <td>${item.qty}</td>
      <td>قطعة</td>
      <td>${Number(item.unitPrice).toFixed(2)}</td>
      <td>${(Number(item.qty) * Number(item.unitPrice)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8" /><title>${doc.documentNumber}</title><style>body{direction:rtl;font-family:Tahoma,Arial,sans-serif;padding:20px;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dbe2ea;padding:8px;text-align:center} .totals{margin-top:12px;display:flex;justify-content:flex-end} .summary{width:280px; border:1px solid #ddd;padding:12px}</style></head><body><h2>${settings.companyName}</h2><h3>فاتورة</h3><p>العميل: ${doc.counterpartyId}</p><p>رقم المستند: ${doc.documentNumber}</p><table><thead><tr><th>#</th><th>Product</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div class="summary"><div>Subtotal: ${doc.subtotal ?? 0}</div><div>Discount: ${doc.discount ?? 0}</div><div>VAT: ${doc.vat ?? 0}</div><div><strong>Total: ${doc.total ?? 0}</strong></div></div></div></body></html>`;
}

export function buildMailtoLink(doc: any, company: string) {
  const summary = doc.items.map((item: any) => `${item.productName}: ${item.qty} × ${item.unitPrice}`).join('\n');
  const subject = encodeURIComponent(`${doc.type === 'sale' ? 'Invoice' : 'Quotation'} ${doc.documentNumber}`);
  const body = encodeURIComponent(`شركة: ${company}\nالعميل: ${doc.counterpartyId}\n\n${summary}\n\nTotal: ${doc.total}\nملاحظات: ${doc.notes || ''}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

export function buildWordDocHtml(doc: any, company: string) {
  const rows = doc.items.map((item: any, index: number) => `<tr><td>${index + 1}</td><td>${item.productName || 'منتج'}</td><td>${item.qty}</td><td>${item.unitPrice}</td><td>${item.qty * item.unitPrice}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${doc.documentNumber}</title></head><body><h2>${company}</h2><p>العميل: ${doc.counterpartyId}</p><p>رقم المستند: ${doc.documentNumber}</p><table border="1"><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>${rows}</table><p>الإجمالي: ${doc.total}</p><p>الضريبة: ${doc.vat}</p><p>الملاحظات: ${doc.notes || ''}</p></body></html>`;
}

export function buildReportHtml(tab: string, data: any) {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>Report</title><style>body{font-family:Tahoma,Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}</style></head><body><h2>تقرير ${tab}</h2><table>${JSON.stringify(data, null, 2)}</table></body></html>`;
}

export function openPrintWindow(html: string) {
  const popup = window.open('', '_blank', 'width=1000,height=720,toolbar=0,scrollbars=1');
  if (!popup) {
    alert('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لطباعة المستند.');
    return;
  }
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}
