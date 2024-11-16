from pydantic import BaseModel, UUID4


class LoanBase(BaseModel):
    age: int
    amount: float
    occupation: str
    token: str
    
    

class LoanCreate(LoanBase):
    pass

class LoanRead(LoanBase):
    id: UUID4

    class Config:
        orm_mode = True
