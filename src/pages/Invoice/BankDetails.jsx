import React from "react";

const BankDetails = () => {
  return (
    <div className="bankdetails">
      <div className="bankDetailsBlockOne">
        <table>
          <tbody>
            <tr className="bankDetailsBlockOneTrOne">
              <td className="accountDetails l-shape" colSpan="3">
                Bank Details: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                RTGS / NEFT / CHEQUE :{" "}
                <span style={{ color: "#003366", fontWeight: "bold" }}>
                  SHIVA SPACETECH
                </span>
              </td>
            </tr>
            <tr className="bankDetailsBlockOneTrTwo">
              <td className="hiddenTd" rowSpan="3"></td>
              <td className="header">BANK :</td>
              <td className="highlight">HDFC BANK</td>
            </tr>
            <tr className="bankDetailsBlockOneTrThree">
              <td className="header">ACCOUNT NO :</td>
              <td className="highlight">5 0 2 0 0 0 5 3 1 5 0 8 5 8</td>
            </tr>
            <tr className="bankDetailsBlockOneTrFour">
              <td className="header">BRANCH :</td>
              <td className="highlight">ELECTRONIC CITY PHASE-2</td>
            </tr>
          </tbody>
        </table>
        <div className="declaration">
          <strong>Declaration:</strong> We declare that this invoice shows the
          actual price of the goods described & that all particulars are true &
          correct.
        </div>
        <div className="receiver">
          <p>Received above goods in good condition</p>
          <p>Receiver Signature</p>
        </div>
      </div>

      <div className="bankDetailsBlockTwo">
        <table className="table2forbanlBlock">
          <tbody>
            <tr className="bankDetailsBlockTwoTrOne">
              <td className="header">PHONE PE / UPI ID</td>
              <td className="email">
                shivaspacetech@ibl / shivaspacetech@hdfcbank
              </td>
            </tr>
            <tr className="bankDetailsBlockTwoTrTwo">
              <td className="header">IFSC CODE :</td>
              <td className="highlight">HDFC0004680</td>
            </tr>
            <tr className="bankDetailsBlockTwoTrThree">
              <td className="header">MICR :</td>
              <td className="highlight">560240151</td>
            </tr>
            <tr className="bankDetailsBlockTwoTrFour">
              <td className="header">ADDRESS :</td>
              <td className="highlight">
                42/4 A, SHANTHIPURA MAIN ROAD <br />
                ELECTRONIC CITY P-2, BENGALURU -560100, <br />
                KARNATAKA, INDIA
              </td>
            </tr>
          </tbody>
        </table>
        <div className="spacetech">
          <span>for</span>{" "}
          <span style={{ color: "#003366", fontWeight: "bold" }}>
            SHIVA SPACETECH
          </span>
        </div>
        <div className="footer">Proprietor</div>
      </div>
    </div>
  );
};

export default React.memo(BankDetails);
