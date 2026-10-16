from models.regression import RegressionResult, fit_simple_linear_regression


def analyze_dataset(points: list[dict[str, float]]) -> RegressionResult:
    """Keep the API service thin so alternate models can be added later."""
    return fit_simple_linear_regression(points)