from backend.app.schemas.nft_tokenization import NFTDeploymentRequest,\
    LoanRequest
from web3 import Web3
from fastapi import APIRouter, HTTPException, Query
import cdp as cdp
import os

# Initialize FastAPI Router
router = APIRouter()

# Replace these with your actual Coinbase API credentials
COINBASE_API_KEY = os.getenv("COINBASE_API_KEY")
COINBASE_API_SECRET = os.getenv("COINBASE_API_SECRET")

# Polygon RPC URL for interacting with Chainlink
ETH_SEPOLIA_RPC_URL = os.getenv("ETH_SEPOLIA_RPC_URL")
ETH_USD_CHAINLINK_ADDRESS = os.getenv("ETH_USD_CHAINLINK_ADDRESS")
USDC_USD_CHAINLINK_ADDRESS = os.getenv("USDC_USD_CHAINLINK_ADDRESS")
DAI_USD_CHAINLINK_ADDRESS = os.getenv("DAI_USD_CHAINLINK_ADDRESS")

# Chainlink Price Feed Contract Addresses on Polygon
CHAINLINK_PRICE_FEEDS = {
    "ETH/USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    "USDC/USD": "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    "DAI/USD": "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
}

# Chainlink Price Feed ABI
CHAINLINK_PRICE_FEED_ABI = '[{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"version","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]'

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


def get_token_price(pair: str) -> float:
    """
    Fetch the latest price of a token pair (e.g., ETH/USD) from Chainlink.

    Args:
        pair (str): The token pair (e.g., ETH/USD).

    Returns:
        float: The latest price of the token in USD.

    Raises:
        HTTPException: If the pair is not supported or the fetch fails.
    """
    if pair not in CHAINLINK_PRICE_FEEDS:
        raise HTTPException(status_code=400, detail=f"Unsupported price pair: {pair}")

    try:
        web3 = Web3(Web3.HTTPProvider(ETH_SEPOLIA_RPC_URL))
        print(web3)
        print("Address: ", CHAINLINK_PRICE_FEEDS[pair])
        feed_contract = web3.eth.contract(address=CHAINLINK_PRICE_FEEDS[pair], abi=CHAINLINK_PRICE_FEED_ABI)
        print(feed_contract)
        price_data = feed_contract.functions.latestRoundData().call()
        price = price_data[1] / 10**8  # Convert price to USD
        return price
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching price for {pair}: {str(e)}")


async def get_crypto_valuation(
    token: str = Query(..., description="The token to evaluate (e.g., ETH, USDC, DAI)"),
    amount: float = Query(..., description="The amount of the token being pledged"),
):
    """
    Get the valuation of a pledged crypto token.

    Args:
        token (str): The token symbol (e.g., ETH, USDC, DAI).
        amount (float): The amount of the token.

    Returns:
        dict: The valuation details, including token, amount, and USD value.
    """
    try:
        pair = f"{token}/USD"
        price = get_token_price(pair)
        usd_value = price * amount
        return {
            "token": token,
            "amount": amount,
            "price_per_unit": price,
            "usd_value": usd_value,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating valuation: {str(e)}")


@router.post("/loan/crypto/approve-reject")
async def loan_approve_reject(request: LoanRequest):
    """
    Approve or reject a loan request based on the value of crypto collateral.

    Args:
        request (LoanRequest): Loan request details, including collateral amount and loan amount.

    Returns:
        dict: Approval status and details.
    """
    try:
        # Validate required fields
        if not request.wallet_id or not request.requested_loan_token or not request.collateral_token or not request.collateral_amount or not request.requested_loan_amount:
            raise HTTPException(status_code=400, detail="Missing required fields in the request.")

        # Call valuation API or function to calculate collateral value
        collateral_valuation = await get_crypto_valuation(
            token=request.collateral_token,
            amount=request.collateral_amount
        )
        
        loan_valuation = await get_crypto_valuation(
            token=request.requested_loan_token,
            amount=request.requested_loan_amount
        )

        if "usd_value" not in collateral_valuation:
            raise HTTPException(status_code=500, detail="Failed to fetch collateral valuation.")

        # Calculate maximum loan amount
        collateral_value = collateral_valuation["usd_value"]
        max_loan_amount = collateral_value * 0.7  # 70% of collateral value

        # Determine approval or rejection
        if loan_valuation["usd_value"] <= max_loan_amount:
            return {
                "status": "approved",
                "approved_loan_amount": request.requested_loan_amount,
                "approved_loan_token": request.requested_loan_token,
                "max_loan_amount_in_usd": max_loan_amount,
                "collateral_value_in_usd": collateral_value,
            }
        else:
            return {
                "status": "rejected",
                "reason": "Requested loan amount exceeds the maximum allowable loan amount.",
                "max_loan_amount_in_usd": max_loan_amount,
                "collateral_value_in_usd": collateral_value,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing loan request: {str(e)}")
