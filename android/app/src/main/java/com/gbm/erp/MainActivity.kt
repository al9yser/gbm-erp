package com.gbm.erp

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.room.Room
import androidx.room.withTransaction
import com.gbm.erp.data.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val Navy = Color(0xFF102A43)
private val Copper = Color(0xFFC28A5B)
private val Sand = Color(0xFFF4F0E8)
private val Paper = Color(0xFFFFFEFC)
private val Ink = Color(0xFF172B3A)
private val Muted = Color(0xFF718096)
private val Border = Color(0xFFE5DED3)
private val Sage = Color(0xFF58776D)
private val Warning = Color(0xFFB77932)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val db = Room.databaseBuilder(applicationContext, AppDatabase::class.java, "gbm-erp.db").build()
        setContent { GbmTheme { GbmApp(db) } }
    }
}

@Composable
private fun GbmTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = lightColorScheme(
        primary = Navy, onPrimary = Color.White, secondary = Copper, onSecondary = Color.White,
        background = Sand, onBackground = Ink, surface = Paper, onSurface = Ink, outline = Border
    ), content = content)
}

private enum class Page(val label: String, val icon: ImageVector) {
    HOME("الرئيسية", Icons.Outlined.SpaceDashboard),
    STOCK("المخزون", Icons.Outlined.Inventory2),
    CONTACTS("العملاء", Icons.Outlined.Groups),
    DOCS("المستندات", Icons.Outlined.ReceiptLong),
    REPORTS("التقارير", Icons.Outlined.Insights),
    SETTINGS("الإعدادات", Icons.Outlined.Settings)
}
private data class DraftLine(val productId: Long? = null, val name: String = "", val code: String = "", val unit: String = "", val qty: String = "1", val price: String = "0", val cost: Double = 0.0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GbmApp(db: AppDatabase) {
    val context = LocalContext.current
    val dao = remember(db) { db.dao() }
    val scope = rememberCoroutineScope()
    val products by dao.observeProducts().collectAsState(initial = emptyList())
    val contacts by dao.observeContacts().collectAsState(initial = emptyList())
    val invoices by dao.observeInvoices().collectAsState(initial = emptyList())
    val lines by dao.observeAllLines().collectAsState(initial = emptyList())
    val prefs = remember { context.getSharedPreferences("gbm-settings", Context.MODE_PRIVATE) }
    var page by remember { mutableStateOf(Page.HOME) }
    var company by remember { mutableStateOf(prefs.getString("company", "GBM INSULATION CONTRACTING LLC") ?: "GBM INSULATION CONTRACTING LLC") }
    var currency by remember { mutableStateOf(prefs.getString("currency", "د.إ") ?: "د.إ") }
    var vat by remember { mutableStateOf(prefs.getFloat("vat", 5f).toDouble()) }
    var exchange by remember { mutableStateOf(prefs.getFloat("exchange", 3.65f).toDouble()) }
    var productEditor by remember { mutableStateOf(false) }
    var productEdit by remember { mutableStateOf<ProductEntity?>(null) }
    var contactEditor by remember { mutableStateOf(false) }
    var contactEdit by remember { mutableStateOf<ContactEntity?>(null) }
    var invoiceEditor by remember { mutableStateOf(false) }

    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        if (uri != null) scope.launch {
            runCatching { importSnapshot(context, db, uri, prefs) }
                .onSuccess { result ->
                    company = prefs.getString("company", company) ?: company
                    currency = prefs.getString("currency", currency) ?: currency
                    vat = prefs.getFloat("vat", 5f).toDouble()
                    exchange = prefs.getFloat("exchange", 3.65f).toDouble()
                    Toast.makeText(context, "تم استيراد " + result.first + " صنف و" + result.second + " مستند", Toast.LENGTH_LONG).show()
                    page = Page.HOME
                }
                .onFailure { Toast.makeText(context, "تعذر الاستيراد: " + (it.message ?: ""), Toast.LENGTH_LONG).show() }
        }
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Scaffold(
            containerColor = Sand,
            topBar = {
                Row(Modifier.fillMaxWidth().background(Navy).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(42.dp).background(Copper, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                        Text("G", color = Navy, fontSize = 25.sp, fontWeight = FontWeight.Black)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("GBM ERP", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text(page.label, color = Color(0xFFD7C7B6), fontSize = 12.sp)
                    }
                    IconButton(onClick = { page = Page.SETTINGS }) { Icon(Icons.Outlined.Tune, "الإعدادات", tint = Color.White) }
                }
            },
            bottomBar = {
                NavigationBar(containerColor = Paper, tonalElevation = 0.dp) {
                    listOf(Page.HOME, Page.STOCK, Page.CONTACTS, Page.DOCS, Page.REPORTS).forEach { item ->
                        NavigationBarItem(selected = page == item, onClick = { page = item },
                            icon = { Icon(item.icon, item.label) }, label = { Text(item.label, fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(selectedIconColor = Copper, selectedTextColor = Navy,
                                indicatorColor = Color(0xFFF0E2D3), unselectedIconColor = Muted))
                    }
                }
            }
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding).background(Sand)) {
                when (page) {
                    Page.HOME -> Dashboard(products, contacts, invoices, currency) { page = it }
                    Page.STOCK -> InventoryScreen(products, currency,
                        { productEdit = null; productEditor = true },
                        { productEdit = it; productEditor = true },
                        { scope.launch { dao.deleteProduct(it) } })
                    Page.CONTACTS -> ContactsScreen(contacts,
                        { contactEdit = null; contactEditor = true },
                        { contactEdit = it; contactEditor = true },
                        { scope.launch { dao.deleteContact(it) } })
                    Page.DOCS -> DocumentsScreen(invoices, currency, context, dao) { invoiceEditor = true }
                    Page.REPORTS -> ReportsScreen(products, invoices, lines, currency)
                    Page.SETTINGS -> SettingsScreen(company, currency, vat, exchange,
                        { name, curr, tax, rate ->
                            company = name; currency = curr; vat = tax; exchange = rate
                            prefs.edit().putString("company", name).putString("currency", curr)
                                .putFloat("vat", tax.toFloat()).putFloat("exchange", rate.toFloat()).apply()
                            Toast.makeText(context, "تم حفظ الإعدادات", Toast.LENGTH_SHORT).show()
                        },
                        { importer.launch(arrayOf("application/json", "text/*", "application/octet-stream")) })
                }
            }
        }
    }

    if (productEditor) ProductEditor(productEdit, { productEditor = false }) { p ->
        scope.launch { if (p.id == 0L) dao.insertProduct(p) else dao.updateProduct(p); productEditor = false }
    }
    if (contactEditor) ContactEditor(contactEdit, { contactEditor = false }) { c ->
        scope.launch { if (c.id == 0L) dao.insertContact(c) else dao.updateContact(c); contactEditor = false }
    }
    if (invoiceEditor) InvoiceEditor(products, contacts, vat, { invoiceEditor = false }) { type, contactId, contactName, note, discount, tax, drafts ->
        scope.launch {
            val valid = drafts.filter { it.name.isNotBlank() && (it.qty.toDoubleOrNull() ?: 0.0) > 0 }
            if (valid.isEmpty()) Toast.makeText(context, "أضف بنداً واحداً بكمية صحيحة", Toast.LENGTH_SHORT).show()
            else {
                val totals = calculateInvoiceTotals(valid.map { (it.qty.toDoubleOrNull() ?: 0.0) to (it.price.toDoubleOrNull() ?: 0.0) }, discount, tax)
                val number = (if (type == "sale") "INV-" else "QT-") + System.currentTimeMillis().toString().takeLast(6)
                val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                val id = dao.insertInvoice(InvoiceEntity(number = number, type = type, contactId = contactId, contactName = contactName,
                    date = date, subtotal = totals.subtotal, discount = totals.discount, vatRate = tax, vat = totals.vat, total = totals.total, notes = note))
                dao.insertLines(valid.map {
                    val q = it.qty.toDoubleOrNull() ?: 0.0
                    val p = it.price.toDoubleOrNull() ?: 0.0
                    InvoiceLineEntity(invoiceId = id, productId = it.productId, productName = it.name, productCode = it.code,
                        unit = it.unit, quantity = q, unitPrice = p, purchasePrice = it.cost, total = q * p)
                })
                if (type == "sale") {
                    valid.filter { it.productId != null }.groupBy { it.productId }.forEach { (productId, rows) ->
                        val product = products.firstOrNull { it.id == productId }
                        if (product != null) {
                            val sold = rows.sumOf { it.qty.toDoubleOrNull() ?: 0.0 }
                            dao.updateProduct(product.copy(stock = product.stock - sold))
                        }
                    }
                }
                invoiceEditor = false
                Toast.makeText(context, "تم حفظ المستند " + number, Toast.LENGTH_SHORT).show()
            }
        }
    }
}

@Composable
private fun Dashboard(products: List<ProductEntity>, contacts: List<ContactEntity>, invoices: List<InvoiceEntity>, currency: String, go: (Page) -> Unit) {
    val sales = invoices.filter { it.type == "sale" }.sumOf { it.total }
    val low = products.count { it.stock <= 10 }
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Column(Modifier.fillMaxWidth().background(Navy, RoundedCornerShape(22.dp)).padding(20.dp)) {
                Text("GBM INSULATION", color = Color(0xFFD7C7B6), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(7.dp))
                Text("إدارة أعمالك، بصورة أوضح", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("نظرة تشغيلية على المبيعات والمخزون", color = Color(0xFFD6DFE5), fontSize = 12.sp)
            }
        }
        item { Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            StatCard("إجمالي المبيعات", money(sales, currency), Icons.Outlined.Payments, Modifier.weight(1f))
            StatCard("قيمة المخزون", money(products.sumOf { it.stock * it.purchasePrice }, currency), Icons.Outlined.Inventory2, Modifier.weight(1f))
        } }
        item { Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            StatCard("الأصناف", products.size.toString(), Icons.Outlined.Category, Modifier.weight(1f))
            StatCard("جهات التعامل", contacts.size.toString(), Icons.Outlined.Groups, Modifier.weight(1f))
        } }
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("تنبيهات المخزون", color = Navy, fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text(low.toString() + " صنف منخفض", color = Warning, fontSize = 11.sp)
            }
            products.filter { it.stock <= 10 }.take(5).forEach { CardRow(it.nameAr.ifBlank { it.nameEn }, it.code, it.stock.toString() + " " + it.unit, Warning) }
            if (low == 0) Text("المخزون بحالة جيدة", color = Sage, modifier = Modifier.padding(8.dp))
        }
        item {
            Text("أحدث المستندات", color = Navy, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            invoices.take(4).forEach { CardRow(it.number, it.contactName, money(it.total, currency), Sage) }
            if (invoices.isEmpty()) EmptyState("لا توجد مستندات", "ابدأ بإنشاء أول فاتورة أو عرض سعر.")
        }
        item { Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            QuickAction("إضافة صنف", Icons.Outlined.AddBox, Modifier.weight(1f)) { go(Page.STOCK) }
            QuickAction("فاتورة جديدة", Icons.Outlined.ReceiptLong, Modifier.weight(1f)) { go(Page.DOCS) }
            QuickAction("التقارير", Icons.Outlined.Insights, Modifier.weight(1f)) { go(Page.REPORTS) }
        } }
    }
}

@Composable
private fun StatCard(title: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(modifier, shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(Paper),
        border = BorderStroke(1.dp, Border), elevation = CardDefaults.cardElevation(0.dp)) {
        Column(Modifier.padding(13.dp)) {
            Icon(icon, null, tint = Copper, modifier = Modifier.size(20.dp))
            Spacer(Modifier.height(8.dp)); Text(title, color = Muted, fontSize = 11.sp)
            Text(value, color = Navy, fontSize = 15.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        }
    }
}

@Composable
private fun CardRow(title: String, subtitle: String, trailing: String, accent: Color) {
    Card(Modifier.fillMaxWidth().padding(bottom = 6.dp), shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(Paper), border = BorderStroke(1.dp, Border)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.width(4.dp).height(34.dp).background(accent, RoundedCornerShape(4.dp)))
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(title, color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Text(subtitle, color = Muted, fontSize = 10.sp)
            }
            Text(trailing, color = Navy, fontWeight = FontWeight.Bold, fontSize = 11.sp)
        }
    }
}

@Composable
private fun QuickAction(label: String, icon: ImageVector, modifier: Modifier = Modifier, click: () -> Unit) {
    Card(modifier.clickable(onClick = click), shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(Paper), border = BorderStroke(1.dp, Border)) {
        Column(Modifier.fillMaxWidth().padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, null, tint = Copper); Text(label, color = Navy, fontSize = 10.sp)
        }
    }
}

@Composable
private fun SectionHeader(title: String, action: String, click: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, color = Navy, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
        TextButton(onClick = click) { Icon(Icons.Outlined.Add, null); Text(action) }
    }
}

@Composable
private fun InventoryScreen(products: List<ProductEntity>, currency: String, add: () -> Unit, edit: (ProductEntity) -> Unit, delete: (ProductEntity) -> Unit) {
    var search by remember { mutableStateOf("") }
    val filtered = products.filter { search.isBlank() || it.nameAr.contains(search, true) || it.nameEn.contains(search, true) || it.code.contains(search, true) }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        SectionHeader("دليل الأصناف", "إضافة صنف", add)
        OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), placeholder = { Text("بحث بالاسم أو الكود") },
            leadingIcon = { Icon(Icons.Outlined.Search, null) }, singleLine = true, shape = RoundedCornerShape(13.dp))
        Spacer(Modifier.height(8.dp))
        Text(filtered.size.toString() + " من " + products.size + " صنف", color = Muted, fontSize = 11.sp)
        LazyColumn(verticalArrangement = Arrangement.spacedBy(7.dp)) {
            items(filtered, key = { it.id }) { p ->
                Card(shape = RoundedCornerShape(15.dp), colors = CardDefaults.cardColors(Paper), border = BorderStroke(1.dp, Border)) {
                    Column(Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(p.nameAr.ifBlank { p.nameEn }, color = Navy, fontWeight = FontWeight.Bold)
                                Text(p.code + " • " + p.nameEn, color = Muted, fontSize = 10.sp)
                            }
                            Text(if (p.stock <= 0) "نفد" else if (p.stock <= 10) "منخفض" else "متوفر",
                                color = if (p.stock <= 10) Warning else Sage, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("المخزون: " + p.stock + " " + p.unit, color = Ink, fontSize = 11.sp, modifier = Modifier.weight(1f))
                            Text("بيع: " + money(p.salePrice, currency), color = Navy, fontSize = 11.sp)
                            IconButton(onClick = { edit(p) }) { Icon(Icons.Outlined.Edit, null, tint = Navy) }
                            IconButton(onClick = { delete(p) }) { Icon(Icons.Outlined.DeleteOutline, null, tint = Warning) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductEditor(item: ProductEntity?, dismiss: () -> Unit, save: (ProductEntity) -> Unit) {
    var code by remember(item) { mutableStateOf(item?.code ?: "") }
    var ar by remember(item) { mutableStateOf(item?.nameAr ?: "") }
    var en by remember(item) { mutableStateOf(item?.nameEn ?: "") }
    var category by remember(item) { mutableStateOf(item?.category ?: "") }
    var unit by remember(item) { mutableStateOf(item?.unit ?: "قطعة") }
    var cost by remember(item) { mutableStateOf(item?.purchasePrice?.toString() ?: "0") }
    var price by remember(item) { mutableStateOf(item?.salePrice?.toString() ?: "0") }
    var stock by remember(item) { mutableStateOf(item?.stock?.toString() ?: "0") }
    AlertDialog(onDismissRequest = dismiss, title = { Text(if (item == null) "صنف جديد" else "تعديل الصنف") },
        text = { Column(Modifier.heightIn(max = 450.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Field("الكود", code) { code = it }; Field("الاسم العربي", ar) { ar = it }; Field("الاسم الإنجليزي", en) { en = it }
            Field("الفئة", category) { category = it }; Field("الوحدة", unit) { unit = it }
            Field("سعر الشراء", cost, KeyboardType.Decimal) { cost = it }; Field("سعر البيع", price, KeyboardType.Decimal) { price = it }
            Field("المخزون", stock, KeyboardType.Decimal) { stock = it }
        } },
        confirmButton = { TextButton(onClick = {
            if (code.isNotBlank() && (ar.isNotBlank() || en.isNotBlank())) save(ProductEntity(item?.id ?: 0, code.trim(), ar.trim(), en.trim(), category.trim(), unit.trim(),
                cost.toDoubleOrNull() ?: 0.0, price.toDoubleOrNull() ?: 0.0, stock.toDoubleOrNull() ?: 0.0))
        }) { Text("حفظ") } },
        dismissButton = { TextButton(onClick = dismiss) { Text("إلغاء") } })
}

@Composable
private fun ContactsScreen(contacts: List<ContactEntity>, add: () -> Unit, edit: (ContactEntity) -> Unit, delete: (ContactEntity) -> Unit) {
    var search by remember { mutableStateOf("") }
    val filtered = contacts.filter { search.isBlank() || it.name.contains(search, true) || it.phone.contains(search) }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        SectionHeader("جهات التعامل", "إضافة جهة", add)
        OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), placeholder = { Text("بحث بالاسم أو الهاتف") },
            leadingIcon = { Icon(Icons.Outlined.Search, null) }, singleLine = true, shape = RoundedCornerShape(13.dp))
        Spacer(Modifier.height(8.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(7.dp)) {
            items(filtered, key = { it.id }) { c ->
                Card(shape = RoundedCornerShape(15.dp), colors = CardDefaults.cardColors(Paper), border = BorderStroke(1.dp, Border)) {
                    Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(c.name, color = Navy, fontWeight = FontWeight.Bold)
                            Text(contactType(c.type) + " • " + c.phone, color = Muted, fontSize = 11.sp)
                            if (c.taxNumber.isNotBlank()) Text("الرقم الضريبي: " + c.taxNumber, color = Muted, fontSize = 10.sp)
                        }
                        IconButton(onClick = { edit(c) }) { Icon(Icons.Outlined.Edit, null, tint = Navy) }
                        IconButton(onClick = { delete(c) }) { Icon(Icons.Outlined.DeleteOutline, null, tint = Warning) }
                    }
                }
            }
        }
    }
}

@Composable
private fun ContactEditor(item: ContactEntity?, dismiss: () -> Unit, save: (ContactEntity) -> Unit) {
    var name by remember(item) { mutableStateOf(item?.name ?: "") }
    var type by remember(item) { mutableStateOf(item?.type ?: "customer") }
    var phone by remember(item) { mutableStateOf(item?.phone ?: "") }
    var email by remember(item) { mutableStateOf(item?.email ?: "") }
    var address by remember(item) { mutableStateOf(item?.address ?: "") }
    var tax by remember(item) { mutableStateOf(item?.taxNumber ?: "") }
    var balance by remember(item) { mutableStateOf(item?.balance?.toString() ?: "0") }
    AlertDialog(onDismissRequest = dismiss, title = { Text(if (item == null) "جهة تعامل جديدة" else "تعديل جهة التعامل") },
        text = { Column(Modifier.heightIn(max = 460.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Field("الاسم", name) { name = it }
            Row { listOf("customer" to "عميل", "supplier" to "مورد", "both" to "الاثنان").forEach { pair ->
                FilterChip(selected = type == pair.first, onClick = { type = pair.first }, label = { Text(pair.second) })
            } }
            Field("الهاتف", phone) { phone = it }; Field("البريد", email) { email = it }; Field("العنوان", address) { address = it }
            Field("الرقم الضريبي", tax) { tax = it }; Field("الرصيد", balance, KeyboardType.Decimal) { balance = it }
        } },
        confirmButton = { TextButton(onClick = { if (name.isNotBlank()) save(ContactEntity(item?.id ?: 0, type, name.trim(), phone, email, address, tax, balance.toDoubleOrNull() ?: 0.0)) }) { Text("حفظ") } },
        dismissButton = { TextButton(onClick = dismiss) { Text("إلغاء") } })
}

@Composable
private fun DocumentsScreen(invoices: List<InvoiceEntity>, currency: String, context: Context, dao: GbmDao, add: () -> Unit) {
    val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        SectionHeader("الفواتير وعروض الأسعار", "مستند جديد", add)
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(invoices, key = { it.id }) { inv ->
                Card(shape = RoundedCornerShape(15.dp), colors = CardDefaults.cardColors(Paper), border = BorderStroke(1.dp, Border)) {
                    Column(Modifier.padding(13.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(inv.number, color = Navy, fontWeight = FontWeight.Bold)
                                Text((if (inv.type == "sale") "فاتورة مبيعات" else "عرض سعر") + " • " + inv.date, color = Muted, fontSize = 10.sp)
                            }
                            Text(money(inv.total, currency), color = Navy, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(inv.contactName, color = Muted, fontSize = 11.sp, modifier = Modifier.weight(1f))
                            TextButton(onClick = { scope.launch {
                                runCatching { shareInvoicePdf(context, inv, dao.linesForInvoice(inv.id), currency) }
                                    .onFailure { Toast.makeText(context, "تعذر إنشاء PDF: " + it.message, Toast.LENGTH_LONG).show() }
                            } }) { Icon(Icons.Outlined.PictureAsPdf, null); Text("PDF") }
                        }
                    }
                }
            }
            if (invoices.isEmpty()) item { EmptyState("لا توجد مستندات", "أنشئ فاتورة مبيعات أو عرض سعر للبدء.") }
        }
    }
}

@Composable
private fun InvoiceEditor(
    products: List<ProductEntity>, contacts: List<ContactEntity>, defaultVat: Double, dismiss: () -> Unit,
    save: (String, Long, String, String, Double, Double, List<DraftLine>) -> Unit
) {
    var type by remember { mutableStateOf("sale") }
    var contactId by remember { mutableStateOf(contacts.firstOrNull()?.id ?: 0L) }
    var contactMenu by remember { mutableStateOf(false) }
    var notes by remember { mutableStateOf("") }
    var discount by remember { mutableStateOf("0") }
    var tax by remember { mutableStateOf(defaultVat.toString()) }
    var drafts by remember { mutableStateOf(listOf(DraftLine())) }
    val total = calculateInvoiceTotals(drafts.map { (it.qty.toDoubleOrNull() ?: 0.0) to (it.price.toDoubleOrNull() ?: 0.0) },
        discount.toDoubleOrNull() ?: 0.0, tax.toDoubleOrNull() ?: defaultVat)
    val contactName = contacts.firstOrNull { it.id == contactId }?.name ?: "عميل نقدي"
    AlertDialog(onDismissRequest = dismiss, title = { Text("إنشاء مستند") },
        text = { Column(Modifier.heightIn(max = 550.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Row {
                FilterChip(selected = type == "sale", onClick = { type = "sale" }, label = { Text("فاتورة") })
                FilterChip(selected = type == "quote", onClick = { type = "quote" }, label = { Text("عرض سعر") })
            }
            Box {
                OutlinedTextField(contactName, {}, Modifier.fillMaxWidth().clickable { contactMenu = true }, readOnly = true, label = { Text("العميل / المورد") })
                DropdownMenu(expanded = contactMenu, onDismissRequest = { contactMenu = false }) {
                    DropdownMenuItem(text = { Text("عميل نقدي") }, onClick = { contactId = 0; contactMenu = false })
                    contacts.forEach { c -> DropdownMenuItem(text = { Text(c.name) }, onClick = { contactId = c.id; contactMenu = false }) }
                }
            }
            drafts.forEachIndexed { index, draft ->
                Card(colors = CardDefaults.cardColors(Color(0xFFF7F3EC)), shape = RoundedCornerShape(12.dp)) {
                    Column(Modifier.padding(9.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("البند " + (index + 1), fontWeight = FontWeight.Bold, color = Navy, modifier = Modifier.weight(1f))
                            if (drafts.size > 1) IconButton(onClick = { drafts = drafts.toMutableList().also { it.removeAt(index) } }) { Icon(Icons.Outlined.Close, null) }
                        }
                        var menu by remember(index) { mutableStateOf(false) }
                        Box {
                            OutlinedTextField(draft.name, {}, Modifier.fillMaxWidth().clickable { menu = true }, readOnly = true,
                                label = { Text("الصنف") }, placeholder = { Text("اختر صنفاً") })
                            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                products.forEach { p -> DropdownMenuItem(text = { Text(p.nameAr + " • " + p.code) }, onClick = {
                                    drafts = drafts.toMutableList().also { it[index] = draft.copy(productId = p.id, name = p.nameAr.ifBlank { p.nameEn },
                                        code = p.code, unit = p.unit, price = p.salePrice.toString(), cost = p.purchasePrice) }
                                    menu = false
                                }) }
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            OutlinedTextField(draft.qty, { v -> drafts = drafts.toMutableList().also { it[index] = draft.copy(qty = v) } },
                                Modifier.weight(1f), label = { Text("الكمية") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
                            OutlinedTextField(draft.price, { v -> drafts = drafts.toMutableList().also { it[index] = draft.copy(price = v) } },
                                Modifier.weight(1f), label = { Text("سعر الوحدة") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
                        }
                    }
                }
            }
            TextButton(onClick = { drafts = drafts + DraftLine() }) { Icon(Icons.Outlined.Add, null); Text("إضافة بند") }
            Field("الخصم", discount, KeyboardType.Decimal) { discount = it }
            Field("ضريبة القيمة المضافة %", tax, KeyboardType.Decimal) { tax = it }
            Field("ملاحظات", notes) { notes = it }
            Card(colors = CardDefaults.cardColors(Color(0xFFEFE7DC))) {
                Column(Modifier.padding(11.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    SummaryLine("الإجمالي قبل الخصم", total.subtotal)
                    SummaryLine("الخصم", total.discount)
                    SummaryLine("الضريبة", total.vat)
                    Divider(color = Border)
                    SummaryLine("الإجمالي النهائي", total.total, true)
                }
            }
        } },
        confirmButton = { TextButton(onClick = { save(type, contactId, contactName, notes, discount.toDoubleOrNull() ?: 0.0, tax.toDoubleOrNull() ?: defaultVat, drafts) }) { Text("حفظ المستند") } },
        dismissButton = { TextButton(onClick = dismiss) { Text("إلغاء") } })
}

@Composable
private fun SummaryLine(label: String, value: Double, strong: Boolean = false) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = if (strong) Navy else Muted, fontWeight = if (strong) FontWeight.Bold else FontWeight.Normal, fontSize = 12.sp)
        Text(String.format(Locale.US, "%.2f", value), color = Navy, fontWeight = if (strong) FontWeight.Bold else FontWeight.Medium, fontSize = 12.sp)
    }
}

@Composable
private fun ReportsScreen(products: List<ProductEntity>, invoices: List<InvoiceEntity>, lines: List<InvoiceLineEntity>, currency: String) {
    val sales = invoices.filter { it.type == "sale" }
    val totalSales = sales.sumOf { it.total }
    val tax = sales.sumOf { it.vat }
    val inventoryCost = products.sumOf { it.stock * it.purchasePrice }
    val margin = lines.sumOf { (it.unitPrice - it.purchasePrice) * it.quantity }
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
        item { Text("مؤشرات الأداء", color = Navy, fontWeight = FontWeight.Bold, fontSize = 19.sp) }
        item { StatCard("إجمالي المبيعات", money(totalSales, currency), Icons.Outlined.Payments) }
        item { StatCard("قيمة المخزون بالتكلفة", money(inventoryCost, currency), Icons.Outlined.Inventory2) }
        item { StatCard("ضريبة المبيعات", money(tax, currency), Icons.Outlined.Receipt) }
        item { StatCard("هامش تقديري قبل المصروفات", money(margin, currency), Icons.Outlined.TrendingUp) }
        item { CardRow("فواتير المبيعات", sales.size.toString(), money(totalSales, currency), Sage) }
        item { CardRow("عروض الأسعار", invoices.count { it.type == "quote" }.toString(), "غير محتسبة ضمن المبيعات", Copper) }
        item { CardRow("أصناف نفدت", products.count { it.stock <= 0 }.toString(), "من إجمالي " + products.size, Warning) }
        item { CardRow("أصناف منخفضة", products.count { it.stock > 0 && it.stock <= 10 }.toString(), "حد التنبيه: 10 وحدات", Warning) }
    }
}

@Composable
private fun SettingsScreen(company: String, currency: String, vat: Double, exchange: Double,
    save: (String, String, Double, Double) -> Unit, onImport: () -> Unit) {
    var name by remember(company) { mutableStateOf(company) }
    var curr by remember(currency) { mutableStateOf(currency) }
    var tax by remember(vat) { mutableStateOf(vat.toString()) }
    var rate by remember(exchange) { mutableStateOf(exchange.toString()) }
    Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("إعدادات المنشأة", color = Navy, fontSize = 19.sp, fontWeight = FontWeight.Bold)
        Field("اسم الشركة", name) { name = it }; Field("رمز العملة", curr) { curr = it }
        Field("ضريبة القيمة المضافة %", tax, KeyboardType.Decimal) { tax = it }
        Field("سعر الصرف", rate, KeyboardType.Decimal) { rate = it }
        Button(onClick = { save(name, curr, tax.toDoubleOrNull() ?: 5.0, rate.toDoubleOrNull() ?: 3.65) },
            modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Navy), shape = RoundedCornerShape(12.dp)) {
            Icon(Icons.Outlined.Save, null); Spacer(Modifier.width(6.dp)); Text("حفظ الإعدادات")
        }
        Divider(color = Border)
        Text("نقل البيانات", color = Navy, fontSize = 17.sp, fontWeight = FontWeight.Bold)
        Text("استورد ملف source_snapshot.json المستخرج من نسخة GBM ERP الأصلية. سيستبدل الاستيراد البيانات المحلية الحالية.", color = Muted, fontSize = 12.sp)
        OutlinedButton(onClick = onImport, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
            Icon(Icons.Outlined.FileOpen, null); Spacer(Modifier.width(6.dp)); Text("استيراد نسخة البيانات JSON")
        }
        Text("بيانات الشركة تبقى محلياً على الجهاز ولا تُرفع إلى المستودع.", color = Sage, fontSize = 11.sp)
    }
}

@Composable
private fun Field(label: String, value: String, keyboard: KeyboardType = KeyboardType.Text, change: (String) -> Unit) {
    OutlinedTextField(value, change, Modifier.fillMaxWidth(), label = { Text(label) },
        keyboardOptions = KeyboardOptions(keyboardType = keyboard), singleLine = true, shape = RoundedCornerShape(12.dp))
}

@Composable
private fun EmptyState(title: String, detail: String) {
    Column(Modifier.fillMaxWidth().padding(25.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Outlined.Inventory, null, tint = Copper, modifier = Modifier.size(36.dp))
        Spacer(Modifier.height(8.dp)); Text(title, color = Navy, fontWeight = FontWeight.Bold); Text(detail, color = Muted, fontSize = 12.sp)
    }
}

private fun money(value: Double, currency: String): String = String.format(Locale.US, "%,.2f %s", value, currency)
private fun contactType(type: String): String = when (type) { "customer" -> "عميل"; "supplier" -> "مورد"; else -> "عميل ومورد" }

private suspend fun importSnapshot(context: Context, db: AppDatabase, uri: Uri, prefs: android.content.SharedPreferences): Pair<Int, Int> {
    val raw = withContext(Dispatchers.IO) {
        context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() } ?: error("تعذر فتح الملف")
    }
    val root = JSONObject(raw)
    val dao = db.dao()
    val itemArray = root.optJSONArray("items") ?: JSONArray()
    val contactArray = root.optJSONArray("contacts") ?: JSONArray()
    val invoiceArray = root.optJSONArray("invoices") ?: JSONArray()
    val products = mutableListOf<ProductEntity>()
    val contacts = mutableListOf<ContactEntity>()
    val invoices = mutableListOf<InvoiceEntity>()
    val invoiceLines = mutableListOf<InvoiceLineEntity>()
    for (i in 0 until itemArray.length()) {
        val o = itemArray.getJSONObject(i)
        products += ProductEntity(o.optLong("id"), o.optString("code"), o.optString("name_ar"), o.optString("name_en"),
            o.optString("category"), o.optString("unit"), o.optString("purchase_price").toDoubleOrNull() ?: 0.0,
            o.optString("sale_price").toDoubleOrNull() ?: 0.0, o.optString("stock_quantity").toDoubleOrNull() ?: 0.0)
    }
    for (i in 0 until contactArray.length()) {
        val o = contactArray.getJSONObject(i)
        contacts += ContactEntity(o.optLong("id"), o.optString("type"), o.optString("name"), o.optString("phone"),
            o.optString("email"), o.optString("address"), o.optString("tax_number"), o.optString("balance").toDoubleOrNull() ?: 0.0)
    }
    for (i in 0 until invoiceArray.length()) {
        val o = invoiceArray.getJSONObject(i)
        val invoiceId = o.optLong("id")
        val subtotal = o.optString("subtotal").toDoubleOrNull() ?: 0.0
        val discount = o.optString("discount").toDoubleOrNull() ?: 0.0
        val taxAmount = o.optString("tax_amount").toDoubleOrNull() ?: 0.0
        invoices += InvoiceEntity(invoiceId, o.optString("invoice_number"), o.optString("type"), o.optLong("contact_id"),
            o.optString("contact_name"), o.optString("date").take(10), subtotal, discount, 5.0, taxAmount,
            o.optString("total_amount").toDoubleOrNull() ?: (subtotal - discount + taxAmount), o.optString("status", "posted"), o.optString("notes"))
        val rows = o.optJSONArray("items") ?: JSONArray()
        for (j in 0 until rows.length()) {
            val line = rows.getJSONObject(j)
            val qty = line.optString("quantity").toDoubleOrNull() ?: 0.0
            val price = line.optString("unit_price").toDoubleOrNull() ?: 0.0
            invoiceLines += InvoiceLineEntity(line.optLong("id"), invoiceId, if (line.isNull("item_id")) null else line.optLong("item_id"),
                line.optString("name_ar").ifBlank { line.optString("name_en") }, line.optString("code"), line.optString("unit"),
                qty, price, line.optString("purchase_price").toDoubleOrNull() ?: 0.0,
                line.optString("total").toDoubleOrNull() ?: qty * price)
        }
    }
    db.withTransaction {
        dao.clearLines(); dao.clearInvoices(); dao.clearContacts(); dao.clearProducts()
        if (products.isNotEmpty()) dao.insertProducts(products)
        if (contacts.isNotEmpty()) dao.insertContacts(contacts)
        if (invoices.isNotEmpty()) dao.insertInvoices(invoices)
        if (invoiceLines.isNotEmpty()) dao.insertLines(invoiceLines)
    }
    root.optJSONObject("settings")?.let { s ->
        prefs.edit().putString("company", s.optString("company_name", "GBM INSULATION CONTRACTING LLC"))
            .putString("currency", s.optString("currency_symbol", "د.إ"))
            .putFloat("exchange", s.optString("exchange_rate").toFloatOrNull() ?: 3.65f)
            .putFloat("vat", s.optString("vat_percentage").toFloatOrNull() ?: 5f).apply()
    }
    return products.size to invoices.size
}

private fun shareInvoicePdf(context: Context, invoice: InvoiceEntity, lines: List<InvoiceLineEntity>, currency: String) {
    val pdf = PdfDocument()
    val page = pdf.startPage(PdfDocument.PageInfo.Builder(595, 842, 1).create())
    val canvas: Canvas = page.canvas
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = android.graphics.Color.rgb(23, 43, 58); textSize = 18f; textAlign = Paint.Align.RIGHT
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
    }
    canvas.drawText("GBM ERP", 550f, 58f, paint)
    paint.textSize = 12f; paint.typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    canvas.drawText(if (invoice.type == "sale") "فاتورة مبيعات" else "عرض سعر", 550f, 88f, paint)
    canvas.drawText("رقم المستند: " + invoice.number, 550f, 116f, paint)
    canvas.drawText("التاريخ: " + invoice.date, 550f, 138f, paint)
    canvas.drawText("العميل: " + invoice.contactName, 550f, 160f, paint)
    paint.color = android.graphics.Color.rgb(194, 138, 91); paint.strokeWidth = 2f
    canvas.drawLine(42f, 185f, 553f, 185f, paint)
    paint.color = android.graphics.Color.rgb(23, 43, 58); paint.textSize = 11f
    canvas.drawText("الصنف", 550f, 215f, paint); canvas.drawText("الكمية", 340f, 215f, paint)
    canvas.drawText("السعر", 230f, 215f, paint); canvas.drawText("الإجمالي", 95f, 215f, paint)
    var y = 245f
    lines.forEach { line ->
        canvas.drawText(line.productName.take(38), 550f, y, paint)
        canvas.drawText(String.format(Locale.US, "%.2f", line.quantity), 340f, y, paint)
        canvas.drawText(String.format(Locale.US, "%.2f", line.unitPrice), 230f, y, paint)
        canvas.drawText(String.format(Locale.US, "%.2f", line.total), 95f, y, paint)
        y += 25f
    }
    paint.color = android.graphics.Color.LTGRAY; canvas.drawLine(42f, y + 8f, 553f, y + 8f, paint)
    paint.color = android.graphics.Color.rgb(23, 43, 58); paint.textSize = 13f
    canvas.drawText("المجموع: " + money(invoice.subtotal, currency), 550f, y + 40f, paint)
    canvas.drawText("الخصم: " + money(invoice.discount, currency), 550f, y + 64f, paint)
    canvas.drawText("الضريبة: " + money(invoice.vat, currency), 550f, y + 88f, paint)
    paint.typeface = Typeface.create("sans-serif", Typeface.BOLD); paint.textSize = 16f
    canvas.drawText("الإجمالي النهائي: " + money(invoice.total, currency), 550f, y + 122f, paint)
    pdf.finishPage(page)
    val safe = invoice.number.replace(Regex("[^A-Za-z0-9_-]"), "_")
    val file = File(context.cacheDir, safe + ".pdf")
    FileOutputStream(file).use { pdf.writeTo(it) }; pdf.close()
    val uri = FileProvider.getUriForFile(context, "com.gbm.erp.fileprovider", file)
    val send = Intent(Intent.ACTION_SEND).apply { type = "application/pdf"; putExtra(Intent.EXTRA_STREAM, uri); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) }
    context.startActivity(Intent.createChooser(send, "مشاركة المستند"))
}
