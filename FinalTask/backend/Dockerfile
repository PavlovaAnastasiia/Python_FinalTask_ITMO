# Use the official Python image
FROM python:3.9.20-slim-bullseye

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY app.py .

# Expose the port on which the application runs
EXPOSE 5000

# Command to run the application, waiting for MySQL to be ready
CMD ["python", "app.py"]