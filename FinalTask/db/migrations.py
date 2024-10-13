import pandas as pd
from sqlalchemy import create_engine
import os
import logging

logging.basicConfig(
    filename='app.log',  # Log to a file
    filemode='a',        # Overwrite the log file every time (use 'a' to append)
    level=logging.INFO,   # Set log level
    format='%(asctime)s - %(levelname)s - %(message)s'
)

df = pd.read_csv("Export.csv", encoding='ISO-8859-1')
engine = create_engine(
    f'mysql+pymysql://{os.getenv("DATABASE_USER")}:{os.getenv("DATABASE_PASSWORD")}@'
    f'{os.getenv("DATABASE_HOST")}/{os.getenv("DATABASE_NAME")}'
)
columns = ['FMID', 'MarketName', 'State', 'city', 'zip', 'x', 'y']
df =  df[columns]
df.rename(columns={
    'FMID': 'id',              # Assuming FMID is a unique identifier
    'MarketName': 'name',
    'State': 'state',
    'city': 'city',
    'zip': 'postal_code',
    'x': 'latitude',
    'y': 'longitude'
}, inplace=True)

#long_cities = df[df['city'].str.len() > 200]
#print(long_cities[['city']])
#df['city'] = df['city'].str.slice(0, 200)

df['latitude'] = df['latitude'].fillna(0)  # Fill missing latitude with 0
df['longitude'] = df['longitude'].fillna(0)  # Fill missing longitude with 0
df['city'] = df['city'].fillna('Unknown')  # Replace with 'Unknown' or any other placeholder
df['state'] = df['state'].fillna('Unknown')  

logging.info("Data loaded and processed.")
existing_ids = pd.read_sql('SELECT id FROM markets', con=engine)['id'].tolist()
logging.info(f"Fetched {len(existing_ids)} existing market IDs from the database.")

new_records = df[~df['id'].isin(existing_ids)]
logging.info(f"Found {len(new_records)} new records to insert.")

if not new_records.empty:
    new_records[['id', 'name', 'city', 'state', 'postal_code', 'latitude', 'longitude']].to_sql(
        'markets', 
        con=engine, 
        if_exists='append', 
        index=False
    )
    logging.info(f"Successfully inserted {len(new_records)} new records into the 'markets' table.")
else:
    logging.info("No new records to insert.")