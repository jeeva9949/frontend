import React, { useState, useEffect } from "react";
import CustomerForm from "../../components/ConsigneeDetails/Form";
import CustomerGrid from "../../components/ConsigneeDetails/Grid";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "../../components/layout/header.css";
import { FiCommand } from "react-icons/fi";

const ConsigneeDetails = () => {
  const [customers, setCustomers] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Track error state

  useEffect(() => {
    const fetchConsigneeDetails = async () => {
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

        const result = await response.json();
        console.log("Response from server:", result);

        // Assuming the API response contains the customer data
        // Ensure that the data is an array before setting it
        setCustomers(result || []); // Default to an empty array if data is missing
      } catch (error) {
        setError(error.message); // Set error message if the API call fails
      } finally {
        setLoading(false); // Set loading to false after the API call completes
      }
    };

    fetchConsigneeDetails();
  }, []); // Empty dependency array means this effect runs only once when the component mounts

  const addCustomer = (newCustomer) => {
    setCustomers((prevCustomers) => [...prevCustomers, newCustomer]);
  };

  // Render loading state while waiting for API response
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Load Consignee List...</p>
      </div>
    );
  }

  // Render error message if there was an error in the API call
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      {/* Header Section */}
      <Header />
      <div>
        {/* Pass the addCustomer function to the form */}
        {/* <CustomerForm onAddCustomer={addCustomer} /> */}
        {/* Pass customers state to CustomerGrid */}
        <CustomerGrid customers={customers} />
      </div>
      {/* Footer Section */}
      <Footer />
    </>
  );
};

export default ConsigneeDetails;
