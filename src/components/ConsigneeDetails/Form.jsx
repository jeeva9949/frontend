import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS
import "./Form.css"; // Import the external CSS file

const Form = ({ onAddCustomer, customerToEdit }) => {
  // State for form data and validation errors
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    address_line_1: "",
    address_line_2: "",
    contact: "",
    placeOfSupply: "",
    gstin: "",
    custId: "",
    email: "",
    id: "", // For editing, include ID
    Timestamp: "", // For editing, include Timestamp
  });

  const [errors, setErrors] = useState({});

  // If customer data is passed for editing, pre-fill the form
  useEffect(() => {
    if (customerToEdit) {
      console.log(
        "customerToEdit =============================:",
        customerToEdit,
      ); // Debug: Check customerToEdit
      setFormData({
        name: customerToEdit.contactName || "",
        client: customerToEdit.client || "",
        address_line_1: customerToEdit.addressLine1 || "",
        address_line_2: customerToEdit.addressLine2 || "",
        contact: customerToEdit.contactNumber || "",
        placeOfSupply: customerToEdit.placeOfSupply || "",
        gstin: customerToEdit.gstin || "",
        custId: customerToEdit.custId || "",
        email: customerToEdit.email || "",
        id: customerToEdit.id || "",
        Timestamp: customerToEdit.Timestamp || "",
      });
    } else {
      // Reset the form if no customerToEdit is passed (new customer form)
      setFormData({
        name: "",
        client: "",
        address_line_1: "",
        address_line_2: "",
        contact: "",
        placeOfSupply: "",
        gstin: "",
        custId: "",
        email: "",
        id: "",
        Timestamp: "",
      });
    }
  }, [customerToEdit]); // Dependency array ensures this runs whenever customerToEdit changes

  // Form validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim() || !/^[a-zA-Z0-9\s]*$/.test(formData.name))
      newErrors.name =
        "Name is required and should contain alphanumeric characters only.";

    if (!formData.client.trim() || !/^[a-zA-Z0-9\s]*$/.test(formData.client))
      newErrors.client =
        "Client Name is required and should contain alphanumeric characters only.";

    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = "Address Line 1 is required.";
    }

    if (!formData.address_line_2.trim()) {
      newErrors.address_line_2 = "Address Line 2 is required.";
    }

    if (
      !formData.placeOfSupply.trim() ||
      !/^[a-zA-Z0-9\s]*$/.test(formData.placeOfSupply)
    )
      newErrors.placeOfSupply =
        "Place of Supply is required and should contain alphanumeric characters only.";

    if (!formData.gstin.trim() || !/^[a-zA-Z0-9]{15}$/.test(formData.gstin))
      newErrors.gstin = "Valid 15-character alphanumeric GSTIN is required.";

    if (!formData.custId.trim() || !/^[a-zA-Z0-9]*$/.test(formData.custId))
      newErrors.custId =
        "Customer ID is required and should contain alphanumeric characters only.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle focus to clear error message for a specific field
  const handleFocus = (e) => {
    const { name } = e.target;
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const response = await fetch(
          `https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/consigneeDetails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
              Origin: window.location.origin,
            },
            body: JSON.stringify({
              ...formData,
              typeOfMethod: customerToEdit ? "updateFields" : "insertFields", // This is for determining insert or update
              id: customerToEdit?.id, // Include ID for updates
              Timestamp: customerToEdit?.Timestamp, // Include Timestamp for updates
            }),
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
          // Show success notification
          toast.success(
            customerToEdit
              ? "Customer details updated successfully!"
              : "Customer added successfully!",
          );

          // Add customer locally after successful API call
          onAddCustomer(formData);

          // Reset form after successful submission
          setFormData({
            name: "",
            client: "",
            address_line_1: "",
            address_line_2: "",
            contact: "",
            placeOfSupply: "",
            gstin: "",
            custId: "",
            email: "",
            id: "", // Reset ID for new form
            Timestamp: "", // Reset Timestamp for new form
          });
          setErrors({}); // Clear errors after successful submission
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        // Show failure notification
        toast.error("Failed to submit data. Please try again.");
      }
    }
  };

  console.log("formData:", formData); // Debug: Check the formData before submission

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <ToastContainer />
      <h2 className="form-title">
        {customerToEdit ? "Edit Customer Details" : "Add Customer Details"}
      </h2>

      {/* Client Field */}
      <div className="form-group">
        <label htmlFor="client">Client:</label>
        <input
          type="text"
          id="client"
          name="client"
          value={formData.client}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter the Client Name"
        />
        <div className="errorBlock">
          {errors.client && <span className="error">{errors.client}</span>}
        </div>
      </div>

      {/* Address Line 1 Field */}
      <div className="form-group">
        <label htmlFor="address_line_1">Address Line 1:</label>
        <input
          type="text"
          id="address_line_1"
          name="address_line_1"
          value={formData.address_line_1}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter Address Line 1"
        />
        <div className="errorBlock">
          {errors.address_line_1 && (
            <span className="error">{errors.address_line_1}</span>
          )}
        </div>
      </div>

      {/* Address Line 2 Field */}
      <div className="form-group">
        <label htmlFor="address_line_2">Address Line 2:</label>
        <input
          type="text"
          id="address_line_2"
          name="address_line_2"
          value={formData.address_line_2}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter Address Line 2"
        />
        <div className="errorBlock">
          {errors.address_line_2 && (
            <span className="error">{errors.address_line_2}</span>
          )}
        </div>
      </div>

      {/* Contact Field */}
      <div className="form-group">
        <label htmlFor="contact">Contact:</label>
        <input
          type="text"
          id="contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter Contact Number"
        />
        <div className="errorBlock">
          {errors.contact && <span className="error">{errors.contact}</span>}
        </div>
      </div>

      {/* Place of Supply Field */}
      <div className="form-group">
        <label htmlFor="placeOfSupply">Place of Supply:</label>
        <input
          type="text"
          id="placeOfSupply"
          name="placeOfSupply"
          value={formData.placeOfSupply}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter Place of Supply"
        />
        <div className="errorBlock">
          {errors.placeOfSupply && (
            <span className="error">{errors.placeOfSupply}</span>
          )}
        </div>
      </div>

      {/* GSTIN Field */}
      <div className="form-group">
        <label htmlFor="gstin">GSTIN:</label>
        <input
          type="text"
          id="gstin"
          name="gstin"
          value={formData.gstin}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter GSTIN"
        />
        <div className="errorBlock">
          {errors.gstin && <span className="error">{errors.gstin}</span>}
        </div>
      </div>

      {/* Customer ID Field */}
      <div className="form-group">
        <label htmlFor="custId">Customer ID:</label>
        <input
          type="text"
          id="custId"
          name="custId"
          value={formData.custId}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter Customer ID"
          disabled={customerToEdit} // Disable if editing
        />
        <div className="errorBlock">
          {errors.custId && <span className="error">{errors.custId}</span>}
        </div>
      </div>

      {/* Email Field */}
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter Email"
        />
        <div className="errorBlock">
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
      </div>

      {/* Name Field */}
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Enter the Name"
        />
        <div className="errorBlock">
          {errors.name && <span className="error">{errors.name}</span>}
        </div>
      </div>

      {/* Submit Button */}
      <div className="submitButtonBlock">
        <button type="submit" className="submit-button">
          {customerToEdit ? "Update Customer" : "Add Customer"}
        </button>
      </div>
    </form>
  );
};

export default Form;
