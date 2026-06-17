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
        print(f"No CSV files found in {dataset_dir}")
        return

    print("Initializing tokenizer...")
    enc = tiktoken.get_encoding("cl100k_base")
    
    report_data = []
    
    print(f"Processing {len(csv_files)} files...")
    for file_path in csv_files:
        filename = os.path.basename(file_path)
        print("Processing file: ", filename)

        char_count, token_count = count_tokens_in_file(file_path, enc)
        report_data.append((filename, char_count, token_count))

        print(f"File: {filename}, Characters: {char_count:,}, Tokens: {token_count:,}")
        
        base_name = os.path.splitext(filename)[0]
        ind_report_path = os.path.join(dataset_dir, f"{base_name}_token_report.txt")
        ind_report_text = f"File: {filename}\nCharacters: {char_count:,}\nTokens: {token_count:,}\n"
        with open(ind_report_path, "w", encoding="utf-8") as ind_f:
            ind_f.write(ind_report_text)
    
    report_lines = []
    report_lines.append("--- Token Count Report ---")
    report_lines.append(f"{'Filename':<40} | {'Characters':<15} | {'Tokens':<15}")
    report_lines.append("-" * 76)
    
    total_chars = 0
    total_tokens = 0
    for filename, chars, tokens in sorted(report_data):
        report_lines.append(f"{filename:<40} | {chars:<15,} | {tokens:<15,}")
        total_chars += chars
        total_tokens += tokens
        
    report_lines.append("-" * 76)
    report_lines.append(f"{'Total':<40} | {total_chars:<15,} | {total_tokens:<15,}")
    
    report_text = "\n".join(report_lines)
    
    print(f"\n{report_text}")
    
    report_file_path = os.path.join(current_dir, "token_count_report.txt")
    with open(report_file_path, "w", encoding="utf-8") as f:
        f.write(report_text)
        
    print(f"\nReport saved to: {report_file_path}")

if __name__ == "__main__":
    generate_report()