import React, { useContext, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  useAddWarehouseTransferMutation,
  useGetWarehouseTransferByRefQuery,
  useUpdateWarehouseTransferMutation,
} from '../../hooks/pindahHooks'
import {
  Table,
  Typography,
  Row,
  Col,
  Button,
  InputNumber,
  message,
  Input,
  Form,
} from 'antd'
import { useIdWarehouse } from './namaWarehouse'
import { useIdNamaBarang } from './NamaBarang'
import { useReactToPrint } from 'react-to-print'
import { useGetWarehousesQuery } from '../../hooks/warehouseHooks'
import { useProductStocks } from './Po'
import { saveMutation } from './apiMutasi'
import UserContext from '../../contexts/UserContext'
import { AnyNsRecord } from 'dns'
import SingleDate from '../SingleDate'
import {
  useAmbilDetailBarangGoretsQuery,
  useSimpanDetailBarangDariGoretMutation,
} from '../../hooks/ambilDetailBarangDariGoretHooks'
import { useAddBarangMutation } from '../../hooks/barangHooks'
// import MutasiSuratJalan from './MutasiSuratJalan'

const { Title, Text } = Typography

const ValidatePindah: React.FC = () => {
  const userContext = useContext(UserContext)
  const { user } = userContext || {}
  const idOutletLoggedIn = user ? String(user.id_outlet) : '0'
  const { error, success, saveInvoiceMutasi } = saveMutation()

  const { idaDataBarang } = useIdNamaBarang()
  const { ref_number } = useParams<{ ref_number: string }>()
  const { data: idWarehouseMonggo } = useGetWarehousesQuery()

  const { data: transferData } = useGetWarehouseTransferByRefQuery(ref_number!)
  console.log({ transferData })
  const { mutate: updateWarehouseTransfer } =
    useUpdateWarehouseTransferMutation()

  const transferArray = Array.isArray(transferData) ? transferData : []
  const transfer = transferArray[0] || {}
  const sumberData = transfer.items || []
  const productIds = sumberData.map((item: any) => item.product_id).join(',')

  console.log({ sumberData })

  const warehouseMap: Record<any, any> = {}

  if (idWarehouseMonggo && Array.isArray(idWarehouseMonggo)) {
    idWarehouseMonggo.forEach((warehouse) => {
      warehouseMap[warehouse.id] = warehouse.id
    })
  }
  const productMap: Record<number, string> = {}
  idaDataBarang.forEach((barang) => {
    productMap[barang.id] = barang.name
  })

  const fromWarehouseId = warehouseMap[transfer.from_warehouse_id]
  console.log({ fromWarehouseId })
  const toWarehouseId = warehouseMap[transfer.to_warehouse_id]
  console.log({ fromWarehouseId })

  const fromWarehouseCode = idWarehouseMonggo?.find(
    (warehouse) => warehouse.name === fromWarehouseId
  )?.code

  //
  if (idWarehouseMonggo && Array.isArray(idWarehouseMonggo)) {
    idWarehouseMonggo.forEach((warehouse) => {
      warehouseMap[warehouse.id] = warehouse.name
    })
  }
  const productMapan: Record<number, string> = {}
  idaDataBarang.forEach((barang) => {
    productMap[barang.id] = barang.name
  })

  const fromWarehouseName =
    warehouseMap[transfer.from_warehouse_id] || transfer.from_warehouse_name
  const toWarehouseName =
    warehouseMap[transfer.to_warehouse_id] || transfer.to_warehouse_name

  const fromWarehouseCodes = idWarehouseMonggo?.find(
    (warehouse) => warehouse.name === fromWarehouseId
  )?.code

  const [title, setTitle] = useState('TRANSFER . . . ')

  useEffect(() => {
    if (String(transfer.to_warehouse_name) === 'EXTRA TRUSS') {
      setTitle('TRANSFER GUDANG')
    } else {
      setTitle('TRANSFER PO')
    }
  }, [transfer.to_warehouse_name])

  const handleTransferChange = (value: number, index: number) => {
    console.log({ value })
    const updatedTransferQty = [...transferQty]
    updatedTransferQty[index] = value
    setTransferQty(updatedTransferQty)
  }
  const [transferQty, setTransferQty] = useState<number[]>([])

  const [dataSource, setDataSource] = useState<any[]>([])

  const [fromQtyState, setFromQtyState] = useState<{ [key: number]: number }>(
    {}
  )
  console.log({ fromQtyState })
  const [toQtyState, setToQtyState] = useState<{ [key: number]: number }>({})
  console.log({ toQtyState })
  const navigate = useNavigate()

  useEffect(() => {
    if (transferData) {
      const initialDataSource = sumberData.map((item: any, index: number) => {
        const product = stocks.find(
          (product) => String(product.id) === String(item.product_id)
        )

        return {
          key: index,
          product_id: item.product_id,
          finance_product_id: item.finance_product_id,
          product_name: item.product_name,
          qty_minta: item.qty_minta,
          unit_name: item.unit_name,
          transferQty: 0,
          fromQty: 0,
          toQty: 0,
          code: null,
          id: 14,
        }
      })
      setDataSource(initialDataSource)
    }
  }, [transferData, sumberData, fromWarehouseId, toWarehouseId])

  const handleSaveTransfer = async () => {
    const validRefNumber = ref_number || ''

    const transferData = {
      from_warehouse_id: toWarehouseId,
      to_warehouse_id: fromWarehouseId,
      trans_date: selectedDates,
      ref_number: validRefNumber,
      memo: '',
      code: 2,
      id: 14,

      items: dataSource.map((row) => ({
        qty_minta: row.qty_minta,
        code: row.code,
        product_id: row.product_id,
        finance_account_id: row.product_id,
        product_name: row.product_name,
        qty: transferQty[row.key] || 0,
        before_qty_dari: fromQtyState[row.product_id] || 0,
        before_qty_tujuan: toQtyState[row.product_id] || 0,
        unit_name: row.unit_name,
        id: 14,
      })),
    }

    saveInvoiceMutasi(transferData)

    try {
      updateWarehouseTransfer(
        { ref_number: validRefNumber, updatedData: transferData },
        {
          onError: (error) => {
            const errorMessage =
              error?.message ||
              'Terjadi kesalahan saat mengupdate data transfer'
            message.error(errorMessage)
            console.error('Error:', error)
          },
        }
      )
    } catch (error) {
      const errorMessage =
        (error as Error)?.message ||
        'Terjadi kesalahan saat menyimpan data transfer'
      message.error(errorMessage)
      console.error('Error:', error)
    }
    navigate(`/simpanidunikdarikledomutasi/${ref_number}`)
  }

  const printSuratJalan = useRef<HTMLDivElement>(null)

  const printSuratJalanHandler = useReactToPrint({
    content: () => printSuratJalan.current,
  })
  const [warehouseDariId, setWarehouseDariId] = useState<string>('')
  const [warehouseTujuanId, setWarehouseTujuanId] = useState<string>('')
  const [qtyDari, setQtyDari] = useState<number | null>(null)
  console.log({ qtyDari })
  const [qtyTujuan, setQtyTujuan] = useState<number | null>(null)
  console.log({ qtyTujuan })

  const combinedWarehouseIds = `${fromWarehouseId},${toWarehouseId}`

  const { stocks, qtyById } = useProductStocks(productIds, combinedWarehouseIds)
  const [selectedDates, setSelectedDates] = useState<string>()

  const handleDateRangeSave = (startDate: string) => {
    setSelectedDates(startDate)
  }
  const columns = [
    // Input for transfer quantity
    {
      title: 'Jumlah TF',
      dataIndex: 'transferQty',
      key: 'transferQty',
      render: (text: string, record: any, index: number) => (
        <Input
          type="number"
          value={transferQty[index] || 0}
          onChange={(e) => {
            const value = Number(e.target.value)
            console.log(`Transfer Input: ${value}`) // Cek nilai input

            setTransferQty((prev) => {
              const newQty = [...prev]
              newQty[index] = value
              return newQty
            })

            // Update fromQtyState dan toQtyState
            const productId = record.product_id
            const product = stocks.find(
              (p) => String(p.id) === String(productId)
            )
            if (product) {
              const qtyDari = product.stocks?.[fromWarehouseId]?.qty || 0
              const qtyTujuan = product.stocks?.[toWarehouseId]?.qty || 0

              setFromQtyState((prevState) => ({
                ...prevState,
                [productId]: qtyDari + value,
              }))

              setToQtyState((prevState) => ({
                ...prevState,
                [productId]: qtyTujuan - value,
              }))
            }
          }}
        />
      ),
    },

    {
      title: 'No',
      dataIndex: 'transferQty',
      key: 'transferQty',
      render: (_: any, record: any, index: number) => {
        const product = stocks.find(
          (product) => String(product.id) === String(record.product_id)
        )

        if (!product) return <span>Product not found</span>

        const qtyDariValue = product?.stocks?.[fromWarehouseId]?.qty || 0
        const qtyTujuanValue = product?.stocks?.[toWarehouseId]?.qty || 0

        const transferAmount = transferQty[index] || 0 // Gunakan index
        const updatedQtyDariValue = qtyDariValue + transferAmount
        const updatedQtyTujuanValue = qtyTujuanValue - transferAmount
        console.log('Product:', product)
        console.log('qtyFromWarehouseId:', updatedQtyDariValue)
        console.log('qtyToWarehouseId:', updatedQtyTujuanValue)

        return (
          <div>
            <span>{`${updatedQtyDariValue} / ${updatedQtyTujuanValue}`}</span>
          </div>
        )
      },
    },
    {
      title: 'Barang',
      dataIndex: 'product_name',
      key: 'product_name',
    },

    {
      title: 'Qty Permintaan',
      dataIndex: 'qty_minta',
      key: 'qty_minta',
    },
    ...(transferData?.code === 1
      ? [
          {
            title: 'Tervalidasi',
            dataIndex: 'qty',
            key: 'qty',
          },
        ]
      : []),

    {
      title: 'Satuan',
      dataIndex: 'unit_name',
      key: 'unit_name',
    },
  ]

  const componentRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  })
  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div ref={componentRef} className="print-container">
        <Title level={3} style={{ textAlign: 'center' }}>
          <span style={{ color: '#AF8700', fontSize: '20px' }}>{title}</span>
        </Title>

        {transferArray.length > 0 && (
          <>
            <Row
              style={{
                marginBottom: '16px',
                borderBottom: '1px dotted #AF8700',
                padding: '8px',
              }}
            >
              <Col span={24}>
                <Row>
                  <Col span={6}>
                    <Text>Refer</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>: {transfer.ref_number}</Text>
                  </Col>
                  <Col span={6} style={{ textAlign: 'center' }}>
                    <Text>Dari</Text>
                  </Col>
                </Row>

                <Row>
                  <Col span={6}>
                    <Text>Tanggal PO</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>: {transfer.trans_date}</Text>
                  </Col>
                  <Col span={6}>
                    <Text>Tanggal Validasi</Text>
                  </Col>
                  <Col span={12}>
                    <SingleDate
                      onChange={(dates) => {
                        setSelectedDates(dates)
                      }}
                      onSave={handleDateRangeSave}
                    />
                  </Col>
                  <Col span={6} style={{ textAlign: 'center' }}>
                    <Text strong>{toWarehouseName}</Text>
                  </Col>
                </Row>

                <Row>
                  <Col span={6}>
                    <Text>Alamat Peminta</Text>
                  </Col>
                  <Col span={12}>
                    <Text italic>: {fromWarehouseCodes || '-'}</Text>
                  </Col>

                  <Col span={6} style={{ textAlign: 'center' }}>
                    <Text>Kepada</Text>
                  </Col>
                </Row>

                <Row>
                  <Col span={6}>
                    <Text>Ket</Text>
                  </Col>
                  <Col span={12}>
                    <Text>: -</Text>
                  </Col>
                  <Col span={6} style={{ textAlign: 'center' }}>
                    <Text strong>{fromWarehouseName}</Text>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Table
              dataSource={sumberData}
              columns={columns as any}
              rowKey="_id"
              pagination={false}
              style={{ marginBottom: '0px' }}
            />

            {transferData?.code !== 2 && (
              <>
                <div style={{ textAlign: 'right' }}>
                  <Button
                    type="dashed"
                    onClick={handleSaveTransfer} // Fungsi untuk menyimpan
                    style={{
                      marginBottom: '16px',
                      backgroundColor: '#28a745', // Ubah warna jika perlu
                      borderColor: '#28a745',
                      color: '#ffffff',
                      width: '140px',
                    }}
                  >
                    Simpan
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
export default ValidatePindah
