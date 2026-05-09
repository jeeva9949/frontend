import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // For handling dynamic customer IDs
import CustomerForm from "../../components/ConsigneeDetails/Form";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "../../components/layout/header.css";
import { FiCommand } from "react-icons/fi";

const ConsigneeDetails = () => {
  const [editCustomer, setEditCustomer] = useState(null); // To store customer data for editing
  const [loading, setLoading] = useState(false); // For loading state
  const { id } = useParams(); // Get the customer ID from the URL for editing (if available)
  const navigate = useNavigate();

  // Fetch customer by ID when id is available in the URL
  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchCustomerById = async () => {
        try {
          const response = await fetch(
            `https://7gqxfqaejf.execute-api.ap-south-1.amazonaws.com/dev/getConsigneeDetails?id=${id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": "CgGBBwnnkF3mny9LNTeoo4maOep63jid207q9tc2",
                Origin: window.location.origin, // Make sure to specify your front-end URL here
                "x-requested-with": "XMLHttpRequest",
              },
            },
          );

          // Check if response is successful
          if (!response.ok) {
            throw new Error("Failed to submit data");
          }

          const data = await response.json();
          console.log("Response from server:", data);

          if (data && data.length > 0) {
            setEditCustomer(data[0]); // Set the customer data for editing
          } else {
            // Handle case where customer ID is not found
            navigate("/cdGrid"); // Redirect if no customer found
          }
        } catch (error) {
          console.error("Error fetching customer by ID:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCustomerById();
    } else {
      setEditCustomer(null); // Clear the form if no ID
    }
  }, [id, navigate]); // This effect runs every time the `id` changes

  // Add or update customer in the state
  const addCustomer = (newCustomer) => {
    // If the customer has an id, update the customer
    if (newCustomer.id) {
      setEditCustomer(newCustomer); // Set the updated customer details
    } else {
      // Otherwise, handle the addition of the new customer
      console.log("Adding new customer:", newCustomer);
    }
    navigate("/cdGrid"); // Redirect to grid after add/update
  };

  // Loading state with GIF and blur effect
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <FiCommand class="loading-icon" style={{ color: "white" }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      {/* Pass the correct prop name (customerToEdit) to match with the child component */}
      <CustomerForm onAddCustomer={addCustomer} customerToEdit={editCustomer} />
      <Footer />
    </>
  );
};

export default ConsigneeDetails;
