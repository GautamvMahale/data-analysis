import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)

# Define constants
START_DATE = datetime(2024, 1, 1)
END_DATE = datetime(2025, 4, 30)
NUM_DAYS = (END_DATE - START_DATE).days + 1

# Define product categories and products
CATEGORIES = {
    'Dog Food': ['Premium Dry Dog Food', 'Wet Dog Food Cans', 'Puppy Kibble', 'Senior Dog Diet', 'Grain-Free Dog Food'],
    'Cat Food': ['Premium Cat Kibble', 'Wet Cat Food Pouches', 'Kitten Formula', 'Senior Cat Diet', 'Hairball Control Formula'],
    'Dog Toys': ['Rubber Chew Toy', 'Tennis Ball Pack', 'Plush Squeaky Toy', 'Rope Tug Toy', 'Interactive Puzzle Toy'],
    'Cat Toys': ['Catnip Mouse', 'Feather Wand', 'Laser Pointer', 'Cat Tunnel', 'Interactive Ball Tower'],
    'Pet Accessories': ['Dog Collar', 'Cat Collar', 'Dog Leash', 'Pet ID Tag', 'Pet Carrier'],
    'Grooming Supplies': ['Dog Shampoo', 'Cat Shampoo', 'Nail Clippers', 'Brush', 'Toothbrush Kit'],
    'Grooming Services': ['Basic Bath', 'Full Grooming', 'Nail Trim', 'Teeth Cleaning', 'De-shedding Treatment'],
    'Health Products': ['Flea & Tick Treatment', 'Vitamins', 'Joint Supplements', 'Dental Chews', 'Ear Cleaner']
}

# Define price ranges for each category
PRICE_RANGES = {
    'Dog Food': (15, 60),
    'Cat Food': (10, 45),
    'Dog Toys': (5, 25),
    'Cat Toys': (3, 20),
    'Pet Accessories': (8, 40),
    'Grooming Supplies': (7, 30),
    'Grooming Services': (25, 120),
    'Health Products': (12, 50)
}

# Define customer IDs
NUM_CUSTOMERS = 200
CUSTOMER_IDS = [f'CUST-{i:04d}' for i in range(1, NUM_CUSTOMERS + 1)]

# Define seasonal trends for categories (multiplier for each month)
SEASONAL_TRENDS = {
    'Dog Food': [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 1.0, 1.2],  # Higher in summer and holidays
    'Cat Food': [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1],  # Similar to dog food
    'Dog Toys': [1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1, 1.0, 1.2, 1.5],  # Higher in spring and holidays
    'Cat Toys': [1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1, 1.0, 1.2, 1.5],  # Similar to dog toys
    'Pet Accessories': [1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.1, 1.0, 1.1, 1.3],  # Higher in summer
    'Grooming Supplies': [1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0],  # Higher in summer
    'Grooming Services': [1.0, 1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.5, 1.3, 1.2, 1.1, 1.2],  # Higher in summer
    'Health Products': [1.3, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.4]   # Higher in winter
}

# Define weekly patterns (multiplier for each day of week, Mon-Sun)
WEEKLY_PATTERNS = [0.8, 0.7, 0.9, 1.0, 1.2, 1.5, 1.3]  # Weekend sales are higher

def generate_sales_data():
    """Generate synthetic pet shop sales data"""
    sales_data = []
    transaction_id = 1
    
    # Generate data for each day
    for day in range(NUM_DAYS):
        current_date = START_DATE + timedelta(days=day)
        month_idx = current_date.month - 1
        day_of_week = current_date.weekday()
        
        # Determine base number of transactions for this day
        base_transactions = np.random.poisson(25)  # Average 25 transactions per day
        daily_transactions = int(base_transactions * WEEKLY_PATTERNS[day_of_week])
        
        # Generate transactions for this day
        for _ in range(daily_transactions):
            # Choose a random customer
            customer_id = random.choice(CUSTOMER_IDS)
            
            # Determine number of items in this transaction (basket size)
            basket_size = np.random.poisson(2) + 1  # At least 1 item, average of 3
            
            # Choose items for this transaction
            for _ in range(basket_size):
                # Choose a category with weighted probabilities
                category = random.choices(list(CATEGORIES.keys()), 
                                         weights=[0.25, 0.20, 0.15, 0.15, 0.10, 0.05, 0.05, 0.05], 
                                         k=1)[0]
                
                # Apply seasonal trend
                seasonal_factor = SEASONAL_TRENDS[category][month_idx]
                if random.random() > seasonal_factor:
                    continue  # Skip this item based on seasonal probability
                
                # Choose a product from the category
                product = random.choice(CATEGORIES[category])
                
                # Determine price
                min_price, max_price = PRICE_RANGES[category]
                price = round(random.uniform(min_price, max_price), 2)
                
                # Determine quantity
                quantity = np.random.geometric(p=0.7)  # Most transactions have 1 of an item, fewer have multiple
                
                # Add to sales data
                sales_data.append({
                    'transaction_id': f'TXN-{transaction_id:06d}',
                    'date': current_date,
                    'customer_id': customer_id,
                    'category': category,
                    'product': product,
                    'quantity': quantity,
                    'unit_price': price,
                    'total_price': round(quantity * price, 2)
                })
            
            transaction_id += 1
    
    # Convert to DataFrame
    df = pd.DataFrame(sales_data)
    
    # Add some random discounts (about 10% of transactions)
    discount_mask = np.random.random(len(df)) < 0.1
    df.loc[discount_mask, 'discount'] = df.loc[discount_mask, 'total_price'] * np.random.uniform(0.05, 0.25, sum(discount_mask))
    df.loc[discount_mask, 'total_price'] = df.loc[discount_mask, 'total_price'] - df.loc[discount_mask, 'discount']
    df['discount'] = df['discount'].fillna(0)
    df['total_price'] = df['total_price'].round(2)
    
    return df

if __name__ == "__main__":
    # Generate sales data
    sales_df = generate_sales_data()
    
    # Save to CSV
    sales_df.to_csv('pet_shop_sales_data.csv', index=False)
    print(f"Generated {len(sales_df)} sales records spanning {NUM_DAYS} days")
    print(f"Data saved to pet_shop_sales_data.csv")
    
    # Print some basic statistics
    print("\nBasic Statistics:")
    print(f"Total Revenue: ${sales_df['total_price'].sum():.2f}")
    print(f"Total Transactions: {sales_df['transaction_id'].nunique()}")
    print(f"Total Customers: {sales_df['customer_id'].nunique()}")
    print(f"Date Range: {sales_df['date'].min()} to {sales_df['date'].max()}")
    
    # Print category breakdown
    print("\nSales by Category:")
    category_sales = sales_df.groupby('category')['total_price'].sum().sort_values(ascending=False)
    for category, sales in category_sales.items():
        print(f"{category}: ${sales:.2f}")
