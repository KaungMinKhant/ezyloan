from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal, engine, Base
from ..crud.users import get_user_by_username, create_user
from ..schemas.users import UserCreate, User

# Create all tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI Router
router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
async def login(user: UserCreate, db: Session = Depends(get_db)):
    """
    login method
    """
    print("user", user)
    db_user = get_user_by_username(db, name=user.name)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered, logging in")
    return create_user(db=db, user_data=user)
