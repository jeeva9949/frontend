import React from "react";
import { toIndianWords } from "../../components/common/numberToWords";
import "./TotalSection.css";
import TaxSection from "./TaxSection";

const TotalSection = ({ invoiceDetails, handleInputChange, showCgstSgst }) => {
  return (
    <div className="invoice-total-wrapper">
      {/* Amount in Words */}
      <div className="invoice-left-block">
        <div className="amount-words-box">
          <div className="amount-words-title">
            Amount Chargeable (In Words)
          </div>
          <div className="amount-words-value">
            {!isNaN(parseFloat(invoiceDetails?.grandTotal))
              ? toIndianWords(parseFloat(invoiceDetails.grandTotal))
                  .toUpperCase()
                  .concat(" ONLY")
              : "-"}
          </div>
        </div>
        <TaxSection invoiceDetails={invoiceDetails} handleInputChange={handleInputChange} showCgstSgst={showCgstSgst} />
      </div>
      {/* Totals Table */}
      <div className="invoice-right-block">
        <div className="totals-box">
          <div className="totals-header">E &amp; O.E</div>

          <table className="totals-table">
            <tbody>
              <tr>
                <td>Net Total</td>
                <td> ₹
                  <input type="text" name="total" value={invoiceDetails.total}
                    onChange={handleInputChange} placeholder="Net Total" readOnly />
                </td>
              </tr>

              {showCgstSgst ? (
                <>
                  <tr>
                    <td>CGST (9%)</td>
                    <td>
                      <input type="text" name="cgst" value={ parseFloat(((9 / 100) * invoiceDetails.total).toFixed(2),
                  )} onChange={handleInputChange} placeholder="CGST" readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td>SGST (9%)</td>
                    <td> ₹
                  <input type="text" name="sgst" value={ parseFloat(((9 / 100) * invoiceDetails.total).toFixed(2),
                  )} onChange={handleInputChange} placeholder="SGST" readOnly />
                </td>
                    
                  </tr>
                </>
              ) : (
                <tr>
                  <td>IGST (18%)</td>
                  <td>
                    ₹ {((18 / 100) * invoiceDetails.total).toFixed(2)}
                  </td>
                </tr>
              )}

              <tr>
                <td>Freight &amp; Packing</td>
                <td>₹ {invoiceDetails.freightPacking || 0}</td>
              </tr>

              <tr>
                <td>Round Off</td>
                <td>₹ {invoiceDetails.roundOff}</td>
              </tr>

              <tr className="grand-total-row">
                <td>GRAND TOTAL</td>
                <td>₹ {invoiceDetails.grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default React.memo(TotalSection);
