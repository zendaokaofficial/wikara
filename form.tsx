"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight, MapPin, User, Home, Loader2 } from "lucide-react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { submitToGoogleSheets } from "./lib/google-sheets"

import kecamatanData from "./data/kecamatan-data.json"
import nameOptions from "./data/name-options.json"

interface SubSLSData {
  jumlahMuatanUsaha: string
  jumlahKK: string
  adaPasar: string
  namaPasar: string
  jumlahMuatanPasar?: string
  adaPerumahan: string
  jumlahPerumahan: string
  namaPerumahan: string
  jumlahBangunan: string
}

export default function Component() {
  const [currentStep, setCurrentStep] = useState<"welcome" | "form">("welcome")
  const [formData, setFormData] = useState({
    nama: "",
    kecamatan: "",
    desa: "",
    sls: "",
    idSLS: "",
    jumlahSubSLS: "",
  })
  const [subSLSData, setSubSLSData] = useState<SubSLSData[]>([])
  const [searchName, setSearchName] = useState("")
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [showErrorNotification, setShowErrorNotification] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [isNamePopoverOpen, setIsNamePopoverOpen] = useState(false)

  const filteredNames = nameOptions.filter((name) => name.toLowerCase().includes(searchName.toLowerCase()))

  const selectedKecamatan = kecamatanData.find((k) => k.id === formData.kecamatan)
  const selectedDesa = selectedKecamatan?.desa.find((d) => d.id === formData.desa)

  // Update subSLSData when jumlahSubSLS changes
  useEffect(() => {
    const jumlah = Number.parseInt(formData.jumlahSubSLS) || 0
    if (jumlah > 0) {
      const newSubSLSData = Array.from({ length: jumlah }, (_, index) => {
        return (
          subSLSData[index] || {
            jumlahMuatanUsaha: "",
            jumlahKK: "",
            adaPasar: "",
            namaPasar: "",
            jumlahMuatanPasar: "",
            adaPerumahan: "",
            jumlahPerumahan: "",
            namaPerumahan: "",
            jumlahBangunan: "",
          }
        )
      })
      setSubSLSData(newSubSLSData)
    } else {
      setSubSLSData([])
    }
  }, [formData.jumlahSubSLS])

  const handleKecamatanChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      kecamatan: value,
      desa: "",
      sls: "",
      idSLS: "",
      jumlahSubSLS: "",
    }))
    setSubSLSData([])
  }

  const handleDesaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      desa: value,
      sls: "",
      idSLS: "",
      jumlahSubSLS: "",
    }))
    setSubSLSData([])
  }

  const handleSLSChange = (value: string) => {
    // Find the selected SLS to get its ID
    const selectedSLS = selectedDesa?.sls.find((sls) => sls.id === value)

    setFormData((prev) => ({
      ...prev,
      sls: value,
      idSLS: selectedSLS?.id || "",
      jumlahSubSLS: "",
    }))
    setSubSLSData([])
  }

  const updateSubSLSData = (index: number, field: keyof SubSLSData, value: string) => {
    setSubSLSData((prev) => {
      const newData = [...prev]
      newData[index] = { ...newData[index], [field]: value }

      // Reset conditional fields when main field changes
      if (field === "adaPasar" && value === "tidak") {
        newData[index].namaPasar = ""
        newData[index].jumlahMuatanPasar = ""
      }
      if (field === "adaPerumahan" && value === "tidak") {
        newData[index].jumlahPerumahan = ""
        newData[index].namaPerumahan = ""
        newData[index].jumlahBangunan = ""
      }

      return newData
    })
  }

  const isFormValid = () => {
    if (!formData.nama || !formData.kecamatan || !formData.desa || !formData.sls || !formData.jumlahSubSLS) {
      return false
    }

    return subSLSData.every((data) => {
      const basicFieldsValid = data.jumlahMuatanUsaha && data.jumlahKK && data.adaPasar && data.adaPerumahan
      const pasarValid = data.adaPasar === "tidak" || (data.adaPasar === "ya" && data.namaPasar) || (data.adaPasar === "ya" && data.jumlahMuatanPasar)
      const perumahanValid =
        data.adaPerumahan === "tidak" ||
        (data.adaPerumahan === "ya" && data.jumlahPerumahan && data.namaPerumahan && data.jumlahBangunan)

      return basicFieldsValid && pasarValid && perumahanValid
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Submit to Google Sheets
      const result = await submitToGoogleSheets({ formData, subSLSData })

      if (result.success) {
        // Reset form
        setFormData({
          nama: "",
          kecamatan: "",
          desa: "",
          sls: "",
          idSLS: "",
          jumlahSubSLS: "",
        })
        setSubSLSData([])

        // Show success notification
        setNotificationMessage(result.message)
        setShowSuccessNotification(true)
        setShowErrorNotification(false)

        // Scroll to top setelah submit berhasil
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })

        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowSuccessNotification(false)
        }, 5000)
      } else {
        // Show error notification
        setNotificationMessage(result.message)
        setShowErrorNotification(true)
        setShowSuccessNotification(false)

        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowErrorNotification(false)
        }, 5000)
      }
    } catch (error) {
      console.error("Submission error:", error)
      setNotificationMessage("Terjadi kesalahan. Silakan coba lagi.")
      setShowErrorNotification(true)
      setShowSuccessNotification(false)

      setTimeout(() => {
        setShowErrorNotification(false)
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (currentStep === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
        <Card className="w-full max-w-2xl mx-2 sm:mx-0">
          <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">Selamat Datang di <span className="text-blue-600">WIKARA</span></CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600">
              Wilkerstat Pelaporan Awal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="text-center space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Aplikasi ini merupakan langkah awal dalam persiapan pelaksanaan kegiatan Wilkerstat 2025.
                Melalui aplikasi ini, pendataan wilayah administratif dilakukan hingga tingkat SLS (Satuan Lingkungan Setempat).
              </p>
              <p className="text-gray-600">
                Data yang Anda input akan tersimpan otomatis di Database BPS Kabupaten Tabanan dan digunakan sebagai dasar untuk penentuan alokasi petugas Wilkerstat 2025.
              </p>
            </div>

            <div className="flex justify-center pt-4 gap-4 flex-col sm:flex-row">
              <Button
                onClick={() => setCurrentStep("form")}
                size="lg"
                className="px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg w-full sm:w-auto cursor-pointer"
              >
                Mulai Isi Form
                <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <Button
                asChild
                size="lg"
                className="px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg w-full sm:w-auto cursor-pointer"
              >
                <a href="/dashboard">
                  Dashboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Form Pendataan Pra Wilkerstat 2025
            </CardTitle>
            <CardDescription>Data akan tersimpan otomatis ke Database BPS Kabupaten Tabanan</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {showSuccessNotification && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-start sm:items-center gap-2">
                <Check className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Berhasil!</p>
                  <p className="text-sm">{notificationMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0 text-green-600 hover:text-green-800 cursor-pointer"
                  onClick={() => setShowSuccessNotification(false)}
                >
                  ×
                </Button>
              </div>
            )}

            {showErrorNotification && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                  !
                </div>
                <div>
                  <p className="font-semibold">Error!</p>
                  <p className="text-sm">{notificationMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0 text-red-600 hover:text-red-800"
                  onClick={() => setShowErrorNotification(false)}
                >
                  ×
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Nama Field */}
              <div className="space-y-2">
                <Label htmlFor="nama" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nama
                </Label>
                <Popover open={isNamePopoverOpen} onOpenChange={setIsNamePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between cursor-pointer", !formData.nama && "text-muted-foreground")}
                    >
                      {formData.nama || "Pilih atau cari nama..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari nama..." value={searchName} onValueChange={setSearchName} />
                      <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm">
                          <div className="space-y-2">
                            <p>Nama tidak ditemukan.</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs cursor-pointer"
                              onClick={() => {
                                if (searchName.trim()) {
                                  setFormData((prev) => ({ ...prev, nama: searchName.trim() }))
                                  setSearchName("")
                                  setIsNamePopoverOpen(false) // Tutup popover setelah tambah nama
                                }
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Tambah &quot;{searchName}&quot;
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredNames.map((name) => (
                            <CommandItem
                              key={name}
                              value={name}
                              className="cursor-pointer"
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, nama: name }))
                                setSearchName("")
                                setIsNamePopoverOpen(false) // Tutup popover setelah pilih nama
                              }}
                            >
                              <Check
                                className={cn("mr-2 h-4 w-4", formData.nama === name ? "opacity-100" : "opacity-0")}
                              />
                              {name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.nama && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                    <Check className="h-4 w-4" />
                    <span>
                      Nama terpilih: <strong>{formData.nama}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={() => setFormData((prev) => ({ ...prev, nama: "" }))}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>

              {/* Kecamatan Field */}
              <div className="space-y-2">
                <Label htmlFor="kecamatan">Kecamatan</Label>
                <Select value={formData.kecamatan} onValueChange={handleKecamatanChange}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Pilih kecamatan" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {kecamatanData.map((kecamatan) => (
                      <SelectItem key={kecamatan.id} value={kecamatan.id} className="cursor-pointer">
                        {kecamatan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desa Field */}
              <div className="space-y-2">
                <Label htmlFor="desa">Desa</Label>
                <Select value={formData.desa} onValueChange={handleDesaChange} disabled={!formData.kecamatan}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={formData.kecamatan ? "Pilih desa" : "Pilih kecamatan terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {selectedKecamatan?.desa.map((desa) => (
                      <SelectItem key={desa.id} value={desa.id} className="cursor-pointer">
                        {desa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SLS Field */}
              <div className="space-y-2">
                <Label htmlFor="sls">SLS (Satuan Lingkungan Setempat)</Label>
                <Select value={formData.sls} onValueChange={handleSLSChange} disabled={!formData.desa}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={formData.desa ? "Pilih SLS" : "Pilih desa terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {selectedDesa?.sls.map((sls) => (
                      <SelectItem key={sls.id} value={sls.id} className="cursor-pointer">
                        {sls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ID SLS Field */}
              <div className="space-y-2">
                <Label htmlFor="id-sls">ID SLS</Label>
                <Input
                  id="id-sls"
                  value={formData.idSLS}
                  disabled
                  placeholder="ID akan muncul otomatis setelah memilih SLS"
                  className="bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                {formData.idSLS && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                    <Check className="h-4 w-4" />
                    <span>
                      ID SLS: <strong>{formData.idSLS}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Jumlah Sub SLS Field */}
              <div className="space-y-2">
                <Label htmlFor="jumlah-sub-sls">Jumlah Sub SLS yang Dibentuk</Label>
                <Input
                  id="jumlah-sub-sls"
                  type="number"
                  min="1"
                  max="50"
                  placeholder={formData.sls ? "Masukkan jumlah sub SLS" : "Pilih SLS terlebih dahulu"}
                  value={formData.jumlahSubSLS}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jumlahSubSLS: e.target.value }))}
                  disabled={!formData.sls}
                  className="w-full"
                />
                {formData.jumlahSubSLS && Number.parseInt(formData.jumlahSubSLS) > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Akan dibentuk <strong>{formData.jumlahSubSLS} Sub SLS</strong> di wilayah ini
                    </span>
                  </div>
                )}
              </div>

              {/* Sub SLS Repeater */}
              {subSLSData.length > 0 && (
                <div className="space-y-4">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Detail Sub SLS</h3>
                    <div className="space-y-3">
                      {subSLSData.map((data, index) => (
                        <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                          <Accordion type="multiple" className="w-full">
                            <AccordionItem value={`sub-sls-${index}`} className="border-none">
                              <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline text-left cursor-pointer border-b border-gray-300 last:border-b-0">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-medium">Sub SLS - {index + 1}</span>
                                  {data.jumlahMuatanUsaha && data.jumlahKK && (
                                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                                      ✓ Terisi
                                    </span>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                                <div className="space-y-4 sm:space-y-6">
                                  {/* Jumlah Muatan Usaha */}
                                  <div className="space-y-2">
                                    <Label>Jumlah Muatan Usaha</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="Masukkan jumlah muatan usaha"
                                      value={data.jumlahMuatanUsaha}
                                      onChange={(e) => updateSubSLSData(index, "jumlahMuatanUsaha", e.target.value)}
                                    />
                                  </div>

                                  {/* Jumlah KK */}
                                  <div className="space-y-2">
                                    <Label>Jumlah KK</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="Masukkan jumlah KK"
                                      value={data.jumlahKK}
                                      onChange={(e) => updateSubSLSData(index, "jumlahKK", e.target.value)}
                                    />
                                  </div>

                                  {/* Ada Pasar */}
                                  <div className="space-y-2">
                                    <Label>Ada Pasar atau tidak</Label>
                                    <Select
                                      value={data.adaPasar}
                                      onValueChange={(value) => updateSubSLSData(index, "adaPasar", value)}
                                    >
                                      <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="Pilih Ya/Tidak" />
                                      </SelectTrigger>
                                      <SelectContent className="w-full">
                                        <SelectItem value="ya" className="cursor-pointer">
                                          Ya
                                        </SelectItem>
                                        <SelectItem value="tidak" className="cursor-pointer">
                                          Tidak
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Nama Pasar - Conditional */}
                                  {data.adaPasar === "ya" && (
                                    <div className="space-y-2">
                                      <Label>Nama Pasar</Label>
                                      <Input
                                        placeholder="Masukkan nama pasar"
                                        value={data.namaPasar}
                                        onChange={(e) => updateSubSLSData(index, "namaPasar", e.target.value)}
                                      />
                                    </div>
                                  )}

                                  {/* Nama Pasar - Conditional */}
                                  {data.adaPasar === "ya" && (
                                    <div className="space-y-2">
                                      <Label>Jumlah Muatan Usaha dalam Pasar</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Masukkan Jumlah Muatan Maksimal dalam Pasar"
                                        value={data.jumlahMuatanPasar}
                                        onChange={(e) => updateSubSLSData(index, "jumlahMuatanPasar", e.target.value)}
                                      />
                                    </div>
                                  )}

                                  {/* Ada Perumahan */}
                                  <div className="space-y-2">
                                    <Label>Ada Perumahan baru atau tidak 2025</Label>
                                    <Select
                                      value={data.adaPerumahan}
                                      onValueChange={(value) => updateSubSLSData(index, "adaPerumahan", value)}
                                    >
                                      <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="Pilih Ya/Tidak" />
                                      </SelectTrigger>
                                      <SelectContent className="w-full">
                                        <SelectItem value="ya" className="cursor-pointer">
                                          Ya
                                        </SelectItem>
                                        <SelectItem value="tidak" className="cursor-pointer">
                                          Tidak
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Jumlah & Nama Perumahan - Conditional */}
                                  {data.adaPerumahan === "ya" && (
                                    <>
                                      <div className="space-y-2">
                                        <Label>Berapa Jumlahnya</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="Masukkan jumlah perumahan"
                                          value={data.jumlahPerumahan}
                                          onChange={(e) => updateSubSLSData(index, "jumlahPerumahan", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Nama Perumahan</Label>
                                        <Input
                                          placeholder="Tuliskan semua nama perusahaan dipisahkan dengan koma"
                                          value={data.namaPerumahan}
                                          onChange={(e) => updateSubSLSData(index, "namaPerumahan", e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Jumlah Bangunan di perumahan</Label>
                                        <Input
                                          placeholder="Pisahkan dengan koma apabila lebih dari satu perusahaan"
                                          value={data.jumlahBangunan}
                                          onChange={(e) => updateSubSLSData(index, "jumlahBangunan", e.target.value)}
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="border-t border-gray-300 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep("welcome")}
                    className="w-full sm:flex-1 order-2 sm:order-1 cursor-pointer"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1 order-1 sm:order-2 cursor-pointer"
                    disabled={!isFormValid() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Kirim Data"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
