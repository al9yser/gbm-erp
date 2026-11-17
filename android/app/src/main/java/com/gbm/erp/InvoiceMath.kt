package com.gbm.erp

data class InvoiceTotals(val subtotal: Double, val discount: Double, val taxable: Double, val vat: Double, val total: Double)

fun calculateInvoiceTotals(lines: List<Pair<Double, Double>>, requestedDiscount: Double, vatRate: Double): InvoiceTotals {
    val subtotal = lines.sumOf { (quantity, price) -> quantity.coerceAtLeast(0.0) * price.coerceAtLeast(0.0) }
    val discount = requestedDiscount.coerceIn(0.0, subtotal)
    val taxable = subtotal - discount
    val vat = taxable * vatRate.coerceAtLeast(0.0) / 100.0
    return InvoiceTotals(subtotal, discount, taxable, vat, taxable + vat)
}
