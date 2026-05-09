import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../components/Invoice/Grid.css"; // External CSS for styling
import { FaEye, FaDownload, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import Header from "../../components/layout/Header"; // Import Header
import Footer from "../../components/layout/Footer"; // Import Footer
import { ToastContainer, toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

// InvoiceGrid Component
const InvoiceGrid = () => {
  const [invoices, setInvoices] = useState([]); // To store fetched invoices
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    InvDate: { start: null, end: null },
    ClientsName: "",
    InvNumber: "",
    InvNetTotal: "",
    InvGrandTotal: "",
    InvTax: "",
    ADPayment: "",
    OSAmount: "",
    ODDate: "",
    ODByDays: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [loading, setLoading] = useState(true); // Initially set to true since data is not loaded yet
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (e, column) => {
    setFilters({ ...filters, [column]: e.target.value });
  };

  // Function to fetch invoices from the Lambda endpoint
  const fetchInvoicesData = async () => {
    const response = await fetch(
      "https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/getInvoice",
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
      throw new Error("Failed to fetch invoices");
    }

    const data = await response.json();
    console.log("Fetched Data:", data); // Debugging: Check the structure of the response

    // Check if the data is an array or if it's nested inside an object
    const result =
      typeof data?.body === "string" ? JSON.parse(data.body) : data.body;
    if (Array.isArray(result)) {
      return result;
    }

    // Fallback: If neither is an array, return an empty array
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const data = await fetchInvoicesData();
        console.log("Fetched and Processed Data:", data); // Debugging: Check the processed data
        setInvoices(data); // Set invoices data after fetching
      } catch (err) {
        setError("Failed to fetch invoices");
      } finally {
        setLoading(false); // Set loading to false after data has been fetched
      }
    };

    fetchData();
  }, []);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setFilters((prevFilters) => ({
      ...prevFilters,
      InvDate: { start, end },
    }));
  };

  console.log("Before Filtering:", invoices);

  // Filter invoices based on filter criteria
  const filteredInvoices = invoices.filter((invoice) => {
    if (
      Object.values(filters).some(
        (value) => value !== "" && value !== null && value !== undefined,
      )
    ) {
      return (
        (!filters.InvDate.start ||
          (new Date(invoice.date) >= filters.InvDate.start &&
            new Date(invoice.date) <= filters.InvDate.end)) &&
        Object.entries(filters).every(([filterKey, filterValue]) => {
          if (filterKey === "InvDate") return true;
          if (!filterValue) return true;

          const dataKeyMap = {
            ClientsName: "name",
            InvNumber: "invoiceNo",
            InvNetTotal: "total",
            InvGrandTotal: "grandTotal",
            InvTax: "totalTaxAmount",
            ADPayment: "invoicePaymentHistory",
            OSAmount: "grandTotal",
            ODDate: "date", // used in logic, not displayed
            ODByDays: "date", // same
          };

          const invoiceKey = dataKeyMap[filterKey];
          if (!invoiceKey || !invoice[invoiceKey]) return false;

          // Special case handling for derived values (e.g. ADPayment, OSAmount, ODByDays)
          if (filterKey === "ADPayment") {
            const totalPaid = invoice?.invoicePaymentHistory?.reduce(
              (sum, item) => sum + parseFloat(item.paymentAmount || 0),
              0,
            );
            return totalPaid.toString().includes(filterValue);
          }

          if (filterKey === "OSAmount") {
            const totalPaid = invoice?.invoicePaymentHistory?.reduce(
              (sum, item) => sum + parseFloat(item.paymentAmount || 0),
              0,
            );
            const osAmount = parseFloat(invoice?.grandTotal || 0) - totalPaid;
            return osAmount.toString().includes(filterValue);
          }

          if (filterKey === "ODByDays") {
            const invoiceDateObj = new Date(invoice.date);
            invoiceDateObj.setDate(invoiceDateObj.getDate() + 30);
            const currentDate = new Date();
            if (currentDate > invoiceDateObj) {
              const timeDifference = currentDate - invoiceDateObj;
              const daysLate = Math.floor(timeDifference / (1000 * 3600 * 24));
              const numericFilterValue = parseInt(filterValue, 10);
              return daysLate > numericFilterValue;
              //return daysLate.toString().includes(filterValue);
            } else {
              return "Nil".toLowerCase().includes(filterValue.toLowerCase());
            }
          }

          if (filterKey === "ODDate") {
            const invoiceDateObj = new Date(invoice.date);
            invoiceDateObj.setDate(invoiceDateObj.getDate() + 30);
            const paymentDueDate = invoiceDateObj.toISOString().split("T")[0];
            return paymentDueDate
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }

          // Default case
          return invoice[invoiceKey]
            ?.toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        })
      );
    } else {
      return true;
    }
  });

  console.log("Filtered Invoices:", filteredInvoices);

  // Sorting invoices
  if (sortConfig.key) {
    filteredInvoices.sort((a, b) => {
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key])
        return -1 * directionMultiplier;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * directionMultiplier;
      return 0;
    });
  }

  // Paginated invoices
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      const direction =
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc";
      return { key, direction };
    });
  };

  // Pagination handling
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Checkbox change handling
  const handleRowSelect = (invoice) => {
    setSelectedInvoices((prevSelected) => {
      const isAlreadySelected = prevSelected.some(
        (inv) => inv.invoiceNo === invoice.invoiceNo,
      );
      if (isAlreadySelected) {
        return prevSelected.filter(
          (inv) => inv.invoiceNo !== invoice.invoiceNo,
        ); // Remove if already selected
      } else {
        return [...prevSelected, invoice]; // Add if not selected
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices([...paginatedInvoices]); // Select all invoices
    } else {
      setSelectedInvoices([]); // Deselect all
    }
  };

  const getDataToExport = () => {
    return paginatedInvoices
      .filter((invoice) =>
        selectedInvoices.some(
          (selected) => selected.invoiceNo === invoice.invoiceNo,
        ),
      )
      .map((invoice) => {
        const totalPaid = invoice?.invoicePaymentHistory?.reduce(
          (sum, item) => sum + parseFloat(item.paymentAmount || 0),
          0,
        );
        const oSPayment = parseFloat(invoice?.grandTotal || 0) - totalPaid;

        const invoiceDateObj = new Date(invoice.date);
        invoiceDateObj.setDate(invoiceDateObj.getDate() + 30);
        const paymentDueDate = invoiceDateObj.toISOString().split("T")[0];

        const currentDate = new Date();
        let daysLate = "Nil";
        if (currentDate > invoiceDateObj) {
          const timeDifference = currentDate - invoiceDateObj;
          daysLate = Math.floor(timeDifference / (1000 * 3600 * 24));
        }

        return {
          "Invoice Date": invoice.date,
          "Client Name": invoice.name,
          "GST No": invoice.gstin,
          "Invoice No": invoice.invoiceNo,
          "Invoice Total": invoice.total,
          "Grand Total": invoice.grandTotal,
          "Total Tax Amount": invoice.totalTaxAmount,
          "Advance Payment": totalPaid || "Nil",
          "OS Amount": oSPayment || "Nil",
          "OD Date": paymentDueDate || "Nil",
          "OD By Days": daysLate || "Nil",
        };
      });
  };

  const exportToExcel = () => {
    if (selectedInvoices.length === 0) {
      alert("Please select at least one invoice to export.");
      return;
    }

    const dataToExport = getDataToExport();

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "Invoices.xlsx");

    // Reset selection after export
    setSelectedInvoices([]);
  };

  const exportToJSON = () => {
    if (selectedInvoices.length === 0) {
      alert("Please select at least one invoice to export.");
      return;
    }

    const dataToExport = getDataToExport();
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Invoices.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset selection after export
    setSelectedInvoices([]);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const navigate = useNavigate();

  const handleCreateInvoice = () => {
    navigate("/invoice");
  };

  console.log("Paginated Invoices:", paginatedInvoices);

  const handleEditInvoice = (id, timestamp) => {
    navigate(`/editInvoice/${id}/${timestamp}`);
  };

  const handleInvoiceDownload = (id, timestamp) => {
    navigate(`/pdfInvoice/${id}/${timestamp}`);
  };

  const handleInvoiceDelete = async (id, timestamp) => {
    if (!id || !timestamp) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/deleteInvoice?id=${id}&timestamp=${timestamp}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
            Origin: window.location.origin,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete invoice");
      }

      const data = await response.json();

      if (data?.statusCode === 200) {
        const dataVal = await fetchInvoicesData();
        console.log("Fetched and Processed Data:", dataVal); // Debugging: Check the processed data
        setInvoices(dataVal); // Set invoices data after fetching
        const result =
          typeof data?.body === "string" ? JSON.parse(data.body) : data.body;
        toast.success(result.message);
      } else {
        toast.error("Something went wrong while deleting");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header Section */}
      <Header />
      <div className="grid-container">
        <div className="GridHeader">
          <h3>Invoice Management</h3>
          <button onClick={handleCreateInvoice} className="createButton">
            Create Invoice
          </button>
          <button onClick={exportToExcel} className="exportToExcel">
            Export to Excel
          </button>
          <button onClick={exportToJSON} className="exportToJson">
            Export to JSON
          </button>
        </div>
        <ToastContainer />
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Load Invoice List...</p>
          </div>
        ) : (
          <table className="grid-table">
            <thead>
              <tr>
                {Object.keys(filters).map((key) =>
                  key === "InvDate" ? (
                    <th key={key} colSpan="3">
                      <DatePicker
                        selected={filters.InvDate.start}
                        onChange={handleDateChange}
                        startDate={filters.InvDate.start}
                        endDate={filters.InvDate.end}
                        selectsRange
                        isClearable
                        placeholderText="Select Date Range"
                        className="date-picker"
                        disabled={loading} // Disable date picker while loading
                      />
                    </th>
                  ) : (
                    <th key={key}>
                      <input
                        type="text"
                        placeholder={`Search ${key}`}
                        value={filters[key]}
                        onChange={(e) => handleFilterChange(e, key)}
                        className="column-search-input"
                        disabled={loading} // Disable input fields while loading
                      />
                    </th>
                  ),
                )}
                <th></th>
              </tr>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedInvoices.length === paginatedInvoices.length &&
                      paginatedInvoices.length > 0
                    }
                  />
                </th>
                <th>SI No</th>
                {Object.keys(filters).map((key) => (
                  <th key={key}>
                    <button
                      type="button"
                      className="sort-header"
                      onClick={() => handleSort(key)}
                      disabled={loading} // Disable sort buttons while loading
                    >
                      {key}{" "}
                      {sortConfig.key === key &&
                        (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </button>
                  </th>
                ))}

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice, index) => {
                const serialNumber =
                  (currentPage - 1) * rowsPerPage + index + 1;

                const totalPaid = invoice?.invoicePaymentHistory.reduce(
                  (sum, item) => sum + parseFloat(item.paymentAmount || 0),
                  0,
                );
                const oSPayment = parseFloat(invoice?.grandTotal) - totalPaid;

                const invoiceDateObj = new Date(invoice.date);
                invoiceDateObj.setDate(invoiceDateObj.getDate() + 30);
                const paymentDueDate = invoiceDateObj
                  .toISOString()
                  .split("T")[0];
                const currentDate = new Date();
                let daysLate = "Nil";
                if (currentDate > invoiceDateObj) {
                  const timeDifference = currentDate - invoiceDateObj;
                  daysLate = Math.floor(timeDifference / (1000 * 3600 * 24)); // Convert milliseconds to days

                  console.log(`The payment is ${daysLate} days late.`);
                } else {
                  console.log("The payment is not late.");
                }

                return (
                  <tr
                    key={`${invoice.InvNumber}-${index}`} // Use both InvNumber and index for unique key
                    className={
                      index % 2 === 0
                        ? "invoiceGrid even-row"
                        : "invoiceGrid odd-row"
                    }
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.some(
                          (inv) => inv.invoiceNo === invoice.invoiceNo,
                        )}
                        onChange={() => handleRowSelect(invoice)}
                      />
                    </td>
                    <td>{serialNumber}</td>
                    <td>{invoice.date}</td>
                    <td>{invoice.name}</td>
                    <td>{invoice.invoiceNo}</td>
                    <td>{invoice.total}</td>
                    <td>{invoice.grandTotal}</td>
                    <td>{invoice.totalTaxAmount}</td>
                    <td>{totalPaid ? totalPaid : "Nil"}</td>
                    <td>{oSPayment ? oSPayment : "Nil"}</td>
                    <td>{paymentDueDate ? paymentDueDate : "Nil"}</td>
                    <td>{daysLate ? daysLate : "Nil"}</td>
                    <td className="actionButtons">
                      <button
                        className="edit-button"
                        onClick={() =>
                          handleEditInvoice(invoice.id, invoice.Timestamp)
                        }
                      >
                        <FaEye style={{ color: "white" }} />
                      </button>
                      <button
                        className="download-button"
                        onClick={() =>
                          handleInvoiceDownload(invoice.id, invoice.Timestamp)
                        }
                      >
                        <FaDownload style={{ color: "white" }} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() =>
                          handleInvoiceDelete(invoice.id, invoice.Timestamp)
                        }
                      >
                        <FaTrash style={{ color: "white" }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="pagination-container">
          <div className="rows-per-page">
            <label htmlFor="rowsPerPage">Rows per page: </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              disabled={loading} // Disable rows per page selector while loading
            >
              {[5, 10, 25, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="pagination">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* Footer Section */}
      <Footer />
    </>
  );
};

export default InvoiceGrid;
