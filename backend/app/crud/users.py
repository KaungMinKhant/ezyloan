from sqlalchemy.orm import Session
from ..models.users import UserLoanData
from ..schemas.users import LoanCreate
import uuid

def create_loan(db: Session, loan_data: LoanCreate):
    new_loan = UserLoanData(**loan_data.dict())
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan

def get_loan_by_id(db: Session, loan_id: uuid.UUID):
    return db.query(UserLoanData).filter(UserLoanData.id == loan_id).first()

def get_all_loans(db: Session, skip: int = 0, limit: int = 10):
    return db.query(UserLoanData).offset(skip).limit(limit).all()

def update_loan(db: Session, loan_id: uuid.UUID, loan_data: LoanCreate):
    loan = db.query(UserLoanData).filter(UserLoanData.id == loan_id).first()
    if loan:
        for key, value in loan_data.dict().items():
            setattr(loan, key, value)
        db.commit()
        db.refresh(loan)
    return loan

def delete_loan(db: Session, loan_id: uuid.UUID):
    loan = db.query(UserLoanData).filter(UserLoanData.id == loan_id).first()
    if loan:
        db.delete(loan)
        db.commit()
    return loan