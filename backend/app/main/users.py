from fastapi import APIRouter, HTTPException, Depends
from ..crud.users import get_user_by_username, create_user
from ..schemas.users import UserCreate
from sqlalchemy.orm import Session


# Initialize FastAPI Router
router = APIRouter()

@router.post("/login")
async def login(username: str, email: str):
    """
    login method
    """
    try:
        print("logging in")
        user_data = UserCreate(name=username, email=email)
        register_user(user_data)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving wallet: {str(e)}")

def register_user(user: UserCreate):
    db: Session = Depends(lambda: __import__('..database').get_db())
    db_user = get_user_by_username(db, name=user.name)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)
