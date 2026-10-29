import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  FlaskConical,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";

import DatasetUploader from "./components/DatasetUploader.jsx";
import Explanation from "./components/Explanation.jsx";
import MetricsPanel from "./components/MetricsPanel.jsx";
import RegressionChart from "./components/RegressionChart.jsx";
import ThresholdControl from "./components/ThresholdControl.jsx";
import { fitRegression } from "./services/api.js";

const DEFAULT_DATA = [
  { x: 0.5, y: 34 },
  { x: 0.8, y: 39 },
  { x: 1.0, y: 42 },
  { x: 1.3, y: 43 },
  { x: 1.5, y: 46 },
  { x: 1.8, y: 49 },
  { x: 2.0, y: 51 },
  { x: 2.2, y: 49 },
  { x: 2.5, y: 54 },
  { x: 2.7, y: 56 },
  { x: 3.0, y: 57 },
  { x: 3.2, y: 61 },
  { x: 3.5, y: 60 },
  { x: 3.7, y: 65 },
  { x: 4.0, y: 66 },
  { x: 4.2, y: 69 },
  { x: 4.5, y: 68 },
  { x: 4.7, y: 73 },
  { x: 5.0, y: 74 },
  { x: 5.2, y: 76 },
  { x: 5.5, y: 79 },
  { x: 5.8, y: 80 },
  { x: 6.0, y: 83 },
  { x: 6.2, y: 82 },
  { x: 6.5, y: 87 },
  { x: 6.8, y: 89 },
  { x: 7.0, y: 91 },
  { x: 7.3, y: 93 },
  { x: 7.5, y: 94 },
  { x: 8.0, y: 98 },
];

export default function App() {
  const [data, setData] = useState([]);
  const [datasetName, setDatasetName] = useState("");
  const [model, setModel] = useState(null);
  const [threshold, setThreshold] = useState(40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pointX, setPointX] = useState("");
  const [pointY, setPointY] = useState("");

  // Theme state
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  // Apply and persist the selected theme
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((previousTheme) => (previousTheme === "light" ? "dark" : "light"));
  }

  // Fit the regression model whenever the dataset changes
  useEffect(() => {
    if (data.length === 0) {
      setModel(null);
      setLoading(false);

      // Preserve upload validation errors when the dataset is cleared.
      return;
    }

    // A regression line needs at least two distinct x values.
    if (new Set(data.map((point) => point.x)).size < 2) {
      setModel(null);
      setLoading(false);
      setError("A regression line needs at least two distinct x values.");
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");

    fitRegression(data, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setModel(result);

        const predictedValues = result.predictions.map(
          (point) => point.predicted,
        );

        if (predictedValues.length > 0) {
          const minimum = Math.min(...predictedValues);
          const maximum = Math.max(...predictedValues);

          setThreshold((current) =>
            Math.min(maximum, Math.max(minimum, current)),
          );
        }
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError" && !controller.signal.aborted) {
          setError(
            requestError.message || "Failed to fit the regression model.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [data]);

  // Prediction range for the threshold control
  const predictionRange = useMemo(() => {
    if (!model || model.predictions.length === 0) {
      return { min: 0, max: 100 };
    }

    const values = model.predictions.map((point) => point.predicted);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      min,
      max: max === min ? min + 1 : max,
    };
  }, [model]);

  // Count predictions above and below the threshold
  const decisions = useMemo(() => {
    const pass =
      model?.predictions.filter((point) => point.predicted >= threshold)
        .length ?? 0;

    const total = model?.predictions.length ?? 0;

    return {
      pass,
      fail: total - pass,
    };
  }, [model, threshold]);

  // Handle dataset upload
  function handleUpload(points, name) {
    if (!Array.isArray(points)) {
      setData([]);
      setDatasetName("");
      setModel(null);
      setPointX("");
      setPointY("");
      setThreshold(40);
      setError(
        typeof name === "string" ? name : "The uploaded dataset is invalid.",
      );
      return;
    }

    if (
      points.some(
        (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
      )
    ) {
      setData([]);
      setDatasetName("");
      setModel(null);
      setPointX("");
      setPointY("");
      setThreshold(40);
      setError("The dataset contains invalid numeric values.");
      return;
    }

    setData(points);
    setDatasetName(name || "Uploaded dataset");
    setError("");
  }

  // Reset to the default dataset
  function resetDataset() {
    const isDefaultDataset =
      datasetName === "Study hours · default" &&
      data.length === DEFAULT_DATA.length &&
      data.every(
        (point, index) =>
          point.x === DEFAULT_DATA[index].x &&
          point.y === DEFAULT_DATA[index].y,
      );

    if (!isDefaultDataset) {
      const confirmed = window.confirm(
        "Are you sure you want to reset the dataset? Your uploaded or edited data will be lost.",
      );

      if (!confirmed) return;
    }

    setData(DEFAULT_DATA);
    setDatasetName("Study hours · default");
    setError("");
    setPointX("");
    setPointY("");
  }

  // Clear the current dataset
  function clearDataset() {
    setData([]);
    setDatasetName("");
    setModel(null);
    setPointX("");
    setPointY("");
    setError("");
    setLoading(false);
    setThreshold(40);
  }

  // Load sample dataset
  function loadSampleDataset() {
    setData(DEFAULT_DATA);
    setDatasetName("Study hours · default");
    setError("");
    setPointX("");
    setPointY("");
  }

  // Add an observation
  function addPoint(event) {
    event.preventDefault();

    const x = Number(pointX);
    const y = Number(pointY);

    if (
      !pointX.trim() ||
      !pointY.trim() ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      setError("Enter a finite number for both study hours and exam marks.");
      return;
    }

    const updatedData = [...data, { x, y }];

    if (new Set(updatedData.map((point) => point.x)).size < 2) {
      setError("A regression line needs at least two distinct x values.");
      return;
    }

    setData(updatedData);
    setDatasetName("Custom dataset");
    setPointX("");
    setPointY("");
    setError("");
  }

  // Remove an observation
  function removePoint(index) {
    const remaining = data.filter((_, pointIndex) => pointIndex !== index);

    if (
      remaining.length > 0 &&
      new Set(remaining.map((point) => point.x)).size < 2
    ) {
      setError("A regression line needs at least two distinct x values.");
      return;
    }

    setData(remaining);
    setDatasetName(remaining.length === 0 ? "" : "Custom dataset");
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          aria-label="Regression Playground home"
        >
          <span className="brand-mark">
            <FlaskConical size={19} strokeWidth={2.1} />
          </span>

          <span>
            Regression <b>Playground</b>
          </span>
        </a>

        <div className="topbar-right">
          <span className="open-source-tag">
            <Sparkles size={13} /> OPEN LEARNING LAB
          </span>

          <button
            type="button"
            className="theme-toggle-btn button"
            onClick={toggleTheme}
            aria-label="Toggle light and dark theme"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}

            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>
        </div>
      </header>

      <main id="top" className="main-content">
        <section className="intro-row">
          <div className="intro-copy">
            <span className="eyebrow">A HANDS-ON ML EXPLORER</span>

            <h1>
              Make the line.
              <br />
              <em>Make the call.</em>
            </h1>

            <p>
              See how a simple model learns from data, then decide what its
              predictions mean.
            </p>
          </div>

          <div className="model-equation" aria-live="polite">
            <span className="equation-label">YOUR MODEL</span>

            {model ? (
              <strong>
                ŷ = {model.intercept.toFixed(1)} {model.slope < 0 ? "−" : "+"}{" "}
                {Math.abs(model.slope).toFixed(1)}x
              </strong>
            ) : (
              <strong>ŷ = —</strong>
            )}

            <span className="equation-caption">
              Best-fit line <span>·</span> least squares
            </span>
          </div>
        </section>

        <section className="dataset-bar" aria-label="Dataset controls">
          <div className="dataset-heading">
            <span className="eyebrow">YOUR DATA</span>

            <strong>
              {data.length} {data.length === 1 ? "observation" : "observations"}
            </strong>
          </div>

          <DatasetUploader
            onUpload={handleUpload}
            onReset={resetDataset}
            datasetName={datasetName}
          />

          <button
            type="button"
            className="button button-secondary"
            onClick={clearDataset}
            disabled={data.length === 0}
          >
            <Trash2 size={16} />
            Clear Dataset
          </button>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={17} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {data.length > 0 ? (
          <div className="workspace-grid">
            <div className="visual-column">
              <RegressionChart
                data={data}
                model={
                  model ?? {
                    predictions: [],
                    intercept: 0,
                    slope: 0,
                  }
                }
                threshold={threshold}
              />

              {loading && (
                <div className="loading-line" role="status">
                  <span className="loading-spinner" />
                  Updating your model…
                </div>
              )}

              {model && (
                <ThresholdControl
                  threshold={threshold}
                  setThreshold={setThreshold}
                  min={predictionRange.min}
                  max={predictionRange.max}
                  passCount={decisions.pass}
                  failCount={decisions.fail}
                />
              )}
            </div>

            <aside className="data-side-panel">
              <div className="points-heading">
                <div>
                  <span className="eyebrow">OBSERVATIONS</span>
                  <h2>Shape the data</h2>
                </div>

                <span className="point-count">{data.length}</span>
              </div>

              <form className="add-point-form" onSubmit={addPoint}>
                <label>
                  <span>Hours</span>

                  <input
                    aria-label="Study hours"
                    inputMode="decimal"
                    placeholder="e.g. 2.5"
                    value={pointX}
                    onChange={(event) => setPointX(event.target.value)}
                  />
                </label>

                <label>
                  <span>Marks</span>

                  <input
                    aria-label="Exam marks"
                    inputMode="decimal"
                    placeholder="e.g. 58"
                    value={pointY}
                    onChange={(event) => setPointY(event.target.value)}
                  />
                </label>

                <button
                  className="icon-button add-button"
                  type="submit"
                  aria-label="Add observation"
                  title="Add observation"
                >
                  <Plus size={18} />
                </button>
              </form>

              <p className="point-help">
                Add an observation to see how one more student shifts the fit.
              </p>

              <div className="points-list" aria-label="Dataset observations">
                <div className="point-row point-header" aria-hidden="true">
                  <span>No.</span>
                  <span>Hours</span>
                  <span className="point-mark">Marks</span>
                  <span />
                </div>

                {data.map((point, index) => (
                  <div className="point-row" key={`${point.x}-${index}`}>
                    <span className="point-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>
                      {point.x.toFixed(1)} <small>hrs</small>
                    </span>

                    <span className="point-mark">
                      {point.y.toFixed(1)} <small>marks</small>
                    </span>

                    <button
                      className="icon-button remove-button"
                      type="button"
                      onClick={() => removePoint(index)}
                      aria-label={`Remove observation ${index + 1}`}
                      title="Remove observation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <section className="empty-state" aria-labelledby="empty-state-title">
            <div className="empty-state-icon">
              <Upload size={28} aria-hidden="true" />
            </div>

            <h2 id="empty-state-title">No dataset loaded</h2>

            <p>
              Upload a CSV dataset or load the sample dataset to start exploring
              linear regression.
            </p>

            <div className="empty-state-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={() =>
                  document.querySelector('input[type="file"]')?.click()
                }
              >
                <Upload size={16} aria-hidden="true" />
                Upload CSV
              </button>

              <button
                className="button button-secondary"
                type="button"
                onClick={loadSampleDataset}
              >
                Load sample dataset
              </button>
            </div>
          </section>
        )}

        {model && (
          <MetricsPanel
            model={model}
            sampleCount={data.length}
            passCount={decisions.pass}
            failCount={decisions.fail}
          />
        )}

        <Explanation data={data} model={model} />
      </main>

      <footer className="footer">
        <span>Built for curious minds.</span>

        <span>
          Regression Playground <i>·</i> learn by changing one thing at a time
        </span>
      </footer>
    </div>
  );
}
