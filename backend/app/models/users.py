import os
from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)


class UserLoanData(Base):
    __tablename__ = "user_loan_data"
    DEFAULT_USER_ID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))

    amount = Column(Numeric, nullable=False)
    token = Column(Text, nullable=False)
    age = Column(Integer, nullable=False)
    occupation = Column(Text, nullable=False)
    monthly_income = Column(Numeric, nullable=False)
    income_currency = Column(Text, nullable=False)
    monthly_expense = Column(Numeric, nullable=False)
    expene_currency = Column(Text, nullable=False)
    purpose_of_loan = Column(Text, nullable=False)
    collateral_type = Column(Text, nullable=False)
    loan_duration = Column(Text, nullable=False)
