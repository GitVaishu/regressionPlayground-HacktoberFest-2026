import { useRef } from "react";
import { RotateCcw, Upload } from "lucide-react";

function parseCsv(text) {
  const content = text.replace(/^\uFEFF/, "").trim();

  if (!content) {
    throw new Error(
      "The CSV file is empty. Add an x,y header and at least two data rows.",
    );
  }

  const lines = content.split(/\r?\n/);
  const firstRow = lines[0].split(",").map((cell) => cell.trim());
  const normalizedHeader = firstRow.map((cell) => cell.toLowerCase());

  const hasHeader =
    normalizedHeader.includes("x") || normalizedHeader.includes("y");

  if (hasHeader) {
    const headerErrors = [];

    if (!normalizedHeader.includes("x")) {
      headerErrors.push("Missing required column 'x'.");
    }

    if (!normalizedHeader.includes("y")) {
      headerErrors.push("Missing required column 'y'.");
    }

    if (normalizedHeader.length !== 2) {
      headerErrors.push("Expected exactly two columns: x,y.");
    }

    if (
      normalizedHeader.includes("x") &&
      normalizedHeader.includes("y") &&
      normalizedHeader.length === 2 &&
      (normalizedHeader[0] !== "x" || normalizedHeader[1] !== "y")
    ) {
      headerErrors.push("Columns must be ordered as 'x,y'.");
    }

    if (headerErrors.length > 0) {
      throw new Error(headerErrors.join(" "));
    }
  }

  const rows = hasHeader ? lines.slice(1) : lines;
  const points = [];
  const errors = [];

  rows.forEach((line, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const columns = line.split(",").map((cell) => cell.trim());

    if (columns.length !== 2) {
      errors.push(
        `Row ${rowNumber}: expected exactly two values (x,y), but found ${columns.length}.`,
      );
      return;
    }

    const [rawX, rawY] = columns;
    const rowErrors = [];

    if (!rawX) {
      rowErrors.push(`column 'x' is empty`);
    } else if (!Number.isFinite(Number(rawX))) {
      rowErrors.push(
        `column 'x' must contain a finite number; found '${rawX}'`,
      );
    }

    if (!rawY) {
      rowErrors.push(`column 'y' is empty`);
    } else if (!Number.isFinite(Number(rawY))) {
      rowErrors.push(
        `column 'y' must contain a finite number; found '${rawY}'`,
      );
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join("; ")}.`);
      return;
    }

    points.push({
      x: Number(rawX),
      y: Number(rawY),
    });
  });

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  if (points.length < 2) {
    throw new Error("At least two data rows are required.");
  }

  if (new Set(points.map((point) => point.x)).size < 2) {
    throw new Error(
      "At least two distinct x values are required to fit a regression line.",
    );
  }

  return points;
}

export default function DatasetUploader({ onUpload, onReset, datasetName }) {
  const inputRef = useRef(null);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onUpload(parseCsv(await file.text()), file.name);
    } catch (error) {
      onUpload(null, error.message);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="dataset-controls">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        hidden
        aria-label="Upload a CSV dataset"
      />
      <button
        className="button button-primary"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={16} aria-hidden="true" /> Upload CSV
      </button>
      <button
        className="button button-secondary"
        type="button"
        onClick={onReset}
      >
        <RotateCcw size={15} aria-hidden="true" /> Reset
      </button>
      <span className="dataset-name" title={datasetName}>
        {datasetName}
      </span>
    </div>
  );
}

export { parseCsv };
