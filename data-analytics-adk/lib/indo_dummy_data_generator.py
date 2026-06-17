import pandas as pd
import numpy as np
import time

NUM_OF_ROWS = 10_000_000
QUALITY_TYPE = 'clean' 

MISSING_VALUES_PERCENTAGE = 0.05
OUTLIERS_PERCENTAGE = 0.0001
NEGATIVE_VALUES_PERCENTAGE = 0.005
INCONSISTENT_TEXT_PERCENTAGE = 0.03
DATE_ERRORS_PERCENTAGE = 0.001

def generate_sales_data_id():
    print(f"Initializing generation for {NUM_OF_ROWS} rows ({QUALITY_TYPE} mode - ID Context)...")
    start_time = time.time()
    
    catalog = [
      ('Laptop Asus ROG', 'Elektronik', 15000000), ('Mouse Wireless Logitek', 'Elektronik', 250000),
      ('Keyboard Mekanik', 'Elektronik', 850000), ('Monitor 4K Samsung', 'Elektronik', 4500000),
      ('Headphone Sony WH', 'Elektronik', 3500000), ('Xiaomi Pad 6', 'Elektronik', 5000000),
      ('iPhone 15 Pro', 'Elektronik', 18500000), ('Powerbank Hippo 10000mAh', 'Elektronik', 200000),
      ('Speaker Robot Bluetooth', 'Elektronik', 150000), ('Kabel Data Type-C', 'Elektronik', 45000),
      ('Smart TV LG 43 inch', 'Elektronik', 3800000), ('Kamera Canon EOS', 'Elektronik', 7200000),
      
      ('Kursi Kerja Ergonomis', 'Perabot', 2500000), ('Meja Kerja Minimalis', 'Perabot', 1200000),
      ('Lampu Tidur Karakter', 'Perabot', 85000), ('Rak Buku Portable', 'Perabot', 175000),
      ('Sapu & Pengki Set', 'Perabot', 45000), ('Wajan Anti Lengket Oxone', 'Perabot', 350000),
      ('Magic Com Yong Ma', 'Perabot', 650000), ('Blender Philips', 'Perabot', 550000),
      ('Dispenser Sharp', 'Perabot', 1800000), ('Air Fryer Simplus', 'Perabot', 450000),
      
      ('Sepatu Lari Specs', 'Pakaian', 450000), ('Kaos Polos Cotton Combed', 'Pakaian', 75000),
      ('Celana Jeans Levi', 'Pakaian', 650000), ('Jaket Hooddie Erigo', 'Pakaian', 250000),
      ('Sandal Jepit Swallow', 'Pakaian', 15000), ('Kemeja Batik Pria', 'Pakaian', 150000),
      ('Hijab Bella Square', 'Pakaian', 25000), ('Tas Ransel Eiger', 'Pakaian', 550000),
      ('Topi Baseball Polos', 'Pakaian', 35000), ('Jam Tangan Casio', 'Pakaian', 450000),
      
      ('Kopi Kapal Api 1kg', 'Bahan Pokok', 85000), ('Indomie Goreng (Karton)', 'Bahan Pokok', 115000),
      ('Minyak Goreng 2L', 'Bahan Pokok', 35000), ('Beras Pandan Wangi 5kg', 'Bahan Pokok', 75000),
      ('Gula Pasir Gulaku 1kg', 'Bahan Pokok', 16000), ('Garam Meja 250g', 'Bahan Pokok', 5000),
      ('Susu Kental Manis Frisian Flag', 'Bahan Pokok', 12000), ('Teh Celup Sariwangi', 'Bahan Pokok', 10000),
      ('Telur Ayam (1kg)', 'Bahan Pokok', 28000), ('Kecap Manis Bango 550ml', 'Bahan Pokok', 22000),
      
      ('Skincare MS Glow Set', 'Kecantikan', 300000), ('Sunscreen Azarine', 'Kecantikan', 65000),
      ('Lipmatte Wardah', 'Kecantikan', 55000), ('Parfum HMNS', 'Kecantikan', 350000),
      ('Oli Mesin Shell Helix', 'Otomotif', 95000), ('Ban Motor Tubeless', 'Otomotif', 250000),
      ('Helm KYT Full Face', 'Otomotif', 850000), ('Kanebo Lap Serbaguna', 'Otomotif', 25000),
    ]
    
    catalog_names = np.array([item[0] for item in catalog])
    catalog_cats = np.array([item[1] for item in catalog])
    catalog_prices = np.array([item[2] for item in catalog])
    
    indices = np.random.randint(0, len(catalog), NUM_OF_ROWS)
    
    cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Yogyakarta']
    payment_methods = ['Gopay', 'OVO', 'Transfer Bank', 'ShopeePay', 'QRIS', 'Tunai', 'Kartu Kredit']
    
    data = {
        'transaction_id': np.arange(1, NUM_OF_ROWS + 1),
        'date': np.array('2024-01-01', dtype='datetime64[D]') + np.random.choice(np.arange(365), NUM_OF_ROWS),
        'product_name': catalog_names[indices],
        'category': catalog_cats[indices],
        'store_location': np.random.choice(cities, NUM_OF_ROWS),
        'payment_method': np.random.choice(payment_methods, NUM_OF_ROWS),
        'quantity': np.random.randint(1, 6, NUM_OF_ROWS),
    }
    
    df = pd.DataFrame(data)
    
    df['unit_price'] = (catalog_prices[indices] * np.random.uniform(0.95, 1.05, NUM_OF_ROWS))
    df['unit_price'] = (df['unit_price'] // 100) * 100
    
    if QUALITY_TYPE == 'dirty':
        print("Injecting 'Indonesian-style' noise...")

        mask_null_cat = np.random.rand(NUM_OF_ROWS) < MISSING_VALUES_PERCENTAGE
        df.loc[mask_null_cat, 'category'] = np.nan

        mask_outlier_price = np.random.rand(NUM_OF_ROWS) < OUTLIERS_PERCENTAGE
        df.loc[mask_outlier_price, 'unit_price'] = df.loc[mask_outlier_price, 'unit_price'] * 10

        mask_neg_qty = np.random.rand(NUM_OF_ROWS) < NEGATIVE_VALUES_PERCENTAGE
        df.loc[mask_neg_qty, 'quantity'] = df.loc[mask_neg_qty, 'quantity'] * -1

        mask_messy_text = np.random.rand(NUM_OF_ROWS) < INCONSISTENT_TEXT_PERCENTAGE
        dirty_city_map = {
            'Jakarta': 'JKT',
            'Yogyakarta': 'Jogja',
            'Bandung': 'BDG',
            'Surabaya': 'SBY',
            'Makassar': 'makasar'
        }
        
        for clean_city, dirty_city in dirty_city_map.items():
            mask_target = (df['store_location'] == clean_city) & mask_messy_text
            df.loc[mask_target, 'store_location'] = dirty_city

    df['total_bill'] = df['quantity'] * df['unit_price']

    print(f"Data ready! Shape: {df.shape}")

    filename = f"./sales_dataset/indo_{NUM_OF_ROWS}_{QUALITY_TYPE}_sales_data.csv"
    print(f"Exporting to {filename}...")

    df.to_csv(filename, index=False)
    
    elapsed = time.time() - start_time
    print(f"Done! Created Indonesian {QUALITY_TYPE} dataset in {elapsed:.2f} seconds.")

if __name__ == "__main__":
    generate_sales_data_id()