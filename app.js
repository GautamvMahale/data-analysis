// Set Chart.js defaults
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
Chart.defaults.color = '#495057';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Color palettes
const categoryColors = [
    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
    '#6f42c1', '#fd7e14', '#20c9a6', '#5a5c69', '#858796'
];

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

// Format number with commas
const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Populate category checkboxes
    const categoryCheckboxesContainer = document.getElementById('category-checkboxes');
    allCategories.forEach((category, index) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'category-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `category-${index}`;
        checkbox.value = category;
        checkbox.className = 'form-check-input category-filter';
        checkbox.checked = true;
        
        const label = document.createElement('label');
        label.htmlFor = `category-${index}`;
        label.className = 'form-check-label ms-2';
        label.textContent = category;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        categoryCheckboxesContainer.appendChild(checkboxDiv);
    });
    
    // Initialize dashboard with all data
    updateDashboard();
    
    // Add event listener for filter button
    document.getElementById('apply-filters').addEventListener('click', updateDashboard);
});

// Update dashboard based on filters
function updateDashboard() {
    // Get selected time period
    const timePeriod = document.getElementById('time-period').value;
    
    // Get selected categories
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
        .map(checkbox => checkbox.value);
    
    // Filter data based on time period
    let filteredData = [...salesData];
    
    if (timePeriod !== 'ALL') {
        const endDate = new Date(Math.max(...filteredData.map(t => t.date.getTime())));
        let startDate;
        
        if (timePeriod === '30D') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 30);
        } else if (timePeriod === '90D') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 90);
        } else if (timePeriod === '6M') {
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 6);
        } else if (timePeriod === '1Y') {
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
        }
        
        filteredData = filteredData.filter(transaction => transaction.date >= startDate);
    }
    
    // Filter by selected categories
    if (selectedCategories.length > 0 && selectedCategories.length < allCategories.length) {
        filteredData = filteredData.map(transaction => {
            const filteredItems = transaction.items.filter(item => 
                selectedCategories.includes(item.category)
            );
            
            if (filteredItems.length === 0) {
                return null;
            }
            
            return {
                ...transaction,
                items: filteredItems,
                totalAmount: filteredItems.reduce((sum, item) => sum + item.totalPrice, 0) - transaction.discount
            };
        }).filter(transaction => transaction !== null);
    }
    
    // Create flattened data for analysis
    const flatData = filteredData.flatMap(transaction => 
        transaction.items.map(item => ({
            transactionId: transaction.transactionId,
            date: transaction.date,
            customerId: transaction.customerId,
            category: item.category,
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
        }))
    );
    
    // Update key metrics
    updateKeyMetrics(filteredData, flatData);
    
    // Update charts
    updateRevenueTimeChart(filteredData, timePeriod);
    updateCategorySalesChart(flatData);
    updateTopProductsChart(flatData);
    updateSeasonalTrendsChart(flatData);
    updateWeeklyPatternChart(flatData);
    updateCustomerFrequencyChart(filteredData);
    
    // Update insights
    updateInsights(filteredData, flatData);
}

// Update key metrics
function updateKeyMetrics(filteredData, flatData) {
    // Calculate total revenue
    const totalRevenue = filteredData.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    
    // Calculate total transactions
    const totalTransactions = filteredData.length;
    document.getElementById('total-transactions').textContent = formatNumber(totalTransactions);
    
    // Calculate average basket size
    const avgBasketSize = totalRevenue / totalTransactions;
    document.getElementById('avg-basket-size').textContent = formatCurrency(avgBasketSize);
}

// Update revenue over time chart
function updateRevenueTimeChart(filteredData, timePeriod) {
    // Group data by appropriate time period
    let timeFormat, groupingFunction;
    
    if (timePeriod === '30D' || timePeriod === '90D') {
        // Group by day for shorter periods
        timeFormat = 'MMM D, YYYY';
        groupingFunction = date => date.toISOString().split('T')[0];
    } else if (timePeriod === '6M') {
        // Group by week for medium periods
        timeFormat = 'MMM D, YYYY';
        groupingFunction = date => {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return weekStart.toISOString().split('T')[0];
        };
    } else {
        // Group by month for longer periods
        timeFormat = 'MMM YYYY';
        groupingFunction = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    // Group data by time period
    const revenueByTime = {};
    const transactionsByTime = {};
    
    filteredData.forEach(transaction => {
        const timeKey = groupingFunction(transaction.date);
        
        if (!revenueByTime[timeKey]) {
            revenueByTime[timeKey] = 0;
            transactionsByTime[timeKey] = 0;
        }
        
        revenueByTime[timeKey] += transaction.totalAmount;
        transactionsByTime[timeKey]++;
    });
    
    // Convert to arrays for Chart.js
    const timeLabels = Object.keys(revenueByTime).sort();
    const revenueData = timeLabels.map(key => revenueByTime[key]);
    const transactionData = timeLabels.map(key => transactionsByTime[key]);
    
    // Format labels based on time period
    const formattedLabels = timeLabels.map(key => {
        if (timeFormat === 'MMM YYYY') {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
            return new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    });
    
    // Create chart
    const ctx = document.getElementById('revenue-time-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.revenueTimeChart) {
        window.revenueTimeChart.destroy();
    }
    
    window.revenueTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    yAxisID: 'y'
                },
                {
                    label: 'Transactions',
                    data: transactionData,
                    borderColor: '#e74a3b',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Transactions'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'y') {
                                label += formatCurrency(context.parsed.y);
                            } else {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update category sales chart
function updateCategorySalesChart(flatData) {
    // Group data by category
    const salesByCategory = {};
    
    flatData.forEach(item => {
        if (!salesByCategory[item.category]) {
            salesByCategory[item.category] = 0;
        }
        
        salesByCategory[item.category] += item.totalPrice;
    });
    
    // Convert to arrays for Chart.js
    const categories = Object.keys(salesByCategory);
    const salesData = categories.map(category => salesByCategory[category]);
    
    // Sort data by sales amount (descending)
    const sortedIndices = salesData
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value)
        .map(item => item.index);
    
    const sortedCategories = sortedIndices.map(index => categories[index]);
    const sortedSalesData = sortedIndices.map(index => salesData[index]);
    
    // Create chart
    const ctx = document.getElementById('category-sales-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.categorySalesChart) {
        window.categorySalesChart.destroy();
    }
    
    window.categorySalesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedCategories,
            datasets: [{
                data: sortedSalesData,
                backgroundColor: categoryColors,
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            cutout: '50%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.raw);
                            const percentage = Math.round(context.raw / sortedSalesData.reduce((a, b) => a + b, 0) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update top products chart
function updateTopProductsChart(flatData) {
    // Group data by product
    const salesByProduct = {};
    
    flatData.forEach(item => {
        if (!salesByProduct[item.product]) {
            salesByProduct[item.product] = 0;
        }
        
        salesByProduct[item.product] += item.totalPrice;
    });
    
    // Convert to arrays for Chart.js and sort
    const productEntries = Object.entries(salesByProduct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const topProducts = productEntries.map(entry => entry[0]);
    const topProductSales = productEntries.map(entry => entry[1]);
    
    // Create chart
    const ctx = document.getElementById('top-products-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.topProductsChart) {
        window.topProductsChart.destroy();
    }
    
    window.topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts,
            datasets: [{
                label: 'Revenue',
                data: topProductSales,
                backgroundColor: '#36b9cc',
                borderColor: '#2c9faf',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.x);
                        }
                    }
                }
            }
        }
    });
}

// Update seasonal trends chart
function updateSeasonalTrendsChart(flatData) {
    // Group data by month and category
    const salesByMonthCategory = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    flatData.forEach(item => {
        const month = item.date.getMonth();
        const category = item.category;
        
        const key = `${month}-${category}`;
        if (!salesByMonthCategory[key]) {
            salesByMonthCategory[key] = 0;
        }
        
        salesByMonthCategory[key] += item.totalPrice;
    });
    
    // Get unique months and categories in the data
    const uniqueMonths = [...new Set(flatData.map(item => item.date.getMonth()))].sort();
    const uniqueCategories = [...new Set(flatData.map(item => item.category))];
    
    // Create datasets for each category
    const datasets = uniqueCategories.map((category, index) => {
        const data = uniqueMonths.map(month => {
            const key = `${month}-${category}`;
            return salesByMonthCategory[key] || 0;
        });
        
        return {
            label: category,
            data: data,
            borderColor: categoryColors[index % categoryColors.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.2
        };
    });
    
    // Create chart
    const ctx = document.getElementById('seasonal-trends-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.seasonalTrendsChart) {
        window.seasonalTrendsChart.destroy();
    }
    
    window.seasonalTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: uniqueMonths.map(month => months[month]),
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.parsed.y);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update weekly pattern chart
function updateWeeklyPatternChart(flatData) {
    // Group data by day of week
    const salesByDay = Array(7).fill(0);
    const transactionsByDay = Array(7).fill(0);
    const transactionCounts = {};
    
    flatData.forEach(item => {
        const dayOfWeek = item.date.getDay();
        salesByDay[dayOfWeek] += item.totalPrice;
        
        // Count unique transactions
        if (!transactionCounts[`${dayOfWeek}-${item.transactionId}`]) {
            transactionCounts[`${dayOfWeek}-${item.transactionId}`] = true;
            transactionsByDay[dayOfWeek]++;
        }
    });
    
    // Create chart
    const ctx = document.getElementById('weekly-pattern-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.weeklyPatternChart) {
        window.weeklyPatternChart.destroy();
    }
    
    window.weeklyPatternChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            datasets: [
                {
                    label: 'Revenue',
                    data: salesByDay,
                    backgroundColor: '#1cc88a',
                    borderColor: '#17a673',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Transactions',
                    data: transactionsByDay,
                    type: 'line',
                    borderColor: '#f6c23e',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: '#f6c23e',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Transactions'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'y') {
                                label += formatCurrency(context.parsed.y);
                            } else {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update customer frequency chart
function updateCustomerFrequencyChart(filteredData) {
    // Count purchases per customer
    const purchasesPerCustomer = {};
    
    filteredData.forEach(transaction => {
        if (!purchasesPerCustomer[transaction.customerId]) {
            purchasesPerCustomer[transaction.customerId] = 0;
        }
        
        purchasesPerCustomer[transaction.customerId]++;
    });
    
    // Create frequency bins
    const frequencyBins = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4-5': 0,
        '6-10': 0,
        '11-20': 0,
        '21-50': 0,
        '51+': 0
    };
    
    Object.values(purchasesPerCustomer).forEach(frequency => {
        if (frequency === 1) frequencyBins['1']++;
        else if (frequency === 2) frequencyBins['2']++;
        else if (frequency === 3) frequencyBins['3']++;
        else if (frequency >= 4 && frequency <= 5) frequencyBins['4-5']++;
        else if (frequency >= 6 && frequency <= 10) frequencyBins['6-10']++;
        else if (frequency >= 11 && frequency <= 20) frequencyBins['11-20']++;
        else if (frequency >= 21 && frequency <= 50) frequencyBins['21-50']++;
        else frequencyBins['51+']++;
    });
    
    // Create chart
    const ctx = document.getElementById('customer-frequency-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.customerFrequencyChart) {
        window.customerFrequencyChart.destroy();
    }
    
    window.customerFrequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(frequencyBins),
            datasets: [{
                label: 'Number of Customers',
                data: Object.values(frequencyBins),
                backgroundColor: '#6f42c1',
                borderColor: '#6033b1',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Customers'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Number of Purchases'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update insights based on the data
function updateInsights(filteredData, flatData) {
    const insightsContainer = document.getElementById('insights-container');
    
    // Clear previous insights
    insightsContainer.innerHTML = '';
    
    // Calculate key metrics for insights
    const totalRevenue = filteredData.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    
    // Top category
    const salesByCategory = {};
    flatData.forEach(item => {
        if (!salesByCategory[item.category]) {
            salesByCategory[item.category] = 0;
        }
        salesByCategory[item.category] += item.totalPrice;
    });
    
    const topCategory = Object.entries(salesByCategory)
        .sort((a, b) => b[1] - a[1])[0];
    
    const topCategoryName = topCategory[0];
    const topCategorySales = topCategory[1];
    const topCategoryPercentage = (topCategorySales / totalRevenue * 100).toFixed(1);
    
    // Top product
    const salesByProduct = {};
    flatData.forEach(item => {
        if (!salesByProduct[item.product]) {
            salesByProduct[item.product] = 0;
        }
        salesByProduct[item.product] += item.totalPrice;
    });
    
    const topProduct = Object.entries(salesByProduct)
        .sort((a, b) => b[1] - a[1])[0];
    
    const topProductName = topProduct[0];
    const topProductSales = topProduct[1];
    const topProductPercentage = (topProductSales / totalRevenue * 100).toFixed(1);
    
    // Weekly pattern
    const salesByDay = Array(7).fill(0);
    flatData.forEach(item => {
        const dayOfWeek = item.date.getDay();
        salesByDay[dayOfWeek] += item.totalPrice;
    });
    
    const bestDayIndex = salesByDay.indexOf(Math.max(...salesByDay));
    const worstDayIndex = salesByDay.indexOf(Math.min(...salesByDay));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Seasonal trends (if enough data)
    let seasonalInsight = '';
    const salesByMonth = Array(12).fill(0);
    const monthCounts = Array(12).fill(0);
    
    flatData.forEach(item => {
        const month = item.date.getMonth();
        salesByMonth[month] += item.totalPrice;
        monthCounts[month]++;
    });
    
    // Only include seasonal insight if we have data for at least 3 months
    const monthsWithData = monthCounts.filter(count => count > 0).length;
    
    if (monthsWithData >= 3) {
        const bestMonthIndex = salesByMonth.indexOf(Math.max(...salesByMonth));
        const worstMonthIndex = salesByMonth.indexOf(Math.min(...salesByMonth.filter((val, idx) => monthCounts[idx] > 0)));
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        seasonalInsight = `
            <p><strong>Seasonal Trends:</strong> ${monthNames[bestMonthIndex]} shows the highest sales, 
            while ${monthNames[worstMonthIndex]} has the lowest. Plan inventory and staffing accordingly 
            for these seasonal fluctuations.</p>
        `;
    }
    
    // Average basket size
    const avgBasketSize = totalRevenue / filteredData.length;
    
    // Customer loyalty
    const purchasesPerCustomer = {};
    filteredData.forEach(transaction => {
        if (!purchasesPerCustomer[transaction.customerId]) {
            purchasesPerCustomer[transaction.customerId] = 0;
        }
        purchasesPerCustomer[transaction.customerId]++;
    });
    
    const repeatCustomers = Object.values(purchasesPerCustomer).filter(count => count > 1).length;
    const totalCustomers = Object.keys(purchasesPerCustomer).length;
    const repeatPercentage = (repeatCustomers / totalCustomers * 100).toFixed(1);
    
    // Create insights HTML
    const insightsHTML = `
        <div class="insight-section">
            <h6 class="insight-title">Key Insights:</h6>
            <p><strong>Top Performing Category:</strong> ${topCategoryName} accounts for 
               ${formatCurrency(topCategorySales)} in sales (${topCategoryPercentage}% of total revenue).</p>
               
            <p><strong>Best-Selling Product:</strong> ${topProductName} generates 
               ${formatCurrency(topProductSales)} in sales (${topProductPercentage}% of total revenue).</p>
               
            <p><strong>Weekly Sales Pattern:</strong> ${dayNames[bestDayIndex]} is the highest-grossing day, 
               while ${dayNames[worstDayIndex]} has the lowest sales. Consider running promotions on slower 
               days to boost traffic and revenue.</p>
               
            ${seasonalInsight}
            
            <p><strong>Basket Size:</strong> The average transaction value is ${formatCurrency(avgBasketSize)}. 
               Consider implementing cross-selling strategies to increase basket size.</p>
               
            <p><strong>Customer Loyalty:</strong> ${repeatPercentage}% of customers are repeat shoppers. 
               Implement a loyalty program to increase customer retention and frequency.</p>
        </div>
        
        <div class="insight-section">
            <h6 class="insight-title">Recommendations:</h6>
            
            <div class="recommendation">
                <strong>1. Inventory Optimization:</strong> Focus on maintaining optimal stock levels for 
                top-selling products, especially ${topProductName} and other items in the ${topCategoryName} category.
            </div>
            
            <div class="recommendation">
                <strong>2. Marketing Strategy:</strong> Increase marketing efforts during ${dayNames[worstDayIndex]} 
                to boost sales during slower periods.
            </div>
            
            <div class="recommendation">
                <strong>3. Customer Retention:</strong> Implement a customer loyalty program with personalized 
                offers based on purchase history to increase repeat business.
            </div>
            
            <div class="recommendation">
                <strong>4. Cross-Selling:</strong> Train staff to suggest complementary products to increase 
                average transaction value.
            </div>
            
            <div class="recommendation">
                <strong>5. Seasonal Promotions:</strong> Plan seasonal promotions and product bundles to 
                capitalize on peak selling periods and mitigate slow seasons.
            </div>
        </div>
    `;
    
    insightsContainer.innerHTML = insightsHTML;
}
