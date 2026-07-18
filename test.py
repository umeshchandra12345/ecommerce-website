from fastapi import FastAPI
from contextlib import asynccontextmanager
from rich import print, panel

@asynccontextmanager
async def life_span_handler(app: FastAPI):
    print(panel.Panel("Server started...",border_style="green"))
    yield
    print(panel.Panel(" stopped...",border_style="red"))

app = FastAPI(lifespan=life_span_handler)

@app.get("/")
def read_root():
    return {"detail":"Server running..."}