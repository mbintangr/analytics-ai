import os
import glob
import tiktoken

def count_tokens_in_file(filename, enc):
    with open(filename, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    
    char_count = len(text)
    tokens = enc.encode(text)
    token_count = len(tokens)
    
    return char_count, token_count

def generate_report():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(current_dir, "sales_dataset")
    
    csv_files = glob.glob(os.path.join(dataset_dir, "*.csv"))
    
    if not csv_files:
        return

    enc = tiktoken.get_encoding("cl100k_base")
    
    report_data = []
    
    for file_path in csv_files:
        filename = os.path.basename(file_path)

        char_count, token_count = count_tokens_in_file(file_path, enc)
        report_data.append((filename, char_count, token_count))
        
        base_name = os.path.splitext(filename)[0]
        ind_report_path = os.path.join(dataset_dir, f"{base_name}_token_report.txt")
        ind_report_text = f"File: {filename}\nCharacters: {char_count:,}\nTokens: {token_count:,}\n"
        with open(ind_report_path, "w", encoding="utf-8") as ind_f:
            ind_f.write(ind_report_text)

if __name__ == "__main__":
    generate_report()