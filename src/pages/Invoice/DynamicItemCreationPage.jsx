import React, { useState } from "react";
import { FaTrash, FaPlus } from "react-icons/fa";
import "./DynamicItemCreationPage.css";

const DynamicTable = ({ rows = [], setRows }) => {
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;

    // Ensure the row exists before updating
    if (!rows[index]) {
      console.error(`Row at index ${index} does not exist.`);
      return;
    }

    const updatedRows = [...rows];
    updatedRows[index][name] = value;

    // Recalculate amount when quantity or rate changes
    if (name === "quantity" || name === "rate") {
      if (name === "rate") {
        updatedRows[index][name] = value.replace(/,/g, "");
      }
      console.log('calculateAmount(updatedRows[index]) ==============', calculateAmount(updatedRows[index]));
      updatedRows[index].amount = calculateAmount(updatedRows[index]);
    }

    // Handle HSN/SAC selection validation
    /*if (name === "hsnSac") {
      const is998898Selected = updatedRows.some((row) => row.hsnSac === "998898");
      const isOtherHSNSelected = updatedRows.some(
        (row) =>
          row.hsnSac !== "998898" &&
          ["82075000", "84603910", "84669390"].includes(row.hsnSac)
      );

      if (value === "998898" && isOtherHSNSelected) {
        alert("HSN/SAC '998898' cannot be selected with other values.");
        updatedRows[index][name] = ""; // Clear invalid selection
      } else if (
        ["82075000", "84603910", "84669390"].includes(value) &&
        is998898Selected
      ) {
        alert(`HSN/SAC '${value}' cannot be selected with '998898'.`);
        updatedRows[index][name] = ""; // Clear invalid selection
      }
    } */

    if (name === "descriptionOptions") {
      const endsWithNEW = value.toUpperCase().endsWith("NEW");

      updatedRows[index].hideDescriptionDriveOptions = !endsWithNEW;
      updatedRows[index].hideDriveOptionValues = !endsWithNEW;

      // Clear values if hiding
      if (!endsWithNEW) {
        updatedRows[index].descriptiondriveOptions = "";
        updatedRows[index].driveOptionValues = "";
      }
    }

    setRows(updatedRows);
  };

  const calculateAmount = (row) => {
    if (row.quantity && row.rate) {
      return (parseFloat(row.quantity) * parseFloat(row.rate)).toLocaleString(
        "en-IN",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      );
    }
    return "0.00";
  };

  const getAvailableOptions = () => {
    /*const is998898Selected = rows.some((row) => row.hsnSac === "998898");
    const isOtherHSNSelected = rows.some(
      (row) =>
        row.hsnSac !== "998898" &&
        ["82075000", "84603910", "84669390"].includes(row.hsnSac)
    );

    if (is998898Selected && rows.length >= 2) {
      return ["998898"]; // Only allow 998898
    } else if (isOtherHSNSelected && rows.length >= 2) {
      return ["82075000", "84603910", "84669390"]; // Only allow other values
    } */

    // Allow all options if no restrictions
    return ["82075000", "84603910", "84669390", "998898"];
  };

  const addRow = () => {
    const newRow = {
      slNo: rows.length + 1,
      descriptionOptions: "",
      description: "",
      typeOptions: "",
      hsnSac: "",
      quantity: "",
      rate: "",
      per: "No's",
      discount: "",
      amount: "0.00",
      descriptiondriveOptions: "",
      driveOptionValues: "", // Initialize as an empty array
    };

    const updatedRows = [...rows];
    if (rows.length < 5) {
      // Insert before `emptyRow_columns`
      updatedRows.splice(rows.length, 0, newRow);
    } else {
      // Append to the end
      updatedRows.push(newRow);
    }

    // Update rows and reassign SL numbers
    setRows(updatedRows.map((row, i) => ({ ...row, slNo: i + 1 })));
  };

  const removeRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows.map((row, i) => ({ ...row, slNo: i + 1 })));
  };

  const totalQuantity = rows.reduce(
    (total, row) => total + parseFloat(row.quantity || 0),
    0,
  );

  const [selectedDriver, setSelectedDriver] = useState("");
  const [options, setOptions] = useState([]);

  const driverOptions = {
    CD_C: [
      "10 X 40MM",
      "10 X 50MM",
      "16 X 40MM",
      "16 X 50MM",
      "20 X 50MM",
      "25 X 70MM",
      "32 X 60MM",
      "40 X 70MM",
    ],
    CD_Cs: ["10 X 45MM", "16 X 45MM", "16 X 53MM", "25 X 80MM", "16 X 80MM"],
    CD_N: ["10 X 40MM", "16 X 40MM", "16 X 50MM", "25 X 70MM"],
    CD_Nsi: ["10 X 45MM", "16 X 45MM", "16 X 53MM", "25 X 80MM"],
    "CD_I'F": [
      "12.7 X 38.1MM",
      "19.05 X 70MM",
      "25.4 X 70MM",
      "31.75 X 70MM",
      "38.1 X 70MM",
    ],
    "CD_I'Fs": ["19.05 X 70MM", "25.4 X 70MM", "31.75 X 70MM", "38.1 X 70MM"],
    CD_IUFs: ["12.7 X 38.1MM", "19.05 X 70MM", "25.4 X 70MM"],
    CD_VDI: [
      "10 X 68MM [M6 X0.5]",
      "16 X 90MM [M10X1]",
      "25 X 112MM [M16X1.5]",
    ],
    CD_VDIs: ["16 X 110MM [M10X1]", "25 X 142MM [M16X1.5]"],
    CD_WD: [
      "10 X 40MM",
      "12 X 45MM",
      "16 X 48MM",
      "20 X 50MM",
      "25 X 56MM",
      "32 X 60MM",
      "40 X 70MM",
    ],
    CD_WDs: ["10 X 45MM", "12 X 50MM", "16 X 50MM", "16 X 80MM", "20 X 50MM"],
    CD_W2N: ["25 X 56MM", "32 X 60MM", "40 X 70MM"],
    CD_W2Ns: ["25 X 56MM", "32 X 60MM", "40 X 70MM"],
    CD_HE: [
      "10 X 40MM",
      "12 X 45MM",
      "16 X 48MM",
      "20 X 50MM",
      "25 X 56MM",
      "32 X 60MM",
      "40 X 70MM",
    ],
    CD_NsP: ["25 X 72MM"],
    CD_SCPN: [
      "4 X 48MM",
      "6 X 45MM",
      "10 X 70MM",
      "10 X 45MM",
      "10 X 55MM",
      "12.7 X 48MM",
      "20 X 50MM",
      "HB 6 X 50MM",
      "HB 10 X 55MM",
      "HB 12 X 60MM",
      "HB 16 X 63MM",
      "HE 6 X 50MM",
      "HE 10 X 55MM",
      "HE 12 X 60MM",
      "HE 16 X 63MM",
    ],
    CD_SCPH: [
      "10 X 70MM",
      "12.7 X 65MM [M6 X 0.5]",
      "16 X 105MM [M10X1]",
      "HA 4 X 46MM",
      "HA 6 X 50MM",
      "HA 10 X 55MM",
      "HA 12 X 60MM",
      "HA 16 X 63MM",
    ],
    CD_XFN: ["16 X 58MM"],
    CD_XFNs: ["16 X 77MM"],
    CD_ADAC: [
      "16 X 112MM [ET16 X 1.5]",
      "20 X 126MM [ET20X2]",
      "28 X 126MM [ET28X2]",
      "36 X 162MM [ET36X2]",
    ],
    CD_GKT: [
      "10 X 60MM [M6 X0.5]",
      "16 X 80MM [M10X1]",
      "25 X 100MM [M16X1.5]",
    ],
    CD_GKTs: ["16 X 80MM [M10X1]", "25 X 100MM [M16X1.5]"],
  };

  const handleDriverChange = (index, e) => {
    const selectedDriver = e.target.value;
    const driverKey = selectedDriver.split(": ")[1];

    // First, update other input fields if necessary (using handleInputChange if needed)
    handleInputChange(index, e);

    // Update the specific row's descriptiondriveOptions and driveOptionValues
    const updatedRows = [...rows];
    updatedRows[index].descriptiondriveOptions = selectedDriver;
    updatedRows[index].driveOptionValues = driverOptions[driverKey] || ""; // Ensure it's always an array

    // Update rows with modified data
    setRows(updatedRows);
  };

  function handleRateBlur(index) {
    const updatedRows = [...rows];
    let rawRate = updatedRows[index].rate.toString().replace(/,/g, "");

    if (!isNaN(rawRate) && rawRate !== "") {
      updatedRows[index].rate = Number(rawRate).toLocaleString("en-IN");
    }

    setRows(updatedRows); // ✅ triggers re-render, input shows "10,000"
  }

  return (
    <>

    <section className="card product-card">
      
      <div className="section-title">
        <span>Product Details</span>
        <button className="btn-add">
          <FaPlus /> Add Item
        </button>
      </div>

      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Description of Goods</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Per</th>
              <th>Disc</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
            <React.Fragment key={index}>
            <tr>
              <td>{index + 1}</td>
              <td className="desc-cell">
                  <select
                    className="descriptionOptions"
                    name="descriptionOptions"
                    value={row.descriptionOptions}
                    onChange={(e) => handleInputChange(index, e)}
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    <option value="GUNDRILL NEW">GUNDRILL NEW</option>
                    <option value="GUNDRILL RE-TIPPING">
                      GUNDRILL RE-TIPPING
                    </option>
                    <option value="GUNDRILL RE-CONDITIONING">
                      GUNDRILL RE-CONDITIONING
                    </option>
                    <option value="GUNDRILL RE-SHARPENING">
                      GUNDRILL RE-SHARPENING
                    </option>
                    <option value="TWO FLUTE GUNDRILL NEW">
                      TWO FLUTE GUNDRILL NEW
                    </option>
                    <option value="TWO FLUTE GUNDRILL RE-TIPPING">
                      TWO FLUTE GUNDRILL RE-TIPPING
                    </option>
                    <option value="TWO FLUTE GUNDRILL RE-CONDITIONING">
                      TWO FLUTE GUNDRILL RE-CONDITIONING
                    </option>
                    <option value="TWO FLUTE GUNDRILL RE-SHARPENING">
                      TWO FLUTE GUNDRILL RE-SHARPENING
                    </option>
                    <option value="GUNDRILL RE-SHARPENING - SPL PROFILE">
                      GUNDRILL RE-SHARPENING - SPL PROFILE
                    </option>
                    <option value="STS-BTA_NEW">STS-BTA_NEW</option>
                    <option value="STS-BTA_RE-TIPPING">
                      STS-BTA_RE-TIPPING
                    </option>
                    <option value="DTS_EJECTOR DRILL H_BTA_NEW">
                      DTS_EJECTOR DRILL H_BTA_NEW
                    </option>
                    <option value="DTS_EJECTOR DRILL H_BTA_RETIPPING">
                      DTS_EJECTOR DRILL H_BTA_RETIPPING
                    </option>
                    <option value="GUNDRILL ACCESSORIES">
                      GUNDRILL ACCESSORIES
                    </option>
                    <option value="DEEP HOLE DRILLING ACCESSORIES">
                      DEEP HOLE DRILLING ACCESSORIES
                    </option>
                    <option value="INDEXABLE INSERT GUNDRILL NEW">
                      INDEXABLE INSERT GUNDRILL NEW
                    </option>
                    <option value="INDEXABLE INSERT GUNDRILL RE-TIPPING">
                      INDEXABLE INSERT GUNDRILL RE-TIPPING
                    </option>
                    <option value="INDEXABLE INSERT GUNDRILL RE-CONDITIONING">
                      INDEXABLE INSERT GUNDRILL RE-CONDITIONING
                    </option>
                    <option value="GUNDRILL RE-SHARPENING MACHINE">
                      GUNDRILL RE-SHARPENING MACHINE
                    </option>
                    <option value="PULL BORE REAMER">PULL BORE REAMER</option>
                    <option value="PUSH BORE REAMER">PUSH BORE REAMER</option>
                    <option value="RIFILING BUTTONS">RIFILING BUTTONS</option>
                    <option value="MULTIPOINT BRAZED CUTTERS">
                      MULTIPOINT BRAZED CUTTERS
                    </option>
                  </select>
                  <textarea
                    className="descriptionText"
                    name="description"
                    value={row.description}
                    onChange={(e) => handleInputChange(index, e)}
                    placeholder="Enter Description"
                  />
                  <select
                    className="typeOptions"
                    name="typeOptions"
                    value={row.typeOptions}
                    onChange={(e) => handleInputChange(index, e)}
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    <option value="TYPE: GC 20 CARBIDE COATED">
                      TYPE: GC 20 CARBIDE COATED
                    </option>
                    <option value="TYPE: GC 20 CARBIDE UNCOATED">
                      TYPE: GC 20 CARBIDE UNCOATED
                    </option>
                    <option value="TYPE: GC 30 CARBIDE COATED">
                      TYPE: GC 30 CARBIDE COATED
                    </option>
                    <option value="TYPE: GC 12.5-1 CARBIDE COATED">
                      TYPE: GC 12.5-1 CARBIDE COATED
                    </option>
                    <option value="TYPE: GC 12.5-1 CARBIDE UNCOATED">
                      TYPE: GC 12.5-1 CARBIDE UNCOATED
                    </option>
                    <option value="TYPE: PCD 9.5MP GC 20 CARBIDE COATED">
                      TYPE: PCD 9.5MP GC 20 CARBIDE COATED
                    </option>
                    <option value="TYPE: PCD 9.5MP GC 20 CARBIDE UNCOATED">
                      TYPE: PCD 9.5MP GC 20 CARBIDE UNCOATED
                    </option>
                    <option value="TYPE: P20 CARBIDE HEAD COATED">
                      TYPE: P20 CARBIDE HEAD COATED
                    </option>
                    <option value="TYPE: P20 CARBIDE HEAD UNCOATED">
                      TYPE: P20 CARBIDE HEAD UNCOATED
                    </option>
                    <option value="TYPE: SA6H CARBIDE HEAD COATED">
                      TYPE: SA6H CARBIDE HEAD COATED
                    </option>
                    <option value="TYPE: SA10H CARBIDE HEAD COATED">
                      TYPE: SA10H CARBIDE HEAD COATED
                    </option>
                    <option value="TYPE: SA6H CARBIDE HEAD UNCOATED">
                      TYPE: SA6H CARBIDE HEAD UNCOATED
                    </option>
                    <option value="TYPE: SA10H CARBIDE HEAD UNCOATED">
                      TYPE: SA10H CARBIDE HEAD UNCOATED
                    </option>
                    <option value="TYPE: RC 25 BORE REAMER COATED">
                      TYPE: RC 25 BORE REAMER COATED
                    </option>
                    <option value="TYPE: RC 25 BORE REAMER UNCOATED">
                      TYPE: RC 25 BORE REAMER UNCOATED
                    </option>
                    <option value="TYPE: GUNDRILL GUIDE BUSH CABIDE">
                      TYPE: GUNDRILL GUIDE BUSH CABIDE
                    </option>
                    <option value="TYPE: GUNDRILL GUIDE BUSH EN-STEEL">
                      TYPE: GUNDRILL GUIDE BUSH EN-STEEL
                    </option>
                    <option value="TYPE: GUNDRILL GUIDE BUSH F-ST-CD">
                      TYPE: GUNDRILL GUIDE BUSH F-ST-CD
                    </option>
                    <option value="TYPE: FORMED_WHIP GUIDES SF-GN">
                      TYPE: FORMED_WHIP GUIDES SF-GN
                    </option>
                    <option value="TYPE: FORMED_WHIP GUIDES TF-GN">
                      TYPE: FORMED_WHIP GUIDES TF-GN
                    </option>
                    <option value="TYPE: WHIP GUIDES BTA/ ROUND">
                      TYPE: WHIP GUIDES BTA/ ROUND
                    </option>
                    <option value="TYPE: BTA/ EJECTOR DRILL TUBES">
                      TYPE: BTA/ EJECTOR DRILL TUBES
                    </option>
                    <option value="TYPE: SF-GN-INSERTS">
                      TYPE: SF-GN-INSERTS
                    </option>
                    <option value="TYPE: BTA / EJECTOR INSERTS">
                      TYPE: BTA / EJECTOR INSERTS
                    </option>
                    <option value="TYPE: SSHTN-PGDRG-MS02">
                      TYPE: SSHTN-PGDRG-MS02
                    </option>
                    <option value="TYPE: SSHTN-PGDRG-UF-01">
                      TYPE: SSHTN-PGDRG-UF-01
                    </option>
                    <option value="TYPE: COMBIN-PULL-RIFILING">
                      TYPE: COMBIN-PULL-RIFILING
                    </option>
                    <option value="TYPE: COMBIN-PUSH-RIFILING">
                      TYPE: COMBIN-PUSH-RIFILING
                    </option>
                    <option value="TYPE: PULL RIFILE BUTTONS">
                      TYPE: PULL RIFILE BUTTONS
                    </option>
                    <option value="TYPE: PUSH RIFILE BUTTONS">
                      TYPE: PUSH RIFILE BUTTONS
                    </option>
                    <option value="TYPE: CUTTERS_FORM">
                      TYPE: CUTTERS_FORM
                    </option>
                    <option value="TYPE: MULTIPOINT BRAZED CUTTERS">
                      TYPE: MULTIPOINT BRAZED CUTTERS
                    </option>
                    <option value="TYPE: CUTTERS_PCD">TYPE: CUTTERS_PCD</option>
                  </select>
                  <div className="driverOptions">
                    {/* First Dropdown: Driver Selection */}
                    <select
                      className="descriptiondriveOptions"
                      name="descriptiondriveOptions"
                      value={row.descriptiondriveOptions}
                      onChange={(e) => handleDriverChange(index, e)}
                      style={{
                        display: row.hideDescriptionDriveOptions
                          ? "none"
                          : "block",
                      }}
                    >
                      <option value="">Select a driver</option>
                      {Object.keys(driverOptions).map((key) => (
                        <option key={key} value={`DRIVER: ${key}`}>
                          {" "}
                          DRIVER: {key}{" "}
                        </option>
                      ))}
                    </select>

                    {/* Second Dropdown: Drive Option Values */}
                    <select
                      className="driveOptionValues"
                      name="driveOptionValues"
                      value={row.driveOptionValues}
                      onChange={(e) => handleInputChange(index, e)}
                      style={{
                        display: row.hideDriveOptionValues ? "none" : "block",
                      }}
                    >
                      <option value="">Select Option</option>

                      {Array.isArray(
                        driverOptions[
                          row.descriptiondriveOptions?.split(": ")[1]
                        ],
                      ) &&
                      driverOptions[row.descriptiondriveOptions?.split(": ")[1]]
                        ?.length > 0 ? (
                        driverOptions[
                          row.descriptiondriveOptions?.split(": ")[1]
                        ].map((value, i) => (
                          <option key={i} value={value}>
                            {value}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No options available
                        </option>
                      )}
                    </select>
                  </div>
                </td>

              <td className="hsn-cell">
                <select
                  className="hsnSacOptions" name="hsnSac" value={row.hsnSac} onChange={(e) => handleInputChange(index, e)}
                >
                  <option value="" disabled> Select an option </option>
                  {getAvailableOptions().map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>

              <td className="quantity-cell">
                <input type="number" name="quantity"
                  value={row.quantity} onChange={(e) => handleInputChange(index, e)} placeholder="Quantity" />
              </td>

              <td className="rate-cell">
                <input type="text" name="rate" value={row.rate} onChange={(e) => handleInputChange(index, e)}
                    onBlur={() => handleRateBlur(index)} placeholder="Rate" />
              </td>
                
              <td className="per-cell">
                <input type="text" name="per" value={row.per} onChange={(e) => handleInputChange(index, e)} 
                  placeholder="No's" />
              </td>

              <td className="discount-cell">
                <select className="discountOptions" name="discount"
                    value={row.discount} onChange={(e) => handleInputChange(index, e)} >
                  <option value="" disabled>Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td className="amount-cell">
                <input type="text" name="amount" value={`₹   ${row.amount}`} placeholder="Amount" readOnly />
              </td>

              <td className="action-cell">
                <button type="button" className="icon-btn" onClick={addRow}>
                    <FaPlus />
                </button>
                <button type="button" className="icon-btn danger" onClick={() => removeRow(index)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
            </React.Fragment>
          ))}
          </tbody>
        </table>
      </div>
    </section>

    </>
  );
};

export default DynamicTable;
