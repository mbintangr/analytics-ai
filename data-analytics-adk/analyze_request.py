import os
import requests
import time
import json as import_json


def analyze_files():
    # Define the directory containing the dataset
    dataset_dir = "sales_dataset"

    # Define the API endpoint
    url = "http://127.0.0.1:8000/analyze"

    # List of files to analyze
    selected_files = [
        # "indo_1000000_dirty_sales_data.csv",
        # "indo_1000000_clean_sales_data.csv",
        # "indo_10000000_dirty_sales_data.csv",
        # "indo_10000000_clean_sales_data.csv",
        # "instax_sales_transaction_data.csv",
        "amazon.csv",
    ]

    # Check if directory exists
    if not os.path.exists(dataset_dir):
        print(f"Directory '{dataset_dir}' not found.")
        return

    # Iterate through selected files
    for filename in selected_files:
        file_path = os.path.join(dataset_dir, filename)

        # Check if file exists
        if not os.path.exists(file_path):
            print(f"File '{filename}' not found in {dataset_dir}. Skipping...")
            continue

        print(f"Sending {filename} for analysis...")

        max_retries = 5
        retry_delay = 10

        for attempt in range(max_retries):
            try:
                with open(file_path, "rb") as f:
                    files = {"file": (filename, f)}

                    # Send POST request
                    print(f"Sending request for {filename}...")
                    start_time = time.time()

                    with requests.post(url, files=files, stream=True) as response:
                        if response.status_code == 200:
                            print(
                                f"Connection established. Receiving stream for {filename}..."
                            )

                            for line in response.iter_lines():
                                if line:
                                    try:
                                        data = (
                                            response.json()
                                            if not isinstance(line, bytes)
                                            else import_json.loads(line)
                                        )

                                        if data.get("type") == "progress":
                                            stage = data.get("stage")
                                            agent = data.get("agent", "")
                                            msg = data.get("message", "")
                                            print(
                                                f"[{time.time() - start_time:.2f}s] Progress: {stage} {agent} {msg}"
                                            )

                                        elif data.get("type") == "result":
                                            print(
                                                f"[{time.time() - start_time:.2f}s] Analysis Complete!"
                                            )
                                            # print("Result:", json.dumps(data.get("data"), indent=2))
                                            # break loop if needed or just wait for stream end

                                        elif data.get("type") == "error":
                                            print(
                                                f"[{time.time() - start_time:.2f}s] Error: {data.get('message')}"
                                            )

                                    except Exception as e:
                                        # In case line is not json or some other error
                                        pass

                            print(f"Success! {filename} analysis stream finished.")
                            break  # Success, exit retry loop
                        else:
                            print(
                                f"Attempt {attempt + 1}/{max_retries} failed to analyze {filename}. Status code: {response.status_code}"
                            )
                            print("Response:", response.text)

            except Exception as e:
                print(
                    f"Attempt {attempt + 1}/{max_retries} error occurred while processing {filename}: {e}"
                )

            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"All {max_retries} attempts failed for {filename}.")

        print("-" * 50)


if __name__ == "__main__":
    analyze_files()
