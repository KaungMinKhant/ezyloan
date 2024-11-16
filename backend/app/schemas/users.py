from pydantic import BaseModel
from sqlalchemy import Column, Integer, String


class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    name: str
    email: str

class UserLogin(BaseModel):
    name: str
    email: str

class User(UserBase):
    id: int

class Config:
    orm_mode = True
