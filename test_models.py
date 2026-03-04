import sys, json, requests

key = "AIzaSyAuHxpUKSGB0fWqjxwMi__wLdzr8siQfeU"
res = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
models = res.json().get('models', [])

for m in models:
    if 'generateContent' in m.get('supportedGenerationMethods', []):
        model_name = m['name']
        print(f"Testing {model_name}...")
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={key}",
                json={"contents":[{"parts":[{"text":"hello"}]}]}
            )
            data = r.json()
            if 'error' in data:
                print(f"  Error: {data['error'].get('status')} - {data['error'].get('message')}")
            else:
                print(f"  SUCCESS! Response: {data['candidates'][0]['content']['parts'][0]['text']}")
                break
        except Exception as e:
            print(f"  Exception: {e}")
