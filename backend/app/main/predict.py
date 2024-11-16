from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

router = APIRouter()

# Load the trained model pipeline
model_pipeline = joblib.load('backend/app/credit_score/model/model_credit.joblib')

# Define the input data model
class InferenceRequest(BaseModel):
    usr_id: str
    name: str
    age: int
    occupation: str
    annual_Income: float
    monthly_inhand_salary: float
    type_of_Loan: str
    wallet_id: str
    num_transactions: int
    total_value: float
    avg_transaction_value: float
    num_unique_addresses: int
    default_address: str
    balance: float
    can_sign: bool
    network_id: str


@router.post("/predict")
async def predict(request: InferenceRequest):
    try:
        input_data = pd.DataFrame([request.dict()])
        column_mapping = {'usr_id':'Customer_ID', 
                           'name':'Name',
                           'age':'Age',
                           'occupation': 'Occupation',
                           'annual_Income':'Annual_Income',
                           'monthly_inhand_salary': 'Monthly_Inhand_Salary',
                           'type_of_Loan': 'Type_of_Loan',
                            'wallet_id': 'wallet_id',
                            'num_transactions':'num_transactions',
                            'total_value':'total_value',
                            'avg_transaction_value':'avg_transaction_value',
                            'num_unique_addresses':'num_unique_addresses',
                            'default_address':'default_address',
                            'balance':'balance',
                            'can_sign':'can_sign',
                            'network_id':'network_id'}

        # Rename the columns using the mapping
        input_data.rename(columns=column_mapping, inplace=True)
        numeric_columns = [
            'Age', 'Annual_Income', 'Monthly_Inhand_Salary', 
            'num_transactions', 'total_value', 'avg_transaction_value', 
            'num_unique_addresses', 'balance'
        ]
        from sklearn.preprocessing import LabelEncoder
        label_encoder = LabelEncoder()
        for column in input_data.columns:
            if input_data[column].dtype == 'object':  # Check if the column contains strings
                input_data[column] = label_encoder.fit_transform(input_data[column])
        for col in numeric_columns:
            input_data[col] = pd.to_numeric(input_data[col], errors='coerce')
        # Preprocess the input data and make predictions
        predictions = model_pipeline.predict(input_data)
        predictions = predictions.tolist()

        # Return the predictions
        return {"predictions": predictions[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
