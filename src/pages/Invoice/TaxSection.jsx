import React from "react";
import { toIndianWords } from "../../components/common/numberToWords";
import "./TaxSection.css";
const TaxSection = ({ invoiceDetails, showCgstSgst }) => {
  const totalTaxAmount = parseFloat(invoiceDetails.totalTaxAmount).toFixed(2);
  const [rupees, paise] = totalTaxAmount.split(".");

  return (
    <div className="tax-section">
      <table>
        <thead>
          <tr className="taxHeader">
            <th>HSN/SAC</th>
            <th>Taxable Value</th>
            {showCgstSgst ? (
              <>
                <th>
                  CGST <div className="cgstPercentage"> 9% </div>
                </th>
                <th>
                  SGST <div className="sgstPercentage"> 9% </div>
                </th>
              </>
            ) : (
              <th>
                IGST <div className="igstPercentage"> 18% </div>
              </th>
            )}
            <th>Total Tax Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="taxColValue">
            <td className="hsn_sac">{invoiceDetails.hsnSac}</td>
            <td className="taxable_value">₹{invoiceDetails.total}</td>
            {showCgstSgst ? (
              <>
                <td className="cgst">
                  ₹{" "}
                  {isNaN((9 / 100) * invoiceDetails.total)
                    ? "0.00"
                    : parseFloat(
                        ((9 / 100) * invoiceDetails.total).toFixed(2),
                      )}{" "}
                </td>
                <td className="sgst">
                  ₹{" "}
                  {isNaN((9 / 100) * invoiceDetails.total)
                    ? "0.00"
                    : parseFloat(
                        ((9 / 100) * invoiceDetails.total).toFixed(2),
                      )}{" "}
                </td>
              </>
            ) : (
              <td className="igst">
                ₹
                {isNaN((18 / 100) * invoiceDetails.total)
                  ? "0.00"
                  : parseFloat(
                      ((18 / 100) * invoiceDetails.total).toFixed(2),
                    )}{" "}
              </td>
            )}
            <td className="total_tax_amount">
              ₹{invoiceDetails.totalTaxAmount}
            </td>
          </tr>
          {/*<tr className="taxColEmpty_value">
            <td className="empty_value"></td>
            <td className="empty_value"></td>
            {showCgstSgst ? (
              <>
                <td className="empty_value"></td>
                <td className="empty_value"></td>
              </>
            ) : (
              <td className="empty_value"></td>
            )}
            <td className="empty_value"></td>
          </tr> */}
        </tbody>
      </table>
      <table className="taxBlock">
        <tbody>
          <tr className="taxInWords">
            <td className="taxInWordsLabel">Tax amount (In words)</td>
            <td className="taxInWordsValue">
              {!isNaN(parseFloat(invoiceDetails?.totalTaxAmount))
                ? `${toIndianWords(parseInt(rupees)).toUpperCase()} RUPEES AND ${toIndianWords(parseInt(paise)).toUpperCase()} PAISE ONLY`
                : "-"}{" "}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(TaxSection);
