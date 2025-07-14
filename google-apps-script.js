function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)

    // GANTI INI DENGAN SPREADSHEET ID ANDA
    const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)

    // Sheet untuk data utama
    let mainSheet = ss.getSheetByName("Data Utama")
    if (!mainSheet) {
      mainSheet = ss.insertSheet("Data Utama")
      // Header untuk sheet utama - ID SLS sebagai kolom pertama
      mainSheet
        .getRange(1, 1, 1, 7)
        .setValues([["ID SLS", "Timestamp", "Nama", "Kecamatan", "Desa", "SLS", "Jumlah Sub SLS"]])
    }

    // Sheet untuk data Sub SLS
    let subSLSSheet = ss.getSheetByName("Detail Sub SLS")
    if (!subSLSSheet) {
      subSLSSheet = ss.insertSheet("Detail Sub SLS")
      // Header untuk sheet Sub SLS - ID SLS sebagai foreign key
      subSLSSheet.getRange(1, 1, 1, 15).setValues([
        [
          "ID SLS", // Foreign Key
          "Sub SLS ID", // Unique identifier untuk setiap sub SLS
          "Timestamp",
          "Nama",
          "Sub SLS",
          "Jumlah Muatan Usaha",
          "Jumlah KK",
          "Ada Pasar",
          "Nama Pasar",
          "Jumlah Muatan Pasar",
          "Ada Perumahan",
          "Jumlah Perumahan",
          "Nama Perumahan",
          "Jumlah Bangunan",
          "Catatan", // Tambahan untuk catatan
        ],
      ])
    }

    // Tambah data utama
    mainSheet.appendRow(data.mainData)

    // Tambah data Sub SLS
    data.subSLSData.forEach((row) => {
      subSLSSheet.appendRow(row)
    })

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Data berhasil disimpan" }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(
      ContentService.MimeType.JSON,
    )
  }
}

// Declare SpreadsheetApp and ContentService
const SpreadsheetApp = SpreadsheetApp
const ContentService = ContentService
