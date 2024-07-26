## 環境安裝
```
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn
pip install groq
```

## Curl
```
curl -X 'POST' \
  'http://localhost:8000/data/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "user_input": "<Comments_List><Comments><Comment_ID>1</Comment_ID><Comment>我要找到那個人，然後狠狠地揍他一頓，讓他知道什麼叫痛苦。</Comment></Comments><Comments><Comment_ID>2</Comment_ID><Comment>握草，胸部太大了吧</Comment></Comments><Comments><Comment_ID>3</Comment_ID><Comment>這個影片非常推薦</Comment></Comments></Comments_List>",
  "apikey": "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"
}'
```

## Output
```
"<filtered_Comments><Comment_ID>1</Comment_ID><Comment_ID>2</Comment_ID></filtered_Comments>"
```