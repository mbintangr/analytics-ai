import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from pandas.api.types import (
    is_numeric_dtype,
    is_datetime64_any_dtype,
    is_string_dtype,
)
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

import ast


def _cast_value(series: pd.Series, value, method: str):
    """Cast LLM-provided value to match column dtype."""
    if (
        isinstance(value, str)
        and value.strip().startswith("[")
        and value.strip().endswith("]")
    ):
        try:
            value = ast.literal_eval(value)
        except (ValueError, SyntaxError):
            pass

    if method in {"in", "not_in"}:
        if not isinstance(value, (list, tuple)):
            value = [value]

    if is_numeric_dtype(series):
        if method == "between":
            if isinstance(value, (list, tuple)) and len(value) >= 2:
                return float(value[0]), float(value[1])
            return float(value), float(value)

        if isinstance(value, (list, tuple)):
            return [float(v) for v in value]
        return float(value)

    if is_datetime64_any_dtype(series):
        if method == "between":
            if isinstance(value, (list, tuple)) and len(value) >= 2:
                return pd.to_datetime(value[0]), pd.to_datetime(value[1])
        if isinstance(value, (list, tuple)):
            return [pd.to_datetime(v) for v in value]
        return pd.to_datetime(value)

    if isinstance(value, (list, tuple)):
        return [str(v) for v in value]
    return str(value)


def load_data(filename: str):
    """
    Load data from a file.

    Args:
      filename (str): The path to the file.

    Returns:
      pd.DataFrame: The data loaded from the file.
    """
    try:
        if filename.endswith(".csv"):
            return pd.read_csv(filename)
        elif filename.endswith(".json"):
            return pd.read_json(filename)
        elif filename.endswith(".parquet"):
            return pd.read_parquet(filename)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            return pd.read_excel(filename, engine="xlrd")
        else:
            raise ValueError(f"Unsupported file format: {filename}")
    except Exception as e:
        raise ValueError(f"Failed to load data from {filename}: {e}")


def get_sample_data(df: pd.DataFrame, sample_size: int = 5):
    """
    Get a sample of the data.

    Args:
      df (pd.DataFrame): The data.
      sample_size (int): The number of rows to sample.

    Returns:
      pd.DataFrame: The sampled data.
    """
    return df.sample(n=sample_size)


def get_head_data(df: pd.DataFrame, head_size: int = 5):
    """
    Get the first few rows of the data.

    Args:
      df (pd.DataFrame): The data.
      head_size (int): The number of rows to return.

    Returns:
      pd.DataFrame: The first few rows of the data.
    """
    return df.head(head_size)


def get_tail_data(df: pd.DataFrame, tail_size: int = 5):
    """
    Get the last few rows of the data.

    Args:
      df (pd.DataFrame): The data.
      tail_size (int): The number of rows to return.

    Returns:
      pd.DataFrame: The last few rows of the data.
    """
    return df.tail(tail_size)


def get_data_description(df: pd.DataFrame, include: str = "all"):
    """
    Get a description of the data.

    Args:
      df (pd.DataFrame): The data.

    Returns:
      pd.DataFrame: The description of the data.
    """
    return df.describe(include=include).T


def get_data_info(df: pd.DataFrame):
    """
    Get a description of the data.

    Args:
      df (pd.DataFrame): The data.

    Returns:
      pd.DataFrame: The description of the data.
    """
    return df.info()


def get_unique_values(df: pd.DataFrame, column: str, max_unique_values: int = 10):
    """
    Get the unique values in a column.

    Args:
      df (pd.DataFrame): The data.
      column (str): The column to get the unique values from.
      max_unique_values (int): The maximum number of unique values to return.

    Returns:
      pd.Series: The unique values in the column.
    """
    return df[column].unique()[:max_unique_values]


def get_unique_values_count(df: pd.DataFrame, column: str):
    """
    Get the unique values count in a column.

    Args:
      df (pd.DataFrame): The data.
      column (str): The column to get the unique values count from.

    Returns:
      pd.Series: The unique values count in the column.
    """
    return df[column].value_counts()


def get_rows_by_condition(df: pd.DataFrame, column: str, value, method: str = "eq"):
    if column not in df.columns:
        raise KeyError(f"Column '{column}' not found")

    series = df[column]
    value = _cast_value(series, value, method)

    if method == "eq":
        return df[series == value]
    elif method == "ne":
        return df[series != value]
    elif method == "gt":
        return df[series > value]
    elif method == "lt":
        return df[series < value]
    elif method == "ge":
        return df[series >= value]
    elif method == "le":
        return df[series <= value]
    elif method == "between":
        low, high = value
        return df[(series >= low) & (series <= high)]

    elif method == "in":
        return df[series.isin(value)]
    elif method == "not_in":
        return df[~series.isin(value)]

    if not is_string_dtype(series):
        raise TypeError(f"Method '{method}' requires string column")

    series = series.astype(str)

    if method == "contains":
        return df[series.str.contains(value, na=False)]
    elif method == "not_contains":
        return df[~series.str.contains(value, na=False)]
    elif method == "startswith":
        return df[series.str.startswith(value, na=False)]
    elif method == "endswith":
        return df[series.str.endswith(value, na=False)]
    elif method == "regex":
        return df[series.str.contains(value, regex=True, na=False)]
    elif method == "not_regex":
        return df[~series.str.contains(value, regex=True, na=False)]

    else:
        raise ValueError(f"Invalid method: {method}")


def get_data_correlation(df: pd.DataFrame, columns: list[str] | None = None):
    """
    Get the correlation of the data.

    Args:
      df (pd.DataFrame): The data.
      columns (list[str] | None): The columns to get the correlation from.

    Returns:
      pd.DataFrame: The correlation of the data.
    """
    if columns is not None:
        return df[columns].corr(numeric_only=True)
    return df.corr(numeric_only=True)


def get_null_values_count(df: pd.DataFrame):
    """
    Get the null values count in the data.

    Args:
      df (pd.DataFrame): The data.

    Returns:
      pd.DataFrame: The null values count in the data.
    """
    return df.isnull().sum()


def get_null_values_rows(df: pd.DataFrame, column: str, limit: int = 5):
    """
    Get the null values rows in the data.

    Args:
      df (pd.DataFrame): The data.
      column (str): The column to get the null values rows from.
      limit (int): The number of rows to return.

    Returns:
      pd.DataFrame: The null values rows in the data.
    """
    return df[df[column].isnull()].head(limit)


def get_duplicate_values_count(df: pd.DataFrame):
    """
    Get the duplicate values count in the data.

    Args:
      df (pd.DataFrame): The data.

    Returns:
      pd.DataFrame: The duplicate values count in the data.
    """
    return df.duplicated().sum()


def detect_outliers_isolation_forest(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    contamination: float = 0.05,
    random_state: int = 42,
    return_outliers_only: bool = False,
) -> pd.DataFrame:
    """
    Detect outliers using Isolation Forest.

    Args:
        df (pd.DataFrame): The data.
        columns (list[str] | None): Numeric columns to use. If None, all numeric columns are used.
        contamination (float): Proportion of expected outliers.
        random_state (int): Random seed.
        return_outliers_only (bool): If True, return only outlier rows.

    Returns:
        pd.DataFrame: DataFrame with an added 'outlier' column (1=inlier, -1=outlier),
                      or only outliers if return_outliers_only=True.
    """
    if columns is None:
        columns = df.select_dtypes(include=[np.number]).columns.tolist()

    if not columns:
        raise ValueError("No numeric columns available for outlier detection")

    model = IsolationForest(contamination=contamination, random_state=random_state)

    outlier_labels = model.fit_predict(df[columns])

    result_df = df.copy()
    result_df["outlier"] = outlier_labels

    if return_outliers_only:
        return result_df[result_df["outlier"] == -1]

    return result_df


def profile_columns(df: pd.DataFrame) -> dict:
    """
    Generate column-level metadata for agent reasoning.

    Args:
        df (pd.DataFrame): The data.

    Returns:
        dict: The column-level metadata.
    """
    profile = {}

    for col in df.columns:
        series = df[col]
        profile[col] = {
            "dtype": str(series.dtype),
            "null_count": int(series.isnull().sum()),
            "null_ratio": float(series.isnull().mean()),
            "unique_count": int(series.nunique()),
            "sample_values": series.dropna().unique()[:5].tolist(),
        }

        if pd.api.types.is_numeric_dtype(series):
            profile[col].update(
                {
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "mean": float(series.mean()),
                    "std": float(series.std()),
                }
            )

    return profile


def merge_data(
    left: pd.DataFrame,
    right: pd.DataFrame,
    how: str = "inner",
    on: str = None,
    left_on: str = None,
    right_on: str = None,
):
    """
    Merge two dataframes.

    Args:
      left (pd.DataFrame): The left dataframe.
      right (pd.DataFrame): The right dataframe.
      how (str): The type of merge to perform.
      on (str): The column to merge on.
      left_on (str): The column to merge on for the left dataframe.
      right_on (str): The column to merge on for the right dataframe.

    Returns:
      pd.DataFrame: The merged dataframe.
    """
    if on is not None:
        return pd.merge(left, right, how=how, on=on)
    if left_on is not None and right_on is not None:
        return pd.merge(left, right, how=how, left_on=left_on, right_on=right_on)
    raise ValueError("No valid merge keys provided")


def remove_null_values(df: pd.DataFrame):
    """
    Remove the null values from the data.

    Args:
      df (pd.DataFrame): The data.

    Returns:
      pd.DataFrame: The data with null values removed.
    """
    return df.dropna()


def fill_null_values(df: pd.DataFrame, value: any = None, method: str = "ffill"):
    """
    Fill the null values in the data.

    Args:
      df (pd.DataFrame): The data.
      value (any): The value to fill the null values with. If None, the method is used to fill the null values.
      method (str): The method to use for the null values fill. Available methods are 'ffill', 'bfill', 'pad', 'backfill', 'interpolate'.

    Returns:
      pd.DataFrame: The data with null values filled.
    """
    if value is not None:
        return df.fillna(value)
    if method == "ffill":
        return df.fillna(method="ffill")
    elif method == "bfill":
        return df.fillna(method="bfill")
    elif method == "pad":
        return df.fillna(method="pad")
    elif method == "backfill":
        return df.fillna(method="backfill")
    elif method == "interpolate":
        return df.fillna(method="interpolate")


def remove_duplicate_values(df: pd.DataFrame):
    """
    Remove the duplicate values from the data.

    Args:
      df (pd.DataFrame): The data.

    Returns:
      pd.DataFrame: The data with duplicate values removed.
    """
    return df.drop_duplicates()


def replace_column_value(df: pd.DataFrame, column: str, value: any, new_value: any):
    """
    Replace the value in the column.

    Args:
      df (pd.DataFrame): The data.
      column (str): The column to replace the value from.
      value (any): The value to replace.
      new_value (any): The new value.

    Returns:
      pd.DataFrame: The data with the value replaced.
    """
    df[column] = df[column].replace(value, new_value)
    return df


def replace_column_value_regex(
    df: pd.DataFrame, column: str, pattern: str, new_value: any
):
    """
    Replace the value in the column using regex.

    Args:
      df (pd.DataFrame): The data.
      column (str): The column to replace the value from.
      pattern (str): The regex pattern to replace.
      new_value (any): The new value.

    Returns:
      pd.DataFrame: The data with the value replaced.
    """
    df[column] = df[column].replace(to_replace=pattern, value=new_value, regex=True)
    return df


def change_data_type(df: pd.DataFrame, columns: list[str], data_type: str):
    """
    Change the data type of the column.

    Args:
      df (pd.DataFrame): The data.
      columns (list[str]): The columns to change the data type from.
      data_type (str): The new data type.

    Returns:
      pd.DataFrame: The data with the data type changed.
    """
    for column in columns:
        df[column] = df[column].astype(data_type)

    return df


def create_column_from_expression(
    df: pd.DataFrame, new_column: str, expression: str
) -> pd.DataFrame:
    """
    Create a new column using a pandas eval expression.

    Args:
        df (pd.DataFrame): The data.
        new_column (str): Name of the new column.
        expression (str): Expression using column names. e.g. 'column1 + column2'

    Returns:
        pd.DataFrame: DataFrame with new column added.
    """
    try:
        df[new_column] = df.eval(expression)
    except Exception:
        local_scope = {col: df[col] for col in df.columns}
        local_scope["pd"] = pd
        local_scope["np"] = np
        df[new_column] = eval(expression, {"__builtins__": {}}, local_scope)
    return df


def compute_data_quality_score(df: pd.DataFrame) -> dict:
    """
    Compute a normalized data quality score.
    Returns per-dimension scores + global score.

    Args:
        df (pd.DataFrame): The data.

    Returns:
        dict: The data quality score.
    """
    total_cells = df.shape[0] * df.shape[1]

    null_ratio = df.isnull().sum().sum() / total_cells
    duplicate_ratio = df.duplicated().sum() / max(len(df), 1)

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    outlier_ratio = 0.0
    if len(numeric_cols) > 0:
        outliers = detect_outliers_isolation_forest(
            df, columns=numeric_cols, return_outliers_only=True
        )
        outlier_ratio = len(outliers) / max(len(df), 1)

    score = 1.0 - (0.5 * null_ratio + 0.3 * duplicate_ratio + 0.2 * outlier_ratio)

    return {
        "null_ratio": null_ratio,
        "duplicate_ratio": duplicate_ratio,
        "outlier_ratio": outlier_ratio,
        "quality_score": round(max(score, 0), 3),
    }


def drop_columns(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """
    Drop specified columns from the dataframe.

    Args:
        df (pd.DataFrame): The data.
        columns (list[str]): List of column names to drop.

    Returns:
        pd.DataFrame: DataFrame with columns removed.
    """
    return df.drop(columns=columns, errors="ignore")


def rename_columns(df: pd.DataFrame, mapping: dict[str, str]) -> pd.DataFrame:
    """
    Rename columns in the dataframe.

    Args:
        df (pd.DataFrame): The data.
        mapping (dict[str, str]): Dictionary mapping old names to new names.

    Returns:
        pd.DataFrame: DataFrame with renamed columns.
    """
    return df.rename(columns=mapping)


def clean_text_column(
    df: pd.DataFrame, column: str, operations: list[str] = ["strip"]
) -> pd.DataFrame:
    """
    Clean a text column with specified operations.

    Args:
        df (pd.DataFrame): The data.
        column (str): The column to clean.
        operations (list[str]): List of operations: 'strip', 'lower', 'upper', 'title'.

    Returns:
        pd.DataFrame: DataFrame with cleaned column.
    """
    if column not in df.columns:
        raise ValueError(f"Column {column} not found in dataframe")

    series = df[column].astype(str)

    for op in operations:
        if op == "strip":
            series = series.str.strip()
        elif op == "lower":
            series = series.str.lower()
        elif op == "upper":
            series = series.str.upper()
        elif op == "title":
            series = series.str.title()

    df[column] = series
    return df


def convert_to_datetime(
    df: pd.DataFrame, columns: list[str], format: str = None
) -> pd.DataFrame:
    """
    Convert columns to datetime objects.

    Args:
        df (pd.DataFrame): The data.
        columns (list[str]): List of columns to convert.
        format (str): Optional datetime format string.

    Returns:
        pd.DataFrame: DataFrame with converted columns.
    """
    for col in columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], format=format, errors="coerce")
    return df


def impute_missing_values(
    df: pd.DataFrame, columns: list[str], strategy: str = "mean", fill_value: any = None
) -> pd.DataFrame:
    """
    Impute missing values in specified columns.

    Args:
        df (pd.DataFrame): The data.
        columns (list[str]): List of columns to impute.
        strategy (str): Imputation strategy: 'mean', 'median', 'mode', 'constant'.
        fill_value (any): Value to use when strategy is 'constant'.

    Returns:
        pd.DataFrame: DataFrame with imputed values.
    """
    for col in columns:
        if col not in df.columns:
            continue

        if strategy == "mean":
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].fillna(df[col].mean())
        elif strategy == "median":
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].fillna(df[col].median())
        elif strategy == "mode":
            mode_val = df[col].mode()
            if not mode_val.empty:
                df[col] = df[col].fillna(mode_val[0])
        elif strategy == "constant":
            df[col] = df[col].fillna(fill_value)

    return df


def save_to_csv(df: pd.DataFrame, path: str) -> str:
    df.to_csv(path, index=False)
    return path


def group_and_aggregate(
    df: pd.DataFrame,
    group_by_columns: list[str],
    agg_columns: dict[str, str] | list[str],
    agg_func: str = "mean",
) -> pd.DataFrame:
    """
    Group by columns and aggregate.

    Args:
        df (pd.DataFrame): The data.
        group_by_columns (list[str]): Columns to group by.
        agg_columns (dict[str, str] | list[str]): Columns to aggregate.
            If a list, the same agg_func is applied to all.
            If a dict, keys are columns and values are aggregation functions (e.g. {'col1': 'mean', 'col2': 'sum'}).
        agg_func (str): Default aggregation function if agg_columns is a list.

    Returns:
        pd.DataFrame: The aggregated dataframe with index reset.
    """
    if isinstance(agg_columns, list):
        agg_dict = {col: agg_func for col in agg_columns}
    else:
        agg_dict = agg_columns

    grouped_df = df.groupby(group_by_columns).agg(agg_dict).reset_index()
    return grouped_df


def create_pivot_table(
    df: pd.DataFrame,
    index: str | list[str],
    columns: str | list[str],
    values: str | list[str],
    aggfunc: str = "mean",
) -> pd.DataFrame:
    """
    Create a pivot table.

    Args:
        df (pd.DataFrame): The data.
        index (str | list[str]): Column(s) to group by on the index.
        columns (str | list[str]): Column(s) to group by on the columns.
        values (str | list[str]): Column(s) to aggregate.
        aggfunc (str): Aggregation function.

    Returns:
        pd.DataFrame: The pivot table with index reset.
    """
    pivot_df = df.pivot_table(
        index=index, columns=columns, values=values, aggfunc=aggfunc
    ).reset_index()
    return pivot_df


def remove_outliers(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    method: str = "isolation_forest",
    contamination: float = 0.05,
    threshold: float = 1.5,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Remove outliers using Isolation Forest or IQR.

    Args:
        df (pd.DataFrame): The data.
        columns (list[str] | None): Numeric columns to use. If None, all numeric columns are used.
        method (str): Method to use ('isolation_forest' or 'iqr').
        contamination (float): Proportion of expected outliers (for Isolation Forest).
        threshold (float): IQR multiplier (default 1.5).
        random_state (int): Random seed.

    Returns:
        pd.DataFrame: DataFrame with outliers removed.
    """
    if columns is None:
        columns = df.select_dtypes(include=[np.number]).columns.tolist()

    if not columns:
        return df

    if method == "iqr":
        mask = pd.Series([True] * len(df), index=df.index)
        for col in columns:
            if col in df.columns:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                col_mask = (df[col] >= lower_bound) & (df[col] <= upper_bound)
                mask = mask & col_mask
        return df[mask]

    else:
        model = IsolationForest(contamination=contamination, random_state=random_state)
        df_for_model = df[columns].fillna(df[columns].median())

        outlier_labels = model.fit_predict(df_for_model)
        return df[outlier_labels == 1]


def clip_values(
    df: pd.DataFrame,
    columns: list[str],
    lower_percentile: float = 0.01,
    upper_percentile: float = 0.99,
) -> pd.DataFrame:
    """
    Clip values in specified columns to the given percentiles.

    Args:
        df (pd.DataFrame): The data.
        columns (list[str]): List of columns to clip.
        lower_percentile (float): Lower percentile (0-1).
        upper_percentile (float): Upper percentile (0-1).

    Returns:
        pd.DataFrame: DataFrame with clipped values.
    """
    df_clipped = df.copy()
    for col in columns:
        if col in df_clipped.columns and pd.api.types.is_numeric_dtype(df_clipped[col]):
            lower_limit = df_clipped[col].quantile(lower_percentile)
            upper_limit = df_clipped[col].quantile(upper_percentile)
            df_clipped[col] = df_clipped[col].clip(lower=lower_limit, upper=upper_limit)
    return df_clipped


def split_column(
    df: pd.DataFrame, column: str, delimiter: str, new_columns: list[str]
) -> pd.DataFrame:
    """
    Split a column into multiple columns based on a delimiter.

    Args:
        df (pd.DataFrame): The data.
        column (str): The column to split.
        delimiter (str): The delimiter to split by.
        new_columns (list[str]): The names of the new columns.

    Returns:
        pd.DataFrame: DataFrame with the column split.
    """
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found")

    split_df = df[column].astype(str).str.split(delimiter, expand=True)

    if split_df.shape[1] > len(new_columns):
        split_df = split_df.iloc[:, : len(new_columns)]
    elif split_df.shape[1] < len(new_columns):
        split_df = split_df.reindex(columns=range(len(new_columns)))

    split_df.columns = new_columns
    df = pd.concat([df, split_df], axis=1)

    return df


def convert_column_type(
    df: pd.DataFrame, column: str, target_type: str, errors: str = "coerce"
) -> pd.DataFrame:
    """
    Convert a column to a specified type.

    Args:
        df (pd.DataFrame): The data.
        column (str): The column to convert.
        target_type (str): The target type ('numeric', 'datetime', 'string', 'int', 'float').
        errors (str): How to handle errors ('coerce', 'raise', 'ignore').

    Returns:
        pd.DataFrame: DataFrame with the column converted.
    """
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found")

    if target_type == "numeric":
        df[column] = pd.to_numeric(df[column], errors=errors)
    elif target_type == "datetime":
        df[column] = pd.to_datetime(df[column], errors=errors)
    elif target_type == "string":
        df[column] = df[column].astype(str)
    elif target_type == "int":
        series = pd.to_numeric(df[column], errors=errors)
        if pd.api.types.is_float_dtype(series):
            series = np.trunc(series)
        df[column] = series.astype("Int64")
    elif target_type == "float":
        df[column] = pd.to_numeric(df[column], errors=errors).astype(float)
    else:
        df[column] = df[column].astype(target_type, errors=errors)

    return df


def _optimize_plot_ticks(ax):
    """
    Optimize ticks for numeric axes to prevent overcrowding.
    Also truncates long string labels to max 10 chars.
    Truncates legend texts to max 20 chars.
    """
    from matplotlib.ticker import MaxNLocator

    try:
        new_labels = []
        for label in ax.get_xticklabels():
            text = label.get_text()
            if len(text) > 10:
                text = text[:10] + "..."
            new_labels.append(text)

        if new_labels:
            ax.set_xticks(ax.get_xticks())
            ax.set_xticklabels(new_labels, rotation=45, ha="right")
    except Exception:
        pass

    try:
        legend = ax.get_legend()
        if legend:
            for text in legend.get_texts():
                original_text = text.get_text()
                if len(original_text) > 20:
                    text.set_text(original_text[:20] + "...")
    except Exception:
        pass

    if len(ax.get_xticks()) > 20:
        ax.xaxis.set_major_locator(MaxNLocator(nbins=10))
        ax.tick_params(axis="x", rotation=45)

    if len(ax.get_yticks()) > 20:
        ax.yaxis.set_major_locator(MaxNLocator(nbins=10))


def plot_bar(
    df: pd.DataFrame,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str | dict | list = None,
    sort_by: str = None,
    ascending: bool = False,
    save_path: str = None,
) -> str | None:
    """
    Create a bar plot. Handles high cardinality in x by showing top 20.
    Returns a warning string if truncation occurred, else None.
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    warning = None

    plot_df = df.copy()

    if pd.api.types.is_numeric_dtype(plot_df[y]):
        initial_len = len(plot_df)
        plot_df = plot_df[~plot_df[y].isin([np.inf, -np.inf])]
        if len(plot_df) < initial_len:
            inf_warning = f"Dropped {initial_len - len(plot_df)} rows with infinite values in '{y}'."
            if warning:
                warning += f" {inf_warning}"
            else:
                warning = inf_warning

    if df[x].nunique() > 20:
        if pd.api.types.is_numeric_dtype(df[y]):
            # Use plot_df to calculate top 20 based on valid values
            top_20 = plot_df.groupby(x)[y].sum().nlargest(20).index
        else:
            top_20 = plot_df[x].value_counts().nlargest(20).index
        plot_df = plot_df[plot_df[x].isin(top_20)]
        title = (title or "") + " (Top 20 Categories)"
        warning_card = f"High cardinality in '{x}' ({df[x].nunique()} categories): truncated to top 20."
        if warning:
            warning += f" {warning_card}"
        else:
            warning = warning_card
    else:
        # plot_df is already a copy
        pass

    if sort_by:
        if sort_by == "y":
            if pd.api.types.is_numeric_dtype(plot_df[y]):
                order_series = (
                    plot_df.groupby(x)[y].sum().sort_values(ascending=ascending)
                )
                order = order_series.index.tolist()
            else:
                order_series = (
                    plot_df[x].value_counts().sort_values(ascending=ascending)
                )
                order = order_series.index.tolist()
        elif sort_by == "x":
            order_series = list(sorted(plot_df[x].unique(), reverse=not ascending))
            order = order_series
        else:
            order = None
    else:
        if df[x].nunique() > 20:
            order = top_20.tolist()
        else:
            order = None

    if hue and plot_df[hue].nunique() > 10:
        top_10_hues = plot_df[hue].value_counts().nlargest(10).index
        plot_df = plot_df[plot_df[hue].isin(top_10_hues)]
        title = (title or "") + f" (Top 10 {hue})"
        hue_warning = f"High cardinality in '{hue}' ({df[hue].nunique()} groups): truncated to top 10."
        if warning:
            warning += f" {hue_warning}"
        else:
            warning = hue_warning

    sns.barplot(
        data=plot_df,
        x=x,
        y=y,
        hue=hue,
        color=color,
        palette=palette,
        order=order,
        ax=ax,
    )

    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)

    _optimize_plot_ticks(ax)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)

    return warning


def plot_line(
    df: pd.DataFrame,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str | dict | list = None,
    save_path: str = None,
) -> str | None:
    """
    Create a line plot.
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    warning = None

    plot_df = df.copy()
    
    # Filter infinite values in y first
    if pd.api.types.is_numeric_dtype(plot_df[y]):
        initial_len = len(plot_df)
        plot_df = plot_df[~plot_df[y].isin([np.inf, -np.inf])]
        if len(plot_df) < initial_len:
            inf_warning = f"Dropped {initial_len - len(plot_df)} rows with infinite values in '{y}'."
            if warning:
                warning += f" {inf_warning}"
            else:
                warning = inf_warning

    if hue and plot_df[hue].nunique() > 10:
        top_10_hues = plot_df[hue].value_counts().nlargest(10).index
        plot_df = plot_df[plot_df[hue].isin(top_10_hues)]
        title = (title or "") + f" (Top 10 {hue})"

    sns.lineplot(
        data=plot_df,
        x=x,
        y=y,
        hue=hue,
        color=color,
        palette=palette,
        ax=ax,
    )
    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)

    _optimize_plot_ticks(ax)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)


def plot_scatter(
    df: pd.DataFrame,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str | dict | list = None,
    save_path: str = None,
) -> str | None:
    """
    Create a scatter plot.
    Returns a warning string if truncation occurred, else None.
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    warning = None

    plot_df = df.copy()
    
    # Filter infinite values in x and y first
    initial_len = len(plot_df)
    cols_to_check = []
    if pd.api.types.is_numeric_dtype(plot_df[x]):
        cols_to_check.append(x)
    if pd.api.types.is_numeric_dtype(plot_df[y]):
        cols_to_check.append(y)
        
    if cols_to_check:
        mask = plot_df[cols_to_check].isin([np.inf, -np.inf]).any(axis=1)
        plot_df = plot_df[~mask]
        if len(plot_df) < initial_len:
            inf_warning = f"Dropped {initial_len - len(plot_df)} rows with infinite values in {cols_to_check}."
            if warning:
                warning += f" {inf_warning}"
            else:
                warning = inf_warning

    if hue and plot_df[hue].nunique() > 10:
        top_10_hues = plot_df[hue].value_counts().nlargest(10).index
        plot_df = plot_df[plot_df[hue].isin(top_10_hues)]
        title = (title or "") + f" (Top 10 {hue})"
        warning_hue = f"High cardinality in '{hue}' ({df[hue].nunique()} groups): truncated to top 10."
        if warning:
             warning += f" {warning_hue}"
        else:
             warning = warning_hue

    sns.scatterplot(
        data=plot_df,
        x=x,
        y=y,
        hue=hue,
        color=color,
        palette=palette,
        ax=ax,
    )
    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)

    _optimize_plot_ticks(ax)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)

    return warning


def plot_histogram(
    df: pd.DataFrame,
    x: str,
    hue: str = None,
    kde: bool = True,
    title: str = None,
    xlabel: str = None,
    bins: int | str = "auto",
    color: str = None,
    palette: str | dict | list = None,
    save_path: str = None,
) -> str | None:
    """
    Create a histogram.
    Returns a warning string if truncation occurred, else None.
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    warning = None

    plot_df = df.copy()
    
    # Filter infinite values in x first
    if pd.api.types.is_numeric_dtype(plot_df[x]):
        initial_len = len(plot_df)
        plot_df = plot_df[~plot_df[x].isin([np.inf, -np.inf])]
        if len(plot_df) < initial_len:
            inf_warning = f"Dropped {initial_len - len(plot_df)} rows with infinite values in '{x}'."
            if warning:
                warning += f" {inf_warning}"
            else:
                warning = inf_warning

    if hue and plot_df[hue].nunique() > 10:
        top_10_hues = plot_df[hue].value_counts().nlargest(10).index
        plot_df = plot_df[plot_df[hue].isin(top_10_hues)]
        title = (title or "") + f" (Top 10 {hue})"
        warning_hue = f"High cardinality in '{hue}' ({df[hue].nunique()} groups): truncated to top 10."
        if warning:
            warning += f" {warning_hue}"
        else:
            warning = warning_hue

    sns.histplot(
        data=plot_df,
        x=x,
        hue=hue,
        kde=kde,
        bins=bins,
        color=color,
        palette=palette,
        ax=ax,
    )
    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)

    _optimize_plot_ticks(ax)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)

    return warning


def plot_box(
    df: pd.DataFrame,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str | dict | list = None,
    save_path: str = None,
) -> str | None:
    """
    Create a box plot.
    Returns a warning string if truncation occurred, else None.
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    warning = None
    
    plot_df = df.copy()

    # Filter infinite values in y first
    if pd.api.types.is_numeric_dtype(plot_df[y]):
        initial_len = len(plot_df)
        plot_df = plot_df[~plot_df[y].isin([np.inf, -np.inf])]
        if len(plot_df) < initial_len:
            inf_warning = f"Dropped {initial_len - len(plot_df)} rows with infinite values in '{y}'."
            if warning:
                warning += f" {inf_warning}"
            else:
                warning = inf_warning

    if x and plot_df[x].nunique() > 20:
        if pd.api.types.is_numeric_dtype(plot_df[y]):
            top_20 = plot_df.groupby(x)[y].median().nlargest(20).index
        else:
            top_20 = plot_df[x].value_counts().nlargest(20).index
        plot_df = plot_df[plot_df[x].isin(top_20)]
        title = (title or "") + " (Top 20 Categories by Median)"
        warning_card = f"High cardinality in '{x}' ({df[x].nunique()} categories): truncated to top 20."
        if warning:
            warning += f" {warning_card}"
        else:
            warning = warning_card

    if hue and plot_df[hue].nunique() > 10:
        top_10_hues = plot_df[hue].value_counts().nlargest(10).index
        plot_df = plot_df[plot_df[hue].isin(top_10_hues)]
        title = (title or "") + f" (Top 10 {hue})"
        hue_warning = f"High cardinality in '{hue}' ({df[hue].nunique()} groups): truncated to top 10."
        if warning:
            warning += f" {hue_warning}"
        else:
            warning = hue_warning

    sns.boxplot(
        data=plot_df,
        x=x,
        y=y,
        hue=hue,
        color=color,
        palette=palette,
        ax=ax,
    )
    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)

    _optimize_plot_ticks(ax)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)

    return warning


def plot_heatmap(
    df: pd.DataFrame,
    index: str = None,
    columns: str = None,
    values: str = None,
    aggfunc: str = "mean",
    title: str = None,
    annot: bool = True,
    cmap: str = "coolwarm",
    save_path: str = None,
):
    """
    Create a heatmap (usually for correlation matrices).
    Supports creating a pivot table on the fly if index, columns, and values are provided.
    """
    fig, ax = plt.subplots(figsize=(10, 8))

    plot_data = df.copy()
    
    if not (index and columns and values):
        plot_data = plot_data.replace([np.inf, -np.inf], np.nan)
        
    if index and columns and values:
        plot_data = df.pivot_table(
            index=index, columns=columns, values=values, aggfunc=aggfunc
        )

    sns.heatmap(plot_data, annot=annot, cmap=cmap, ax=ax)
    if title:
        ax.set_title(title)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)


def plot_count(
    df: pd.DataFrame,
    x: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str | dict | list = None,
    save_path: str = None,
) -> str | None:
    """
    Create a count plot. Handles high cardinality.
    Returns a warning string if truncation occurred, else None.
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    warning = None
    
    plot_df = df.copy()

    # Filter infinite values in x (if numeric) first
    if pd.api.types.is_numeric_dtype(plot_df[x]):
        initial_len = len(plot_df)
        plot_df = plot_df[~plot_df[x].isin([np.inf, -np.inf])]
        if len(plot_df) < initial_len:
            inf_warning = f"Dropped {initial_len - len(plot_df)} rows with infinite values in '{x}'."
            if warning:
                warning += f" {inf_warning}"
            else:
                warning = inf_warning

    if plot_df[x].nunique() > 20:
        top_20 = plot_df[x].value_counts().nlargest(20).index
        plot_df = plot_df[plot_df[x].isin(top_20)]
        title = (title or "") + " (Top 20 Categories)"
        warning_card = f"High cardinality in '{x}' ({df[x].nunique()} categories): truncated to top 20."
        if warning:
            warning += f" {warning_card}"
        else:
            warning = warning_card

    if hue and plot_df[hue].nunique() > 10:
        top_10_hues = plot_df[hue].value_counts().nlargest(10).index
        plot_df = plot_df[plot_df[hue].isin(top_10_hues)]
        title = (title or "") + f" (Top 10 {hue})"
        hue_warning = f"High cardinality in '{hue}' ({df[hue].nunique()} groups): truncated to top 10."
        if warning:
            warning += f" {hue_warning}"
        else:
            warning = hue_warning

    sns.countplot(
        data=plot_df,
        x=x,
        hue=hue,
        order=plot_df[x].value_counts().index,
        color=color,
        palette=palette,
        ax=ax,
    )
    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)

    _optimize_plot_ticks(ax)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)

    return warning


def plot_pie(
    df: pd.DataFrame,
    labels: str,
    values: str = None,
    title: str = None,
    palette: str | dict | list = None,
    save_path: str = None,
) -> str | None:
    """
    Create a pie chart.
    Args:
        df: DataFrame
        labels: Column for slice labels
        values: Column for slice sizes. If None, counts occurrences of 'labels'.
        title: Plot title
        palette: Color palette
        save_path: Path to save the plot
    Returns:
        Warning string if truncation occurred.
    """
    fig, ax = plt.subplots(figsize=(10, 8))
    warning = None

    if values:
        if pd.api.types.is_numeric_dtype(df[values]):
            clean_df = df[~df[values].isin([np.inf, -np.inf])]
            if len(clean_df) < len(df):
                warning = f"Dropped {len(df) - len(clean_df)} rows with infinite values in '{values}'."
            data = clean_df.groupby(labels)[values].sum()
        else:
            data = df[labels].value_counts()
    else:
        data = df[labels].value_counts()

    if len(data) > 10:
        top_10 = data.nlargest(10)
        others_sum = data.sum() - top_10.sum()
        data = top_10
        if others_sum > 0:
            data["Others"] = others_sum
        warning = (
            f"High cardinality in '{labels}': truncated to top 10 categories + Others."
        )
        title = (title or "") + " (Top 10 + Others)"

    colors = None
    if palette:
        if isinstance(palette, str):
            colors = sns.color_palette(palette, n_colors=len(data))
        elif isinstance(palette, list):
            colors = palette

    def autopct_filter(pct):
        return ("%1.1f%%" % pct) if pct > 2 else ""

    wedges, texts, autotexts = ax.pie(
        data,
        labels=None,
        autopct=autopct_filter,
        startangle=90,
        colors=colors,
        textprops={"fontsize": 10},
        pctdistance=0.85,
    )

    ax.legend(
        wedges,
        [
            f"{label[:20] + '...' if len(label) > 20 else label} ({value:,})"
            for label, value in zip(data.index, data.values)
        ],
        title=labels,
        loc="center left",
        bbox_to_anchor=(1, 0, 0.5, 1),
    )

    if title:
        ax.set_title(title)

    if save_path:
        fig.tight_layout()
        fig.savefig(save_path, bbox_inches="tight")
        plt.close(fig)

    return warning


def get_top_n_rows(
    df: pd.DataFrame, column: str, n: int = 5, ascending: bool = False
) -> pd.DataFrame:
    """
    Get the top/bottom N rows sorted by a column.

    Args:
        df (pd.DataFrame): The data.
        column (str): The column to sort by.
        n (int): The number of rows to return.
        ascending (bool): Whether to sort in ascending order (True=bottom N, False=top N).

    Returns:
        pd.DataFrame: The sorted dataframe.
    """
    if column not in df.columns:
        raise ValueError(f"Column {column} not found in dataframe")
    return df.sort_values(by=column, ascending=ascending).head(n)


def get_group_stats(
    df: pd.DataFrame, group_by: str, target_col: str, agg: str = "mean"
) -> dict:
    """
    Get aggregated statistics for a target column grouped by another column.

    Args:
        df (pd.DataFrame): The data.
        group_by (str): The column to group by.
        target_col (str): The column to aggregate.
        agg (str): The aggregation function ('mean', 'sum', 'max', 'min', 'count', 'median').

    Returns:
        dict: A dictionary of {group_label: aggregated_value}.
    """
    if group_by not in df.columns or target_col not in df.columns:
        raise ValueError(f"Columns {group_by} or {target_col} not found")

    result = df.groupby(group_by)[target_col].agg(agg)
    return result.to_dict()


def get_column_stats(df: pd.DataFrame, column: str) -> dict:
    """
    Get detailed statistics for a specific column.

    Args:
        df (pd.DataFrame): The data.
        column (str): The column to analyze.

    Returns:
        dict: Dictionary of statistics.
    """
    if column not in df.columns:
        raise ValueError(f"Column {column} not found")

    series = df[column]
    stats = series.describe().to_dict()

    stats["null_count"] = int(series.isnull().sum())
    stats["dtype"] = str(series.dtype)

    if pd.api.types.is_numeric_dtype(series):
        stats["skew"] = float(series.skew())
        stats["kurtosis"] = float(series.kurtosis())

    return stats


def get_aggregation_scalar(df: pd.DataFrame, column: str, agg: str = "mean") -> float:
    """
    Get a single aggregated value for a column (e.g., total revenue).

    Args:
        df (pd.DataFrame): The data.
        column (str): The column to aggregate.
        agg (str): Aggregation function ('mean', 'sum', 'max', 'min', 'count', 'median', 'std', 'var').

    Returns:
        float: The aggregated scalar value.
    """
    if column not in df.columns:
        raise ValueError(f"Column {column} not found")

    series = df[column]

    if agg == "mean":
        return float(series.mean())
    elif agg == "sum":
        return float(series.sum())
    elif agg == "max":
        return float(series.max())
    elif agg == "min":
        return float(series.min())
    elif agg == "count":
        return int(series.count())
    elif agg == "median":
        return float(series.median())
    elif agg == "std":
        return float(series.std())
    elif agg == "var":
        return float(series.var())
    else:
        raise ValueError(f"Unsupported aggregation: {agg}")


def save_text_to_file(text: str, filename: str) -> str:
    """
    Save text content to a file.

    Args:
        text (str): The text content to save.
        filename (str): The path to the file.

    Returns:
        str: The path to the saved file.
    """
    with open(filename, "w", encoding="utf-8") as f:
        f.write(text)
    return filename


def remove_rows_by_condition(df: pd.DataFrame, column: str, value, method: str = "eq"):
    """
    Remove rows based on a condition.
    Inverse of get_rows_by_condition.
    """
    if column not in df.columns:
        raise KeyError(f"Column '{column}' not found")

    series = df[column]
    value = _cast_value(series, value, method)

    if method == "eq":
        return df[series != value]
    elif method == "ne":
        return df[series == value]
    elif method == "gt":
        return df[series <= value]
    elif method == "lt":
        return df[series >= value]
    elif method == "ge":
        return df[series < value]
    elif method == "le":
        return df[series > value]
    elif method == "between":
        low, high = value
        return df[~((series >= low) & (series <= high))]

    elif method == "in":
        return df[~series.isin(value)]
    elif method == "not_in":
        return df[series.isin(value)]

    if not is_string_dtype(series):
        series = series.astype(str)

    if method == "contains":
        return df[~series.str.contains(value, na=False)]
    elif method == "not_contains":
        return df[series.str.contains(value, na=False)]
    elif method == "startswith":
        return df[~series.str.startswith(value, na=False)]
    elif method == "endswith":
        return df[~series.str.endswith(value, na=False)]
    elif method == "regex":
        return df[~series.str.contains(value, regex=True, na=False)]
    elif method == "not_regex":
        return df[series.str.contains(value, regex=True, na=False)]

    else:
        raise ValueError(f"Invalid method: {method}")
