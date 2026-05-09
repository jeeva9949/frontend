import { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { BarChart } from "@mui/x-charts/BarChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import "./DashboardPage.css"; // We'll also update this file

const sizing = {
  margin: { right: 5 },
  width: 300,
  height: 300,
  legend: { hidden: true },
};

const chartSetting = {
  yAxis: [{ label: "Amount (₹)" }],
  width: 1000,
  height: 400,
  sx: {
    [`.${axisClasses.left} .${axisClasses.label}`]: {
      transform: "translate(-50px, 0)",
    },
  },
};

const valueFormatter = (value) => `₹ ${(value ?? 0).toLocaleString()}`;

const DashboardPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pieData, setPieData] = useState([]);
  const [barDataset, setBarDataset] = useState([]);
  const [invBillData, setinvBillData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState(null);

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
    const result =
      typeof data?.body === "string" ? JSON.parse(data.body) : data.body;
    return Array.isArray(result) ? result : [];
  };

  const groupByMonth = (records) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const grouped = months.map((month) => ({
      month,
      TotalBillGeneratedAmt: 0,
      ReceivedAmt: 0,
      OutstandingAmt: 0,
      totalTaxAmount: 0,
    }));

    records.forEach((record) => {
      if (!record.Timestamp) return;
      const date = new Date(Number(record.Timestamp));
      const monthIndex = date.getMonth();
      const invoicePaidAmt =
        record?.invoicePaymentHistory?.reduce(
          (sum, item) => sum + parseFloat(item?.paymentAmount || 0),
          0,
        ) || 0;
      const grandTotal = parseFloat(record?.grandTotal || 0);
      const totalTaxAmount = parseFloat(record?.totalTaxAmount || 0);
      const invoiceOSPaymentAmt = grandTotal - invoicePaidAmt;

      grouped[monthIndex].TotalBillGeneratedAmt += grandTotal;
      grouped[monthIndex].ReceivedAmt += invoicePaidAmt;
      grouped[monthIndex].OutstandingAmt += invoiceOSPaymentAmt;
      grouped[monthIndex].totalTaxAmount += totalTaxAmount;
    });
    return grouped;
  };

  const getFinancialYearDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const fyStart = new Date(
      currentMonth >= 3 ? currentYear : currentYear - 1,
      3,
      1,
    );
    const fyEnd = new Date(
      currentMonth >= 3 ? currentYear + 1 : currentYear,
      2,
      31,
      23,
      59,
      59,
      999,
    );
    return { fyStart, fyEnd };
  };

  const transformToPieData = (filteredData) => {
    const totals = {
      totalBillGenerated: 0,
      receivedAmount: 0,
      outstandingAmount: 0,
      totalTaxAmount: 0,
    };

    filteredData.forEach((record) => {
      const grandTotal = parseFloat(record?.grandTotal || 0);
      const received =
        record?.invoicePaymentHistory?.reduce(
          (sum, item) => sum + parseFloat(item?.paymentAmount || 0),
          0,
        ) || 0;
      const outstanding = grandTotal - received;
      const taxAmount = parseFloat(record?.totalTaxAmount || 0);

      totals.totalBillGenerated += grandTotal;
      totals.receivedAmount += received;
      totals.outstandingAmount += outstanding;
      totals.totalTaxAmount += taxAmount;
    });

    return [
      {
        id: "bill",
        label: "Total Bill",
        value: totals.totalBillGenerated,
        color: "#0088FE",
      },
      {
        id: "received",
        label: "Received",
        value: totals.receivedAmount,
        color: "#00C49F",
      },
      {
        id: "outstanding",
        label: "Outstanding",
        value: totals.outstandingAmount,
        color: "#FFBB28",
      },
      {
        id: "tax",
        label: "Tax",
        value: totals.totalTaxAmount,
        color: "#FF8042",
      },
    ].filter((item) => item.value > 0);
  };

  const customerNames = [...new Set(invBillData.map((record) => record.name))];

  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setSelectedCategory(selected);
    const { fyStart, fyEnd } = getFinancialYearDates();

    const filteredData = invBillData.filter((record) => {
      if (!record.Timestamp) return false;
      const recordDate = new Date(Number(record.Timestamp));
      return (
        recordDate >= fyStart && recordDate <= fyEnd && record.name === selected
      );
    });

    const pieDataForSelected = transformToPieData(filteredData);
    setPieData(pieDataForSelected);

    if (selected) {
      const customerBarData = groupByMonth(filteredData);
      setBarDataset(customerBarData);

      // Set Customer Details (first matching record)
      const customerInfo = invBillData.find((r) => r.name === selected);
      setCustomerDetails(customerInfo || null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const invoiceData = await fetchInvoicesData();
        setinvBillData(invoiceData);

        const groupedData = groupByMonth(invoiceData);
        setBarDataset(groupedData);

        const defaultName = [...new Set(invoiceData.map((r) => r.name))][0];
        if (defaultName) {
          setSelectedCategory(defaultName);
          const { fyStart, fyEnd } = getFinancialYearDates();
          const filteredData = invoiceData.filter((record) => {
            if (!record.Timestamp) return false;
            const recordDate = new Date(Number(record.Timestamp));
            return (
              recordDate >= fyStart &&
              recordDate <= fyEnd &&
              record.name === defaultName
            );
          });
          const pieDataForSelected = transformToPieData(filteredData);
          setPieData(pieDataForSelected);

          const customerInfo = invoiceData.find((r) => r.name === defaultName);
          setCustomerDetails(customerInfo || null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalPieValue = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <Header />

      <div className="dashboard-container">
        <div className="barChartBlock">
          {barDataset.length > 0 ? (
            <BarChart
              dataset={barDataset}
              xAxis={[
                {
                  scaleType: "band",
                  dataKey: "month",
                  label: "Financial Year",
                },
              ]}
              series={[
                {
                  dataKey: "TotalBillGeneratedAmt",
                  label: "Total Bill Generated",
                  valueFormatter,
                },
                {
                  dataKey: "ReceivedAmt",
                  label: "Received Amount",
                  valueFormatter,
                },
                {
                  dataKey: "totalTaxAmount",
                  label: "Tax Amount",
                  valueFormatter,
                },
                {
                  dataKey: "OutstandingAmt",
                  label: "Outstanding Amount",
                  valueFormatter,
                },
              ]}
              {...chartSetting}
            />
          ) : (
            <p>Loading bar chart...</p>
          )}
        </div>

        <div className="customer-select-block">
          <label>Select Customer: </label>
          <select
            id="customer-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            {customerNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="piechartBlock">
          {customerDetails && (
            <div className="customer-details-card">
              <h3>Customer Details</h3>
              <p>
                <strong>Name:</strong> {customerDetails.name}
              </p>
              <p>
                <strong>Mobile:</strong> {customerDetails.mobileNo}
              </p>
              <p>
                <strong>Email:</strong> {customerDetails.emailId}
              </p>
              <p>
                <strong>GST No:</strong> {customerDetails.gstin}
              </p>
              <p>
                <strong>State:</strong> {customerDetails.stateName}
              </p>
              <p>
                <strong>Address:</strong> {customerDetails.address}
              </p>
            </div>
          )}

          {loading ? (
            <p>Loading pie chart...</p>
          ) : pieData.length > 0 ? (
            <div className="piechart">
              <PieChart
                width={400}
                height={400}
                series={[
                  {
                    data: pieData,
                    outerRadius: 120,
                    arcLabel: (params) =>
                      `${params.label}: ₹${params.value.toLocaleString()}`,
                    arcLabelMinAngle: 5,
                  },
                ]}
                sx={{
                  [`& .${pieArcLabelClasses.root}`]: {
                    fontSize: "14px",
                    fill: "#333",
                    fontWeight: 500,
                    fontFamily: "Segoe UI, sans-serif",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.05)",
                  },
                }}
                slotProps={{
                  legend: {
                    direction: "row",
                    position: { vertical: "bottom", horizontal: "middle" },
                  },
                }}
              />
            </div>
          ) : (
            <p>No data available for the selected customer</p>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default DashboardPage;
