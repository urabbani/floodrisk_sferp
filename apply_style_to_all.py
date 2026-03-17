import requests
import time

GS_URL = "http://10.0.0.205:8080/geoserver/rest"
GS_USER = "admin"
GS_PASS = "geoserver"
WORKSPACE = "exposures"
STYLE_NAME = "impact_depth_simple"

def get_all_layers():
    """Get all layers in the exposures workspace"""
    url = f"{GS_URL}/workspaces/{WORKSPACE}/layers.json"
    r = requests.get(url, auth=(GS_USER, GS_PASS))
    if r.status_code == 200:
        data = r.json()
        return data.get('layers', {}).get('layer', [])
    return []

def apply_style(layer_name):
    """Apply impact_depth_simple style to a layer"""
    url = f"{GS_URL}/layers/{WORKSPACE}:{layer_name}"

    payload = {
        "layer": {
            "defaultStyle": {
                "name": STYLE_NAME,
                "workspace": WORKSPACE
            }
        }
    }

    r = requests.put(url, json=payload, auth=(GS_USER, GS_PASS))

    if r.status_code == 200:
        return True, "✅"
    else:
        return False, f"❌ {r.status_code}"

def main():
    print("📋 Fetching all layers from exposures workspace...")
    layers = get_all_layers()
    print(f"✅ Found {len(layers)} layers\n")

    print(f"🎨 Applying {STYLE_NAME} style to all layers...\n")

    success_count = 0
    fail_count = 0
    failed_layers = []

    for i, layer in enumerate(layers, 1):
        layer_name = layer['name']
        success, status = apply_style(layer_name)

        if success:
            success_count += 1
            print(status, end='', flush=True)
        else:
            fail_count += 1
            failed_layers.append((layer_name, status))
            print(status, end='', flush=True)

        # Progress indicator every 50 layers
        if i % 50 == 0:
            print(f"  {i}/{len(layers)} processed...")

    print(f"\n\n{'='*60}")
    print(f"✅ Success: {success_count}/{len(layers)}")
    print(f"❌ Failed: {fail_count}/{len(layers)}")

    if failed_layers:
        print(f"\n📋 Failed layers:")
        for layer_name, status in failed_layers[:10]:  # Show first 10
            print(f"  {status} {layer_name}")
        if len(failed_layers) > 10:
            print(f"  ... and {len(failed_layers) - 10} more")

    print(f"\n🔄 Reload GeoServer to apply changes:")
    print(f"   http://10.0.0.205:8080/geoserver/web/?wicket:bookmarkable=:org.geoserver.web.GeoServerApplication:home")

if __name__ == "__main__":
    main()
