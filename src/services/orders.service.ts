/**
 * Order channel bridge for Phase 3 Commerce API.
 * Today POS sales are the only order channel; online orders will extend this module.
 */
export {
  createSale as createPosOrder,
  refundSale as refundPosOrder,
  type CreateSaleInput,
  type SaleLineInput,
} from "./sales.service";
