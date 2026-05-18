import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import DynamicTable from "./DynamicItemCreationPage";
import InvoicePricingAndBankDetails from "./InvoicePricingAndBankDetails";
import InvoicePreviewModalContent from "./InvoicePreviewModalContent";
import { PdfPage } from "./GenerateInvoicePdfPage";
import Modal from "../../components/common/Modal";

import "./InvoiceForm.css";
import "./InvoicePage.css";
import Header from "../../components/layout/Header"; // Import Header
import Footer from "../../components/layout/Footer"; // Import Footer
import { ToastContainer, toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

const invoiceSteps = [
  {
    id: 1,
    title: "Client Details",
    helper: "Select customer information",
  },
  {
    id: 2,
    title: "Invoice Details",
    helper: "Add invoice references",
  },
  {
    id: 3,
    title: "Product Details",
    helper: "Enter billed items",
  },
  {
    id: 4,
    title: "Invoice Summary",
    helper: "Review and submit",
  },
];

const EmbeddedPdfPage = typeof PdfPage === "function" ? PdfPage : null;

const InvoiceForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfInvoiceData, setPdfInvoiceData] = useState(null);
  const submitToastRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);
  const nameInputRef = useRef(null);
  const dispatchSelectRef = useRef(null);
  const dateInputRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const tableSectionRef = useRef(null);

  // START: Temporary Dev PDF View - State - Remove after CSS changes are complete
  const [isDevPdfModalOpen, setIsDevPdfModalOpen] = useState(false);

  const handleDownload = useCallback(async (detailsForDownload) => {
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
      const { jsPDF } = await import("jspdf");
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
          throw new Error("Element with ID 'content' not found.");
        }

        // Convert the element to canvas using html2canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Increase scale for better quality
          useCORS: true, // Ensure cross-origin images are handled correctly
          allowTaint: true, // Allow cross-origin images
          backgroundColor: "white", // Set background color
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
        `${detailsForDownload.invoiceNo}_Full_Invoice_Compressed.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewEditMode, setIsPreviewEditMode] = useState(false);
  const [previewDetails, setPreviewDetails] = useState(null);

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
        typeOptions: "",
        description: "",
        hsnSac: "",
        quantity: "",
        rate: "",
        per: "No's",
        discount: "",
        amount: "0.00",
        descriptiondriveOptions: "",
        driveOptionValues: "",
        hideDescriptionDriveOptions: true,
        hideDriveOptionValues: true,
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
        console.log(
          "year ==",
          year,
          "== month ==",
          month,
          "== startYear ==",
          startYear,
        );
        const currentFinancialYear =
          month >= 4
            ? String(startYear).slice(-2) +
              "-" +
              String(startYear + 1).slice(-2)
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setInvoiceDetails((prevState) => {
      const nextDetails = { ...prevState, [name]: value };
      return name === "freightPacking"
        ? buildCalculatedDetails(nextDetails, nextDetails.rows, value)
        : nextDetails;
    });
  };

  const sumAmounts = (items) => {
    const total = items.reduce((sum, item) => {
      // Remove commas from the amount string and parse as float
      const amount = parseFloat(item.amount.replace(/,/g, "")) || 0;
      return sum + amount;
    }, 0);
    return total.toFixed(2);
  };

  const formatIndianNumber = (num) => {
    const [integerPart, decimalPart] = num.toString().split(".");
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    const formatted =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
      (otherNumbers ? "," : "") +
      lastThree;
    return decimalPart ? formatted + "." + decimalPart : formatted;
  };

  const buildCalculatedDetails = (baseDetails, updatedRows, freightPacking) => {
    const nextRows = updatedRows || baseDetails.rows || [];
    const nextFreightPacking =
      freightPacking ?? baseDetails.freightPacking ?? 0;
    const netTotal = sumAmounts(nextRows);
    const hsnSac = [
      ...new Set(nextRows.map((row) => row.hsnSac).filter(Boolean)),
    ].join(", ");

    const numericTotal = parseFloat(netTotal) || 0;
    const cgstAmount = parseFloat(((9 / 100) * numericTotal).toFixed(2));
    const sgstAmount = parseFloat(((9 / 100) * numericTotal).toFixed(2));
    const igstAmount = parseFloat(((18 / 100) * numericTotal).toFixed(2));
    const totalTaxAmount = baseDetails.gstin?.startsWith("29")
      ? cgstAmount + sgstAmount
      : igstAmount;
    const totalAmt =
      numericTotal + totalTaxAmount + (parseFloat(nextFreightPacking) || 0);
    const roundedValue = Math.round(totalAmt);
    const roundOffValue = parseFloat((roundedValue - totalAmt).toFixed(2));
    const grandTotal = parseFloat((totalAmt + roundOffValue).toFixed(2));

    return {
      ...baseDetails,
      rows: nextRows,
      total: netTotal,
      hsnSac,
      freightPacking: nextFreightPacking,
      cgst: cgstAmount.toFixed(2),
      sgst: sgstAmount.toFixed(2),
      igst: igstAmount.toFixed(2),
      totalTaxAmount: totalTaxAmount.toFixed(2),
      roundOff: roundOffValue.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  // Bind rows update to invoiceDetails state
  const handleRowsChange = async (updatedRows) => {
    setInvoiceDetails((prevDetails) =>
      buildCalculatedDetails(
        prevDetails,
        updatedRows,
        prevDetails.freightPacking,
      ),
    );
  };

  const calculateTaxes = (netTotal, hsnSac) => {
    const cgstAmount = parseFloat(((9 / 100) * netTotal).toFixed(2));
    const sgstAmount = parseFloat(((9 / 100) * netTotal).toFixed(2));
    const igstAmount = parseFloat(((18 / 100) * netTotal).toFixed(2));

    setInvoiceDetails((prevState) => ({
      ...prevState,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
    }));

    return invoiceDetails.gstin?.startsWith("29")
      ? cgstAmount + sgstAmount
      : igstAmount;
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

  const validateStep = (step, details = invoiceDetails) => {
    const errors = {};

    if (step === 1) {
      if (!details.custId) errors.custId = "Customer ID is required.";
      if (!details.name) errors.name = "Client Name is required.";
      if (!details.gstin) {
        errors.gstin = "GSTIN is required for the selected client.";
      }
    }

    if (step === 2) {
      if (!details.invoiceNo) {
        errors.invoiceNo = "Invoice Number is required.";
      }
      if (!details.date) errors.date = "Date is required.";
      if (!details.modeOfPayment) {
        errors.modeOfPayment = "Mode of Payment is required.";
      }
      if (!details.dispatchedThrough) {
        errors.dispatchedThrough = "Dispatched Through is required.";
      }
    }

    if (step === 3) {
      const validRows = details.rows || [];

      if (validRows.length === 0) {
        errors.rows = "At least one item is required.";
      }

      if (
        validRows.some(
          (row) =>
            !row.descriptionOptions ||
            !row.description ||
            !row.hsnSac ||
            !row.quantity ||
            !row.rate,
        )
      ) {
        errors.rows =
          "Each item needs goods, description, HSN/SAC, quantity, and rate.";
      }
    }

    return errors;
  };

  const validateForm = (details = invoiceDetails) => {
    return invoiceSteps.reduce(
      (errors, step) => ({ ...errors, ...validateStep(step.id, details) }),
      {},
    );
  };

  const goToNextStep = () => {
    const errors = validateStep(activeStep);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill the mandatory fields before moving next.");
      return;
    }

    setFormErrors({});
    setActiveStep((currentStep) =>
      Math.min(currentStep + 1, invoiceSteps.length),
    );
  };

  const goToPreviousStep = () => {
    setFormErrors({});
    setActiveStep((currentStep) => Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const detailsToSubmit =
      isPreviewOpen && previewDetails ? previewDetails : invoiceDetails;
    const errors = validateForm(detailsToSubmit);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.custId || errors.name || errors.gstin) {
        setActiveStep(1);
      } else if (
        errors.invoiceNo ||
        errors.date ||
        errors.modeOfPayment ||
        errors.dispatchedThrough
      ) {
        setActiveStep(2);
      } else if (errors.rows) {
        setActiveStep(3);
      }
      toast.error("Please complete all mandatory fields before submitting.");
      return;
    }

    const loadingToastId = toast.loading(
      "Submitting invoice and generating PDF...",
    );
    submitToastRef.current = loadingToastId;
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/invoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
            Origin: window.location.origin,
          },
          body: JSON.stringify({ ...detailsToSubmit }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit data");
      }

      console.log("Response from server:", result);

      setFormErrors({});
      flushSync(() => {
        setInvoiceDetails(detailsToSubmit);
        setIsPreviewOpen(false);
        setIsPreviewEditMode(false);
        setPreviewDetails(null);
      });

      nameInputRef.current?.classList.remove("error-border");
      dispatchSelectRef.current?.classList.remove("error-border");
      dateInputRef.current?.classList.remove("error-border");
      paymentSelectRef.current?.classList.remove("error-border");
      tableSectionRef.current?.classList.remove("error-border");

      toast.update(loadingToastId, {
        render: "Invoice submitted. Generating PDF download...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      setPdfInvoiceData(detailsToSubmit);
    } catch (error) {
      console.error("Invoice submit/download failed:", error);
      toast.update(loadingToastId, {
        render:
          error?.message || "Failed to submit invoice or generate the PDF.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setIsLoading(false);
    }
  };

  const handlePdfDownloadComplete = ({ success, error }) => {
    setPdfInvoiceData(null);
    setIsLoading(false);

    if (!submitToastRef.current) {
      return;
    }

    toast.update(submitToastRef.current, {
      render: success
        ? "Invoice submitted and PDF downloaded."
        : error?.message || "Invoice submitted, but PDF download failed.",
      type: success ? "success" : "error",
      isLoading: false,
      autoClose: success ? 3000 : 5000,
    });
    submitToastRef.current = null;
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

    if (!selectedId || !Array.isArray(addressInfo)) {
      setSelectedClientDetail(null);
      setSelectedData({
        CLIENTS: "",
        CONTACT_NAME: "",
        ADDRESS_LINE_1: "",
        PLACE_OF_SUPPLY: "",
        GST: "",
        CUS_ID: "",
      });
      setInvoiceDetails((prevState) => ({
        ...prevState,
        name: "",
        address: "",
        placeOfSupply: "",
        contact: "",
        custId: "",
        gstin: "",
      }));
      return;
    }

    const clientDetail = addressInfo.find(
      (item) => String(item.custId).trim() === selectedId,
    );

    setSelectedClientDetail(clientDetail || null);

    if (!clientDetail) {
      return;
    }

    setSelectedData({
      CLIENTS: clientDetail.client || "",
      CONTACT_NAME: clientDetail.contactName || "",
      ADDRESS_LINE_1: `${clientDetail.addressLine1 || ""}\n${
        clientDetail.addressLine2 || ""
      }`,
      PLACE_OF_SUPPLY: clientDetail.placeOfSupply || "",
      GST: clientDetail.gstin || "",
      CUS_ID: clientDetail.custId || "",
    });

    setShowCgstSgst(Boolean(clientDetail.gstin?.startsWith("29")));
    setFormErrors((prevErrors) => {
      const { custId, name, gstin, ...remainingErrors } = prevErrors;
      return remainingErrors;
    });

    setInvoiceDetails((prevState) => {
      const nextDetails = {
        ...prevState,
        name: clientDetail.client || "",
        address: `${clientDetail.addressLine1 || ""}\n${
          clientDetail.addressLine2 || ""
        }`,
        placeOfSupply: clientDetail.placeOfSupply || "",
        contact: clientDetail.contactNumber || "",
        custId: clientDetail.custId || "",
        gstin: clientDetail.gstin || "",
      };
      return buildCalculatedDetails(
        nextDetails,
        nextDetails.rows,
        nextDetails.freightPacking,
      );
    });
  };

  const handleOpenPreview = () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please complete all mandatory fields before preview.");
      return;
    }

    setPreviewDetails(JSON.parse(JSON.stringify(invoiceDetails)));
    setIsPreviewEditMode(false);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setIsPreviewEditMode(false);
    setPreviewDetails(null);
  };

  const handlePreviewInputChange = (e) => {
    const { name, value } = e.target;

    setPreviewDetails((prevDetails) => {
      const nextDetails = { ...prevDetails, [name]: value };
      return name === "freightPacking"
        ? buildCalculatedDetails(nextDetails, nextDetails.rows, value)
        : nextDetails;
    });
  };

  const handlePreviewRowsChange = (updatedRows) => {
    setPreviewDetails((prevDetails) =>
      buildCalculatedDetails(
        prevDetails,
        updatedRows,
        prevDetails.freightPacking,
      ),
    );
  };

  const handlePreviewClientChange = (e) => {
    const selectedId = e.target.value?.trim();
    const clientDetail = addressInfo.find(
      (item) => String(item.custId).trim() === selectedId,
    );

    if (!clientDetail) {
      return;
    }

    setPreviewDetails((prevDetails) => {
      const nextDetails = {
        ...prevDetails,
        name: clientDetail.client || "",
        address: `${clientDetail.addressLine1 || ""}\n${
          clientDetail.addressLine2 || ""
        }`,
        placeOfSupply: clientDetail.placeOfSupply || "",
        contact: clientDetail.contactNumber || "",
        custId: clientDetail.custId || "",
        gstin: clientDetail.gstin || "",
      };
      return buildCalculatedDetails(
        nextDetails,
        nextDetails.rows,
        nextDetails.freightPacking,
      );
    });
  };

  const handleSavePreviewChanges = () => {
    setInvoiceDetails(previewDetails);
    setShowCgstSgst(Boolean(previewDetails.gstin?.startsWith("29")));
    const clientDetail = addressInfo.find(
      (item) =>
        String(item.custId).trim() === String(previewDetails.custId).trim(),
    );
    setSelectedClientDetail(clientDetail || null);
    setIsPreviewEditMode(false);
    toast.success("Preview changes saved.");
  };

  // START: Temporary Dev PDF View - Handler - Remove after CSS changes are complete
  const handleOpenDevPdfPreview = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please complete all mandatory fields before previewing Dev PDF.");
      return;
    }
    setPreviewDetails(JSON.parse(JSON.stringify(invoiceDetails))); // Use invoiceDetails for the PDF
    setIsDevPdfModalOpen(true);
  };

  const handleCloseDevPdfPreview = () => setIsDevPdfModalOpen(false);
  // END: Temporary Dev PDF View
  const previewClientDetail = previewDetails
    ? addressInfo.find(
        (item) =>
          String(item.custId).trim() === String(previewDetails.custId).trim(),
      )
    : null;

  return (
    <>
      {/* Header Section */}
      <Header />
      <div className="invoice">
        {/* Toastify container for displaying notifications */}
        <ToastContainer />
        {/*isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Generating PDF...</p>
          </div>
        ) */}

        <div className="form-group_customer">
          <div className="info-box">
            <div className="info-header"> Add Invoice Details </div>


            <div className="container">
              <div className="progress-container">
                <div className="progress-steps">
                  <div
                    className="progress-line"
                    style={{
                      width: `${((activeStep - 1) / (invoiceSteps.length - 1)) * 100}%`,
                    }}
                  ></div>
                  {invoiceSteps.map((step) => (
                    <div
                      className={`step ${activeStep === step.id ? "active" : ""} ${
                        activeStep > step.id ? "completed" : ""
                      }`}
                      data-step={step.id}
                      key={step.id}
                    >
                      <div className="step-circle">
                        {activeStep > step.id ? "\u2713" : step.id}
                      </div>
                      <div className="step-label">{step.title}</div>
                      <div className="step-helper">{step.helper}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-content">
                {/*<!-- Step 1 -->*/}
                <div
                  className={`form-step ${activeStep === 1 ? "active" : ""}`}
                  data-step="1"
                >
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
                    <label className="field-label">
                      Select Cust Id <span className="required">*</span>
                    </label>
                    <select
                      className={`select-dropdown ${formErrors.custId ? "error-border" : ""}`}
                      value={invoiceDetails.custId || ""}
                      onChange={handleClientDropdownChange}
                    >
                      <option value="">Select Customer Id</option>
                      {addressInfo.map((item) => (
                        <option key={item.custId} value={item.custId}>
                          {item.custId}
                        </option>
                      ))}
                    </select>
                    {formErrors.custId && (
                      <p className="field-error">{formErrors.custId}</p>
                    )}
                  </div>
                  {selectedClientDetail && (
                    <section className="invoice-section client">
                      <div className="section-title">Client Details</div>
                      <div className="info-grid">
                        {selectedClientDetail.contactName && (
                          <div className="info-item">
                            <label>Contact Name</label>
                            <span>{selectedClientDetail.contactName}</span>
                          </div>
                        )}

                        {selectedClientDetail.gstin && (
                          <div className="info-item">
                            <label>GSTIN</label>
                            <span>{selectedClientDetail.gstin}</span>
                          </div>
                        )}

                        {selectedClientDetail.placeOfSupply && (
                          <div className="info-item">
                            <label>Place of Supply</label>
                            <span>{selectedClientDetail.placeOfSupply}</span>
                          </div>
                        )}

                        {selectedClientDetail.contactNumber && (
                          <div className="info-item">
                            <label>Contact Number</label>
                            <span>{selectedClientDetail.contactNumber}</span>
                          </div>
                        )}

                        {selectedClientDetail.email && (
                          <div className="info-item">
                            <label>Email</label>
                            <span>{selectedClientDetail.email}</span>
                          </div>
                        )}

                        {selectedClientDetail.client && (
                          <div className="info-item">
                            <label>Client</label>
                            <span>{selectedClientDetail.client}</span>
                          </div>
                        )}

                        {selectedClientDetail.addressLine1 && (
                          <div className="info-item">
                            <label>Address Line 1</label>
                            <span>{selectedClientDetail.addressLine1}</span>
                          </div>
                        )}

                        {selectedClientDetail.addressLine2 && (
                          <div className="info-item">
                            <label>Address Line 2</label>
                            <span>{selectedClientDetail.addressLine2}</span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  <div className="button-group">
                    <button
                      className="btn-primary btn-next"
                      type="button"
                      onClick={goToNextStep}
                    >
                      Next -&gt;
                    </button>
                  </div>
                </div>

                {/*<!-- Step 2 -->*/}
                <div
                  className={`form-step ${activeStep === 2 ? "active" : ""}`}
                  data-step="2"
                >
                  <h2>Invoice Details</h2>
                  <p className="step-description">
                    Add invoice references and delivery information.
                  </p>

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

                  <section className="invoice-section header">
                    <div className="section-title">Invoice Details</div>
                    <div className="info-grid">
                      <div className="info-item">
                        <label className="field-label">
                          Invoice No <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          name="invoiceNo"
                          value={invoiceDetails.invoiceNo}
                          onChange={handleInputChange}
                          className={formErrors.invoiceNo ? "error-border" : ""}
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">P.O No</label>
                        <input
                          type="text"
                          name="poNo"
                          value={invoiceDetails.poNo || ""}
                          onChange={handleInputChange}
                          className={formErrors.poNo ? "error-border" : ""}
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">
                          Delivery Challan No
                        </label>
                        <input
                          type="text"
                          name="deliveryChallanNo"
                          value={invoiceDetails.deliveryChallanNo || ""}
                          onChange={handleInputChange}
                          className={
                            formErrors.deliveryChallanNo ? "error-border" : ""
                          }
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">Delivery Note</label>
                        <input
                          type="text"
                          name="deliveryNote"
                          value={invoiceDetails.deliveryNote || ""}
                          onChange={handleInputChange}
                          className={
                            formErrors.deliveryNote ? "error-border" : ""
                          }
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">
                          Date <span className="required">*</span>
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={invoiceDetails.date || ""}
                          onChange={handleInputChange}
                          ref={dateInputRef}
                          className={formErrors.date ? "error-border" : ""}
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">
                          Delivery Note date
                        </label>
                        <input
                          type="date"
                          name="deliveryNoteDate"
                          value={invoiceDetails.deliveryNoteDate || ""}
                          onChange={handleInputChange}
                          className={
                            formErrors.deliveryNoteDate ? "error-border" : ""
                          }
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">
                          Mode of Payment <span className="required">*</span>
                        </label>
                        <select
                          name="modeOfPayment"
                          value={invoiceDetails.modeOfPayment || ""}
                          onChange={handleInputChange}
                          ref={paymentSelectRef}
                          className={
                            formErrors.modeOfPayment ? "error-border" : ""
                          }
                        >
                          <option value="" disabled>
                            {" "}
                            Select an option{" "}
                          </option>
                          <option value="ADVANCE PAYMENT">
                            ADVANCE PAYMENT
                          </option>
                          <option value="IMMEDEATE BASIS">
                            IMMEDEATE BASIS
                          </option>
                          <option value="15 DAYS">15 DAYS</option>
                          <option value="30 DAYS">30 DAYS</option>
                          <option value="60 DAYS">60 DAYS</option>
                        </select>
                      </div>

                      <div className="info-item">
                        <label className="field-label">
                          Dispatched Through <span className="required">*</span>
                        </label>
                        <select
                          id="dispactchOptions"
                          name="dispatchedThrough"
                          value={invoiceDetails.dispatchedThrough || ""}
                          onChange={handleInputChange}
                          ref={dispatchSelectRef}
                          className={
                            formErrors.dispatchedThrough ? "error-border" : ""
                          }
                        >
                          <option value="" disabled>
                            {" "}
                            Select an option{" "}
                          </option>
                          <option value="BY HAND">BY HAND</option>
                          <option value="DTDC - SPEED">DTDC - SPEED</option>
                          <option value="DTDC">DTDC</option>
                          <option value="PORTER">PORTER</option>
                          <option value="TRANSPORTS">TRANSPORTS</option>
                          <option value="THE PROFESSIONAL">
                            THE PROFESSIONAL
                          </option>
                          <option value="TIRUPATI COURIER">
                            TIRUPATI COURIER
                          </option>
                          <option value="ANJANI">ANJANI</option>
                        </select>
                      </div>

                      <div className="info-item">
                        <label className="field-label">Proforma (Ref)</label>
                        <input
                          type="text"
                          name="proformaRef"
                          value={invoiceDetails.proformaRef || ""}
                          onChange={handleInputChange}
                          className={
                            formErrors.proformaRef ? "error-border" : ""
                          }
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">Terms of Delivery</label>
                        <input
                          type="text"
                          name="termsOfDelivery"
                          value={invoiceDetails.termsOfDelivery || ""}
                          onChange={handleInputChange}
                          className={
                            formErrors.termsOfDelivery ? "error-border" : ""
                          }
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">E-way Bill No</label>
                        <input
                          type="text"
                          name="ewayBillNo"
                          value={invoiceDetails.ewayBillNo || ""}
                          onChange={handleInputChange}
                          className={
                            formErrors.ewayBillNo ? "error-border" : ""
                          }
                        />
                      </div>

                      <div className="info-item">
                        <label className="field-label">Dated</label>
                        <input
                          type="date"
                          name="dated"
                          value={invoiceDetails.dated || ""}
                          onChange={handleInputChange}
                          className={formErrors.dated ? "error-border" : ""}
                        />
                      </div>
                    </div>
                  </section>

                  <div className="button-group">
                    <button
                      className="btn-prev"
                      type="button"
                      onClick={goToPreviousStep}
                    >
                      &lt;- Back
                    </button>
                    <button
                      className="btn-next"
                      type="button"
                      onClick={goToNextStep}
                    >
                      Next -&gt;
                    </button>
                  </div>
                </div>

                {/*<!-- Step 3 -->*/}
                <div
                  className={`form-step ${activeStep === 3 ? "active" : ""}`}
                  data-step="3"
                >
                  <h2>Product Details</h2>
                  <p className="step-description">
                    Add goods, descriptions, HSN/SAC, quantity, and rate.
                  </p>

                  {/*<div class="file-upload-area" id="fileUploadArea">
                    <div class="upload-icon"></div>
                    <div class="upload-text">Drag & drop files here</div>
                    <div class="upload-subtext">or click to browse • Max 10MB per file</div>
                    <input type="file" id="fileInput" class="file-input" multiple accept="">
                </div>

                <div class="file-list" id="fileList"></div>*/}

                  {formErrors.rows && (
                    <p className="field-error section-error">
                      {formErrors.rows}
                    </p>
                  )}
                  <section
                    className={`invoice-section product-entry ${formErrors.rows ? "error-border" : ""}`}
                    ref={tableSectionRef}
                  >
                    <DynamicTable
                      rows={invoiceDetails.rows}
                      setRows={handleRowsChange}
                    />
                  </section>

                  <div className="button-group">
                    <button
                      className="btn-prev"
                      type="button"
                      onClick={goToPreviousStep}
                    >
                      &lt;- Back
                    </button>
                    <button
                      className="btn-next"
                      type="button"
                      onClick={goToNextStep}
                    >
                      Next -&gt;
                    </button>
                  </div>
                </div>

                {/*<!-- Step 4 -->*/}
                <div
                  className={`form-step ${activeStep === 4 ? "active" : ""}`}
                  data-step="4"
                >
                  <h2>Review & submit</h2>
                  <p className="step-description">
                    Please review pricing and bank details before submitting.
                  </p>

                  {/*<div id="reviewContent"></div>*/}

                  <section className="invoice-section product-list preview-section">
                    <div className="section-title">Pricing & Bank Details</div>
                    <InvoicePricingAndBankDetails
                      invoiceDetails={invoiceDetails}
                      showCgstSgst={showCgstSgst}
                    />
                  </section>

                  <div className="button-group">
                    <button
                      className="btn-prev"
                      type="button"
                      onClick={goToPreviousStep}
                    >
                      &lt;- Back
                    </button>
                    <button
                      className="btn-secondary preview-button"
                      type="button"
                      onClick={handleOpenPreview}
                    >
                      Preview
                    </button>
                    {/* START: Temporary Dev PDF View Button - Remove after CSS changes are complete */}
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={handleOpenDevPdfPreview}
                      style={{ marginLeft: '10px', backgroundColor: 'purple', color: 'white' }}
                    >
                       PDF View
                    </button>
                    {/* END: Temporary Dev PDF View Button */}
                    <button
                      className="btn-next"
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      Submit
                    </button>
                  </div>
                </div>

                {/*<!-- Step 5 -->
            <div class="form-step" data-step="5">
                <div class="success-message">
                    <div class="success-icon">?</div>
                    <h2 class="success-title">All done!</h2>
                    <p class="success-text">Thank you for your submission. We'll be in touch soon.</p>
                </div>
            </div>*/}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={isPreviewEditMode ? "Edit Invoice Details" : "Invoice Preview"}
        size="large"
      >
        {previewDetails && (
          <>
            <InvoicePreviewModalContent
              addressInfo={addressInfo}
              invoiceDetails={previewDetails}
              isEditMode={isPreviewEditMode}
              previewClientDetail={previewClientDetail}
              onClientChange={handlePreviewClientChange}
              onInputChange={handlePreviewInputChange}
              onRowsChange={handlePreviewRowsChange}
            />
            <div className="invoice-modal-footer">
              <button
                className="btn-prev"
                type="button"
                onClick={handleClosePreview}
              >
                {isPreviewEditMode ? "Cancel" : "Close"}
              </button>
              {isPreviewEditMode ? (
                <button
                  className="btn-next"
                  type="button"
                  onClick={handleSavePreviewChanges}
                >
                  Save Changes
                </button>
              ) : (
                <>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setIsPreviewEditMode(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-next"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* START: Temporary Dev PDF View Modal - Remove after CSS changes are complete */}
      <Modal
        isOpen={isDevPdfModalOpen}
        onClose={handleCloseDevPdfPreview}
        title="PDF View"
        size="large"
      >
        {previewDetails && (
          <PdfPage
            invoiceDataOverride={previewDetails}
            embedded={true} // Treat as embedded to hide header/footer and toast
            useAdvancedPdfGenerator={true} // Use the advanced PDF generator for dev preview
            disableAutoDownload={true} // Disable automatic PDF download
          />
        )}
      </Modal>
      {/* END: Temporary Dev PDF View Modal */}
      {pdfInvoiceData && EmbeddedPdfPage && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: "-10000px",
            width: "820px",
            minHeight: "1200px",
            overflow: "hidden",
            background: "#fff",
            pointerEvents: "none",
          }}
        >
          <EmbeddedPdfPage
            invoiceDataOverride={pdfInvoiceData}
            embedded
            // useAdvancedPdfGenerator={true} // Uncomment to use advanced PDF generator for final download
            onDownloadComplete={handlePdfDownloadComplete}
          />
        </div>
      )}
      {/* Footer Section */}
      <Footer />
    </>
  );
};

export default InvoiceForm;
