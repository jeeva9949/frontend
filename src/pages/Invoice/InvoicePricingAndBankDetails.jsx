import React from "react";
import { toIndianWords } from "../../components/common/numberToWords";
import "./InvoicePricingAndBankDetails.css";

const currency = (value) => `Rs. ${value || "0.00"}`;

const InvoicePricingAndBankDetails = ({ invoiceDetails, showCgstSgst }) => {
  const grandTotal = parseFloat(invoiceDetails?.grandTotal);
  const amountInWords = !Number.isNaN(grandTotal)
    ? `${toIndianWords(grandTotal).toUpperCase()} ONLY`
    : "-";

  return (
    <div className="pricing-bank-shell">
      <div className="pricing-bank-grid">
        <div className="pricing-column">
          <div className="pricing-card">
            <div className="pricing-card-title">E. &amp; O.E</div>
            <div className="pricing-row">
              <span>Net Total</span>
              <strong>{currency(invoiceDetails?.total)}</strong>
            </div>
            {showCgstSgst ? (
              <>
                <div className="pricing-row">
                  <span>CGST (9%)</span>
                  <strong>{currency(invoiceDetails?.cgst)}</strong>
                </div>
                <div className="pricing-row">
                  <span>SGST (9%)</span>
                  <strong>{currency(invoiceDetails?.sgst)}</strong>
                </div>
              </>
            ) : (
              <div className="pricing-row">
                <span>IGST (18%)</span>
                <strong>{currency(invoiceDetails?.igst || invoiceDetails?.totalTaxAmount)}</strong>
              </div>
            )}
            <div className="pricing-row">
              <span>Freight &amp; Packing</span>
              <strong>{currency(invoiceDetails?.freightPacking)}</strong>
            </div>
            <div className="pricing-row">
              <span>Round Off</span>
              <strong>{currency(invoiceDetails?.roundOff)}</strong>
            </div>
            <div className="pricing-row grand">
              <span>Grand Total</span>
              <strong>{currency(invoiceDetails?.grandTotal)}</strong>
            </div>
          </div>

          <div className="amount-words-card">
            <span>Amount Chargeable (In Words)</span>
            <strong>{amountInWords}</strong>
          </div>
        </div>

        <div className="bank-card">
          <div className="bank-card-title">Bank Details</div>
          <div className="bank-card-body">
            <div className="bank-left">
              <div className="bank-field">
                <span>RTGS / NEFT / Cheque:</span>
                <strong>SHIVA SPACETECH</strong>
              </div>
              <div className="bank-divider" />
              <div className="bank-field">
                <span>Bank:</span>
                <strong>HDFC BANK</strong>
              </div>
              <div className="bank-field">
                <span>Account No:</span>
                <strong>5 0 2 0 0 0 5 3 1 5 0 8 5 8</strong>
              </div>
              <div className="bank-field">
                <span>Branch:</span>
                <strong>ELECTRONIC CITY PHASE-2</strong>
              </div>
            </div>

            <div className="bank-right">
              <div className="bank-field">
                <span>Phone Pe / UPI ID:</span>
                <strong className="upi-box">
                  shivaspacetech@ibl / shivaspacetech@hdfcbank
                </strong>
              </div>
              <div className="bank-field">
                <span>IFSC Code:</span>
                <strong>HDFC0004680</strong>
              </div>
              <div className="bank-field">
                <span>MICR:</span>
                <strong>560240151</strong>
              </div>
              <div className="bank-address">
                <span>Address:</span>
                <strong>
                  42/4 A, SHANTHIPURA MAIN ROAD
                  <br />
                  ELECTRONIC CITY P-2, BENGALURU -560100
                  <br />
                  KARNATAKA, INDIA
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InvoicePricingAndBankDetails);
