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

    return warning


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
