import {BigInt} from '@graphprotocol/graph-ts'
import {
  CreateEstate,
  AddLand,
  RemoveLand,
  UpdateOperator,
  Update
} from '../types/EstateRegistry/Estate'
import {Estate, Parcel} from '../types/schema'

export function handleCreateEstate(event: CreateEstate): void {
  let id = event.params._estateId.toHex()
  let estate = new Estate(id)
  estate.owner = event.params._owner
  estate.metaData = event.params._data
  estate.land = []
  estate.size = BigInt.fromI32(0)
  estate.sizeArray = 0
  estate.tx = event.transaction.hash
  estate.save()
}

export function handleAddLand(event: AddLand): void {
  let id = event.params._estateId.toHex()
  let estate = Estate.load(id)
  let lands = estate.land
  lands.push(event.params._landId)
  estate.land = lands
  estate.sizeArray = estate.land.length
  estate.size = estate.size.plus(BigInt.fromI32(1))
  estate.save()

  let landParcel = Parcel.load(event.params._landId.toHex())
  // Would expect that this isn't needed, but it is here for safety, since failing at block 6,000,000 slows down iterative testing
  // Because if land parcel doesn't exist, we get a crashed node
  if (landParcel == null) {
    landParcel = new Parcel(event.params._landId.toHex())
  }
  landParcel.estate = id
  landParcel.save()
}

export function handleRemoveLand(event: RemoveLand): void {
  let id = event.params._estateId.toHex()
  let estate = Estate.load(id)
  let lands = estate.land

  let i = lands.indexOf(event.params._landId)
  lands.splice(i, 1)
  estate.land = lands
  estate.size = estate.size.minus(BigInt.fromI32(1))
  estate.sizeArray = estate.land.length
  estate.save()

  let landParcel = Parcel.load(event.params._landId.toHex())
  // Would expect that this isn't needed, but it is here for safety, since failing at block 6,000,000 slows down iterative testing
  // Because if land parcel doesn't exist, we get a crashed node
  if (landParcel == null) {
    landParcel = new Parcel(event.params._landId.toHex())
  }
  landParcel.owner = event.params._destinatary
  landParcel.estate = null
  landParcel.save()
}


export function handleUpdateOperator(event: UpdateOperator): void {
  let id = event.params._estateId.toHex()
  let estate = Estate.load(id)
  estate.operator = event.params._operator
  estate.save()
}

export function handleEstate(event: Update): void {
    let id = event.params._assetId.toHex()
    let estate = Estate.load(id)
    estate.metaData = event.params._data
    estate.save()
}