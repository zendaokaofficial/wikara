"use server"

interface FormSubmissionData {
  formData: {
    nama: string
    kecamatan: string
    desa: string
    sls: string
    idSLS: string
    jumlahSubSLS: string
  }
  subSLSData: Array<{
    jumlahMuatanUsaha: string
    jumlahKK: string
    adaPasar: string
    namaPasar: string
    jumlahMuatanPasar?: string
    adaPerumahan: string
    jumlahPerumahan: string
    namaPerumahan: string
    jumlahBangunan: string
  }>
}

export async function submitToGoogleSheets(data: FormSubmissionData) {
  try {
    // Google Sheets API endpoint
    const APP_SCRIPT_ID = process.env.GOOGLE_APPS_SCRIPT_ID
    if (!APP_SCRIPT_ID) {
      throw new Error("Google Apps Script ID (GOOGLE_APPS_SCRIPT_ID) not configured")
    }

    // Prepare main form data
    const timestamp = new Date().toLocaleString("id-ID")
    const mainData = [
      data.formData.idSLS, // Primary Key - ID SLS
      timestamp,
      data.formData.nama,
      data.formData.kecamatan,
      data.formData.desa,
      data.formData.sls,
      data.formData.jumlahSubSLS,
    ]

    // Prepare Sub SLS data
    const subSLSRows = data.subSLSData.map((subSLS, index) => {
      const subSLSId = data.subSLSData.length === 1
        ? `${data.formData.idSLS}00`
        : `${data.formData.idSLS}${String(index + 1).padStart(2, "0")}`


      return [
        data.formData.idSLS,        // Foreign Key - ID SLS
        `'${subSLSId}`,                    // Unique Sub SLS ID
        timestamp,
        data.formData.nama,
        `Sub SLS - ${index + 1}`,
        subSLS.jumlahMuatanUsaha,
        subSLS.jumlahKK,
        subSLS.adaPasar,
        subSLS.namaPasar,
        subSLS.jumlahMuatanPasar,
        subSLS.adaPerumahan,
        subSLS.jumlahPerumahan,
        subSLS.namaPerumahan,
        subSLS.jumlahBangunan,
      ]
    })


    // Send to Google Sheets using Google Apps Script Web App
    const response = await fetch(`https://script.google.com/macros/s/${APP_SCRIPT_ID}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mainData,
        subSLSData: subSLSRows,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to submit to Google Sheets")
    }

    const result = await response.json()
    return { success: true, message: "Data berhasil disimpan ke Google Sheets!" }
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error)
    return {
      success: false,
      message: "Gagal menyimpan data. Silakan coba lagi.",
    }
  }
}
