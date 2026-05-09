import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaTrash, FaPlus } from "react-icons/fa";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "./InvoicePage.css";
import { toIndianWords } from "../../components/common/numberToWords";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EditInvoicePage.css";

const EditInvoiceForm = () => {
  const { id, timeStamp } = useParams();
  const [editInvoice, setEditInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [existingRows, setExistingRows] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(0);

  useEffect(() => {
    if (id && timeStamp) {
      setIsLoading(true);
      const fetchInvoiceById = async () => {
        try {
          const response = await fetch(
            `https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/getInvoice?id=${id}&timestamp=${timeStamp}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
                Origin: window.location.origin,
              },
            },
          );

          if (!response.ok) throw new Error("Failed to fetch invoice");

          const data = await response.json();
          const result =
            typeof data?.body === "string" ? JSON.parse(data.body) : data.body;
          if (result && result.length > 0) {
            setEditInvoice(result[0]);
            if (result[0]?.invoicePaymentHistory) {
              setExistingRows(result[0]?.invoicePaymentHistory);
              const totalPaid = result[0]?.invoicePaymentHistory.reduce(
                (sum, item) => sum + parseFloat(item.paymentAmount || 0),
                0,
              );
              setRemainingBalance(
                parseFloat(result[0]?.grandTotal - totalPaid).toFixed(2),
              );
            }
            if (remainingBalance > 0 && rows.length === 0) {
              setRows([
                {
                  date: "",
                  paymentAmount: "",
                  installmentSiNo: "",
                },
              ]);
            }
          }
        } catch (error) {
          console.error("Error fetching invoice:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvoiceById();
    }
  }, [id, timeStamp]);

  useEffect(() => {
    if (remainingBalance > 0 && rows.length === 0) {
      setRows([
        {
          date: "",
          paymentAmount: "",
          installmentSiNo: "",
        },
      ]);
    }
  }, [remainingBalance, rows.length]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        date: "",
        paymentAmount: "",
        installmentSiNo: "",
      },
    ]);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const updatedRows = [...rows];
    updatedRows[index][name] = value;
    setRows(updatedRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(
      `https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          invoiceNo: editInvoice.invoiceNo,
          type: "update",
          invoicePaymentHistory: rows,
        }),
      },
    );

    const result = await response.json();
    if (!response.ok) {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.error("Failed to Update the record");
      }
    } else {
      console.log("Response from server:", result);

      // Show success notification
      toast.success("Invoice successfully Updated to DB!");
      window.location.reload();
    }
  };

  const totalQuantity = editInvoice?.rows?.reduce(
    (total, row) => total + parseFloat(row.quantity || 0),
    0,
  );
  const hsnSac = editInvoice?.rows?.map((row) => row.hsnSac);
  const totalTaxAmount = parseFloat(editInvoice?.totalTaxAmount).toFixed(2);
  const [rupees, paise] = totalTaxAmount.split(".");

  return (
    <>
      <Header />
      <div className="invoice">
        <ToastContainer />
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        <div
          id="content"
          className={
            isLoading ? "blurred invoice-container" : "invoice-container"
          }
        >
          <h3 className="invoice-title">
            <span>{editInvoice?.invoiceType || "N/A"}</span>
          </h3>

          <div className="header row">
            <div className="headerBlock1 col-6">
              <img src="/img/SSTLOGO.jpg" alt="Logo" />
            </div>
            <div className="headerBlock2 col-6">
              <div className="addressandGstBlock">
                <img src="/img/GSTN.png" alt="Logo" />
                <div className="addressBlock">
                  <p>
                    SY NO:96/10, MUNESHWARA LAYOUT, <br />
                    KAMMASANDRA ROAD,HEBBAGODI, <br />
                    ELECTRONIC CITY POST ,BENGALURU-560100 <br />
                    Contact: +91-8861960764 / +91-7299087061 <br />
                    e-mail: shiva_spacetech@yahoo.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="details billHeaderSection">
            <table>
              <tbody>
                <tr>
                  <td className="consigneeDetails" colSpan="2">
                    <strong>Consignee Details :</strong>
                  </td>
                  <td className="invoiceLabel">
                    <strong>Invoice No.</strong>
                  </td>
                  <td className="invoiceInput">
                    <span>{editInvoice?.invoiceNo || "N/A"}</span>
                  </td>
                  <td className="dateLabel">
                    <strong>Date</strong>
                  </td>
                  <td className="dateInput">
                    <span>{editInvoice?.dated || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="nameLabel">
                    <strong>Name</strong>
                  </td>
                  <td className="nameInput">
                    <span>{editInvoice?.name || "N/A"}</span>
                  </td>
                  <td className="poNoLabel">
                    <strong>P.O No</strong>
                  </td>
                  <td className="poNoInput">
                    <span>{editInvoice?.poNo || "N/A"}</span>
                  </td>
                  <td className="datedLabel">
                    <strong>Dated</strong>
                  </td>
                  <td className="datedInput">
                    <span>{editInvoice?.dated || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="addressLabel" rowSpan="2">
                    <strong>Address</strong>
                  </td>
                  <td className="addressBlock" rowSpan="2">
                    <span>{editInvoice?.address || "N/A"}</span>
                  </td>
                  <td className="deliveryChallanNoLabel">
                    <strong>Delivery Challan No</strong>
                  </td>
                  <td className="deliveryChallanNoInput">
                    <span>{editInvoice?.deliveryChallanNo || "N/A"}</span>
                  </td>
                  <td className="deliveryNotedateLabel">
                    <strong>Delivery Note date</strong>
                  </td>
                  <td className="deliveryNotedateInput">
                    <span>{editInvoice?.deliveryNoteDate || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="deliveryNotedateLabel">
                    <strong>Delivery Note</strong>
                  </td>
                  <td className="deliveryNoteInput">
                    <span>{editInvoice?.deliveryNote || "N/A"}</span>
                  </td>
                  <td className="modeOfPaymentLabel">
                    <strong>Mode of Payment</strong>
                  </td>
                  <td className="modeOfPaymentselect">
                    <span>{editInvoice?.modeOfPayment || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="contactLabel">
                    <strong>Contact</strong>
                  </td>
                  <td className="contactInput">
                    <span>{editInvoice?.contact || "N/A"}</span>
                  </td>
                  <td className="dispacthedLabel">
                    <strong>Dispacthed Through</strong>
                  </td>
                  <td className="dispacthedSelect">
                    <span>{editInvoice?.dispatchedThrough || "N/A"}</span>
                  </td>
                  <td className="proformaLabel">
                    <strong>PROFORMA (REF)</strong>
                  </td>
                  <td className="proformaInput">
                    <span>{editInvoice?.proformaRef || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="placeOfSupplyLabel">
                    <strong>Place of Supply</strong>
                  </td>
                  <td className="placeOfSupplyInput">
                    <span>{editInvoice?.placeOfSupply || "N/A"}</span>
                  </td>
                  <td className="termOfDeliveryLabel">
                    <strong>Terms of Delivery</strong>
                  </td>
                  <td className="termOfDeliveryInput">
                    <span>{editInvoice?.termsOfDelivery || "N/A"}</span>
                  </td>
                  <td className="ewayBillNoLabel">
                    <strong>E-way Bill No</strong>
                  </td>
                  <td className="ewayBillNoInput">
                    <span>{editInvoice?.ewayBillNo || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="gstinLabel">
                    <strong>GSTIN</strong>
                  </td>
                  <td className="gstinInput">
                    <span>{editInvoice?.gstin || "N/A"}</span>
                  </td>
                  <td className="custIdLabel">
                    <strong>CUST ID</strong>
                  </td>
                  <td className="custIdInput">
                    <span>{editInvoice?.custId || "N/A"}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-section">
            <table>
              <thead>
                <tr className="headerRow">
                  <th className="slNoHeader">SL. No</th>
                  <th className="descriptionOfGoodsHeader">
                    Description of Goods
                  </th>
                  <th className="hsnSacHeader">HSN/SAC</th>
                  <th className="quantityHeader">Quantity</th>
                  <th className="rateHeader">Rate</th>
                  <th className="perHeader">Per</th>
                  <th className="discHeader">Disc.%</th>
                  <th className="amountHeader">Amount</th>
                </tr>
              </thead>
              {
                <tbody>
                  {editInvoice?.rows && editInvoice.rows.length > 0 ? (
                    editInvoice.rows.map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="descriptionOptions">
                            {row.descriptionOptions || "N/A"}
                          </span>
                          <span className="description">
                            {row.description || "N/A"}
                          </span>
                          <span className="typeOptions">
                            {row.typeOptions || "N/A"}
                          </span>
                          <span
                            className="descriptiondriveOptions"
                            style={{
                              display: row.hideDescriptionDriveOptions
                                ? "none"
                                : "block",
                            }}
                          >
                            {row.descriptiondriveOptions || "N/A"}
                          </span>
                          <span
                            className="driveOptionValues"
                            style={{
                              display: row.hideDriveOptionValues
                                ? "none"
                                : "block",
                            }}
                          >
                            {row.driveOptionValues || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="hsnSac">{row.hsnSac || "N/A"}</span>
                        </td>
                        <td>
                          <span className="quantity">
                            {row.quantity || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="rate">{row.rate || "N/A"}</span>
                        </td>
                        <td>
                          <span className="per">{row.per || "N/A"}</span>
                        </td>
                        <td>
                          <span className="discount">
                            {row.discount || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="amount">{`₹   ${row.amount || 0}`}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No rows available</td>
                    </tr>
                  )}

                  {editInvoice?.rows && editInvoice.rows.length < 5 && (
                    <tr className="emptyRow_columns">
                      <td colSpan="9"></td>
                    </tr>
                  )}
                  <tr className="totalRow_columns">
                    <td></td>
                    <td></td>
                    <td>TOTAL</td>
                    <td>{totalQuantity} No's</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              }
            </table>
          </div>
          <div>
            <div className="total-section">
              <table className="blockOne">
                <tbody>
                  <tr className="blockOneTrOne">
                    <td>Amount Chargeable (In words)</td>
                  </tr>
                  <tr className="blockOneTrSec">
                    <td>
                      {editInvoice?.grandTotal
                        ? toIndianWords(editInvoice.grandTotal)
                            .toUpperCase()
                            .concat(" ONLY")
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="blockSec">
                <caption className="total-section-header">E. & O.E</caption>
                <tbody>
                  <tr>
                    <td>
                      <strong>NET TOTAL</strong>
                    </td>
                    <td>
                      ₹<span>{editInvoice?.total || "-"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>CGST (9%)</strong>
                    </td>
                    <td>
                      ₹{" "}
                      <span>
                        {" "}
                        {isNaN((9 / 100) * editInvoice?.total)
                          ? "0.00"
                          : parseFloat(
                              ((9 / 100) * editInvoice?.total).toFixed(2),
                            )}{" "}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>SGST (9%)</strong>
                    </td>
                    <td>
                      {" "}
                      ₹{" "}
                      <span>
                        {" "}
                        {isNaN((9 / 100) * editInvoice?.total)
                          ? "0.00"
                          : parseFloat(
                              ((9 / 100) * editInvoice?.total).toFixed(2),
                            )}{" "}
                      </span>{" "}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>IGST (18%)</strong>
                    </td>
                    <td>
                      ₹
                      <span>
                        {isNaN((18 / 100) * editInvoice?.total)
                          ? "0.00"
                          : parseFloat(
                              ((18 / 100) * editInvoice?.total).toFixed(2),
                            )}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Freight & Packing</strong>
                    </td>
                    <td>
                      ₹<span>{editInvoice?.freightPacking || "-"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Round Off</strong>
                    </td>
                    <td>
                      ₹<span>{editInvoice?.roundOff || "-"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>GRAND TOTAL</strong>
                    </td>
                    <td>
                      ₹<span>{editInvoice?.grandTotal || "-"}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="tax-section">
              <table>
                <thead>
                  <tr className="taxHeader">
                    <th>HSN/SAC</th>
                    <th>Taxable Value</th>
                    {editInvoice &&
                    editInvoice.gstin &&
                    typeof editInvoice.gstin === "string" &&
                    editInvoice.gstin.startsWith("29") ? (
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
                    <td className="hsn_sac">{editInvoice?.hsnSac}</td>
                    <td className="taxable_value">₹{editInvoice?.total}</td>
                    {editInvoice &&
                    editInvoice.gstin &&
                    typeof editInvoice.gstin === "string" &&
                    editInvoice.gstin.startsWith("29") ? (
                      <>
                        <td className="cgst">
                          ₹
                          {isNaN((9 / 100) * editInvoice?.total)
                            ? "0.00"
                            : parseFloat(
                                ((9 / 100) * editInvoice?.total).toFixed(2),
                              )}{" "}
                        </td>
                        <td className="sgst">
                          ₹
                          {isNaN((9 / 100) * editInvoice?.total)
                            ? "0.00"
                            : parseFloat(
                                ((9 / 100) * editInvoice?.total).toFixed(2),
                              )}{" "}
                        </td>
                      </>
                    ) : (
                      <td className="igst">
                        ₹
                        {isNaN((18 / 100) * editInvoice?.total)
                          ? "0.00"
                          : parseFloat(
                              ((18 / 100) * editInvoice?.total).toFixed(2),
                            )}{" "}
                      </td>
                    )}
                    <td className="total_tax_amount">
                      ₹{editInvoice?.totalTaxAmount}
                    </td>
                  </tr>
                  <tr className="taxColEmpty_value">
                    <td className="empty_value"></td>
                    <td className="empty_value"></td>
                    {editInvoice &&
                    editInvoice.gstin &&
                    typeof editInvoice.gstin === "string" &&
                    editInvoice.gstin.startsWith("29") ? (
                      <>
                        <td className="empty_value"></td>
                        <td className="empty_value"></td>
                      </>
                    ) : (
                      <td className="empty_value"></td>
                    )}
                    <td className="empty_value"></td>
                  </tr>
                </tbody>
              </table>
              <table>
                <tbody>
                  <tr className="taxInWords">
                    <td className="taxInWordsLabel">Tax amount (In words)</td>
                    <td className="taxInWordsValue">
                      {!isNaN(parseFloat(editInvoice?.totalTaxAmount))
                        ? `${toIndianWords(parseInt(rupees)).toUpperCase()} RUPEES AND ${toIndianWords(parseInt(paise)).toUpperCase()} PAISE ONLY`
                        : "-"}{" "}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="paymentDetailsBlock">
            <h3>
              Invoice Payment Details with current Outstanding Amount : ₹{" "}
              {remainingBalance}
            </h3>
            <form onSubmit={handleSubmit}>
              {/* Table Header */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th className="sINoTH">SI.No</th>
                    <th className="sINoTH">Date of Payment</th>
                    <th>Payment Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {existingRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.installmentSiNo}</td>
                      <td>{row.date}</td>
                      <td>{row.paymentAmount}</td>
                    </tr>
                  ))}

                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          name="installmentSiNo"
                          value={row.installmentSiNo}
                          onChange={(e) => handleChange(e, index)}
                          placeholder="Enter SI No"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          name="date"
                          value={row.date}
                          onChange={(e) => handleChange(e, index)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="paymentAmount"
                          value={row.paymentAmount}
                          onChange={(e) => handleChange(e, index)}
                          placeholder="Enter payment amount"
                          required
                        />
                      </td>
                      <td className="actionBlock">
                        <button type="button" onClick={handleAddRow}>
                          <FaPlus />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Submit Button */}
              {remainingBalance > 0 && (
                <div className="paymentSubmitButton">
                  <button type="submit">Submit</button>
                </div>
              )}
            </form>
          </div>
          <div className="main-footer">
            <p>
              **THIS IS COMPUTER GENERATED INVOICE. PLEASE DO WRITE OR CALL US
              ON QUERIES**
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default EditInvoiceForm;
