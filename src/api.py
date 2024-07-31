from fastapi import FastAPI
from pydantic import BaseModel
from utils.generate import filter_comments

app = FastAPI()

class InputData(BaseModel):
    user_input: str
    apikey: str

@app.post("/data/")
async def generate(data: InputData):
    filtered = filter_comments(data.user_input, data.apikey)
    return filtered

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
