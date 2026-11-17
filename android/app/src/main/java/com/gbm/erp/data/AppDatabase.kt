package com.gbm.erp.data

import androidx.room.*
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val code: String, val nameAr: String, val nameEn: String, val category: String, val unit: String,
    val purchasePrice: Double, val salePrice: Double, val stock: Double
)

@Entity(tableName = "contacts")
data class ContactEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String, val name: String, val phone: String = "", val email: String = "",
    val address: String = "", val taxNumber: String = "", val balance: Double = 0.0
)

@Entity(tableName = "invoices")
data class InvoiceEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val number: String, val type: String, val contactId: Long, val contactName: String,
    val date: String, val subtotal: Double, val discount: Double, val vatRate: Double,
    val vat: Double, val total: Double, val status: String = "posted", val notes: String = ""
)

@Entity(tableName = "invoice_lines")
data class InvoiceLineEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val invoiceId: Long, val productId: Long?, val productName: String, val productCode: String = "",
    val unit: String = "", val quantity: Double, val unitPrice: Double, val purchasePrice: Double, val total: Double
)

@Dao
interface GbmDao {
    @Query("SELECT * FROM products ORDER BY id DESC") fun observeProducts(): Flow<List<ProductEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertProduct(item: ProductEntity): Long
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertProducts(items: List<ProductEntity>)
    @Update suspend fun updateProduct(item: ProductEntity)
    @Delete suspend fun deleteProduct(item: ProductEntity)

    @Query("SELECT * FROM contacts ORDER BY id DESC") fun observeContacts(): Flow<List<ContactEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertContact(item: ContactEntity): Long
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertContacts(items: List<ContactEntity>)
    @Update suspend fun updateContact(item: ContactEntity)
    @Delete suspend fun deleteContact(item: ContactEntity)

    @Query("SELECT * FROM invoices ORDER BY date DESC, id DESC") fun observeInvoices(): Flow<List<InvoiceEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertInvoice(item: InvoiceEntity): Long
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertInvoices(items: List<InvoiceEntity>)
    @Query("SELECT * FROM invoice_lines WHERE invoiceId = :invoiceId ORDER BY id") suspend fun linesForInvoice(invoiceId: Long): List<InvoiceLineEntity>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insertLines(items: List<InvoiceLineEntity>)
    @Query("SELECT * FROM invoice_lines") fun observeAllLines(): Flow<List<InvoiceLineEntity>>

    @Query("DELETE FROM invoice_lines") suspend fun clearLines()
    @Query("DELETE FROM invoices") suspend fun clearInvoices()
    @Query("DELETE FROM contacts") suspend fun clearContacts()
    @Query("DELETE FROM products") suspend fun clearProducts()
}

@Database(entities = [ProductEntity::class, ContactEntity::class, InvoiceEntity::class, InvoiceLineEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() { abstract fun dao(): GbmDao }
