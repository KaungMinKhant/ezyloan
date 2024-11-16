from fastapi import APIRouter, UploadFile, Form, HTTPException
from web3 import Web3, HTTPProvider
import os

router = APIRouter()

# Polygon configuration
POLYGON_RPC_URL = os.getenv("POLYGON_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
DEPLOYER_ADDRESS = os.getenv("DEPLOYER_ADDRESS")

w3 = Web3(HTTPProvider(POLYGON_RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

@router.post("/assets/tokenize")
async def tokenize_asset(
    description: str = Form(...),
    collateral_type: str = Form(...),
    owner_address: str = Form(...),
    asset_photo: UploadFile = None
):
    try:
        # Save asset photo
        if asset_photo:
            file_location = f"uploads/{asset_photo.filename}"
            with open(file_location, "wb") as file:
                file.write(await asset_photo.read())

        # Load contract ABI
        contract_abi = [...]  # Replace with your contract ABI
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)

        # Create mint transaction
        tx = contract.functions.mintNFT(
            owner_address,
            description,
            collateral_type
        ).buildTransaction({
            "chainId": w3.eth.chain_id,
            "gas": 500000,
            "gasPrice": w3.toWei("30", "gwei"),
            "nonce": w3.eth.get_transaction_count(account.address),
        })

        # Sign and send transaction
        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        return {
            "message": "Asset tokenized successfully",
            "transaction_hash": tx_hash.hex(),
            "description": description,
            "collateral_type": collateral_type,
            "owner_address": owner_address,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tokenization failed: {str(e)}")
