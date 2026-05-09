import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import DynamicTable from "./DynamicItemCreationPage";
import TotalSection from "./TotalSection"; // Import the TotalSection component
import TaxSection from "./TaxSection";
import BankDetails from "./BankDetails";

import "./InvoiceForm.css"; 
import "./InvoicePage.css";
import Header from "../../components/layout/Header"; // Import Header
import Footer from "../../components/layout/Footer"; // Import Footer
import { ToastContainer, toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

const InvoiceForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef(null);
  const dispatchSelectRef = useRef(null);
  const dateInputRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const tableSectionRef = useRef(null);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);
    const saveButton = document.getElementById("saveInvoiceButton");
    const addressForBill = document.getElementById("addressForBill");
    const addressForPdf = document.getElementById("addressForPdf");
    //const spacetechBlock = document.getElementsByClassName("spacetech");

    // Check if the save button exists before hiding it
    if (saveButton) {
      //saveButton.style.display = "none";
      //addressForBill.style.display = "none";
      //addressForPdf.style.display = "block";
      //spacetechBlock.style.height = "70px";
      //document.getElementsByClassName('spacetech')[0].style.height = '70px';
      //document.getElementsByClassName("contactInput")[0].style.borderBottom ="2px solid #000";
      //document.getElementsByClassName("placeOfSupplyInput")[0].style.borderBottom = "2px solid #000";
      //document.getElementsByClassName("poNoInput")[0].style.borderBottom = "2px solid #000";
      //document.getElementsByClassName("deliveryChallanNoInput")[0].style.borderBottom = "2px solid #000";
    } else {
      console.warn("Save button not found.");
    }

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // General margin
      const headerHeight = 5; // Header height
      const footerHeight = 5; // Footer height
      const contentHeight =
        pageHeight - headerHeight - footerHeight - 2 * margin;

      const titles = [
        "(Original For Recipient)",
        "(Duplicate For Transporter)",
        "(Triplicate For Supplier)",
      ];

      for (let i = 0; i < titles.length; i++) {
        // Add header
        const titleElement = document.getElementById("invoiceReference");
        if (titleElement) {
          titleElement.textContent = titles[i];
        }

        // Generate content
        const element = document.getElementById("content");
        if (!element) {
          console.error("Element with ID 'content' not found.");
          setIsLoading(false);
          return;
        }

        // Convert the element to canvas using html2canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Increase scale for better quality
          useCORS: true, // Ensure cross-origin images are handled correctly
          allowTaint: true, // Allow cross-origin images
          backgroundColor: 'white', // Set background color
          logging: false, // Disable console logging for performance
        });
        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        // Calculate vertical alignment
        const contentY = margin + headerHeight;
        if (imgHeight > contentHeight) {
          console.warn("Content height exceeds available space; scaling down.");
        }

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          contentY,
          imgWidth,
          Math.min(imgHeight, contentHeight),
          "",
          "SLOW",
        );

        // Add footer
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i + 1} of ${titles.length}`,
          pageWidth / 2,
          pageHeight - margin,
          { align: "center" },
        );

        // Add a new page except for the last iteration
        if (i < titles.length - 1) {
          pdf.addPage();
        }
      }

      // Compression: Save PDF with a reduced file size
      const compressedPdf = pdf.output("blob");

      // Use FileSaver.js to save the compressed file
      saveAs(
        compressedPdf,
        `${invoiceDetails.invoiceNo}_Full_Invoice_Compressed.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsLoading(false);
      if (saveButton) {
        saveButton.style.display = "block";
      } else {
        console.warn("Save button not found when resetting visibility.");
      }
    }
  }, []);

  const [formErrors, setFormErrors] = useState({});

  // State management for form inputs
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceType: "INVOICE",
    invoiceNo: "",
    date: "",
    dated: "",
    name: "",
    poNo: "",
    address: "",
    deliveryChallanNo: "",
    deliveryNoteDate: "",
    deliveryNote: "",
    modeOfPayment: "",
    contact: "",
    dispatchedThrough: "",
    proformaRef: "",
    placeOfSupply: "",
    termsOfDelivery: "",
    ewayBillNo: "",
    gstin: "",
    custId: "",
    total: "",
    cgst: "",
    sgst: "",
    igst: "",
    grandTotal: "",
    hsnSac: "",
    taxableValue: "",
    cgstAmount: "",
    sgstAmount: "",
    igstAmount: "",
    totalTaxAmount: "",
    freightPacking: "",
    roundOff: "",
    rows: [
      {
        slNo: 1,
        descriptionOptions: "",
        description: "",
        hsnSac: "",
        quantity: "",
        rate: "",
        per: "No's",
        discount: "",
        amount: "",
      },
    ],
  });

  const [date, setDate] = useState("");
  const [gstin, setGstin] = useState("");
  const [showCgstSgst, setShowCgstSgst] = useState(false);
  const [addressInfo, setAddressInfo] = useState([]); // Initialize as an empty array

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/getConsigneeDetails",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
              Origin: window.location.origin,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch consignee details");
        }

        const addressInfo = await response.json();
        setAddressInfo(addressInfo); // Set addressInfo here

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0"); // Ensure two digits
        const startYear = month >= 4 ? year : year - 1;
        console.log('year ==',year ,'== month ==', month , '== startYear ==', startYear);
        const currentFinancialYear = month >= 4 ? String(startYear).slice(-2) + "-" + String(startYear + 1).slice(-2)
            : String(year - 1).slice(-2) + "-" + String(year).slice(-2);

        const day = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        setInvoiceDetails((prevDetails) => ({
          ...prevDetails,
          invoiceNo: `SSP/${currentFinancialYear}/`,
          //date: formattedDate,
        }));

        //setDate(formattedDate);
      } catch (error) {
        console.error("Error fetching consignee details:", error);
      }
    };

    fetchData(); // Call the async function immediately
  }, []); // Empty dependency array means this effect runs only once after the component mounts

  const [rows, setRows] = useState([
    {
      slNo: 1,
      descriptionOptions: "",
      description: "",
      hsnSac: "",
      quantity: "",
      rate: "",
      per: "",
      discount: "",
      amount: "",
    },
  ]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update grandTotal if the field being updated is freightPacking
    if (name === "freightPacking") {
      const freightPackingValue = parseFloat(value) || 0; // Safely parse freightPacking value
      //const freightPackingValue = value === '' ? 0 : parseFloat(value);
      calculateTotals(invoiceDetails.total, freightPackingValue);
    }

    // Update invoice details with the new value and grandTotal
    setInvoiceDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const sumAmounts = (items) => {
    const total = items.reduce((sum, item) => {
      // Remove commas from the amount string and parse as float
      const amount = parseFloat(item.amount.replace(/,/g, '')) || 0;
      return sum + amount;
    }, 0);
    return total.toFixed(2);
  };

  const formatIndianNumber = (num) => {
    const [integerPart, decimalPart] = num.toString().split('.');
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
    return decimalPart ? formatted + '.' + decimalPart : formatted;
  };

  // Bind rows update to invoiceDetails state
  const handleRowsChange = async (updatedRows) => {
    console.log('invoiceDetails updatedRows ============', updatedRows);
    const netTotal = sumAmounts(updatedRows);
    console.log('invoiceDetails ============', netTotal);
    const allHSNSAC = updatedRows.map((row) => row.hsnSac).join(", ");
    const uniqueHSNSAC = [
      ...new Set(allHSNSAC.split(", ").map((item) => item.trim())),
    ].join(", ");

    setInvoiceDetails((prevDetails) => ({
      ...prevDetails,
      rows: updatedRows,
      total: netTotal,
      hsnSac: uniqueHSNSAC,
    }));

    calculateTotals(netTotal, invoiceDetails.freightPacking || 0);
  };

  const calculateTaxes = (netTotal, hsnSac) => {
    const cgstAmount = parseFloat( ((9 / 100) * netTotal).toFixed(2) );
    const sgstAmount = parseFloat( ((9 / 100) * netTotal).toFixed(2) );
    const igstAmount = parseFloat( ((18 / 100) * netTotal).toFixed(2) );

    setInvoiceDetails((prevState) => ({
      ...prevState,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
    }));

    return gstin.startsWith("29") ? cgstAmount + sgstAmount : igstAmount;
  };

  // Calculate totals (you can expand this to handle more complex logic)
  const calculateTotals = (netTotal, freightPacking) => {
    const totalTaxAmount = calculateTaxes(netTotal, invoiceDetails.hsnSac);

    // Calculate the rounded value (including freight/packing)
    const totalAmt =
      parseFloat(netTotal) +
      parseFloat(totalTaxAmount) +
      (parseFloat(freightPacking) || 0);
    const roundedValue = Math.round(totalAmt);
    const roundOffValue = parseFloat((roundedValue - totalAmt).toFixed(2));
    const grandTotal = parseFloat((totalAmt + roundOffValue).toFixed(2));

    setInvoiceDetails((prevState) => ({
      ...prevState,
      totalTaxAmount: totalTaxAmount.toFixed(2),
      roundOff: roundOffValue.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    }));
  };

  const validateForm = () => {
    const errors = {};
    // Basic validation for each field
    if (!invoiceDetails.invoiceNo)
      errors.invoiceNo = "Invoice Number is required.";
    if (!invoiceDetails.date) errors.date = "Date is required.";
    //if (!invoiceDetails.dated) errors.dated = "Dated is required.";
    if (!invoiceDetails.name) errors.name = "Client Name is required.";
    if (!invoiceDetails.dispatchedThrough)
      errors.dispatchedThrough = "Dispatched Through is required.";
    //if (!invoiceDetails.termsOfDelivery) errors.termsOfDelivery = "Terms Of Delivery is required.";

    //if (!invoiceDetails.poNo) errors.poNo = "P.O. Number is required.";
    //if (!invoiceDetails.deliveryChallanNo) errors.deliveryChallanNo = "Delivery Challan Number is required.";
    //if (!invoiceDetails.deliveryNote) errors.deliveryNote = "Delivery Note is required.";
    if (!invoiceDetails.modeOfPayment)
      errors.modeOfPayment = "Mode of Payment is required.";
    if (!selectedData.GST)
      errors.gstin = "GSTIN is required for the selected client.";
    //if (!invoiceDetails.deliveryNoteDate) errors.deliveryNoteDate = "Delivery Note Date is required.";

    // Additional checks
    if (invoiceDetails.rows && invoiceDetails.rows.length === 0)
      errors.rows = "At least one item is required in the rows.";
    if (
      invoiceDetails.rows &&
      invoiceDetails.rows.some(
        (row) => !row.description || !row.quantity || !row.rate,
      )
    ) {
      errors.rows = "Each row must have a description, quantity, and rate.";
    }

    console.log("errors ============", errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    //console.log('invoiceDetails ======================', invoiceDetails)

    const response = await fetch(`https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ ...invoiceDetails }),
      },
    );

    const result = await response.json();
    // Check if response is successful
    if (!response.ok) {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.error("Failed to submit data");
      }
    } else {
      console.log("Response from server:", result);

      // Show success notification
      toast.success("Invoice successfully inserted to DB!");
      setFormErrors({});

      // Proceed with form submission or PDF generation
      console.log("Form is valid, proceed with submission or PDF generation.");

      nameInputRef.current?.classList.remove("error-border");
      dispatchSelectRef.current?.classList.remove("error-border");
      dateInputRef.current?.classList.remove("error-border");
      paymentSelectRef.current?.classList.remove("error-border");
      tableSectionRef.current?.classList.remove("error-border");

      handleDownload();
    }
  };

  const [search, setSearch] = useState(""); // For search input
  const [suggestions, setSuggestions] = useState([]); // Filtered suggestions
  const [selectedData, setSelectedData] = useState({
    CLIENTS: "",
    CONTACT_NAME: "",
    ADDRESS_LINE_1: "",
    PLACE_OF_SUPPLY: "",
    GST: "",
    CUS_ID: "",
  });

  // Handle search input and filter suggestions
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Check if addressInfo is defined and is an array
    if (Array.isArray(addressInfo) && value.length > 0) {
      console.log("addressInfo ======================", addressInfo);

      const filteredData = addressInfo.filter(
        (item) =>
          item.status === "active" &&
          item.client &&
          typeof item.client === "string" &&
          item.client.toLowerCase().includes(value.toLowerCase()),
      );
      console.log("filteredData ========================", filteredData);
      setSuggestions(filteredData);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selection from suggestions
  const handleSelect = (item) => {
    // Check if all necessary properties exist and are valid
    if (!item || !item.client) {
      console.error("Invalid item selected:", item);
      toast.error("Invalid item selected:", item);
      return; // Early exit if item is invalid
    }

    // Now safe to proceed with the rest of your logic
    setSelectedData({
      CLIENTS: item.client,
      CONTACT_NAME: item.contactName,
      ADDRESS_LINE_1: `${item.addressLine1}\n${item.addressLine2}`,
      PLACE_OF_SUPPLY: item.placeOfSupply,
      GST: item.gstin,
      CUS_ID: item.custId,
    });

    if (item.gstin && typeof item.gstin === "string") {
      setShowCgstSgst(item.gstin.startsWith("29"));
    }

    setSearch(item.client);
    setInvoiceDetails((prevState) => ({
      ...prevState,
      name: item.client,
      address: `${item.addressLine1}\n${item.addressLine2}`,
      placeOfSupply: item.placeOfSupply,
      contact: item.contactNumber,
      custId: item.custId,
      gstin: item.gstin,
    }));

    setSuggestions([]); // Clear suggestions
  };

  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  const handleClientDropdownChange = (e) => {
  const selectedId = e.target.value?.trim();

  if (!selectedId || !Array.isArray(addressInfo)) { setSelectedClientDetail(null); return; }

  const selectedData = addressInfo.find( item => String(item.custId).trim() === selectedId );

  console.log("Selected ID:", selectedId);
  console.log("Matched Object:", selectedData);

  setSelectedClientDetail(selectedData || null);
};


  return (
    <>
      {/* Header Section */}
      <Header />
      <div className="invoice">
        {/* Toastify container for displaying notifications */}
        <ToastContainer />
        { /*isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Generating PDF...</p>
          </div>
        ) */}
        


<div className="form-group_customer">
  <div className="info-box">
    <div className="info-header"> Add Invoice Details </div>
    <div class="invoice-container"></div>


    <div class="container">
      <div class="progress-container">
        <div class="progress-steps">
          <div class="progress-line" id="progressLine"></div>
          <div class="step active" data-step="1">
              <div class="step-circle">1</div>
              <div class="step-label">Client Details</div>
          </div>
          <div class="step" data-step="2">
              <div class="step-circle">2</div>
              <div class="step-label">Invoice Details</div>
          </div>
          <div class="step" data-step="3">
              <div class="step-circle">3</div>
              <div class="step-label">Product Details</div>
          </div>
          <div class="step" data-step="4">
              <div class="step-circle">4</div>
              <div class="step-label">Invoice Summary</div>
          </div>
        </div>
      </div>

      <div class="form-content">
            {/*<!-- Step 1 -->*/}
        <div class="form-step active" data-step="1">
          {/*<h2>Let's start with basics</h2>
          <p class="step-description">Tell us a bit about yourself so we can personalize your experience.</p>
                
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="fullName" placeholder="John Doe" required>
                </div>
                
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="email" placeholder="john@example.com" required>
                </div>
                
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="phone" placeholder="+1 (555) 000-0000">
                </div> */}

                <div className="select-wrapper">
                  <label>Select Cust Id</label>
                      <select className="select-dropdown" onChange={handleClientDropdownChange}>
                        <option value="">Select Customer Id</option>
                        {addressInfo.map(item => (
                          <option key={item.custId} value={item.custId}>
                            {item.custId}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedClientDetail && (
                    <section class="invoice-section client">
                      <div class="section-title">Client Details</div>
                      <div className="info-grid">
                        { selectedClientDetail.contactName && (
                          <div className="info-item">
                            <label>Contact Name</label>
                            <span>{selectedClientDetail.contactName}</span>
                          </div>
                        )}

                        { selectedClientDetail.gstin && (
                          <div className="info-item">
                            <label>GSTIN</label>
                            <span>{selectedClientDetail.gstin}</span>
                          </div>
                        )}

                        { selectedClientDetail.placeOfSupply && (
                          <div className="info-item">
                            <label>Place of Supply</label>
                            <span>{selectedClientDetail.placeOfSupply}</span>
                          </div>
                        )}

                        { selectedClientDetail.contactNumber && (
                          <div className="info-item">
                            <label>Contact Number</label>
                            <span>{selectedClientDetail.contactNumber}</span>
                          </div>
                        )}

                        { selectedClientDetail.email && (
                          <div className="info-item">
                            <label>Email</label>
                            <span>{selectedClientDetail.email}</span>
                          </div>
                        )}

                        { selectedClientDetail.client && (
                          <div className="info-item">
                            <label>Client</label>
                            <span>{selectedClientDetail.client}</span>
                          </div>
                        )}

                        { selectedClientDetail.addressLine1 && (
                          <div className="info-item">
                            <label>Address Line 1</label>
                            <span>{selectedClientDetail.addressLine1}</span>
                          </div>
                        )}

                        { selectedClientDetail.addressLine2 && (
                          <div className="info-item">
                            <label>Address Line 2</label>
                            <span>{selectedClientDetail.addressLine2}</span>
                          </div>
                        )}

                        
                      </div>
                    </section>
                    )}

          <div class="button-group">
              <button class="btn-primary btn-next" onclick="nextStep()">Continue →</button>
          </div>
        </div>

            {/*<!-- Step 2 -->*/}
            <div class="form-step" data-step="2">
                <h2>Share your story</h2>
                <p class="step-description">Help us understand your needs and preferences better.</p>
                
                {/*<div class="form-group">
                    <label>Company Name</label>
                    <input type="text" id="company" placeholder="Acme Inc.">
                </div>
                
                <div class="form-group">
                    <label>Role</label>
                    <select id="role">
                        <option value="">Select your role</option>
                        <option value="designer">Designer</option>
                        <option value="developer">Developer</option>
                        <option value="manager">Manager</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Tell us more</label>
                    <textarea id="message" placeholder="What brings you here today?"></textarea>
                </div>*/}

                <section class="invoice-section header">
                      <div class="section-title">Invoice Details</div>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Invoice No</label>
                          <input type="text" name="invoiceNo" value={invoiceDetails.invoiceNo} 
                            onChange={handleInputChange} className={formErrors.invoiceNo ? "error-border" : ""} />
                        </div>

                        <div className="info-item">
                          <label>P.O No</label>
                          <input type="text" name="poNo" value={invoiceDetails.poNo || ""} 
                          onChange={handleInputChange} className={formErrors.poNo ? "error-border" : ""} />
                        </div>

                        <div className="info-item">
                          <label>Delivery Challan No</label>
                          <input type="text" name="deliveryChallanNo" value={invoiceDetails.deliveryChallanNo || ""}
                        onChange={handleInputChange} className={formErrors.deliveryChallanNo ? "error-border" : ""} />
                        </div>
                    
                        <div className="info-item">
                          <label>Delivery Note</label>
                          <input type="text" name="deliveryNote" value={invoiceDetails.deliveryNote || ""}
                        onChange={handleInputChange} className={formErrors.deliveryNote ? "error-border" : ""} />
                        </div>
                    
                        <div className="info-item">
                          <label>Date</label>
                          <input type="date" name="date" value={invoiceDetails.date || ""}
                            onChange={handleInputChange} ref={dateInputRef} className={formErrors.date ? "error-border" : ""} />
                        </div>

                        <div className="info-item">
                          <label>Delivery Note date</label>
                          <input type="date" name="deliveryNoteDate" value={invoiceDetails.deliveryNoteDate || ""}
                          onChange={handleInputChange} className={formErrors.deliveryNoteDate ? "error-border" : ""} />
                        </div>

                        <div className="info-item">
                          <label>Mode of Payment</label>
                          <select name="modeOfPayment"
                            value={invoiceDetails.modeOfPayment || ""} onChange={handleInputChange} 
                            ref={paymentSelectRef} className={formErrors.modeOfPayment ? "error-border" : ""} >
                            <option value="" disabled>{" "}Select an option{" "}</option>
                            <option value="ADVANCE PAYMENT">ADVANCE PAYMENT</option>
                            <option value="IMMEDEATE BASIS">IMMEDEATE BASIS</option>
                            <option value="15 DAYS">15 DAYS</option>
                            <option value="30 DAYS">30 DAYS</option>
                            <option value="60 DAYS">60 DAYS</option>
                          </select>
                        </div>

                        <div className="info-item">
                          <label>Dispacthed Through</label>
                          <select id="dispactchOptions" name="dispatchedThrough" value={invoiceDetails.dispatchedThrough || ""} onChange={handleInputChange}
                        ref={dispatchSelectRef} className={formErrors.dispatchedThrough ? "error-border" : ""} >
                            <option value="" disabled>{" "}Select an option{" "}</option>
                            <option value="BY HAND">BY HAND</option>
                            <option value="DTDC - SPEED">DTDC - SPEED</option>
                            <option value="DTDC">DTDC</option>
                            <option value="PORTER">PORTER</option>
                            <option value="TRANSPORTS">TRANSPORTS</option>
                            <option value="TIRUPATI COURIER">TIRUPATI COURIER</option>
                            <option value="ANJANI">ANJANI</option>
                          </select>
                        </div>

                        <div className="info-item">
                          <label>PROFORMA (REF)</label>
                          <input type="text" name="proformaRef" value={invoiceDetails.proformaRef || ""}
                          onChange={handleInputChange} className={formErrors.proformaRef ? "error-border" : ""} />
                        </div>
                    
                        <div className="info-item">
                          <label>Terms of Delivery</label>
                          <input type="text" name="termsOfDelivery" value={invoiceDetails.termsOfDelivery || ""}
                        onChange={handleInputChange} className={formErrors.termsOfDelivery ? "error-border" : "" } />
                        </div>

                        <div className="info-item">
                          <label>E-way Bill No</label>
                          <input type="text" name="ewayBillNo" value={invoiceDetails.ewayBillNo || ""}
                        onChange={handleInputChange} className={formErrors.ewayBillNo ? "error-border" : ""} />
                        </div>
            
                        <div className="info-item">
                            <label>Dated</label>
                            <input type="date" name="dated" value={invoiceDetails.dated || ""} 
                          onChange={handleInputChange} className={formErrors.dated ? "error-border" : ""} />
                        </div> 
                      </div>
                    </section>

                <div class="button-group">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-next" onclick="nextStep()">Continue →</button>
                </div>
            </div>

            {/*<!-- Step 3 -->*/}
            <div class="form-step" data-step="3">
                <h2>Upload your files</h2>
                <p class="step-description">Share any relevant documents, images, or files with us.</p>
                
                {/*<div class="file-upload-area" id="fileUploadArea">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">Drag & drop files here</div>
                    <div class="upload-subtext">or click to browse • Max 10MB per file</div>
                    <input type="file" id="fileInput" class="file-input" multiple accept="">
                </div>

                <div class="file-list" id="fileList"></div>*/}
                
                <section class="invoice-section product-entry">
                  <DynamicTable rows={invoiceDetails.rows} setRows={handleRowsChange} />
                </section>

                <div class="button-group">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-next" onclick="nextStep()">Continue →</button>
                </div>
            </div>

            {/*<!-- Step 4 -->*/}
            <div class="form-step" data-step="4">
                <h2>Review & submit</h2>
                <p class="step-description">Please review your information before submitting.</p>
                
                {/*<div id="reviewContent"></div>*/}

                <section class="invoice-section product-list">
                  <div class="section-title">Invoice Summary </div>
                  <TotalSection invoiceDetails={invoiceDetails} handleInputChange={handleInputChange} showCgstSgst={showCgstSgst} />  
                </section>

                <div class="button-group">
                    <button class="btn-prev" onclick="prevStep()">← Back</button>
                    <button class="btn-next" onclick="handleSubmit()">Submit ✓</button>
                </div>
            </div>

            {/*<!-- Step 5 -->
            <div class="form-step" data-step="5">
                <div class="success-message">
                    <div class="success-icon">✓</div>
                    <h2 class="success-title">All done!</h2>
                    <p class="success-text">Thank you for your submission. We'll be in touch soon.</p>
                </div>
            </div>*/}
        </div>
    </div>








        
              
                    
                      
                    

                    

                    

                    
                  </div>
                </div>
              </div>

             


      
      {/* Footer Section */}
      <Footer />
    </>
  );
};

export default InvoiceForm;
