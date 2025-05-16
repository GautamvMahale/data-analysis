// Generate synthetic pet shop sales data
const generateSalesData = () => {
    // Constants for data generation
    const START_DATE = new Date(2024, 0, 1); // Jan 1, 2024
    const END_DATE = new Date(2025, 3, 30);  // Apr 30, 2025
    const NUM_DAYS = Math.floor((END_DATE - START_DATE) / (1000 * 60 * 60 * 24)) + 1;
    
    // Product categories and products
    const CATEGORIES = {
        'Dog Food': ['Premium Dry Dog Food', 'Wet Dog Food Cans', 'Puppy Kibble', 'Senior Dog Diet', 'Grain-Free Dog Food'],
        'Cat Food': ['Premium Cat Kibble', 'Wet Cat Food Pouches', 'Kitten Formula', 'Senior Cat Diet', 'Hairball Control Formula'],
        'Dog Toys': ['Rubber Chew Toy', 'Tennis Ball Pack', 'Plush Squeaky Toy', 'Rope Tug Toy', 'Interactive Puzzle Toy'],
        'Cat Toys': ['Catnip Mouse', 'Feather Wand', 'Laser Pointer', 'Cat Tunnel', 'Interactive Ball Tower'],
        'Pet Accessories': ['Dog Collar', 'Cat Collar', 'Dog Leash', 'Pet ID Tag', 'Pet Carrier'],
        'Grooming Supplies': ['Dog Shampoo', 'Cat Shampoo', 'Nail Clippers', 'Brush', 'Toothbrush Kit'],
        'Grooming Services': ['Basic Bath', 'Full Grooming', 'Nail Trim', 'Teeth Cleaning', 'De-shedding Treatment'],
        'Health Products': ['Flea & Tick Treatment', 'Vitamins', 'Joint Supplements', 'Dental Chews', 'Ear Cleaner']
    };
    
    // Price ranges for each category
    const PRICE_RANGES = {
        'Dog Food': [15, 60],
        'Cat Food': [10, 45],
        'Dog Toys': [5, 25],
        'Cat Toys': [3, 20],
        'Pet Accessories': [8, 40],
        'Grooming Supplies': [7, 30],
        'Grooming Services': [25, 120],
        'Health Products': [12, 50]
    };
    
    // Customer IDs
    const NUM_CUSTOMERS = 200;
    const CUSTOMER_IDS = Array.from({ length: NUM_CUSTOMERS }, (_, i) => `CUST-${String(i + 1).padStart(4, '0')}`);
    
    // Seasonal trends for categories (multiplier for each month)
    const SEASONAL_TRENDS = {
        'Dog Food': [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 1.0, 1.2],  // Higher in summer and holidays
        'Cat Food': [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1],  // Similar to dog food
        'Dog Toys': [1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1, 1.0, 1.2, 1.5],  // Higher in spring and holidays
        'Cat Toys': [1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1, 1.0, 1.2, 1.5],  // Similar to dog toys
        'Pet Accessories': [1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.1, 1.0, 1.1, 1.3],  // Higher in summer
        'Grooming Supplies': [1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0],  // Higher in summer
        'Grooming Services': [1.0, 1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.5, 1.3, 1.2, 1.1, 1.2],  // Higher in summer
        'Health Products': [1.3, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.4]   // Higher in winter
    };
    
    // Weekly patterns (multiplier for each day of week, Mon-Sun)
    const WEEKLY_PATTERNS = [0.8, 0.7, 0.9, 1.0, 1.2, 1.5, 1.3];  // Weekend sales are higher
    
    // Helper functions
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max) => Math.random() * (max - min) + min;
    const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
    const weightedRandomChoice = (array, weights) => {
        const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < array.length; i++) {
            random -= weights[i];
            if (random <= 0) return array[i];
        }
        return array[array.length - 1];
    };
    const randomDate = (start, end) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };
    
    // Generate data
    const salesData = [];
    let transactionId = 1;
    
    // Generate data for each day
    for (let day = 0; day < NUM_DAYS; day++) {
        const currentDate = new Date(START_DATE);
        currentDate.setDate(START_DATE.getDate() + day);
        const monthIdx = currentDate.getMonth();
        const dayOfWeek = currentDate.getDay();
        
        // Determine base number of transactions for this day
        const baseTransactions = randomInt(15, 35);  // Average 25 transactions per day
        const dailyTransactions = Math.floor(baseTransactions * WEEKLY_PATTERNS[dayOfWeek]);
        
        // Generate transactions for this day
        for (let t = 0; t < dailyTransactions; t++) {
            // Choose a random customer
            const customerId = randomChoice(CUSTOMER_IDS);
            
            // Determine number of items in this transaction (basket size)
            const basketSize = Math.max(1, Math.floor(Math.random() * 5));  // 1-5 items
            
            const transactionItems = [];
            
            // Choose items for this transaction
            for (let i = 0; i < basketSize; i++) {
                // Choose a category with weighted probabilities
                const categoryWeights = [0.25, 0.20, 0.15, 0.15, 0.10, 0.05, 0.05, 0.05];
                const categoryNames = Object.keys(CATEGORIES);
                const category = weightedRandomChoice(categoryNames, categoryWeights);
                
                // Apply seasonal trend
                const seasonalFactor = SEASONAL_TRENDS[category][monthIdx];
                if (Math.random() > seasonalFactor) {
                    continue;  // Skip this item based on seasonal probability
                }
                
                // Choose a product from the category
                const product = randomChoice(CATEGORIES[category]);
                
                // Determine price
                const [minPrice, maxPrice] = PRICE_RANGES[category];
                const price = parseFloat(randomFloat(minPrice, maxPrice).toFixed(2));
                
                // Determine quantity
                const quantity = Math.floor(-Math.log(Math.random()) / 0.7) + 1;  // Geometric distribution
                
                // Add to transaction items
                transactionItems.push({
                    product,
                    category,
                    quantity,
                    unitPrice: price,
                    totalPrice: parseFloat((quantity * price).toFixed(2))
                });
            }
            
            // Skip empty transactions
            if (transactionItems.length === 0) continue;
            
            // Calculate total transaction amount
            const totalAmount = transactionItems.reduce((sum, item) => sum + item.totalPrice, 0);
            
            // Add random discount (about 10% of transactions)
            let discount = 0;
            if (Math.random() < 0.1) {
                discount = parseFloat((totalAmount * randomFloat(0.05, 0.25)).toFixed(2));
            }
            
            // Add to sales data
            salesData.push({
                transactionId: `TXN-${String(transactionId).padStart(6, '0')}`,
                date: currentDate,
                customerId,
                items: transactionItems,
                totalAmount: parseFloat((totalAmount - discount).toFixed(2)),
                discount
            });
            
            transactionId++;
        }
    }
    
    return salesData;
};

// Generate the sales data
const salesData = generateSalesData();

// Extract all unique categories from the data
const allCategories = [...new Set(salesData.flatMap(transaction => 
    transaction.items.map(item => item.category)
))].sort();

// Extract all unique products from the data
const allProducts = [...new Set(salesData.flatMap(transaction => 
    transaction.items.map(item => item.product)
))].sort();

// Extract all unique dates from the data
const allDates = [...new Set(salesData.map(transaction => 
    transaction.date.toISOString().split('T')[0]
))].sort();

// Extract all unique customers from the data
const allCustomers = [...new Set(salesData.map(transaction => transaction.customerId))];

// Flatten the data for easier analysis
const flattenedData = salesData.flatMap(transaction => 
    transaction.items.map(item => ({
        transactionId: transaction.transactionId,
        date: transaction.date,
        customerId: transaction.customerId,
        category: item.category,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: transaction.discount
    }))
);

console.log(`Generated ${salesData.length} transactions with ${flattenedData.length} items`);
