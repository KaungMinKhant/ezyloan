from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class UserLoanData(Base):
    __tablename__ = "user_loan_data"
    DEFAULT_USER_ID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))

    amount = Column(Numeric, nullable=False)
    token = Column(Text, nullable=False)
    age = Column(Integer, nullable=False)
    occupation = Column(Text, nullable=False)
