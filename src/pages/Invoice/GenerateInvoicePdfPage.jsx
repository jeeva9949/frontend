import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import * as domtoimageModule from "dom-to-image-more";
import { saveAs } from "file-saver";
import { useLocation, useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { toIndianWords } from "../../components/common/numberToWords";
import BankDetails from "./BankDetails";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EditInvoicePage.css";
import "./GenerateInvoicePdfPage.css";

const domtoimage = domtoimageModule.default || domtoimageModule;

const PdfPage = ({
  invoiceDataOverride = null,
  embedded = false,
  onDownloadComplete,
  disableAutoDownload = false, // New prop to control auto-download
  useAdvancedPdfGenerator = false, // Add this prop
} = {}) => {
  const { id, timeStamp } = useParams();
  const location = useLocation();
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [existingRows, setExistingRows] = useState([]);
  const hasDownloadedRef = useRef(false);
  const contentRef = useRef(null);
  // originalDisplay and originalPosition are declared here to be accessible in finally
  const invoiceReferenceRef = useRef(null);

  useEffect(() => {
    if (invoiceDataOverride) {
      setInvoiceData(invoiceDataOverride);
      hasDownloadedRef.current = false;
      return;
    }

    const pendingInvoiceData = sessionStorage.getItem("pendingInvoicePdfData");
    let invoiceFromStorage = null;

    if (pendingInvoiceData) {
      try {
        invoiceFromStorage = JSON.parse(pendingInvoiceData);
      } catch (error) {
        console.error("Invalid pending invoice PDF data:", error);
        sessionStorage.removeItem("pendingInvoicePdfData");
      }
    }

    const invoiceFromNavigation =
      location.state?.invoiceData || invoiceFromStorage;

    if (invoiceFromNavigation) {
      setInvoiceData(invoiceFromNavigation);
      sessionStorage.removeItem("pendingInvoicePdfData");
      return;
    }

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
            setInvoiceData(result[0]);
          }
        } catch (error) {
          console.error("Error fetching invoice:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvoiceById();
    }
  }, [id, timeStamp, location.state, invoiceDataOverride]);

  useEffect(() => {
    if (invoiceData && !hasDownloadedRef.current && !disableAutoDownload) {
      // Check disableAutoDownload
      hasDownloadedRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pdfDownload();
        });
      });
    }
  }, [invoiceData, disableAutoDownload]); // Add disableAutoDownload to deps

  /**
   * Off-screen container: position:absolute keeps the element in the document
   * layout flow so scrollWidth / scrollHeight are always accurate. The clone
   * is never visible to the user and never disturbs the live invoice element.
   */
  const createOffscreenWrapper = () => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:absolute;top:-99999px;left:0;width:720px;background:#fff;overflow:visible;";
    document.body.appendChild(wrapper);
    return wrapper;
  };

  /** Clones the element with a new title, mounts it, and waits for images + fonts. */
  const mountClone = async (wrapper, element, title) => {
    const clone = element.cloneNode(true);
    const clonedTitle = clone.querySelector("#invoiceReference");
    if (clonedTitle) clonedTitle.textContent = title;

    wrapper.innerHTML = "";
    wrapper.appendChild(clone);

    await Promise.all(
      Array.from(clone.querySelectorAll("img")).map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            }),
      ),
    );
    await document.fonts?.ready;
    await new Promise((resolve) => setTimeout(resolve, 150));

    return clone;
  };

  /**
   * Captures the clone as a 2× PNG using dom-to-image-more (SVG foreignObject).
   * dom-to-image-more preserves the browser's exact CSS rendering — including
   * border-collapse, grids, and pseudo-elements — which is why borders in the
   * PDF match the on-screen preview exactly, without doubling.
   */
  // const captureCloneAsPng = async (clone) => {
  //   const width = clone.offsetWidth || 1000; // Fallback to 720px if offsetWidth is unavailable
  //   const height = (clone.scrollHeight || clone.offsetHeight) + 20;

  //   const dataUrl = await domtoimage.toPng(clone, {
  //     width,
  //     height,
  //     scale: 2,
  //     bgcolor: "#ffffff",
  //     cacheBust: true,
  //   });

  //   return { dataUrl, naturalWidth: width, naturalHeight: height };
  // };
  const captureCloneAsPng = async (clone) => {
    const width = clone.scrollWidth || clone.offsetWidth || 1000;

    const height = (clone.scrollHeight || clone.offsetHeight) + 20;

    const dataUrl = await domtoimage.toPng(clone, {
      width,
      height,
      scale: 2,
      bgcolor: "#ffffff",
      cacheBust: true,
      quality: 1,
    });

    return {
      dataUrl,
      naturalWidth: width,
      naturalHeight: height,
    };
  };
  /**
   * Scales the image to fit fully within the A4 printable area (both width and
   * height), reserving 8 mm at the bottom for the page-number line.
   */
  // const fitImageToPage = (
  //   naturalWidth,
  //   naturalHeight,
  //   pageWidth,
  //   pageHeight,
  //   margin,
  // ) => {
  //   const pageNumReserve = 8;
  //   const maxW = pageWidth - 2 * margin;
  //   const maxH = pageHeight - 2 * margin - pageNumReserve;

  //   const scale = Math.min(maxW / naturalWidth, maxH / naturalHeight);
  //   const imgW = naturalWidth * scale;
  //   const imgH = naturalHeight * scale;

  //   return {
  //     x: margin + (maxW - imgW) / 2,
  //     y: margin,
  //     imgW,
  //     imgH,
  //   };
  // };
  const fitImageToPage = (
    naturalWidth,
    naturalHeight,
    pageWidth,
    pageHeight,
    margin,
  ) => {
    // Same margin for all 4 sides
    const footerReserve = 5;

    // Exact printable area
    const printableWidth = pageWidth - margin * 2;

    const printableHeight = pageHeight - margin * 2 - footerReserve;

    return {
      // Equal left spacing
      x: margin,

      // Equal top spacing
      y: margin,

      // Exact width fit
      imgW: printableWidth,

      // Exact height fit
      imgH: printableHeight,
    };
  };
  // const pdfDownload = async () => {
  //   const loadingToastId = embedded
  //     ? null
  //     : toast.loading("Generating and downloading PDF...");
  //   setIsLoading(true);

  //   let tempWrapper = null;

  //   try {
  //     const element = contentRef.current;
  //     if (!element) {
  //       throw new Error("Invoice content was not ready for PDF generation.");
  //     }

  //     const pdf = new jsPDF({
  //       unit: "mm",
  //       format: "a4",
  //       orientation: "portrait",
  //     });

  //     const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  //     const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  //     const margin = 10;

  //     const titles = [
  //       "(Original For Recipient)",
  //       "(Duplicate For Transporter)",
  //       "(Triplicate For Supplier)",
  //     ];

  //     tempWrapper = createOffscreenWrapper();

  //     for (let i = 0; i < titles.length; i++) {
  //       const clone = await mountClone(tempWrapper, element, titles[i]);
  //       const { dataUrl, naturalWidth, naturalHeight } =
  //         await captureCloneAsPng(clone);

  //       // Scale to fit within the printable area (respects both width and height)
  //       const { x, y, imgW, imgH } = fitImageToPage(
  //         naturalWidth,
  //         naturalHeight,
  //         pageWidth,
  //         pageHeight,
  //         margin,
  //       );

  //       pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH, "", "FAST");

  //       // Page number sits in the reserved 8mm strip at the bottom
  //       pdf.setFontSize(8);
  //       pdf.text(
  //         `Page ${i + 1} of ${titles.length}`,
  //         pageWidth / 2,
  //         pageHeight - margin / 2,
  //         { align: "center" },
  //       );

  //       if (i < titles.length - 1) pdf.addPage();
  //     }

  //     saveAs(pdf.output("blob"), `${invoiceData.invoiceNo}_Invoice.pdf`);

  //     if (embedded) {
  //       onDownloadComplete?.({ success: true });
  //     } else {
  //       toast.update(loadingToastId, {
  //         render: "PDF downloaded successfully.",
  //         type: "success",
  //         isLoading: false,
  //         autoClose: 3000,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error generating PDF:", error);
  //     if (embedded) {
  //       onDownloadComplete?.({ success: false, error });
  //     } else {
  //       toast.update(loadingToastId, {
  //         render: error?.message || "Failed to generate PDF.",
  //         type: "error",
  //         isLoading: false,
  //         autoClose: 5000,
  //       });
  //     }
  //   } finally {
  //     setIsLoading(false);
  //     if (tempWrapper?.parentNode) document.body.removeChild(tempWrapper);
  //   }
  // };
  const pdfDownload = async () => {
    const loadingToastId = embedded
      ? null
      : toast.loading("Generating and downloading PDF...");

    setIsLoading(true);

    let tempWrapper = null;

    try {
      const element = contentRef.current;

      if (!element) {
        throw new Error("Invoice content was not ready for PDF generation.");
      }

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      /**
       * 50px visual spacing
       */
      const margin = 7;

      const titles = [
        "(Original For Recipient)",
        "(Duplicate For Transporter)",
        "(Triplicate For Supplier)",
      ];

      tempWrapper = createOffscreenWrapper();

      for (let i = 0; i < titles.length; i++) {
        const clone = await mountClone(tempWrapper, element, titles[i]);

        const { dataUrl, naturalWidth, naturalHeight } =
          await captureCloneAsPng(clone);

        const { x, y, imgW, imgH } = fitImageToPage(
          naturalWidth,
          naturalHeight,
          pageWidth,
          pageHeight,
          margin,
        );

        pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH, "", "FAST");

        pdf.setFontSize(8);

        pdf.text(
          `Page ${i + 1} of ${titles.length}`,
          pageWidth / 2,
          pageHeight - 2,
          {
            align: "center",
          },
        );

        if (i < titles.length - 1) {
          pdf.addPage();
        }
      }

      saveAs(pdf.output("blob"), `${invoiceData.invoiceNo}_Invoice.pdf`);

      if (embedded) {
        onDownloadComplete?.({
          success: true,
        });
      } else {
        toast.update(loadingToastId, {
          render: "PDF downloaded successfully.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);

      if (embedded) {
        onDownloadComplete?.({
          success: false,
          error,
        });
      } else {
        toast.update(loadingToastId, {
          render: error?.message || "Failed to generate PDF.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    } finally {
      setIsLoading(false);

      if (tempWrapper?.parentNode) {
        document.body.removeChild(tempWrapper);
      }
    }
  };

  // const generateAdvancedPdf = async () => {
  //   const loadingToastId = embedded
  //     ? null
  //     : toast.loading("Generating and downloading PDF...");
  //   setIsLoading(true);

  //   let tempWrapper = null;

  //   try {
  //     const element = contentRef.current;
  //     if (!element) {
  //       throw new Error("Invoice content was not ready for PDF generation.");
  //     }

  //     const pdf = new jsPDF({
  //       unit: "mm",
  //       format: "a4",
  //       orientation: "portrait",
  //     });

  //     const pageWidth = pdf.internal.pageSize.getWidth();
  //     const pageHeight = pdf.internal.pageSize.getHeight();
  //     const margin = 10;

  //     const titles = [
  //       "(Original For Recipient)",
  //       "(Duplicate For Transporter)",
  //       "(Triplicate For Supplier)",
  //     ];

  //     tempWrapper = document.createElement("div");
  //     tempWrapper.style.cssText =
  //       "position:absolute;top:-99999px;left:0;width:720px;background:#fff;";
  //     document.body.appendChild(tempWrapper);

  //     for (let i = 0; i < titles.length; i++) {
  //       const clone = await mountClone(tempWrapper, element, titles[i]);
  //       const { dataUrl, naturalWidth, naturalHeight } =
  //         await captureCloneAsPng(clone);

  //       const { x, y, imgW, imgH } = fitImageToPage(
  //         naturalWidth,
  //         naturalHeight,
  //         pageWidth,
  //         pageHeight,
  //         margin,
  //       );

  //       pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH, "", "FAST");

  //       pdf.setFontSize(8);
  //       pdf.text(
  //         `Page ${i + 1} of ${titles.length}`,
  //         pageWidth / 2,
  //         pageHeight - margin / 2,
  //         { align: "center" },
  //       );

  //       if (i < titles.length - 1) pdf.addPage();
  //     }

  //     saveAs(
  //       pdf.output("blob"),
  //       `${invoiceData.invoiceNo}_Invoice_Advanced.pdf`,
  //     );

  //     if (embedded) {
  //       onDownloadComplete?.({ success: true });
  //     } else {
  //       toast.update(loadingToastId, {
  //         render: "PDF downloaded successfully.",
  //         type: "success",
  //         isLoading: false,
  //         autoClose: 3000,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error generating advanced PDF:", error);
  //     if (embedded) {
  //       onDownloadComplete?.({ success: false, error });
  //     } else {
  //       toast.update(loadingToastId, {
  //         render: error?.message || "Failed to generate PDF.",
  //         type: "error",
  //         isLoading: false,
  //         autoClose: 5000,
  //       });
  //     }
  //   } finally {
  //     setIsLoading(false);
  //     if (tempWrapper?.parentNode) document.body.removeChild(tempWrapper);
  //   }
  // };
  const generateAdvancedPdf = async () => {
    const loadingToastId = embedded
      ? null
      : toast.loading("Generating and downloading PDF...");

    setIsLoading(true);

    let tempWrapper = null;

    try {
      const element = contentRef.current;

      if (!element) {
        throw new Error("Invoice content was not ready for PDF generation.");
      }

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 5;

      const titles = [
        "(Original For Recipient)",
        "(Duplicate For Transporter)",
        "(Triplicate For Supplier)",
      ];

      tempWrapper = createOffscreenWrapper();

      for (let i = 0; i < titles.length; i++) {
        const clone = await mountClone(tempWrapper, element, titles[i]);

        const { dataUrl, naturalWidth, naturalHeight } =
          await captureCloneAsPng(clone);

        const { x, y, imgW, imgH } = fitImageToPage(
          naturalWidth,
          naturalHeight,
          pageWidth,
          pageHeight,
          margin,
        );

        pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH, "", "FAST");

        pdf.setFontSize(8);

        pdf.text(
          `Page ${i + 1} of ${titles.length}`,
          pageWidth / 2,
          pageHeight - 5,
          {
            align: "center",
          },
        );

        if (i < titles.length - 1) {
          pdf.addPage();
        }
      }

      saveAs(
        pdf.output("blob"),
        `${invoiceData.invoiceNo}_Invoice_Advanced.pdf`,
      );

      if (embedded) {
        onDownloadComplete?.({
          success: true,
        });
      } else {
        toast.update(loadingToastId, {
          render: "PDF downloaded successfully.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error generating advanced PDF:", error);

      if (embedded) {
        onDownloadComplete?.({
          success: false,
          error,
        });
      } else {
        toast.update(loadingToastId, {
          render: error?.message || "Failed to generate PDF.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    } finally {
      setIsLoading(false);

      if (tempWrapper?.parentNode) {
        document.body.removeChild(tempWrapper);
      }
    }
  };
  const totalQuantity = invoiceData?.rows?.reduce(
    (total, row) => total + parseFloat(row.quantity || 0),
    0,
  );
  const hsnSac = invoiceData?.rows?.map((row) => row.hsnSac);
  const totalTaxAmount = parseFloat(invoiceData?.totalTaxAmount).toFixed(2);
  const [rupees, paise] = totalTaxAmount.split(".");

  // Determine which PDF download function to use
  const currentPdfDownloadFunction = useAdvancedPdfGenerator
    ? generateAdvancedPdf
    : pdfDownload;

  return (
    <>
      {!embedded && <Header />}
      <div className="invoice">
        {!embedded && <ToastContainer />}
        {!embedded && isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        <div
          id="content"
          ref={contentRef}
          className="invoice-container pdf-invoice-content"
        >
          <h3 className="invoice-title">
            <span>{invoiceData?.invoiceType || "N/A"}</span>
            <span id="invoiceReference" ref={invoiceReferenceRef}>
              (Original For Recipient)
            </span>
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
                  <td className="consigneeDetails" colSpan={2}>
                    <strong>Consignee Details :</strong>
                  </td>
                  <td className="invoiceLabel">
                    <strong>Invoice No.</strong>
                  </td>
                  <td className="invoiceInput">
                    <span>{invoiceData?.invoiceNo || "N/A"}</span>
                  </td>
                  <td className="dateLabel">
                    <strong>Date</strong>
                  </td>
                  <td className="dateInput">
                    <span>{invoiceData?.dated || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="nameLabel">
                    <strong>Name</strong>
                  </td>
                  <td className="nameInput">
                    <span>{invoiceData?.name || "N/A"}</span>
                  </td>
                  <td className="poNoLabel">
                    <strong>P.O No</strong>
                  </td>
                  <td className="poNoInput">
                    <span>{invoiceData?.poNo || "N/A"}</span>
                  </td>
                  <td className="datedLabel">
                    <strong>Dated</strong>
                  </td>
                  <td className="datedInput">
                    <span>{invoiceData?.dated || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="addressLabel" rowSpan="2">
                    <strong>Address</strong>
                  </td>
                  <td className="addressBlock" rowSpan="2">
                    <span>{invoiceData?.address || "N/A"}</span>
                  </td>
                  <td className="deliveryChallanNoLabel">
                    <strong>Delivery Challan No</strong>
                  </td>
                  <td className="deliveryChallanNoInput">
                    <span>{invoiceData?.deliveryChallanNo || "N/A"}</span>
                  </td>
                  <td className="deliveryNotedateLabel">
                    <strong>Delivery Note date</strong>
                  </td>
                  <td className="deliveryNotedateInput">
                    <span>{invoiceData?.deliveryNoteDate || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="deliveryNotedateLabel">
                    <strong>Delivery Note</strong>
                  </td>
                  <td className="deliveryNoteInput">
                    <span>{invoiceData?.deliveryNote || "N/A"}</span>
                  </td>
                  <td className="modeOfPaymentLabel">
                    <strong>Mode of Payment</strong>
                  </td>
                  <td className="modeOfPaymentselect">
                    <span>{invoiceData?.modeOfPayment || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="contactLabel">
                    <strong>Contact</strong>
                  </td>
                  <td className="contactInput">
                    <span>{invoiceData?.contact || "N/A"}</span>
                  </td>
                  <td className="dispacthedLabel">
                    <strong>Dispacthed Through</strong>
                  </td>
                  <td className="dispacthedSelect">
                    <span>{invoiceData?.dispatchedThrough || "N/A"}</span>
                  </td>
                  <td className="proformaLabel">
                    <strong>PROFORMA (REF)</strong>
                  </td>
                  <td className="proformaInput">
                    <span>{invoiceData?.proformaRef || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="placeOfSupplyLabel">
                    <strong>Place of Supply</strong>
                  </td>
                  <td className="placeOfSupplyInput">
                    <span>{invoiceData?.placeOfSupply || "N/A"}</span>
                  </td>
                  <td className="termOfDeliveryLabel">
                    <strong>Terms of Delivery</strong>
                  </td>
                  <td className="termOfDeliveryInput">
                    <span>{invoiceData?.termsOfDelivery || "N/A"}</span>
                  </td>
                  <td className="ewayBillNoLabel">
                    <strong>E-way Bill No</strong>
                  </td>
                  <td className="ewayBillNoInput">
                    <span>{invoiceData?.ewayBillNo || "N/A"}</span>
                  </td>
                </tr>

                <tr>
                  <td className="gstinLabel">
                    <strong>GSTIN</strong>
                  </td>
                  <td className="gstinInput">
                    <span>{invoiceData?.gstin || "N/A"}</span>
                  </td>
                  <td className="custIdLabel">
                    <strong>CUST ID</strong>
                  </td>
                  <td className="custIdInput">
                    <span>{invoiceData?.custId || "N/A"}</span>
                  </td>
                  <td></td>
                  <td></td>
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
                  {invoiceData?.rows && invoiceData.rows.length > 0 ? (
                    invoiceData.rows.map((row, index) => (
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
                      <td colSpan="8">No rows available</td>
                    </tr>
                  )}

                  {invoiceData?.rows && invoiceData.rows.length < 5 && (
                    <tr className="emptyRow_columns">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
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
                      {invoiceData?.grandTotal
                        ? `Rupees ${toIndianWords(parseFloat(invoiceData.grandTotal))} Only`
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
                      ₹<span>{invoiceData?.total || "-"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>CGST 9 %</strong>
                    </td>
                    <td>
                      ₹
                      <span>
                        {isNaN((9 / 100) * invoiceData?.total)
                          ? "0.00"
                          : parseFloat(
                              ((9 / 100) * invoiceData?.total).toFixed(2),
                            )}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>SGST 9 %</strong>
                    </td>
                    <td>
                      ₹
                      <span>
                        {isNaN((9 / 100) * invoiceData?.total)
                          ? "0.00"
                          : parseFloat(
                              ((9 / 100) * invoiceData?.total).toFixed(2),
                            )}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>IGST 18 %</strong>
                    </td>
                    <td>
                      ₹
                      <span>
                        {isNaN((18 / 100) * invoiceData?.total)
                          ? "0.00"
                          : parseFloat(
                              ((18 / 100) * invoiceData?.total).toFixed(2),
                            )}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Freight & Packing</strong>
                    </td>
                    <td>
                      ₹<span>{invoiceData?.freightPacking || "-"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Round Off</strong>
                    </td>
                    <td>
                      ₹<span>{invoiceData?.roundOff || "-"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>GRAND TOTAL</strong>
                    </td>
                    <td>
                      ₹<span>{invoiceData?.grandTotal || "-"}</span>
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
                    <th>
                      CGST Rate <div className="cgstPercentage"> 9% </div>
                    </th>
                    <th>
                      SGST Rate <div className="sgstPercentage"> 9% </div>
                    </th>
                    <th>
                      IGST Rate <div className="igstPercentage"> 18% </div>
                    </th>
                    <th>Total Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="taxColValue">
                    <td className="hsn_sac">{invoiceData?.hsnSac}</td>
                    <td className="taxable_value">₹{invoiceData?.total}</td>
                    <td className="cgst">
                      ₹
                      {invoiceData?.gstin?.startsWith("29")
                        ? isNaN((9 / 100) * invoiceData?.total)
                          ? "0.00"
                          : parseFloat(
                              ((9 / 100) * invoiceData?.total).toFixed(2),
                            )
                        : "0.00"}
                    </td>
                    <td className="sgst">
                      ₹
                      {invoiceData?.gstin?.startsWith("29")
                        ? isNaN((9 / 100) * invoiceData?.total)
                          ? "0.00"
                          : parseFloat(
                              ((9 / 100) * invoiceData?.total).toFixed(2),
                            )
                        : "0.00"}
                    </td>
                    <td className="igst">
                      ₹
                      {!invoiceData?.gstin?.startsWith("29")
                        ? isNaN((18 / 100) * invoiceData?.total)
                          ? "0.00"
                          : parseFloat(
                              ((18 / 100) * invoiceData?.total).toFixed(2),
                            )
                        : "0.00"}
                    </td>
                    <td className="total_tax_amount">
                      ₹{invoiceData?.totalTaxAmount}
                    </td>
                  </tr>
                  <tr className="taxColEmpty_value">
                    <td className="empty_value"></td>
                    <td className="empty_value"></td>
                    <td className="empty_value"></td>
                    <td className="empty_value"></td>
                    <td className="empty_value"></td>
                    <td className="empty_value"></td>
                  </tr>
                </tbody>
              </table>
              <table>
                <tbody>
                  <tr className="taxInWords">
                    <td className="taxInWordsLabel">Tax amount (In words)</td>
                    <td className="taxInWordsValue">
                      {!isNaN(parseFloat(invoiceData?.totalTaxAmount))
                        ? `Rupees ${toIndianWords(parseInt(rupees))} Paise ${toIndianWords(parseInt(paise))} Only`
                        : "-"}{" "}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <BankDetails />
          </div>

          <div className="main-footer">
            <p>
              THIS IS COMPUTER GENERATED INVOICE. PLEASE DO WRITE OR CALL US ON
              QUERIES
            </p>
          </div>
        </div>
      </div>
      {!embedded && <Footer />}
    </>
  );
};

export default PdfPage;
export { PdfPage };
