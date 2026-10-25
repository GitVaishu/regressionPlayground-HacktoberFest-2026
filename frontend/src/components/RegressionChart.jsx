import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload.find(
    (entry) => entry.payload?.actual !== undefined,
  )?.payload;

  if (!point) return null;

  return (
    <div className="chart-tooltip">
      <strong>{point.x.toFixed(1)} study hours</strong>

      <span>
        Actual mark <b>{point.actual.toFixed(1)}</b>
      </span>

      <span>
        Predicted <b>{point.predicted.toFixed(1)}</b>
      </span>

      <span>
        Decision{" "}
        <b
          className={
            point.decision === "PASS" ? "tooltip-pass" : "tooltip-fail"
          }
        >
          {point.decision}
        </b>
      </span>
    </div>
  );
}

function ResidualTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;

  if (!point || point.actual === undefined) return null;

  return (
    <div className="chart-tooltip">
      <strong>{point.x.toFixed(2)} input value</strong>

      <span>
        Actual <b>{point.actual.toFixed(2)}</b>
      </span>

      <span>
        Predicted <b>{point.predicted.toFixed(2)}</b>
      </span>

      <span>
        Residual <b>{point.residual.toFixed(2)}</b>
      </span>
    </div>
  );
}

export default function RegressionChart({ data, model, threshold }) {
  const [showResiduals, setShowResiduals] = useState(false);
  // Track theme changes from document root
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark",
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Dynamic theme-aware colors for Recharts SVG elements
  const gridStroke = isDark ? '#334155' : '#e4ebe5';
  const axisColor = isDark ? '#94a3b8' : '#78877b';
  const refLineColor = isDark ? '#f87171' : '#dd765b';
  const fitLineColor = isDark ? '#4ade80' : '#3e765c';
  const passColor = isDark ? '#4ade80' : '#2f8a68';
  const failColor = isDark ? '#f87171' : '#dd765b';
  const outlierColor = isDark ? '#f87171' : '#dc2626';

  const chartData = useMemo(
    () =>
      model.predictions.map((row) => ({
        ...row,
        decision: row.predicted >= threshold ? "PASS" : "FAIL",
      })),
    [model.predictions, threshold],
  );

  const lineData = useMemo(() => {
    const xValues = data.map((point) => point.x);
    const low = Math.min(...xValues);
    const high = Math.max(...xValues);

    return [
      { x: low, fitted: model.intercept + model.slope * low },
      { x: high, fitted: model.intercept + model.slope * high },
    ];
  }, [data, model.intercept, model.slope]);

  const passPoints = useMemo(() => chartData.filter((point) => point.decision === 'PASS'), [chartData]);
  const failPoints = useMemo(() => chartData.filter((point) => point.decision === 'FAIL'), [chartData]);
  const residualDomain = useMemo(() => {
    const residuals = chartData.map((point) => point.residual);
    const maxAbs = Math.max(1, ...residuals.map(Math.abs));

    return [-maxAbs * 1.1, maxAbs * 1.1];
  }, [chartData]);

  return (
    <section className="chart-panel" aria-labelledby="chart-heading">
      <div className="chart-heading-row">
        <div>
          <span className="eyebrow">THE BIG PICTURE</span>

          <h2 id="chart-heading">
            {showResiduals
              ? "Residuals vs. input"
              : "Study time vs. exam marks"}
          </h2>

          <p>
            {showResiduals
              ? "Residual = actual − predicted. Positive values mean under-prediction; negative values mean over-prediction."
              : "Each dot is a student. Color reflects the prediction, not the actual mark."}
          </p>
        </div>

        <div className="chart-controls">
          <span className="chart-sample-count">{data.length} observations</span>

          <button
            type="button"
            className="residual-toggle"
            onClick={() => setShowResiduals((current) => !current)}
            aria-pressed={showResiduals}
          >
            {showResiduals ? "Show Regression" : "Show Residuals"}
          </button>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={showResiduals ? chartData : undefined}
            margin={{ top: 14, right: 20, bottom: 20, left: 8 }}
          >
            <CartesianGrid
              stroke={gridStroke}
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="x"
              name="Input"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickLine={false}
              axisLine={{ stroke: axisColor }}
              tick={{ fill: axisColor, fontSize: 12 }}
              tickFormatter={(value) => Number(value).toFixed(1)}
              label={{
                value: showResiduals ? "Input (x)" : "Study hours",
                position: "insideBottom",
                offset: -8,
                fill: axisColor,
                fontSize: 12,
              }}
            />

            <YAxis
              type="number"
              dataKey={showResiduals ? "residual" : "actual"}
              domain={showResiduals ? residualDomain : ["auto", "auto"]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#78877b", fontSize: 11 }}
              tickFormatter={(value) => Number(value).toFixed(1)}
              width={75}
              label={{
                value: showResiduals ? "Residual" : "Exam marks",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fill: axisColor,
                fontSize: 11,
              }}
            />
            <Scatter data={passPoints} dataKey="actual" name="Predicted PASS" fill={passColor} legendType="circle">
              {passPoints.map((entry, index) => (
                <Cell
                  key={`pass-cell-${index}`}
                  fill={entry.is_outlier ? outlierColor : passColor}
                  stroke={entry.is_outlier ? '#991b1b' : 'none'}
                  strokeWidth={entry.is_outlier ? 2 : 0}
                  r={entry.is_outlier ? 7 : 4}
                />
              ))}
            </Scatter>
            <Scatter data={failPoints} dataKey="actual" name="Predicted FAIL" fill={failColor} legendType="circle">
              {failPoints.map((entry, index) => (
                <Cell
                  key={`fail-cell-${index}`}
                  fill={entry.is_outlier ? outlierColor : failColor}
                  stroke={entry.is_outlier ? '#991b1b' : 'none'}
                  strokeWidth={entry.is_outlier ? 2 : 0}
                  r={entry.is_outlier ? 7 : 4}
                />
              ))}
            </Scatter>

            {showResiduals ? (
              <>
                <Tooltip
                  content={<ResidualTooltip />}
                  cursor={{
                    stroke: "#a6b4a8",
                    strokeDasharray: "3 4",
                  }}
                />

                <ReferenceLine
                  y={0}
                  stroke="#78877b"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: "Zero residual",
                    fill: "#66756a",
                    fontSize: 11,
                    position: "insideTopRight",
                  }}
                />

                <Scatter
                  data={chartData}
                  dataKey="residual"
                  name="Residual"
                  fill="#3e765c"
                />
              </>
            ) : (
              <>
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{
                    stroke: "#a6b4a8",
                    strokeDasharray: "3 4",
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  height={34}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#66756a" }}
                />

                <ReferenceLine
                  y={threshold}
                  stroke="#dd765b"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Decision cutoff ${threshold.toFixed(1)}`,
                    fill: "#c65f45",
                    fontSize: 11,
                    position: "insideTopRight",
                  }}
                />

                <Line
                  data={lineData}
                  dataKey="fitted"
                  name="Best-fit line"
                  type="linear"
                  stroke="#3e765c"
                  strokeWidth={3}
                  dot={false}
                  activeDot={false}
                  legendType="line"
                />

                <Scatter
                  data={chartData.filter((point) => point.decision === "PASS")}
                  dataKey="actual"
                  name="Predicted PASS"
                  fill="#2f8a68"
                  legendType="circle"
                />

                <Scatter
                  data={chartData.filter((point) => point.decision === "FAIL")}
                  dataKey="actual"
                  name="Predicted FAIL"
                  fill="#dd765b"
                  legendType="circle"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footnote">
        {showResiduals ? (
          <>
            <span className="threshold-line-key" />
            Dashed line = zero residual
          </>
        ) : (
          <>
            <span className="threshold-line-key" />
            Dashed line = chosen threshold
          </>
        )}
      </div>
    </section>
  );
}
