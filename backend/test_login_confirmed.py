import requests

def test_login():
    url = "http://127.0.0.1:8009/token"
    payload = {
        "username": "gitams4@gmail.com",
        "password": "Admin123@#$"
    }
    
    # OAuth2PasswordRequestForm expects form-data
    response = requests.post(url, data=payload)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Login Successful!")
        print(f"Response: {response.json()}")
    else:
        print("Login Failed!")
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_login()
