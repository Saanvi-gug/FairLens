import requests
import json

url = 'http://localhost:8000/audit/dataset'
files = {'file': open('../sample_data/hiring_bias.csv', 'rb')}
data = {'sensitive_col': 'gender', 'target_col': 'hired'}
try:
    r = requests.post(url, files=files, data=data)
    print("STATUS", r.status_code)
    try:
        print(r.json())
    except:
        print(r.text)
except Exception as e:
    print("EXCEPTION", e)
