import {useState } from 'react';
import { BookOpen, Check, CircleHelp, LineChart, ScanSearch } from 'lucide-react';

const steps = [
  { icon: ScanSearch, title: 'Bring data', detail: 'Study hours and marks become plotted observations.' },
  { icon: LineChart, title: 'Fit a line', detail: 'Least squares picks the line with the smallest squared errors.' },
  { icon: CircleHelp, title: 'Predict a score', detail: 'The line gives a continuous predicted mark for each student.' },
  { icon: Check, title: 'Make a decision', detail: 'Your threshold turns each prediction into PASS or FAIL.' },
];

const terms = [
  ['Slope', 'How much the predicted mark changes per extra study hour.'],
  ['Intercept', 'The line’s predicted mark when study hours are zero.'],
  ['Residual', 'Actual mark minus predicted mark for one observation.'],
  ['MSE / RMSE', 'Average squared error; RMSE returns it to mark-sized units.'],
  ['R²', 'How much of the variation in marks the fitted line explains.'],
];

export default function Explanation({ data = [], model }) {
  const [isR2Open, setIsR2Open] = useState(false);

  let ssres = null;
  let sstot = null;
  let calculatedR2 = null;

  if (data.length > 0 && model?.predictions?.length === data.length) {
    const meanY =
      data.reduce((sum, point) => sum + point.y, 0) / data.length;

    sstot = data.reduce(
      (sum, point) => sum + (point.y - meanY) ** 2,
      0
    );

    ssres = model.predictions.reduce(
      (sum, point) => sum + (point.actual - point.predicted) ** 2,
      0
    );

    calculatedR2 = sstot > 0 ? 1 - ssres / sstot : 1;
  }

  return (
    <section className="learning-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Learn</span>
          <h2>Understand the regression</h2>
        </div>
      </div>

      <div className="terms-grid">
        {terms.map(([term, description]) => (
          <div className="term-item" key={term}>
            <strong>{term}</strong>
            <span>{description}</span>
          </div>
        ))}
      </div>

      <div className="r2-explanation">
        <button
          type="button"
          className="r2-toggle"
          onClick={() => setIsR2Open((open) => !open)}
          aria-expanded={isR2Open}
        >
          <span>How is R² calculated?</span>
          <span aria-hidden="true">{isR2Open ? '−' : '+'}</span>
        </button>

        {isR2Open && (
          <div className="r2-content">
            <p>
              <strong>R² (R-squared)</strong> measures how well the
              regression line explains the variation in the observed data.
            </p>

            <div className="r2-formula">
              R² = 1 − SSres / SStot
            </div>

            <div className="r2-definitions">
              <div>
                <strong>SSres — Residual Sum of Squares</strong>
                <p>
                  The total squared difference between the actual values
                  and the values predicted by the regression model.
                </p>
              </div>

              <div>
                <strong>SStot — Total Sum of Squares</strong>
                <p>
                  The total squared difference between the actual values
                  and their mean. It represents the overall variation in
                  the target values.
                </p>
              </div>
            </div>

            {calculatedR2 !== null && (
              <div className="r2-current">
                <h3>For the current dataset</h3>

                <div className="r2-values">
                  <div>
                    <span>SSres</span>
                    <strong>{ssres.toFixed(4)}</strong>
                  </div>

                  <div>
                    <span>SStot</span>
                    <strong>{sstot.toFixed(4)}</strong>
                  </div>

                  <div>
                    <span>R²</span>
                    <strong>{calculatedR2.toFixed(4)}</strong>
                  </div>
                </div>

                <div className="r2-interpretation">
                  <strong>What does this mean?</strong>

                  <p>
                    The current model explains approximately{' '}
                    <strong>{(calculatedR2 * 100).toFixed(2)}%</strong> of
                    the variation in the target values using the input
                    variable.
                  </p>

                  <p>
                    For example, if you were predicting exam marks from
                    study hours, an R² of 0.82 would mean that the
                    regression model explains about 82% of the variation
                    in exam marks. The remaining variation may be caused
                    by factors not captured by the model.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}




