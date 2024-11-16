import io
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from PIL import Image
from ..database import SessionLocal, engine
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import uuid
from .wallet import router as wallet_router
from .users import router as login_router
from .loan_form import router as loan_form_router
from .predict import router as credit_score_router


SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5000",
    "http://localhost",
    # Add other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.include_router(wallet_router, prefix="/api/v1")
app.include_router(login_router, prefix="/api/v1")
app.include_router(loan_form_router, prefix="/api/v1")
app.include_router(credit_score_router, prefix="/api/v1")
