from pydantic import BaseModel, UUID4


class LoanBase(BaseModel):
    age: int
    amount: float
    occupation: str
    token: str
    monthly_income: float
    income_currency: str
    monthly_expense: float
    expene_currency: str
    purpose_of_loan: str
    collateral_type: str
    loan_duration: str
    
    

class LoanCreate(LoanBase):
    pass

class LoanRead(LoanBase):
    id: UUID4

    class Config:
        orm_mode = True
