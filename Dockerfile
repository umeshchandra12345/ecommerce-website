FROM python:3.12-slim

WORKDIR /code

# Copy and install dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy application source code
COPY ./api /code/api
COPY ./app /code/app
COPY ./core /code/core
COPY ./services /code/services
COPY ./templates /code/templates
COPY ./utils.py /code/utils.py

# Expose port
EXPOSE 8000

# Default command
CMD ["fastapi", "run", "app/main.py", "--port", "8000"]
