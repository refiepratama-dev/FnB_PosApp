package expo.modules.usbprinter

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val CHUNK_SIZE = 16384
private const val WRITE_TIMEOUT_MS = 5000
private const val MSG_NOT_FOUND = "Printer USB tidak terdeteksi. Cabut lalu colok lagi kabel OTG, pastikan printer menyala."

/**
 * Print langsung ke printer thermal lewat kabel USB OTG (Android USB Host).
 * Hanya 3 fungsi: daftar printer USB, minta izin, kirim data (ESC/POS) mentah.
 * Isi struk dan perintah ESC/POS dibuat di sisi JavaScript (src/lib/printer/usbBytes.ts).
 */
class UsbPrinterModule : Module() {
  private val context: Context
    get() = appContext.reactContext
      ?: throw CodedException("USB_NO_CONTEXT", "Aplikasi belum siap, coba lagi.", null)

  private val usbManager: UsbManager
    get() = context.getSystemService(Context.USB_SERVICE) as UsbManager

  override fun definition() = ModuleDefinition {
    Name("UsbPrinter")

    // true kalau HP / tablet punya USB host (bisa dipasangi kabel OTG)
    Function("isSupported") {
      context.packageManager.hasSystemFeature(PackageManager.FEATURE_USB_HOST)
    }

    // Perangkat USB yang kemungkinan printer: kelas printer (7) atau kelas vendor (255) yang punya jalur kirim data
    AsyncFunction("listPrinters") {
      val manager = usbManager
      manager.deviceList.values.mapNotNull { device ->
        val isPrinterClass = findBulkOut(device, true) != null
        val isVendorClass = !isPrinterClass && hasVendorInterface(device) && findBulkOut(device, false) != null
        if (!isPrinterClass && !isVendorClass) {
          null
        } else {
          val productName = try { device.productName } catch (e: Exception) { null }
          mapOf(
            "vendorId" to device.vendorId,
            "productId" to device.productId,
            "name" to (productName ?: "Printer USB"),
            "isPrinterClass" to isPrinterClass,
            "hasPermission" to manager.hasPermission(device)
          )
        }
      }
    }

    // Minta izin USB (muncul dialog Android). true = diizinkan.
    AsyncFunction("requestPermission") { vendorId: Int, productId: Int, promise: Promise ->
      val device = findDevice(vendorId, productId)
      when {
        device == null -> promise.reject("USB_NOT_FOUND", MSG_NOT_FOUND, null)
        usbManager.hasPermission(device) -> promise.resolve(true)
        else -> askPermission(device, promise)
      }
    }

    // Kirim data mentah (base64) ke printer. Sambungan dibuka lalu ditutup tiap cetak supaya aman saat kabel dicabut.
    AsyncFunction("write") { vendorId: Int, productId: Int, base64: String ->
      val manager = usbManager
      val device = findDevice(vendorId, productId)
        ?: throw CodedException("USB_NOT_FOUND", MSG_NOT_FOUND, null)
      if (!manager.hasPermission(device)) {
        throw CodedException("USB_PERMISSION", "Izin USB belum diberikan. Buka Setting > Printer lalu pilih printer USB lagi.", null)
      }
      sendBytes(manager, device, Base64.decode(base64, Base64.DEFAULT))
      true
    }
  }

  private fun findDevice(vendorId: Int, productId: Int): UsbDevice? =
    usbManager.deviceList.values.firstOrNull { it.vendorId == vendorId && it.productId == productId }

  private fun hasVendorInterface(device: UsbDevice): Boolean {
    for (i in 0 until device.interfaceCount) {
      if (device.getInterface(i).interfaceClass == UsbConstants.USB_CLASS_VENDOR_SPEC) return true
    }
    return false
  }

  /** Cari jalur kirim data (bulk OUT). printerOnly = hanya interface kelas printer. */
  private fun findBulkOut(device: UsbDevice, printerOnly: Boolean): Pair<UsbInterface, UsbEndpoint>? {
    for (i in 0 until device.interfaceCount) {
      val usbInterface = device.getInterface(i)
      if (printerOnly && usbInterface.interfaceClass != UsbConstants.USB_CLASS_PRINTER) continue
      for (e in 0 until usbInterface.endpointCount) {
        val endpoint = usbInterface.getEndpoint(e)
        if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK && endpoint.direction == UsbConstants.USB_DIR_OUT) {
          return Pair(usbInterface, endpoint)
        }
      }
    }
    return null
  }

  private fun askPermission(device: UsbDevice, promise: Promise) {
    val ctx = context
    val action = "${ctx.packageName}.USB_PERMISSION"
    val filter = IntentFilter(action)

    val receiver = object : BroadcastReceiver() {
      override fun onReceive(c: Context, intent: Intent) {
        if (intent.action != action) return
        try {
          ctx.unregisterReceiver(this)
        } catch (e: Exception) {
          // sudah dilepas
        }
        promise.resolve(intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false))
      }
    }

    if (Build.VERSION.SDK_INT >= 33) {
      ctx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      ctx.registerReceiver(receiver, filter)
    }

    // FLAG_MUTABLE wajib di Android 12+ supaya sistem bisa mengisi hasil izin ke intent ini
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0)
    val pending = PendingIntent.getBroadcast(ctx, 0, Intent(action).setPackage(ctx.packageName), flags)
    usbManager.requestPermission(device, pending)
  }

  private fun sendBytes(manager: UsbManager, device: UsbDevice, data: ByteArray) {
    val target = findBulkOut(device, true) ?: findBulkOut(device, false)
      ?: throw CodedException("USB_NO_ENDPOINT", "Perangkat USB ini tidak terbaca sebagai printer.", null)
    val usbInterface = target.first
    val endpoint = target.second

    val connection = manager.openDevice(device)
      ?: throw CodedException("USB_OPEN_FAILED", "Tidak bisa membuka printer USB. Cabut lalu colok lagi kabel OTG.", null)
    try {
      if (!connection.claimInterface(usbInterface, true)) {
        throw CodedException("USB_CLAIM_FAILED", "Printer USB sedang dipakai aplikasi lain.", null)
      }
      var offset = 0
      while (offset < data.size) {
        val length = minOf(CHUNK_SIZE, data.size - offset)
        val sent = connection.bulkTransfer(endpoint, data, offset, length, WRITE_TIMEOUT_MS)
        if (sent <= 0) {
          throw CodedException("USB_WRITE_FAILED", "Gagal mengirim data ke printer USB. Cek kabel dan kertas.", null)
        }
        offset += sent
      }
      connection.releaseInterface(usbInterface)
    } finally {
      connection.close()
    }
  }
}
