import pandas as pd
import numpy as np
import time

# ==========================================
# CONFIGURATION
# ==========================================

# Dataset Size
NUM_OF_ROWS = 15_000_000

# Data Quality ('clean' or 'dirty')
# If 'clean', all noise injection steps below will be skipped.
QUALITY_TYPE = 'dirty' 

# Noise Configuration (Probabilities in Decimal, e.g., 0.05 = 5%)
MISSING_VALUES_PERCENTAGE = 0.05       # 5% chance of missing category
OUTLIERS_PERCENTAGE = 0.001            # 0.1% chance of price/qty outlier
NEGATIVE_VALUES_PERCENTAGE = 0.005     # 0.5% chance of negative quantity
INCONSISTENT_TEXT_PERCENTAGE = 0.03    # 3% chance of typos/formatting issues
DATE_ERRORS_PERCENTAGE = 0.001         # 0.1% chance of date anomalies

# ==========================================
# MAIN SCRIPT
# ==========================================

def generate_sales_data():
    print(f"Initializing generation for {NUM_OF_ROWS} rows ({QUALITY_TYPE} mode)...")
    start_time = time.time()
    
    # --- STEP 1: GENERATE BASE CLEAN DATA ---
    catalog = [
        ('Gaming Laptop', 'Electronics', 1200.00),
        ('Wireless Mouse', 'Electronics', 25.50),
        ('Mechanical Keyboard', 'Electronics', 85.00),
        ('4K Monitor', 'Electronics', 350.00),
        ('Noise Cancelling Headphones', 'Electronics', 199.99),
        ('Smart Watch', 'Electronics', 150.00),
        ('Tablet Pro', 'Electronics', 600.00),
        ('USB-C Hub', 'Electronics', 45.00),
        ('Ergonomic Chair', 'Home', 250.00),
        ('Standing Desk', 'Home', 450.00),
        ('Running Shoes', 'Clothing', 85.00),
        ('Cotton T-Shirt', 'Clothing', 15.00),
        ('Denim Jeans', 'Clothing', 45.00),
        ('Face Serum', 'Beauty', 35.00),
        ('Coffee Maker', 'Home', 80.00),
    ]
    
    # Pre-process catalog for vectorized operations
    catalog_names = np.array([item[0] for item in catalog])
    catalog_cats = np.array([item[1] for item in catalog])
    catalog_prices = np.array([item[2] for item in catalog])
    
    # Generate random indices to select products
    indices = np.random.randint(0, len(catalog), NUM_OF_ROWS)
    
    cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'London', 'Paris', 'Tokyo']
    payment_methods = ['Credit Card', 'PayPal', 'Debit Card', 'Bank Transfer']
    
    print("Generating base data...")
    
    data = {
        'transaction_id': np.arange(1, NUM_OF_ROWS + 1),
        # Generate random dates within the last year
        'date': np.array('2024-01-01', dtype='datetime64[D]') + np.random.choice(np.arange(365), NUM_OF_ROWS),
        'product_name': catalog_names[indices],
        'category': catalog_cats[indices],
        'store_location': np.random.choice(cities, NUM_OF_ROWS),
        'payment_method': np.random.choice(payment_methods, NUM_OF_ROWS),
        'quantity': np.random.randint(1, 6, NUM_OF_ROWS),
    }
    
    df = pd.DataFrame(data)
    
    # Add slight natural price variation (not dirty data, just realistic variance)
    df['unit_price'] = np.round(catalog_prices[indices] * np.random.uniform(0.98, 1.02, NUM_OF_ROWS), 2)
    
    # --- STEP 2: INJECT NOISE (IF DIRTY) ---
    if QUALITY_TYPE == 'dirty':
        print("Injecting noise, outliers, and errors...")

        # A. MISSING VALUES
        print(f"  - Injecting missing values ({MISSING_VALUES_PERCENTAGE*100}%)...")
        mask_null_cat = np.random.rand(NUM_OF_ROWS) < MISSING_VALUES_PERCENTAGE
        df.loc[mask_null_cat, 'category'] = np.nan
        
        # We apply a smaller ratio for payment method missing values (arbitrarily 40% of the config value)
        mask_null_pay = np.random.rand(NUM_OF_ROWS) < (MISSING_VALUES_PERCENTAGE * 0.4)
        df.loc[mask_null_pay, 'payment_method'] = np.nan

        # B. OUTLIERS
        print(f"  - Injecting outliers ({OUTLIERS_PERCENTAGE*100}%)...")
        mask_outlier_price = np.random.rand(NUM_OF_ROWS) < OUTLIERS_PERCENTAGE
        df.loc[mask_outlier_price, 'unit_price'] = df.loc[mask_outlier_price, 'unit_price'] * 100
        
        mask_outlier_qty = np.random.rand(NUM_OF_ROWS) < OUTLIERS_PERCENTAGE
        # Assign huge quantities to outliers
        df.loc[mask_outlier_qty, 'quantity'] = np.random.randint(500, 1000, size=mask_outlier_qty.sum())

        # C. NEGATIVE VALUES
        print(f"  - Injecting negative values ({NEGATIVE_VALUES_PERCENTAGE*100}%)...")
        mask_neg_qty = np.random.rand(NUM_OF_ROWS) < NEGATIVE_VALUES_PERCENTAGE
        df.loc[mask_neg_qty, 'quantity'] = df.loc[mask_neg_qty, 'quantity'] * -1

        # D. INCONSISTENT TEXT
        print(f"  - Injecting inconsistent text ({INCONSISTENT_TEXT_PERCENTAGE*100}%)...")
        # Select rows to potentially dirty
        mask_messy_text = np.random.rand(NUM_OF_ROWS) < INCONSISTENT_TEXT_PERCENTAGE
        
        dirty_city_map = {
            'New York': 'new york',       # Lowercase issue
            'Los Angeles': 'LA',          # Abbreviation issue
            'Chicago': 'chicago ',        # Trailing whitespace issue
            'London': 'London_UK',        # Naming convention issue
            'Tokyo': 'Tokyoo'             # Typo
        }
        
        for clean_city, dirty_city in dirty_city_map.items():
            # Find rows that are (Target City) AND (Selected for Noise)
            mask_target = (df['store_location'] == clean_city) & mask_messy_text    
            df.loc[mask_target, 'store_location'] = dirty_city

        # E. DATE ERRORS
        print(f"  - Injecting date errors ({DATE_ERRORS_PERCENTAGE*100}%)...")
        mask_bad_date = np.random.rand(NUM_OF_ROWS) < DATE_ERRORS_PERCENTAGE
        bad_dates = np.random.choice([pd.Timestamp('1900-01-01'), pd.Timestamp('2099-12-31')], size=mask_bad_date.sum())
        df.loc[mask_bad_date, 'date'] = bad_dates
    else:
        print("Skipping noise injection (Clean Mode selected).")

    # --- STEP 3: FINAL CALCULATION ---
    # Calculate Total Bill (Calculate this AFTER noise injection to ensure outliers propagate mathematically)
    df['total_bill'] = df['quantity'] * df['unit_price']

    # --- STEP 4: EXPORT ---
    filename = f"./sales_dataset/{NUM_OF_ROWS}_{QUALITY_TYPE}_sales_data.csv"
    
    print(f"Data ready! Shape: {df.shape}")
    print(f"Exporting to {filename}...")
    df.to_csv(filename, index=False)
    
    elapsed = time.time() - start_time
    print(f"Done! Created {QUALITY_TYPE} dataset in {elapsed:.2f} seconds.")

if __name__ == "__main__":
    generate_sales_data()