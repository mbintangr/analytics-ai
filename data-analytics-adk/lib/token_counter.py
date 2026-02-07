import tiktoken

def count_tokens_in_file(filename):
    print("Loading file...")
    # Read the file as a raw string
    with open(filename, 'r', encoding='utf-8') as f:
        text = f.read()
    
    print(f"File loaded. Length: {len(text)} characters.")
    
    # Initialize Tokenizer (GPT-4 encoding)
    print("Counting tokens...")
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    
    print(f"Total Tokens: {len(tokens):,}")

# Run
count_tokens_in_file("datasets/10M_dirty_sales_data_fixed.csv")