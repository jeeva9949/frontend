import React from "react";
import DynamicTable from "./DynamicItemCreationPage";

const invoiceFieldRows = [
  ["invoiceNo", "Invoice No", "text"],
  ["date", "Date", "date"],
  ["poNo", "P.O No", "text"],
  ["dated", "Dated", "date"],
  ["deliveryChallanNo", "Delivery Challan No", "text"],
  ["deliveryNoteDate", "Delivery Note Date", "date"],
  ["deliveryNote", "Delivery Note", "text"],
  ["termsOfDelivery", "Terms of Delivery", "text"],
  ["proformaRef", "Proforma (Ref)", "text"],
  ["ewayBillNo", "E-way Bill No", "text"],
];

const paymentOptions = [
  "ADVANCE PAYMENT",
  "IMMEDEATE BASIS",
  "15 DAYS",
  "30 DAYS",
  "60 DAYS",
];

const dispatchOptions = [
  "BY HAND",
  "DTDC - SPEED",
  "DTDC",
  "PORTER",
  "TRANSPORTS",
  "THE PROFESSIONAL",
  "TIRUPATI COURIER",
  "ANJANI",
];

const InvoicePreviewModalContent = ({
  addressInfo,
  invoiceDetails,
  isEditMode,
  previewClientDetail,
  onClientChange,
  onInputChange,
  onRowsChange,
}) => {
  return (
    <div className="invoice-preview-content">
      <section className="modal-section">
        <div className="modal-section-title">1. Client Details</div>
        <div className="modal-grid modal-grid-6">
          <div className="modal-field">
            <label>Select Cust Id</label>
            <select
              value={invoiceDetails.custId || ""}
              onChange={onClientChange}
              disabled={!isEditMode}
            >
              <option value="">Select Customer Id</option>
              {addressInfo.map((item) => (
                <option key={item.custId} value={item.custId}>
                  {item.custId}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>Contact Name</label>
            <input value={previewClientDetail?.contactName || ""} readOnly />
          </div>
          <div className="modal-field">
            <label>GSTIN</label>
            <input
              name="gstin"
              value={invoiceDetails.gstin || ""}
              onChange={onInputChange}
              readOnly={!isEditMode}
            />
          </div>
          <div className="modal-field">
            <label>Place of Supply</label>
            <input
              name="placeOfSupply"
              value={invoiceDetails.placeOfSupply || ""}
              onChange={onInputChange}
              readOnly={!isEditMode}
            />
          </div>
          <div className="modal-field">
            <label>Contact Number</label>
            <input
              name="contact"
              value={invoiceDetails.contact || ""}
              onChange={onInputChange}
              readOnly={!isEditMode}
            />
          </div>
          <div className="modal-field">
            <label>Client</label>
            <input
              name="name"
              value={invoiceDetails.name || ""}
              onChange={onInputChange}
              readOnly={!isEditMode}
            />
          </div>
          <div className="modal-field modal-span-2">
            <label>Address</label>
            <textarea
              name="address"
              value={invoiceDetails.address || ""}
              onChange={onInputChange}
              readOnly={!isEditMode}
            />
          </div>
        </div>
      </section>

      <section className="modal-section">
        <div className="modal-section-title">2. Invoice Details</div>
        <div className="modal-grid modal-grid-6">
          {invoiceFieldRows.map(([name, label, type]) => (
            <div className="modal-field" key={name}>
              <label>{label}</label>
              <input
                type={type}
                name={name}
                value={invoiceDetails[name] || ""}
                onChange={onInputChange}
                readOnly={!isEditMode}
              />
            </div>
          ))}
          <div className="modal-field">
            <label>Mode of Payment</label>
            <select
              name="modeOfPayment"
              value={invoiceDetails.modeOfPayment || ""}
              onChange={onInputChange}
              disabled={!isEditMode}
            >
              <option value="">Select an option</option>
              {paymentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>Dispatched Through</label>
            <select
              name="dispatchedThrough"
              value={invoiceDetails.dispatchedThrough || ""}
              onChange={onInputChange}
              disabled={!isEditMode}
            >
              <option value="">Select an option</option>
              {dispatchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="modal-section">
        <div className="modal-section-title">3. Product Details</div>
        <DynamicTable
          rows={invoiceDetails.rows}
          setRows={onRowsChange}
          readOnly={!isEditMode}
        />
      </section>

      <section className="modal-section">
        <div className="modal-section-title">4. Financial Summary</div>
        <div className="financial-summary">
          <div>
            <span>Net Total:</span>
            <strong>Rs. {invoiceDetails.total || "0.00"}</strong>
          </div>
          <div>
            <span>
              {invoiceDetails.gstin?.startsWith("29")
                ? "CGST + SGST (18%):"
                : "IGST (18%):"}
            </span>
            <strong>Rs. {invoiceDetails.totalTaxAmount || "0.00"}</strong>
          </div>
          <div>
            <span>Freight & Packing:</span>
            <strong>Rs. {invoiceDetails.freightPacking || "0.00"}</strong>
          </div>
          <div>
            <span>Round Off:</span>
            <strong>Rs. {invoiceDetails.roundOff || "0.00"}</strong>
          </div>
          <div className="summary-grand">
            <span>Grand Total:</span>
            <strong>Rs. {invoiceDetails.grandTotal || "0.00"}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvoicePreviewModalContent;
