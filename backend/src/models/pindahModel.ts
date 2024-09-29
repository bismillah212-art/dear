import { modelOptions, prop, getModelForClass } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class TransferItem {
  @prop({ required: true })
  public product_id!: number
  @prop({ required: true })
  public product_name!: string
  @prop({ required: true })
  public qty!: number

  @prop({ required: true })
  public before_qty_dari!: number
  @prop({ required: true })
  public before_qty_tujuan!: number
  @prop({ required: true })
  public unit_name!: string
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class WarehouseTransfer {
  public _id?: string

  @prop({ required: true })
  public from_warehouse_id!: number

  @prop({ required: true })
  public to_warehouse_id!: number

  @prop({ required: true })
  public from_warehouse_name!: string

  @prop({ required: true })
  public to_warehouse_name!: string

  @prop()
  public ref_number!: string

  @prop()
  public memo!: string

  @prop({ type: () => [TransferItem], required: true })
  public items!: TransferItem[]

  @prop({ type: () => [String], default: [] })
  public attachment!: string[]

  @prop({ required: true })
  public trans_date!: string
}

export const WarehouseTransferModel = getModelForClass(WarehouseTransfer)
export const TransferItemModel = getModelForClass(TransferItem)
