# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install uv provided by the astral-sh/uv image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory in the container
WORKDIR /app

# Copy the file with the requirements to the container
COPY pyproject.toml uv.lock ./

# Install python dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the application
# We use `uv run` to ensure we run within the environment created by `uv sync`
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
