from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal, engine, Base
from ..schemas.users import LoanCreate, LoanRead
from ..crud.users import create_loan, get_loan_by_id, get_all_loans, update_loan, delete_loan
import uuid

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

@router.post("/loans/", response_model=LoanRead)
def create_loan_endpoint(loan: LoanCreate, db: Session = Depends(get_db)):
    print("loan", loan)
    return create_loan(db=db, loan_data=loan)

@router.get("/loans/{loan_id}", response_model=LoanRead)
def get_loan(loan_id: uuid.UUID, db: Session = Depends(get_db)):
    loan = get_loan_by_id(db, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

@router.get("/loans/", response_model=list[LoanRead])
def list_loans(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_all_loans(db, skip=skip, limit=limit)

@router.put("/loans/{loan_id}", response_model=LoanRead)
def update_loan_endpoint(loan_id: uuid.UUID, loan: LoanCreate, db: Session = Depends(get_db)):
    updated_loan = update_loan(db, loan_id, loan)
    if not updated_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return updated_loan

@router.delete("/loans/{loan_id}", response_model=dict)
def delete_loan_endpoint(loan_id: uuid.UUID, db: Session = Depends(get_db)):
    deleted_loan = delete_loan(db, loan_id)
    if not deleted_loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return {"message": "Loan deleted successfully"}
