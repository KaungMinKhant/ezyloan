from pydantic import BaseModel
from decimal import Decimal

class NFTDeploymentRequest(BaseModel):
    name: str
    symbol: str
    base_uri: str

class FaucetTransactionResponse(BaseModel):
    transaction_hash: str
    transaction_link: str
    status: str
    network_id: str

class SmartContract(BaseModel):
    smart_contract_id: str
    wallet_id: str
    network_id: str
    contract_address: str
    type: str
    transaction_hash: str
    transaction_link: str
    status: str

class LoanRequest(BaseModel):
    wallet_id: str
    collateral_token: str
    collateral_amount: float
    requested_loan_amount: float
    requested_loan_token: str

class LendRequest(BaseModel):
    loan_amount: float
    loan_token: str

class LoanRepay(BaseModel):
    loan_details: dict
    repayment_amount: float
    repayment_token: str
