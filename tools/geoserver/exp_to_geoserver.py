import requests

# --- CONFIGURATION ---
GS_URL = "http://10.0.0.205:8080/geoserver/rest"
GS_USER = "admin"
GS_PASS = "geoserver"
WORKSPACE = "exposures"

# Database Connection Details
DB_CONFIG = {
    "host": "10.0.0.205",
    "port": "5432",
    "database": "postgres",
    "user": "postgres",
    "passwd": "maltanadirSRV0",
    "dbtype": "postgis"
}

schemas = [
    "T3_100yrs_Future_Breaches_Impacted", "T3_100yrs_Future_Perfect_Impacted", "T3_100yrs_Future_RedCapacity_Impacted",
    "T3_100yrs_Present_Breaches_Impacted", "T3_100yrs_Present_Perfect_Impacted", "T3_100yrs_Present_RedCapacity_Impacted",
    "T3_10yrs_Future_Breaches_Impacted", "T3_10yrs_Future_Perfect_Impacted", "T3_10yrs_Future_RedCapacity_Impacted",
    "T3_10yrs_Present_Breaches_Impacted", "T3_10yrs_Present_Perfect_Impacted", "T3_10yrs_Present_RedCapacity_Impacted",
    "T3_2.3yrs_Future_Breaches_Impacted", "T3_2.3yrs_Future_Perfect_Impacted", "T3_2.3yrs_Future_RedCapacity_Impacted",
    "T3_2.3yrs_Present_Breaches_Impacted", "T3_2.3yrs_Present_Perfect_Impacted", "T3_2.3yrs_Present_RedCapacity_Impacted",
    "T3_25yrs_Future_Breaches_Impacted", "T3_25yrs_Future_Perfect_Impacted", "T3_25yrs_Future_RedCapacity_Impacted",
    "T3_25yrs_Present_Breaches_Impacted", "T3_25yrs_Present_Perfect_Impacted", "T3_25yrs_Present_RedCapacity_Impacted",
    "T3_500yrs_Future_Breaches_Impacted", "T3_500yrs_Future_Perfect_Impacted", "T3_500yrs_Future_RedCapacity_Impacted",
    "T3_500yrs_Present_Breaches_Impacted", "T3_500yrs_Present_Perfect_Impacted", "T3_500yrs_Present_RedCapacity_Impacted",
    "T3_50yrs_Future_Breaches_Impacted", "T3_50yrs_Future_Perfect_Impacted", "T3_50yrs_Future_RedCapacity_Impacted",
    "T3_50yrs_Present_Breaches_Impacted", "T3_50yrs_Present_Perfect_Impacted", "T3_50yrs_Present_RedCapacity_Impacted",
    "T3_5yrs_Future_Breaches_Impacted", "T3_5yrs_Future_Perfect_Impacted", "T3_5yrs_Future_RedCapacity_Impacted",
    "T3_5yrs_Present_Breaches_Impacted", "T3_5yrs_Present_Perfect_Impacted", "T3_5yrs_Present_RedCapacity_Impacted"
]

def add_geoserver_store(schema_name):
    # 1. Create the DataStore for this specific schema
    store_url = f"{GS_URL}/workspaces/{WORKSPACE}/datastores"
    
    store_payload = {
        "dataStore": {
            "name": schema_name, # Store name matches schema name
            "connectionParameters": {
                "entry": [
                    {"@key": "host", "$": DB_CONFIG["host"]},
                    {"@key": "port", "$": DB_CONFIG["port"]},
                    {"@key": "database", "$": DB_CONFIG["database"]},
                    {"@key": "user", "$": DB_CONFIG["user"]},
                    {"@key": "passwd", "$": DB_CONFIG["passwd"]},
                    {"@key": "dbtype", "$": "postgis"},
                    {"@key": "schema", "$": schema_name} # The magic ingredient
                ]
            }
        }
    }

    # POST to create store
    r = requests.post(store_url, json=store_payload, auth=(GS_USER, GS_PASS))
    
    if r.status_code == 201:
        print(f"✅ Store Created: {schema_name}")
        # 2. Optionally: Auto-publish the tables in this schema
        # (This requires a second call to /featuretypes if you want them visible)
    else:
        print(f"❌ Failed {schema_name}: {r.text}")

# Execute
for s in schemas:
    add_geoserver_store(s)