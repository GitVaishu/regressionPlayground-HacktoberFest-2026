from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class RegressionResult:
    slope: float
    intercept: float
    r2: float
    mse: float
    rmse: float
    mae: float
    predictions: list[dict[str, float | bool]]


def fit_simple_linear_regression(
    points: list[dict[str, float]],
) -> RegressionResult:
    """Fit y = intercept + slope*x using the least-squares closed form."""
    if not points:
        return RegressionResult(
            slope=0.0,
            intercept=0.0,
            r2=0.0,
            mse=0.0,
            rmse=0.0,
            mae=0.0,
            predictions=[],
        )

    x_values = np.asarray([point["x"] for point in points], dtype=float)
    y_values = np.asarray([point["y"] for point in points], dtype=float)

    x_mean = float(np.mean(x_values))
    y_mean = float(np.mean(y_values))
    centered_x = x_values - x_mean
    centered_y = y_values - y_mean

    # Avoid division by zero if all x values are identical
    x_variance = np.dot(centered_x, centered_x)
    slope = float(np.dot(centered_x, centered_y) / x_variance) if x_variance > 0 else 0.0
    intercept = float(y_mean - slope * x_mean)

    predicted_values = intercept + slope * x_values
    residuals = y_values - predicted_values
    mse = float(np.mean(residuals**2))
    total_sum_squares = float(np.sum(centered_y**2))
    residual_sum_squares = float(np.sum(residuals**2))
    r2 = (
        1.0 - residual_sum_squares / total_sum_squares
        if total_sum_squares > 0
        else 1.0
    )

    # Calculate standard deviation of residuals for outlier detection
    std_residual = float(np.std(residuals))
    outlier_threshold = 2.0 * std_residual

    prediction_rows = [
        {
            "x": float(x_value),
            "actual": float(y_value),
            "predicted": float(predicted_value),
            "residual": float(residual),
            "is_outlier": bool(std_residual > 0 and abs(residual) > outlier_threshold),
        }
        for x_value, y_value, predicted_value, residual in zip(
            x_values, y_values, predicted_values, residuals
        )
    ]

    return RegressionResult(
        slope=slope,
        intercept=intercept,
        r2=float(r2),
        mse=mse,
        rmse=float(np.sqrt(mse)),
        mae=float(np.mean(np.abs(residuals))),
        predictions=prediction_rows,
    )