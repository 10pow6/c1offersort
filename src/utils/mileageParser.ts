/**
 * Parses mileage value from text string
 * Handles multiple formats:
 * - Multiplier format: "2X miles" → 2000
 * - Numeric format: "Up to 60,000 miles" → 60000
 * - Simple numeric: "5000 miles" → 5000
 * - Static points: "1,700 miles" → 1700
 *
 * @param text - The text containing mileage information
 * @returns Numeric mileage value, or 0 if no valid format found
 */
export function parseMileageValue(text: string): number {
  const cleanedText = text.replace(/\*/g, "").trim();

  const multiplierMatch = cleanedText.match(/(\d+)X miles/i);
  if (multiplierMatch) {
    return parseInt(multiplierMatch[1], 10) * 1000;
  }

  const milesMatch = cleanedText.match(/(?:Up to )?([0-9,]+) miles/i);
  if (milesMatch) {
    return parseInt(milesMatch[1].replace(/,/g, ""), 10);
  }

  return 0;
}
