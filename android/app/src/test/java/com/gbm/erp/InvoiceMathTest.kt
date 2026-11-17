package com.gbm.erp
import org.junit.Assert.assertEquals
import org.junit.Test
class InvoiceMathTest {
    @Test fun calculatesDiscountAndVat() {
        val r = calculateInvoiceTotals(listOf(2.0 to 100.0), 15.0, 5.0)
        assertEquals(200.0, r.subtotal, 0.001); assertEquals(15.0, r.discount, 0.001)
        assertEquals(185.0, r.taxable, 0.001); assertEquals(9.25, r.vat, 0.001); assertEquals(194.25, r.total, 0.001)
    }
    @Test fun discountCannotExceedSubtotal() {
        val r = calculateInvoiceTotals(listOf(1.0 to 25.0), 100.0, 5.0)
        assertEquals(25.0, r.discount, 0.001); assertEquals(0.0, r.total, 0.001)
    }
}
