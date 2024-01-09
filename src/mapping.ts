import {
  Address,
  ByteArray,
  Bytes,
  ethereum,
  log,
  BigInt,
} from "@graphprotocol/graph-ts";
import {
  CallOnExternalPositionExecutedForFund,
  ExternalPositionDeployedForFund,
  ExternalPositionTypeInfoUpdated,
  ValidatedVaultProxySetForFund,
} from "../generated/ExternalPositionManager/ExternalPositionManager";

export function handleCallOnExternalPositionExecutedForFund(
  event: CallOnExternalPositionExecutedForFund
): void {
  if (
    event.params.externalPosition.notEqual(
      Address.fromString("0xc6e0c8f5aae2791b563b4a1e2c23efea38d79d94")
    )
  ) {
    return;
  }

  log.warning("actionId: {}, actionArgs: {}", [
    event.params.actionId.toString(),
    event.params.actionArgs.toHex(),
  ]);

  if (event.params.actionId.toI32() == 3) {
    let decoded = ethereum.decode(
      "(uint16,bytes32,uint16,uint256)",
      event.params.actionArgs
    );

    if (decoded == null) {
      log.warning("Unable to decode actionArgs", []);
      return;
    }

    let tuple = decoded.toTuple();
    let borrowedCurrencyId = tuple[0].toI32();
    let encodedBorrowTrade = tuple[1].toBytes();
    let collateralCurrencyId = tuple[2].toI32();
    let collateralAssetAmount = tuple[3].toBigInt();

    log.warning(
      "borrowedCurrencyId {}, encodedBorrowTrade {}, collateralCurrencyId {}, collateralAssetAmount {}",
      [
        borrowedCurrencyId.toString(),
        encodedBorrowTrade.toHex(),
        collateralCurrencyId.toString(),
        collateralAssetAmount.toString(),
      ]
    );

    let array = new Uint8Array(1 + 1 + 11 + 4 + 15);
    array.set(encodedBorrowTrade);

    let backAndForth = Bytes.fromUint8Array(array);

    let marketIndexSlice = array.subarray(1, 2);
    let marketIndexBytes = Bytes.fromUint8Array(marketIndexSlice.reverse());
    let marketIndex = BigInt.fromUnsignedBytes(marketIndexBytes);

    let fCashAmountSlice = array.subarray(2, 13);
    let fCashAmountBytes = Bytes.fromUint8Array(fCashAmountSlice.reverse());
    let fCashAmount = BigInt.fromUnsignedBytes(fCashAmountBytes);

    // let decodedBorrowTrade = ethereum.decode(
    //   "(uint8,uint8,uint88,uint32,uint120)",
    //   encodedBorrowTrade
    // );

    // if (decodedBorrowTrade == null) {
    //   log.warning("Unable to decode encodedBorrowTrade", []);
    //   return;
    // }

    // let borrowTradeTuple = decodedBorrowTrade.toTuple();
    // let marketIndex = borrowTradeTuple[1].toI32();
    // let fCashAmount = borrowTradeTuple[2].toBigInt();

    log.warning(
      "array {}, length {}, backAndForth {}, marketIndexSlice {}, marketIndexBytes {}, marketIndex {}, fCashAmountSlice{}, fCashAmountBytes {}, fCashAmount {}",
      [
        array.toString(),
        array.length.toString(),
        backAndForth.toHex(),
        marketIndexSlice.toString(),
        marketIndexBytes.toHex(),
        marketIndex.toString(),
        fCashAmountSlice.toString(),
        fCashAmountBytes.toHex(),
        fCashAmount.toString(),
      ]
    );
  }
}

export function handleExternalPositionDeployedForFund(
  event: ExternalPositionDeployedForFund
): void {}

export function handleExternalPositionTypeInfoUpdated(
  event: ExternalPositionTypeInfoUpdated
): void {}

export function handleValidatedVaultProxySetForFund(
  event: ValidatedVaultProxySetForFund
): void {}

// Adapted from https://ethereum.stackexchange.com/questions/114582/the-graph-nodes-cant-decode-abi-encoded-data-containing-arrays
function tuplePrefixBytes(input: Bytes): Bytes {
  let inputTypedArray = input.subarray(0);

  let tuplePrefix = ByteArray.fromHexString(
    "0x0000000000000000000000000000000000000000000000000000000000000020"
  );

  let inputAsTuple = new Uint8Array(
    tuplePrefix.length + inputTypedArray.length
  );

  inputAsTuple.set(tuplePrefix, 0);
  inputAsTuple.set(inputTypedArray, tuplePrefix.length);

  return Bytes.fromUint8Array(inputAsTuple);
}
