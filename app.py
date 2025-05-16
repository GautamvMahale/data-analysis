import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import dash
from dash import dcc, html, Input, Output, State, dash_table
import dash_bootstrap_components as dbc
from datetime import datetime, timedelta
import os

# Check if data exists, if not generate it
if not os.path.exists('pet_shop_sales_data.csv'):
    import generate_data
    print("Generating sample data...")

# Load data
df = pd.read_csv('pet_shop_sales_data.csv')
df['date'] = pd.to_datetime(df['date'])

# Create app
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = 'Pet Shop Sales Analysis'

# Define time period options
time_periods = [
    {'label': 'Last 30 Days', 'value': '30D'},
    {'label': 'Last 90 Days', 'value': '90D'},
    {'label': 'Last 6 Months', 'value': '6M'},
    {'label': 'Last Year', 'value': '1Y'},
    {'label': 'All Time', 'value': 'ALL'}
]

# Define layout
app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("Pet Shop Sales Analysis Dashboard", className="text-center my-4"),
            html.P("Comprehensive analysis of sales data to help make informed business decisions", 
                  className="text-center text-muted mb-5")
        ])
    ]),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Filter Data", className="card-title"),
                    html.Label("Select Time Period:"),
                    dcc.Dropdown(
                        id='time-period-dropdown',
                        options=time_periods,
                        value='ALL',
                        clearable=False
                    ),
                    html.Div(className="my-2"),
                    html.Label("Select Categories:"),
                    dcc.Dropdown(
                        id='category-dropdown',
                        options=[{'label': cat, 'value': cat} for cat in sorted(df['category'].unique())],
                        value=sorted(df['category'].unique()),
                        multi=True,
                        clearable=False
                    ),
                    html.Div(className="my-3"),
                    dbc.Button("Apply Filters", id="apply-filters-button", color="primary", className="w-100")
                ])
            ], className="mb-4")
        ], width=3),
        
        dbc.Col([
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H5("Total Revenue", className="card-title text-center"),
                            html.H3(id="total-revenue", className="text-center text-primary")
                        ])
                    ])
                ], width=4),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H5("Total Transactions", className="card-title text-center"),
                            html.H3(id="total-transactions", className="text-center text-primary")
                        ])
                    ])
                ], width=4),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H5("Avg. Basket Size", className="card-title text-center"),
                            html.H3(id="avg-basket-size", className="text-center text-primary")
                        ])
                    ])
                ], width=4)
            ], className="mb-4"),
            
            dbc.Card([
                dbc.CardBody([
                    html.H5("Revenue Over Time", className="card-title"),
                    dcc.Graph(id="revenue-time-graph")
                ])
            ], className="mb-4")
        ], width=9)
    ]),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Sales by Category", className="card-title"),
                    dcc.Graph(id="category-sales-graph")
                ])
            ])
        ], width=6),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Top 10 Best-Selling Products", className="card-title"),
                    dcc.Graph(id="top-products-graph")
                ])
            ])
        ], width=6)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Seasonal Trends", className="card-title"),
                    dcc.Graph(id="seasonal-trends-graph")
                ])
            ])
        ], width=6),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Weekly Sales Pattern", className="card-title"),
                    dcc.Graph(id="weekly-pattern-graph")
                ])
            ])
        ], width=6)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Customer Purchasing Frequency", className="card-title"),
                    dcc.Graph(id="customer-frequency-graph")
                ])
            ])
        ], width=12)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H5("Business Insights & Recommendations", className="card-title"),
                    html.Div(id="insights-text", className="mt-3")
                ])
            ])
        ], width=12)
    ], className="mb-4"),
    
    html.Footer([
        html.P("Pet Shop Sales Analysis Dashboard © 2025", className="text-center text-muted")
    ], className="mt-5 mb-4")
    
], fluid=True)

# Define callback to update all visualizations
@app.callback(
    [Output("total-revenue", "children"),
     Output("total-transactions", "children"),
     Output("avg-basket-size", "children"),
     Output("revenue-time-graph", "figure"),
     Output("category-sales-graph", "figure"),
     Output("top-products-graph", "figure"),
     Output("seasonal-trends-graph", "figure"),
     Output("weekly-pattern-graph", "figure"),
     Output("customer-frequency-graph", "figure"),
     Output("insights-text", "children")],
    [Input("apply-filters-button", "n_clicks")],
    [State("time-period-dropdown", "value"),
     State("category-dropdown", "value")]
)
def update_dashboard(n_clicks, time_period, categories):
    # Filter data based on time period
    filtered_df = df.copy()
    
    if time_period != 'ALL':
        end_date = df['date'].max()
        if time_period == '30D':
            start_date = end_date - timedelta(days=30)
        elif time_period == '90D':
            start_date = end_date - timedelta(days=90)
        elif time_period == '6M':
            start_date = end_date - timedelta(days=180)
        elif time_period == '1Y':
            start_date = end_date - timedelta(days=365)
        
        filtered_df = filtered_df[filtered_df['date'] >= start_date]
    
    # Filter by selected categories
    if categories:
        filtered_df = filtered_df[filtered_df['category'].isin(categories)]
    
    # Calculate key metrics
    total_revenue = f"${filtered_df['total_price'].sum():,.2f}"
    total_transactions = f"{filtered_df['transaction_id'].nunique():,}"
    
    # Calculate average basket size (average transaction value)
    transaction_totals = filtered_df.groupby('transaction_id')['total_price'].sum()
    avg_basket = f"${transaction_totals.mean():.2f}"
    
    # Revenue over time graph
    # Determine appropriate time grouping based on selected period
    if time_period in ['30D', '90D']:
        # Group by day for shorter periods
        time_df = filtered_df.groupby(filtered_df['date'].dt.date)['total_price'].sum().reset_index()
        time_df['date'] = pd.to_datetime(time_df['date'])
        time_title = 'Daily Revenue'
    elif time_period in ['6M']:
        # Group by week for medium periods
        time_df = filtered_df.groupby(pd.Grouper(key='date', freq='W-MON'))['total_price'].sum().reset_index()
        time_title = 'Weekly Revenue'
    else:
        # Group by month for longer periods
        time_df = filtered_df.groupby(pd.Grouper(key='date', freq='M'))['total_price'].sum().reset_index()
        time_title = 'Monthly Revenue'
    
    revenue_time_fig = px.line(
        time_df, 
        x='date', 
        y='total_price',
        title=time_title,
        labels={'date': 'Date', 'total_price': 'Revenue ($)'}
    )
    revenue_time_fig.update_layout(hovermode="x unified")
    
    # Add transaction count as a secondary axis
    if time_period in ['30D', '90D']:
        transaction_df = filtered_df.groupby(filtered_df['date'].dt.date)['transaction_id'].nunique().reset_index()
        transaction_df['date'] = pd.to_datetime(transaction_df['date'])
    elif time_period in ['6M']:
        transaction_df = filtered_df.groupby(pd.Grouper(key='date', freq='W-MON'))['transaction_id'].nunique().reset_index()
    else:
        transaction_df = filtered_df.groupby(pd.Grouper(key='date', freq='M'))['transaction_id'].nunique().reset_index()
    
    revenue_time_fig.add_trace(
        go.Scatter(
            x=transaction_df['date'],
            y=transaction_df['transaction_id'],
            name='Transactions',
            yaxis='y2',
            line=dict(color='red', dash='dot')
        )
    )
    
    revenue_time_fig.update_layout(
        yaxis2=dict(
            title='Number of Transactions',
            overlaying='y',
            side='right'
        ),
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='right',
            x=1
        )
    )
    
    # Sales by category graph
    category_sales = filtered_df.groupby('category')['total_price'].sum().reset_index()
    category_sales = category_sales.sort_values('total_price', ascending=False)
    
    category_sales_fig = px.pie(
        category_sales,
        values='total_price',
        names='category',
        title='Sales by Category',
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    
    category_sales_fig.update_traces(textposition='inside', textinfo='percent+label')
    
    # Top 10 best-selling products graph
    product_sales = filtered_df.groupby('product')['total_price'].sum().reset_index()
    product_sales = product_sales.sort_values('total_price', ascending=False).head(10)
    
    top_products_fig = px.bar(
        product_sales,
        x='total_price',
        y='product',
        title='Top 10 Best-Selling Products',
        labels={'total_price': 'Revenue ($)', 'product': 'Product'},
        orientation='h',
        color='total_price',
        color_continuous_scale=px.colors.sequential.Blues
    )
    
    top_products_fig.update_layout(yaxis={'categoryorder': 'total ascending'})
    
    # Seasonal trends graph (monthly sales by category)
    filtered_df['month'] = filtered_df['date'].dt.month
    filtered_df['month_name'] = filtered_df['date'].dt.strftime('%b')
    
    seasonal_df = filtered_df.groupby(['month', 'month_name', 'category'])['total_price'].sum().reset_index()
    
    # Create a proper month order
    month_order = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
                  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
    
    # Only include months that are in the filtered data
    available_months = sorted(filtered_df['month'].unique())
    month_names = [month_order[m] for m in available_months]
    
    seasonal_trends_fig = px.line(
        seasonal_df,
        x='month',
        y='total_price',
        color='category',
        title='Seasonal Sales Trends by Category',
        labels={'total_price': 'Revenue ($)', 'month': 'Month'}
    )
    
    seasonal_trends_fig.update_layout(
        xaxis=dict(
            tickmode='array',
            tickvals=available_months,
            ticktext=month_names
        ),
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='right',
            x=1
        )
    )
    
    # Weekly sales pattern graph
    filtered_df['day_of_week'] = filtered_df['date'].dt.dayofweek
    filtered_df['day_name'] = filtered_df['date'].dt.strftime('%a')
    
    weekly_df = filtered_df.groupby(['day_of_week', 'day_name'])['total_price'].sum().reset_index()
    
    # Create proper day order
    day_order = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
    
    # Only include days that are in the filtered data
    available_days = sorted(filtered_df['day_of_week'].unique())
    day_names = [day_order[d] for d in available_days]
    
    weekly_pattern_fig = px.bar(
        weekly_df,
        x='day_of_week',
        y='total_price',
        title='Weekly Sales Pattern',
        labels={'total_price': 'Revenue ($)', 'day_of_week': 'Day of Week'},
        color='total_price',
        color_continuous_scale=px.colors.sequential.Viridis
    )
    
    weekly_pattern_fig.update_layout(
        xaxis=dict(
            tickmode='array',
            tickvals=available_days,
            ticktext=day_names
        )
    )
    
    # Add transaction count line
    weekly_txn_df = filtered_df.groupby(['day_of_week', 'day_name'])['transaction_id'].nunique().reset_index()
    
    weekly_pattern_fig.add_trace(
        go.Scatter(
            x=weekly_txn_df['day_of_week'],
            y=weekly_txn_df['transaction_id'],
            name='Transactions',
            mode='lines+markers',
            yaxis='y2',
            line=dict(color='red')
        )
    )
    
    weekly_pattern_fig.update_layout(
        yaxis2=dict(
            title='Number of Transactions',
            overlaying='y',
            side='right'
        )
    )
    
    # Customer purchasing frequency
    customer_freq = filtered_df.groupby('customer_id')['transaction_id'].nunique().reset_index()
    customer_freq.columns = ['customer_id', 'purchase_frequency']
    
    # Create bins for frequency
    bins = [0, 1, 2, 3, 5, 10, 20, 50, 100]
    labels = ['1', '2', '3', '4-5', '6-10', '11-20', '21-50', '51+']
    customer_freq['frequency_group'] = pd.cut(customer_freq['purchase_frequency'], bins=bins, labels=labels, right=False)
    
    frequency_counts = customer_freq['frequency_group'].value_counts().reset_index()
    frequency_counts.columns = ['frequency_group', 'count']
    frequency_counts = frequency_counts.sort_values('frequency_group')
    
    customer_frequency_fig = px.bar(
        frequency_counts,
        x='frequency_group',
        y='count',
        title='Customer Purchase Frequency Distribution',
        labels={'frequency_group': 'Number of Purchases', 'count': 'Number of Customers'},
        color='count',
        color_continuous_scale=px.colors.sequential.Reds
    )
    
    # Generate insights based on the data
    insights_html = generate_insights(filtered_df)
    
    return (
        total_revenue,
        total_transactions,
        avg_basket,
        revenue_time_fig,
        category_sales_fig,
        top_products_fig,
        seasonal_trends_fig,
        weekly_pattern_fig,
        customer_frequency_fig,
        insights_html
    )

def generate_insights(df):
    """Generate business insights and recommendations based on the data"""
    insights = []
    
    # Top category
    top_category = df.groupby('category')['total_price'].sum().sort_values(ascending=False).index[0]
    top_category_sales = df[df['category'] == top_category]['total_price'].sum()
    total_sales = df['total_price'].sum()
    top_category_percentage = (top_category_sales / total_sales) * 100
    
    insights.append(html.P([
        html.Strong("Top Performing Category: "), 
        f"{top_category} accounts for ${top_category_sales:,.2f} in sales ({top_category_percentage:.1f}% of total revenue)."
    ]))
    
    # Top product
    top_product = df.groupby('product')['total_price'].sum().sort_values(ascending=False).index[0]
    top_product_sales = df[df['product'] == top_product]['total_price'].sum()
    top_product_percentage = (top_product_sales / total_sales) * 100
    
    insights.append(html.P([
        html.Strong("Best-Selling Product: "), 
        f"{top_product} generates ${top_product_sales:,.2f} in sales ({top_product_percentage:.1f}% of total revenue)."
    ]))
    
    # Weekly pattern insight
    day_sales = df.groupby(df['date'].dt.dayofweek)['total_price'].sum()
    best_day_idx = day_sales.idxmax()
    worst_day_idx = day_sales.idxmin()
    day_names = {0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday'}
    
    insights.append(html.P([
        html.Strong("Weekly Sales Pattern: "), 
        f"{day_names[best_day_idx]} is the highest-grossing day, while {day_names[worst_day_idx]} has the lowest sales. ",
        "Consider running promotions on slower days to boost traffic and revenue."
    ]))
    
    # Seasonal insights
    if len(df['date'].dt.month.unique()) > 3:  # Only if we have enough months
        month_sales = df.groupby(df['date'].dt.month)['total_price'].sum()
        best_month_idx = month_sales.idxmax()
        worst_month_idx = month_sales.idxmin()
        month_names = {1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
                      7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December'}
        
        insights.append(html.P([
            html.Strong("Seasonal Trends: "), 
            f"{month_names[best_month_idx]} shows the highest sales, while {month_names[worst_month_idx]} has the lowest. ",
            "Plan inventory and staffing accordingly for these seasonal fluctuations."
        ]))
    
    # Average basket size
    transaction_totals = df.groupby('transaction_id')['total_price'].sum()
    avg_basket = transaction_totals.mean()
    
    insights.append(html.P([
        html.Strong("Basket Size: "), 
        f"The average transaction value is ${avg_basket:.2f}. ",
        "Consider implementing cross-selling strategies to increase basket size."
    ]))
    
    # Customer frequency
    customer_freq = df.groupby('customer_id')['transaction_id'].nunique()
    repeat_customers = (customer_freq > 1).sum()
    total_customers = len(customer_freq)
    repeat_percentage = (repeat_customers / total_customers) * 100
    
    insights.append(html.P([
        html.Strong("Customer Loyalty: "), 
        f"{repeat_percentage:.1f}% of customers are repeat shoppers. ",
        "Implement a loyalty program to increase customer retention and frequency."
    ]))
    
    # Recommendations section
    recommendations = [
        html.P([
            html.Strong("1. Inventory Optimization: "), 
            f"Focus on maintaining optimal stock levels for top-selling products, especially {top_product} and other items in the {top_category} category."
        ]),
        html.P([
            html.Strong("2. Marketing Strategy: "), 
            f"Increase marketing efforts during {day_names[worst_day_idx]} and {month_names.get(worst_month_idx, 'slower months')} to boost sales during slower periods."
        ]),
        html.P([
            html.Strong("3. Customer Retention: "), 
            "Implement a customer loyalty program with personalized offers based on purchase history to increase repeat business."
        ]),
        html.P([
            html.Strong("4. Cross-Selling: "), 
            "Train staff to suggest complementary products to increase average transaction value."
        ]),
        html.P([
            html.Strong("5. Seasonal Promotions: "), 
            "Plan seasonal promotions and product bundles to capitalize on peak selling periods and mitigate slow seasons."
        ])
    ]
    
    return html.Div([
        html.H6("Key Insights:", className="mt-2"),
        html.Div(insights),
        html.H6("Recommendations:", className="mt-4"),
        html.Div(recommendations)
    ])

if __name__ == '__main__':
    app.run_server(debug=True)
