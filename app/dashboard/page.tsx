"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type SheetData = string[][]

type SLSItem = {
  id: string
  name: string
  sheetData?: string[]
}

type DesaItem = {
  id: string
  name: string
  sls: SLSItem[]
}

type KecamatanItem = {
  id: string
  name: string
  desa: DesaItem[]
}

export default function DashboardPage() {
  const [kecamatanData, setKecamatanData] = useState<KecamatanItem[]>([])
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sheetRes, jsonRes] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_SHEET_URL!),
          fetch("/data/kecamatan-data.json"),
        ])
        const sheetResult = await sheetRes.json()
        const sheetRows: SheetData = sheetResult.data
        const jsonData: KecamatanItem[] = await jsonRes.json()

        const rows = sheetRows.slice(1)
        const slsMap = new Map<string, string[]>()

        for (const row of rows) {
          const rawId = row[0] as string
          let idSLS: string
          if (!isNaN(Number(rawId))) {
            idSLS = Number(rawId).toFixed(0).padStart(14, "0")
          } else {
            idSLS = String(rawId ?? "").replace(/[^\d]/g, "").padStart(14, "0")
          }
          slsMap.set(idSLS, row)
        }

        const joinedData = jsonData.map((kec) => ({
          ...kec,
          desa: kec.desa.map((desa) => ({
            ...desa,
            sls: desa.sls.map((sls) => ({
              ...sls,
              sheetData: slsMap.get(sls.id),
            })),
          })),
        }))
        setKecamatanData(joinedData)
      } catch (err) {
        console.error("Gagal mengambil data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p className="p-6 text-base">Loading data...</p>

  const filteredKec = selectedKec
    ? kecamatanData.filter((k) => k.id === selectedKec)
    : kecamatanData

  const chartData = selectedKec
    ? filteredKec[0]?.desa.map((desa) => {
        const total = desa.sls.length
        const updated = desa.sls.filter((s) => s.sheetData).length
        return {
          name: desa.name,
          percentage: total ? Number(((updated / total) * 100).toFixed(1)) : 0,
        }
      }) || []
    : kecamatanData.map((kec) => {
        const total = kec.desa.reduce((sum, d) => sum + d.sls.length, 0)
        const updated = kec.desa.reduce((sum, d) => sum + d.sls.filter((s) => s.sheetData).length, 0)
        return {
          name: kec.name,
          percentage: total ? Number(((updated / total) * 100).toFixed(1)) : 0,
        }
      })

  const flatRows = filteredKec.flatMap((kec) =>
    kec.desa.flatMap((desa) =>
      desa.sls.map((sls) => ({
        kecamatan: kec.name,
        desa: desa.name,
        idSLS: sls.id,
        namaSLS: sls.name,
        jumlahSubSLS: sls.sheetData?.[6] || "-",
        nama: sls.sheetData?.[2] || "-",
        timestamp: sls.sheetData?.[1] || "-",
      }))
    )
  )

  const totalPages = Math.ceil(flatRows.length / rowsPerPage)
  const indexOfLast = currentPage * rowsPerPage
  const indexOfFirst = indexOfLast - rowsPerPage
  const currentRows = flatRows.slice(indexOfFirst, indexOfLast)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto space-y-10 text-base">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base">Filter Kecamatan</CardTitle>
                <select
                  value={selectedKec}
                  onChange={(e) => {
                    setSelectedKec(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="mt-2 border border-gray-300 rounded-md px-3 py-2 w-full sm:w-64"
                >
                  <option value="">Semua Kecamatan</option>
                  {kecamatanData.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <Link href="/" className="text-blue-600 hover:underline">
                ← Kembali
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">
              Persentase SLS Terupdate {selectedKec ? "per Desa" : "per Kecamatan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={Math.max(300, chartData.length * 50)}
            >
              <BarChart
                layout="vertical"
                data={chartData.sort((a, b) => b.percentage - a.percentage)}
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="percentage" fill="#60a5fa" barSize={30} radius={[4, 4, 4, 4]}>
                  <LabelList dataKey="percentage" position="right" formatter={(v) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Tabel Data Terhubung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="table-auto w-full border border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border px-3 py-2">Kecamatan</th>
                    <th className="border px-3 py-2">Desa</th>
                    <th className="border px-3 py-2">ID SLS</th>
                    <th className="border px-3 py-2">Nama SLS</th>
                    <th className="border px-3 py-2">Jumlah Sub SLS</th>
                    <th className="border px-3 py-2">Nama</th>
                    <th className="border px-3 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{row.kecamatan}</td>
                      <td className="border px-3 py-2">{row.desa}</td>
                      <td className="border px-3 py-2">{row.idSLS}</td>
                      <td className="border px-3 py-2">{row.namaSLS}</td>
                      <td className="border px-3 py-2">{row.jumlahSubSLS}</td>
                      <td className="border px-3 py-2">{row.nama}</td>
                      <td className="border px-3 py-2">{row.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-full flex flex-col items-center sm:flex-row sm:justify-between gap-3 text-sm">
              <p>Halaman {currentPage} dari {totalPages}</p>
              <div className="flex gap-1 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  ←
                </Button>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  } else if (
                    Math.abs(page - currentPage) === 2 &&
                    (page === 2 || page === totalPages - 1)
                  ) {
                    return <span key={page}>...</span>
                  } else {
                    return null
                  }
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                >
                  →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
