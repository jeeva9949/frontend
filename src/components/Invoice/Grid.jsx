import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Grid.css"; // External CSS for styling
import { FaEye } from "react-icons/fa";

// Function to fetch invoices from the Lambda endpoint
const fetchInvoicesData = async () => {
  const response = await fetch(
    "https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/getInvoices",
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
  return data;
};

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
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [loading, setLoading] = useState(false); // For loading state
  const [error, setError] = useState(null); // For error handling

  const navigate = useNavigate();

  // Fetch invoices when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchInvoicesData();
        console.log("data ===========================", data);
        setInvoices(data); // Set invoices data after fetching
      } catch (err) {
        setError("Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e, column) => {
    setFilters({ ...filters, [column]: e.target.value });
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setFilters((prevFilters) => ({
      ...prevFilters,
      InvDate: { start, end },
    }));
  };

  const filteredInvoices = invoices.filter((invoice) => {
    return (
      (!filters.InvDate.start ||
        (new Date(invoice.InvDate) >= filters.InvDate.start &&
          new Date(invoice.InvDate) <= filters.InvDate.end)) &&
      Object.keys(filters).every((key) => {
        if (key === "InvDate") return true;
        return invoice[key]
          ?.toString()
          .toLowerCase()
          .includes(filters[key].toLowerCase());
      })
    );
  });

  if (sortConfig.key) {
    filteredInvoices.sort((a, b) => {
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key])
        return -1 * directionMultiplier;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * directionMultiplier;
      return 0;
    });
  }

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

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCheckboxChange = (invoiceNumber) => {
    setSelectedInvoices((prevSelected) => {
      if (prevSelected.includes(invoiceNumber)) {
        return prevSelected.filter((num) => num !== invoiceNumber);
      } else {
        return [...prevSelected, invoiceNumber];
      }
    });
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCreateInvoice = () => {
    navigate("/invoiceForm");
  };

  // If still loading, show loading state
  if (loading) {
    return <div>Loading invoices...</div>;
  }

  // If there was an error fetching data, display error message
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="grid-container">
      <div className="GridHeader">
        <h3>Invoice Management</h3>
        <button onClick={handleCreateInvoice} className="createButton">
          Create Invoice
        </button>
      </div>
      <table className="grid-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedInvoices(
                      paginatedInvoices.map((inv) => inv.InvNumber),
                    );
                  } else {
                    setSelectedInvoices([]);
                  }
                }}
                checked={
                  paginatedInvoices.length > 0 &&
                  paginatedInvoices.every((inv) =>
                    selectedInvoices.includes(inv.InvNumber),
                  )
                }
              />
            </th>
            <th>Serial No</th>
            {Object.keys(filters).map((key) => (
              <th key={key}>
                {key === "InvDate" ? (
                  <DatePicker
                    selected={filters.InvDate.start}
                    onChange={handleDateChange}
                    startDate={filters.InvDate.start}
                    endDate={filters.InvDate.end}
                    selectsRange
                    isClearable
                    placeholderText="Select Date Range"
                    className="date-picker"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={`Search ${key}`}
                    value={filters[key]}
                    onChange={(e) => handleFilterChange(e, key)}
                    className="column-search-input"
                  />
                )}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvoices.map((invoice, index) => {
            const serialNumber = (currentPage - 1) * rowsPerPage + index + 1;
            return (
              <tr
                key={invoice.InvNumber}
                className={index % 2 === 0 ? "even-row" : "odd-row"}
              >
                <td>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange(invoice.InvNumber)}
                    checked={selectedInvoices.includes(invoice.InvNumber)}
                  />
                </td>
                <td>{serialNumber}</td>
                <td>{invoice.InvDate}</td>
                <td>{invoice.ClientsName}</td>
                <td>{invoice.InvNumber}</td>
                <td>{invoice.InvNetTotal}</td>
                <td>{invoice.InvGrandTotal}</td>
                <td>{invoice.InvTax}</td>
                <td>{invoice.ADPayment}</td>
                <td>{invoice.OSAmount}</td>
                <td>{invoice.ODDate}</td>
                <td className="actionButtons">
                  <button
                    className="edit-button"
                    onClick={() => alert(`Edit Invoice ${invoice.InvNumber}`)}
                  >
                    <FaEye style={{ color: "white" }} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination-container">
        <div className="rows-per-page">
          <label htmlFor="rowsPerPage">Rows per page: </label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
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
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGrid;
