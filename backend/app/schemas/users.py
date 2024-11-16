from pydantic import BaseModel
from sqlalchemy import Column, Integer, String


class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class UserLogin(BaseModel):
    pass

class User(UserBase):
    id: int

    class Config:
        orm_mode = True
