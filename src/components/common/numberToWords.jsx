export function toIndianWords(grandTotalValue) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const units = ["", "Thousand", "Lakh", "Crore"]; // Indian numbering system

  if (grandTotalValue === 0) return "Zero";

  let word = "";
  let groupIndex = 0;

  // Process the value in groups of two digits (as per the Indian system)
  while (grandTotalValue > 0) {
    let groupValue;
    if (groupIndex === 0) {
      // For the first group, take the last three digits
      groupValue = grandTotalValue % 1000;
      grandTotalValue = Math.floor(grandTotalValue / 1000);
    } else {
      // For subsequent groups, take the last two digits
      groupValue = grandTotalValue % 100;
      grandTotalValue = Math.floor(grandTotalValue / 100);
    }

    if (groupValue > 0) {
      word = convertGroup(groupValue) + " " + units[groupIndex] + " " + word;
    }

    groupIndex++; // Move to the next group: Thousand, Lakh, Crore, etc.
  }

  // Function to convert a number less than 1000 into words
  function convertGroup(groupValue) {
    let groupWord = "";

    // Convert hundreds place (if applicable)
    if (groupValue >= 100) {
      groupWord += ones[Math.floor(groupValue / 100)] + " Hundred ";
      groupValue %= 100;
    }

    // Convert tens place (20-99)
    if (groupValue >= 20) {
      groupWord += tens[Math.floor(groupValue / 10)] + " ";
      groupValue %= 10;
    }

    // Convert ones place (1-9)
    if (groupValue > 0) {
      groupWord += ones[groupValue] + " ";
    }

    return groupWord.trim();
  }

  return word.trim();
}
