import requests

print("Testing /demo/hiring_bias")
r = requests.get('http://localhost:8000/demo/hiring_bias')
print(r.status_code)
try:
    print(r.text[:100])
except:
    pass
