from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import Environment, settings

app = FastAPI(title="PassWeb")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn

    print("Starting app...")
    uvicorn.run(
        "main:app", host="0.0.0.0", port=8000, reload=settings.env == Environment.DEV
    )
