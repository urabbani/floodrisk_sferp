import requests

# --- CONFIGURATION ---
# Use 127.0.0.1 instead of localhost for better compatibility in WSL
GS_URL = "http://10.0.0.205:8080/geoserver/rest"
GS_USER = "admin"
GS_PASS = "geoserver"
WORKSPACE = "exposures"
SRS = "EPSG:32642"

# The 9 layers present in EVERY schema
target_layers = [
    "BHU", "Buildings", "Built_up_Area", "Cropped_Area", 
    "Electric_Grid", "Railways", "Roads", "Settlements", "Telecom_Towers"
]

# The 42 Schema names (used as Store Names)
stores = [
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

def sanitize_layer_name(store_name):
    """
    Fix decimal points in layer names (e.g., 2.3yrs -> 23yrs)
    GeoServer REST API has issues with decimals in layer names
    """
    # Replace decimal point in return periods (e.g., 2.3 -> 23)
    return store_name.replace("2.3yrs", "23yrs")

def publish_sub_layer(store_name, table_name):
    # Unique layer name for GeoServer: StoreName_TableName
    # WORKAROUND: Replace decimal points to avoid REST API issues
    # Example: T3_23yrs_Present_Breaches_Impacted_Buildings (was 2.3yrs)
    sanitized_store = sanitize_layer_name(store_name)
    published_name = f"{sanitized_store}_{table_name}"

    endpoint = f"{GS_URL}/workspaces/{WORKSPACE}/datastores/{store_name}/featuretypes?recalculate=nativebbox,latlonbbox"
    
    payload = {
        "featureType": {
            "name": published_name,
            "nativeName": table_name, # The actual table name in the DB schema
            "title": f"{store_name} - {table_name}".replace("_", " "),
            "srs": SRS,
            "nativeCRS": SRS,
            "projectionPolicy": "FORCE_DECLARED",
            "enabled": True
        }
    }

    try:
        r = requests.post(endpoint, json=payload, auth=(GS_USER, GS_PASS), timeout=10)
        if r.status_code == 201:
            print(f"✅ Published: {published_name}")
        else:
            print(f"⚠️  Skipped {published_name}: {r.status_code} - {r.text}")
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Is GeoServer running at {GS_URL}?")
        return False
    return True

# Nested Loop: For each store, publish the 9 layers
for store in stores:
    print(f"--- Processing Store: {store} ---")
    for layer in target_layers:
        success = publish_sub_layer(store, layer)
        if not success:
            break # Stop if connection is dead