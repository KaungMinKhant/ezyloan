from sqlalchemy.orm import Session
from ..models.users import User
from ..schemas.users import UserCreate
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_username(db: Session, name: str):
    return db.query(User).filter(User.name == name).first()

def create_user(db: Session, user: UserCreate):
    db_user = user.User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
