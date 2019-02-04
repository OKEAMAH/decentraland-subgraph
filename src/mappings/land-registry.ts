import { LANDRegistry, Transfer, Update } from '../types/LANDRegistry/LANDRegistry'
import { Parcel, ParcelData } from '../types/schema'

enum CSVState {
  BETWEEN = 0,
  UNQUOTED_VALUE = 1,
  QUOTED_VALUE = 2,
}

/**
 * Parses a CSV string into an array of strings.
 * @param csv CSV string.
 * @returns Array of strings.
 */
function parseCSV(csv: string): Array<string> {
  let values = new Array<string>()
  let valueStart = 0
  let state = CSVState.BETWEEN

  for (let i: i32 = 0; i < csv.length; i++) {
    if (state == CSVState.BETWEEN) {
      if (csv[i] != ',') {
        if (csv[i] == '"') {
          state = CSVState.QUOTED_VALUE
          valueStart = i + 1
        } else {
          state = CSVState.UNQUOTED_VALUE
          valueStart = i
        }
      }
    } else if (state == CSVState.UNQUOTED_VALUE) {
      if (csv[i] == ',') {
        values.push(csv.substr(valueStart, i - valueStart))
        state = CSVState.BETWEEN
      }
    } else if (state == CSVState.QUOTED_VALUE) {
      if (csv[i] == '"') {
        values.push(csv.substr(valueStart, i - valueStart))
        state = CSVState.BETWEEN
      }
    }
  }

  return values
}

export function handleLandTransfer(event: Transfer): void {
  let parcelId = event.params.assetId.toHex()
  let registry = LANDRegistry.bind(event.address)

  let parcel = new Parcel(parcelId)
  parcel.owner = event.params.to
  parcel.lastTransferredAt = event.block.timestamp
  parcel.save()
}

export function handleLandUpdate(event: Update): void {
  // Bind LANDRegistry contract
  let registry = LANDRegistry.bind(event.address)

  let parcelId = event.params.assetId.toHex()
  let coordinate = registry.decodeTokenId(event.params.assetId)

  // Create ParcelData entity
  let dataString = event.params.data.toString()
  let dataId = parcelId + '-data'
  let data = new ParcelData(dataId)
  data.parcel = parcelId

  // Parse CSV data
  if (dataString.charAt(0) == '0') {
    let values = parseCSV(dataString)
    if (values.length > 0) {
      data.version = values[0]
    }
    if (values.length > 1) {
      data.name = values[1]
    }
    if (values.length > 2) {
      data.description = values[2]
    }
    if (values.length > 3) {
      data.ipns = values[3]
    }
  } else {
    return // Unsupported version
  }

  data.save()

  // Create Parcel entity
  let parcel = new Parcel(parcelId)
  parcel.x = coordinate.value0
  parcel.y = coordinate.value1
  parcel.data = dataId
  parcel.updatedAt = event.block.timestamp
  parcel.save()
}