from backend.app.schemas.nft_tokenization import NFTDeploymentRequest
from fastapi import APIRouter, HTTPException
import cdp as cdp
import os

# Initialize FastAPI Router
router = APIRouter()

# Replace these with your actual Coinbase API credentials
COINBASE_API_KEY = os.getenv("COINBASE_API_KEY")
COINBASE_API_SECRET = os.getenv("COINBASE_API_SECRET")

cdp.Cdp.configure(COINBASE_API_KEY, COINBASE_API_SECRET)

@router.post("/wallet/create")
async def create_wallet():
    """
    Endpoint to create a new wallet.

    Returns:
        dict: Wallet details including ID and address.
    """
    try:
        # Initialize MPC Wallet Client
        wallet = cdp.Wallet.create()
        default_address = {
            'address_id': wallet.default_address.address_id,
            'wallet_id': wallet.default_address.wallet_id,
            'network_id': wallet.default_address.network_id
        }
        file_path = f"data/{wallet.id}.json"
        wallet.save_seed(file_path, encrypt=True)
        return {
            "balance": wallet.balance,
            "can_sign": wallet.can_sign,
            "default_address": default_address,
            "id": wallet.id,
            "network_id": wallet.network_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating wallet: {str(e)}")

 
@router.get("/wallet/{wallet_id}")
async def get_wallet(wallet_id: str):
    """
    Endpoint to retrieve wallet details by ID, hydrate it, and fetch balances.

    Args:
        wallet_id (str): The ID of the wallet.

    Returns:
        dict: Wallet details including balance and address.
    """
    try:
        # Fetch the unhydrated wallet from the Coinbase API
        print(f"Wallet ID: {wallet_id}")
        fetched_wallet = cdp.Wallet.fetch(wallet_id)
        print(f"Fetched Wallet: {fetched_wallet}")

        # Check if the wallet is hydrated
        if fetched_wallet.server_signer_status is None:
            # Fetch the seed securely (your responsibility to securely store/retrieve this)
            # Replace `fetch_seed` with your implementation to retrieve the seed for this wallet ID
            hydrated_wallet = fetch_seed(wallet_id, fetched_wallet)

        # Retrieve wallet balances
        balance = hydrated_wallet.balance
        default_address = {
             'address_id': hydrated_wallet.default_address.address_id,
             'wallet_id': hydrated_wallet.default_address.wallet_id,
             'network_id': hydrated_wallet.default_address.network_id
        }

        # Prepare response data
        return {
            "id": wallet_id,
            "default_address": default_address,
            "balance": balance,
            "can_sign": hydrated_wallet.can_sign,
            "network_id": hydrated_wallet.network_id
        }

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving wallet: {str(e)}")


def fetch_seed(wallet_id: str,
               wallet: any):
    """
    Fetch the wallet seed from the locally saved file.

    Args:
        wallet_id (str): The ID of the wallet to fetch the seed for.

    Returns:
        dict: Seed data for the wallet.

    Raises:
        FileNotFoundError: If the seed file does not exist.
        Exception: If any error occurs while loading the seed.
    """
    try:
        # Construct the file path where the seed is stored
        file_path = f"data/{wallet_id}.json"

        # Check if the file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Seed file for wallet {wallet_id} does not exist.")

        # Load the seed data from the file
        wallet.load_seed(file_path=file_path)
        print("Wallet Seed: ", wallet)
        return wallet

    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error fetching seed for wallet {wallet_id}: {str(e)}")


@router.post("/wallet/{wallet_id}/deploy-nft")
async def deploy_nft(wallet_id: str, request: NFTDeploymentRequest):
    try:
        # Fetch the wallet
        wallet = cdp.Wallet.fetch(wallet_id)
        wallet = fetch_seed(wallet_id, wallet)

         # Ensure the wallet has sufficient balance by requesting faucet funds
        faucet_response = wallet.faucet(asset_id="eth")
        faucet_response.wait()  # Wait for the faucet transaction to complete
        print("Entire Faucet Response: ", faucet_response)
        print(f"Faucet transaction: {faucet_response.transaction_hash}")
        # Deploy NFT contract
        nft_contract = wallet.deploy_nft(request.name, request.symbol, request.base_uri)
        print(nft_contract)
        return {
            "contract_address": nft_contract.contract_address,
            "name": request.name,
            "symbol": request.symbol,
            "base_uri": request.base_uri
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deploying NFT: {str(e)}")
