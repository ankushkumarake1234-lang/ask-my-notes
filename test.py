import sys, json, urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

key = "AIzaSyAuHxpUKSGB0fWqjxwMi__wLdzr8siQfeU"
def check_model(model_name):
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={key}"
    data = json.dumps({'contents':[{'parts':[{'text':'hello'}]}]}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
    try:
        res = urllib.request.urlopen(req, context=ctx)
        return True, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return False, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return False, str(e)

try:
    res = urllib.request.urlopen(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}", context=ctx)
    models = json.loads(res.read().decode('utf-8')).get('models', [])
    for m in models:
        if 'generateContent' in m.get('supportedGenerationMethods', []):
            name = m['name']
            success, result = check_model(name)
            if success:
                print(f"{name}: SUCCESS")
                sys.exit(0)
            else:
                err_msg = result.get('error', {}).get('message', str(result)) if isinstance(result, dict) else result
                if 'Quota' in str(err_msg):
                    print(f"{name}: QUOTA EXCEEDED")
                else:
                    print(f"{name}: ERROR {err_msg}")
except Exception as e:
    print(f"Failed to list models: {e}")
