import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Grid.css"; // External CSS for styling
import { FaUserEdit, FaCheckCircle, FaBan } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify"; // Ensure ToastContainer is imported
import "react-toastify/dist/ReactToastify.css";

const CustomerGrid = ({ customers = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [customersData, setCustomersData] = useState(customers);
  const [filters, setFilters] = useState({
    client: "",
    addressLine1: "",
    addressLine2: "",
    placeOfSupply: "",
    gstin: "",
    contactName: "",
    contactNumber: "",
    id: "", // Changed from custId to id
    email: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const rowsPerPage = 5;

  const navigate = useNavigate();

  // Handle search for individual columns
  const handleFilterChange = (e, column) => {
    setFilters({ ...filters, [column]: e.target.value });
  };

  // Apply column filters dynamically
  const filteredCustomers = customersData.filter((customer) =>
    Object.keys(filters).every((key) => {
      const filterValue = filters[key].toLowerCase().trim();
      const customerValue = customer[key];

      if (!filterValue) return true; // If filter value is empty, don't filter this column

      // If it's a string, apply the filtering
      if (customerValue && typeof customerValue === "string") {
        return customerValue.toLowerCase().includes(filterValue);
      }

      // For non-string customer values, apply .toString() and then filter
      return customerValue?.toString().toLowerCase().includes(filterValue);
    }),
  );

  // Sorting logic
  if (sortConfig.key) {
    filteredCustomers.sort((a, b) => {
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key])
        return -1 * directionMultiplier;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * directionMultiplier;
      return 0;
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

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

  const handleToggleActivation = async (customerId) => {
    const customer = customersData.find(
      (customer) => customer.id === customerId,
    ); // Updated to use 'id'
    const updatedStatus = customer.status === "active" ? "inactive" : "active";

    // Use the timestamp from the existing customer object
    const timestamp = customer.Timestamp; // Get the timestamp directly from the existing object

    // Optimistic update: Update status locally before calling API
    const updatedCustomers = customersData.map((customer) =>
      customer.id === customerId
        ? { ...customer, status: updatedStatus, Timestamp: timestamp } // Use the existing timestamp here
        : customer,
    );
    setCustomersData(updatedCustomers);

    // Call API to update status on the server
    try {
      const response = await fetch(
        "https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/consigneeDetails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
            Origin: window.location.origin,
          },
          body: JSON.stringify({
            typeOfMethod: "updateStatus",
            status: updatedStatus,
            id: customerId, // Use 'id' instead of 'custId'
            Timestamp: timestamp, // Send the existing timestamp in the API request body
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Success notification
      toast.success(
        "Customer status is successfully updated to " + updatedStatus + "!",
      );
    } catch (error) {
      console.error(error);
      // Failure notification
      toast.error(
        "Failed to update " + updatedStatus + " status. Please try again.",
      );

      // Optionally revert status change if API call fails
      const revertedCustomers = customersData.map(
        (customer) =>
          customer.id === customerId
            ? { ...customer, status: customer.status }
            : customer, // Updated to use 'id'
      );
      setCustomersData(revertedCustomers);
    }
  };

  const formatKeyToLabel = (key) => {
    return key
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCreateUser = () => {
    navigate("/cdForm");
  };

  const handleEditUser = (customerId) => {
    console.log("customerId =======================", customerId);
    // Navigate to the "cdForm" page with the customer ID as a parameter
    navigate(`/cdForm/${customerId}`); // Pass the customerId to the form page
  };

  return (
    <div className="customer-grid-container">
      <ToastContainer />
      <div className="GridHeader">
        <h3>Customer Management</h3>
        <button onClick={handleCreateUser} className="createUserButton">
          Create User
        </button>
      </div>
      <table className="customer-table">
        <thead>
          <tr>
            <th></th>
            {Object.keys(filters).map((key) => (
              <th key={key}>
                <input
                  type="text"
                  placeholder={`Search ${formatKeyToLabel(key)}`}
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(e, key)}
                  className="column-search-input"
                />
              </th>
            ))}
            <th></th>
            <th></th>
          </tr>
          <tr>
            <th>Serial No</th>
            {[
              { key: "client", label: "Client Name" },
              { key: "addressLine1", label: "Address Line 1" },
              { key: "addressLine2", label: "Address Line 2" },
              { key: "placeOfSupply", label: "Place of Supply" },
              { key: "gstin", label: "GSTIN" },
              { key: "contactName", label: "Contact Name" },
              { key: "custId", label: "Customer ID" },
              { key: "contactNumber", label: "Phone" },
              { key: "email", label: "Email" },
              { key: "timestamp", label: "Timestamp" }, // Add timestamp column header
            ].map(({ key, label }) => (
              <th key={key}>
                <button
                  type="button"
                  className="sort-header"
                  onClick={() => handleSort(key)}
                >
                  {label}{" "}
                  {sortConfig.key === key &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </button>
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCustomers.map((customer, index) => {
            const serialNumber = (currentPage - 1) * rowsPerPage + index + 1;
            const isActive = customer.status === "active"; // Use status directly from customer
            return (
              <tr
                key={customer.id} // Updated to use 'id'
                className={index % 2 === 0 ? "even-row" : "odd-row"}
              >
                <td>{serialNumber}</td>
                <td>{customer.client}</td>
                <td>{customer.addressLine1}</td>
                <td>{customer.addressLine2}</td>
                <td>{customer.placeOfSupply}</td>
                <td>{customer.gstin}</td>
                <td>{customer.contactName}</td>
                <td>{customer.custId}</td>
                <td>{customer.contactNumber}</td>
                <td>{customer.email}</td>
                <td>{new Date(customer.Timestamp).toLocaleString()}</td>
                <td className="actionButtons">
                  <button
                    className="edit-button"
                    onClick={() => handleEditUser(customer.id)} // Pass the 'id' to navigate to the edit page
                  >
                    <FaUserEdit style={{ color: "white" }} />
                  </button>
                  <button
                    className={`status-button ${isActive ? "active" : "inactive"}`}
                    onClick={() => handleToggleActivation(customer.id)} // Updated to use 'id'
                  >
                    {isActive ? <FaCheckCircle /> : <FaBan />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
  );
};

export default CustomerGrid;
