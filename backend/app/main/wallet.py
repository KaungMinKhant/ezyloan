from decimal import Decimal
from backend.app.schemas.nft_tokenization import NFTDeploymentRequest,\
    LoanRequest, LendRequest, LoanRepay
import datetime
from web3 import Web3
from fastapi import APIRouter, HTTPException, Query
import json
import cdp as cdp
import os
from cdp.transaction import Transaction
from .feature_extraction import extract_features
from .predict import predict

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
        balance = hydrated_wallet.balances()
        print("Balance: ", balance)
        default_address = {
             'address_id': hydrated_wallet.default_address.address_id,
             'wallet_id': hydrated_wallet.default_address.wallet_id,
             'network_id': hydrated_wallet.default_address.network_id
        }
        
        print("Hydrated Wallet: ", hydrated_wallet)

        # Return the wallet details
        transactions = Transaction.list(hydrated_wallet.default_address.network_id,
                                        hydrated_wallet.default_address.address_id)
        transactions = [list(transactions)]
        transaction_features = extract_features(transactions[:3])
        
        wallet_details = {
            "id": wallet_id,
            "default_address": default_address,
            "balance": balance,
            "can_sign": hydrated_wallet.can_sign,
            "network_id": hydrated_wallet.network_id
        }

        # Add the transaction features to the wallet details
        wallet_details.update(transaction_features)

        # Prepare response data
        return wallet_details

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving wallet: {str(e)}")


@router.get("/wallets")
async def list_wallets():
    """
    List all locally stored wallets and include associated loan details if the wallet is a borrower.
    """
    try:
        wallets_dir = "data"  # Path where wallets are stored
        approved_loans_file = "data/approved_loans.json"  # File with approved loans
        wallet_files = [f for f in os.listdir(wallets_dir) if f.endswith(".json")]

        # Load approved loans
        if os.path.exists(approved_loans_file):
            with open(approved_loans_file, "r") as f:
                approved_loans = json.load(f)
        else:
            approved_loans = []

        wallets = []
        for file in wallet_files:
            # Remove the .json extension to get the wallet ID
            wallet_id = file.replace(".json", "")
            try:
                # Fetch wallet details
                wallet = await get_wallet(wallet_id)

                # Check if the wallet_id is a borrower_wallet_id in approved_loans
                loan_details = [
                    {key: value for key, value in loan.items() if key != "contract_abi"}  # Exclude "contract_abi"
                    for loan in approved_loans
                    if loan["borrower_wallet_id"] == wallet_id
                ]

                # Add loan details to the wallet object if found
                wallet["loan_details"] = loan_details if loan_details else None

                # Append the updated wallet object to the list
                wallets.append(wallet)
            except Exception as e:
                print(f"Error fetching wallet {wallet_id}: {str(e)}")
                continue

        return wallets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing wallets: {str(e)}")


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


@router.post("/wallet/{wallet_id}/nft-approve-reject-loan")
async def approve_reject_loan_with_nft(wallet_id: str, request: NFTDeploymentRequest):
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
        
        # Validate required fields
        if not request.wallet_id or not request.requested_loan_token or not request.requested_loan_amount:
            raise HTTPException(status_code=400, detail="Missing required fields in the request.")

        # Step 1: Calculate collateral valuation
        collateral_valuation = await get_realworld_asset_valuation(
            asset=request.name
        )
        loan_valuation = await get_crypto_valuation(
            token=request.requested_loan_token,
            amount=request.requested_loan_amount
        )

        if "usd_value" not in collateral_valuation:
            raise HTTPException(status_code=500, detail="Failed to fetch collateral valuation.")
        print("wallet data: ", wallet)
        # Calculate credit sccore
        wallet_data = get_wallet(wallet_id)
        print("wallet data: ", wallet_data)
        personal_data = {"usr_id": "user_123",
                        "name": "John Doe",
                        "age": 30,
                        "occupation": "Software Engineer",
                        "annual_Income": 80000.0,
                        "monthly_inhand_salary": 5000.0,
                        "type_of_Loan": "Personal"}

        wallet_data.update(personal_data)
        credit_score = predict(wallet_data)
        print("credit score: ", credit_score)


        # Calculate maximum loan amount
        collateral_value = collateral_valuation["usd_value"]
        threhold = 0.7
        if credit_score["predictions"] == 2:
            threhold = 0.8
        elif credit_score["predictions"] == 0:
            threhold = 0.6
        max_loan_amount = collateral_value * threhold  # threhold% of collateral value

        if loan_valuation["usd_value"] > max_loan_amount:
            return {
                "status": "rejected",
                "reason": "Requested loan amount exceeds the maximum allowable loan amount.",
                "max_loan_amount_in_usd": max_loan_amount,
                "collateral_value_in_usd": collateral_value,
            }

        # Step 2: Find matching lender
        with open("data/lend_requests.json", "r") as file:
            lend_requests = json.load(file)

        print("Lend Requests: ", lend_requests)
        # Prioritize lenders with the same token
        matched_lender = next(
            (lender for lender in lend_requests
            if lender["loan_token"] == request.requested_loan_token and
                lender["loan_valuation_in_usd"] >= loan_valuation["usd_value"]),
            None
        )

        # If no exact token match is found, fallback to general match
        if not matched_lender:
            matched_lender = next(
                (lender for lender in lend_requests
                if lender["loan_valuation_in_usd"] >= loan_valuation["usd_value"]),
                None
            )

        if not matched_lender:
            return {"status": "rejected", "reason": "No matching lender found."}

        # Fetch lender's wallet
        lender_wallet = cdp.Wallet.fetch(matched_lender["wallet_id"])
        lender_wallet = fetch_seed(matched_lender["wallet_id"], lender_wallet)

        # Step 3: Handle token mismatch
        if matched_lender["loan_token"] != request.requested_loan_token:
            try:
                from_asset_id = matched_lender["loan_token"].lower()
                to_asset_id = request.requested_loan_token.lower()
                trade_response = lender_wallet.trade(
                    amount=request.requested_loan_amount,
                    from_asset_id=from_asset_id,
                    to_asset_id=to_asset_id
                )
                trade_response.wait()  # Wait for the trade to complete
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Token trade failed: {str(e)}")

        # Step 4: Deploy a smart contract
        try:
            borrower_wallet = cdp.Wallet.fetch(request.wallet_id)
            borrower_wallet = fetch_seed(request.wallet_id, borrower_wallet)
            faucet_response = borrower_wallet.faucet(asset_id="eth")
            faucet_response.wait()
            # 1USDC = 1000 LTT
            total_supply = int(request.requested_loan_amount * 1000)
            smart_contract = borrower_wallet.deploy_token(
                name="LoanTrackingToken",
                symbol="LTT",
                total_supply=total_supply
            )
            smart_contract.wait()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Smart contract deployment failed: {str(e)}")

        # Step 5: Transfer funds to borrower
        try:
            transfer_response = lender_wallet.transfer(
                amount=request.requested_loan_amount,
                asset_id=request.requested_loan_token.lower(),
                destination=borrower_wallet.default_address.address_id
            )
            transfer_response.wait()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fund transfer failed: {str(e)}")

        result =  {
            "status": "approved",
            "approved_loan_amount": request.requested_loan_amount,
            "approved_loan_token": request.requested_loan_token,
            "max_loan_amount_in_usd": max_loan_amount,
            "collateral_value_in_usd": collateral_value,
            "message": f"Loan approved. Funds transferred successfully.",
            "smart_contract_address": smart_contract.contract_address,
            "lender_wallet_id": lender_wallet.id,
            "borrower_wallet_id": borrower_wallet.id,
            "transaction_hash": transfer_response.transaction_hash,
            "transaction_link": transfer_response.transaction_link,
            "network_id": transfer_response.network_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "contract_abi": smart_contract.abi
        }
        save_request(result, file_path="data/approved_loans.json")
        return result
        

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing loan request: {str(e)}")


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

async def get_realworld_asset_valuation(
    asset: str = Query(..., description="The real-world asset to evaluate (e.g., Gold, Silver, Real Estate)")
):
    """
    Get the valuation of a pledged real-world asset.

    Args:
        asset (str): The asset being pledged (e.g., Gold, Silver, Real Estate).
        amount (float): The amount of the asset.

    Returns:
        dict: The valuation details, including asset, amount, and USD value.
    """
    try:
        # Fetch the valuation of the real-world asset
        # For simplicity, we assume the valuation is 1/10th of the amount
        if asset == "house":
            usd_value = 100000
        elif asset == "car":
            usd_value = 5000
        else:
            usd_value = 1000
        return {
            "asset": asset,
            "usd_value": usd_value,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating valuation: {str(e)}")


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


@router.get("/exchange-rate/{from_token}/{to_token}")
async def get_exchange_rate(
    from_token: str,
    to_token: str,
):
    """
    Calculate the exchange rate between two tokens using USD as a middleman.

    Args:
        from_token (str): The token you are converting from (e.g., ETH, USDC, DAI).
        to_token (str): The token you are converting to (e.g., ETH, USDC, DAI).

    Returns:
        dict: The exchange rate details, including from_token, to_token, and rate.

    Raises:
        HTTPException: If any error occurs while fetching the prices or calculating the rate.
    """
    try:
        if from_token == to_token:
            return {
                "from_token": from_token,
                "to_token": to_token,
                "rate": 1.0,
                "message": "Same token; exchange rate is 1.0",
            }

        # Fetch USD prices for both tokens
        from_pair = f"{from_token}/USD"
        to_pair = f"{to_token}/USD"

        from_price = get_token_price(from_pair)  # Price of from_token in USD
        to_price = get_token_price(to_pair)      # Price of to_token in USD

        # Calculate exchange rate using USD as the middleman
        exchange_rate = from_price / to_price

        return {
            "from_token": from_token,
            "to_token": to_token,
            "rate": exchange_rate,
            "message": f"Exchange rate calculated: 1 {from_token} = {exchange_rate:.6f} {to_token}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating exchange rate: {str(e)}")


@router.post("/loan/crypto/approve-reject")
async def loan_approve_reject(request: LoanRequest):
    """
    Approve or reject a loan request, handle token mismatch, deploy a smart contract,
    and transfer the loan amount to the borrower.

    Args:
        request (LoanRequest): Loan request details, including collateral amount and loan amount.

    Returns:
        dict: Approval status and details.
    """
    try:
        # Validate required fields
        if not request.wallet_id or not request.requested_loan_token or not request.collateral_token or not request.collateral_amount or not request.requested_loan_amount:
            raise HTTPException(status_code=400, detail="Missing required fields in the request.")

        # Step 1: Calculate collateral valuation
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

        if loan_valuation["usd_value"] > max_loan_amount:
            return {
                "status": "rejected",
                "reason": "Requested loan amount exceeds the maximum allowable loan amount.",
                "max_loan_amount_in_usd": max_loan_amount,
                "collateral_value_in_usd": collateral_value,
            }

        # Step 2: Find matching lender
        with open("data/lend_requests.json", "r") as file:
            lend_requests = json.load(file)

        print("Lend Requests: ", lend_requests)
        # Prioritize lenders with the same token
        matched_lender = next(
            (lender for lender in lend_requests
            if lender["loan_token"] == request.requested_loan_token and
                lender["loan_valuation_in_usd"] >= loan_valuation["usd_value"]),
            None
        )

        # If no exact token match is found, fallback to general match
        if not matched_lender:
            matched_lender = next(
                (lender for lender in lend_requests
                if lender["loan_valuation_in_usd"] >= loan_valuation["usd_value"]),
                None
            )

        if not matched_lender:
            return {"status": "rejected", "reason": "No matching lender found."}

        # Fetch lender's wallet
        lender_wallet = cdp.Wallet.fetch(matched_lender["wallet_id"])
        lender_wallet = fetch_seed(matched_lender["wallet_id"], lender_wallet)

        # Step 3: Handle token mismatch
        if matched_lender["loan_token"] != request.requested_loan_token:
            try:
                from_asset_id = matched_lender["loan_token"].lower()
                to_asset_id = request.requested_loan_token.lower()
                trade_response = lender_wallet.trade(
                    amount=request.requested_loan_amount,
                    from_asset_id=from_asset_id,
                    to_asset_id=to_asset_id
                )
                trade_response.wait()  # Wait for the trade to complete
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Token trade failed: {str(e)}")

        # Step 4: Deploy a smart contract
        try:
            borrower_wallet = cdp.Wallet.fetch(request.wallet_id)
            borrower_wallet = fetch_seed(request.wallet_id, borrower_wallet)
            faucet_response = borrower_wallet.faucet(asset_id="eth")
            faucet_response.wait()
            # 1USDC = 1000 LTT
            total_supply = int(request.requested_loan_amount * 1000)
            smart_contract = borrower_wallet.deploy_token(
                name="LoanTrackingToken",
                symbol="LTT",
                total_supply=total_supply
            )
            smart_contract.wait()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Smart contract deployment failed: {str(e)}")

        # Step 5: Transfer funds to borrower
        try:
            transfer_response = lender_wallet.transfer(
                amount=request.requested_loan_amount,
                asset_id=request.requested_loan_token.lower(),
                destination=borrower_wallet.default_address.address_id
            )
            transfer_response.wait()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fund transfer failed: {str(e)}")

        result =  {
            "status": "approved",
            "approved_loan_amount": request.requested_loan_amount,
            "approved_loan_token": request.requested_loan_token,
            "max_loan_amount_in_usd": max_loan_amount,
            "collateral_value_in_usd": collateral_value,
            "message": f"Loan approved. Funds transferred successfully.",
            "smart_contract_address": smart_contract.contract_address,
            "lender_wallet_id": lender_wallet.id,
            "borrower_wallet_id": borrower_wallet.id,
            "transaction_hash": transfer_response.transaction_hash,
            "transaction_link": transfer_response.transaction_link,
            "network_id": transfer_response.network_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "contract_abi": smart_contract.abi
        }
        save_request(result, file_path="data/approved_loans.json")
        return result
        

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing loan request: {str(e)}")


@router.post("/wallet/{wallet_id}/accept-reject-lend-request")
async def accept_reject_lend_request(wallet_id: str, request: LendRequest):
    """
    Endpoint to evaluate and approve/reject a loan request based on wallet valuation.

    Args:
        wallet_id (str): The ID of the lender's wallet.
        request (LendRequest): The loan request details including loan_amount and loan_token.

    Returns:
        dict: The result of the loan evaluation (accepted/rejected and reasons).
    """
    try:
        # Fetch the wallet details
        wallet = await get_wallet(wallet_id)

        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        # Calculate the wallet's total valuation in USD
        wallet_balance = wallet.get("balance", {})
        wallet_total_valuation = 0.0

        for token, amount in wallet_balance.items():
            token = token.upper()
            amount = float(amount)
            token_valuation = await get_crypto_valuation(token, amount)
            wallet_total_valuation += token_valuation['usd_value']

        # Calculate the max loan amount (50% of wallet valuation)
        max_loan_amount = wallet_total_valuation * 0.5

        # Get the valuation of the loan request
        loan_valuation = await get_crypto_valuation(
            request.loan_token,
            float(request.loan_amount)
        )
        
        loan_valuation = loan_valuation['usd_value']

        # Decision logic
        if loan_valuation > max_loan_amount:
            return {
                "status": "rejected",
                "reason": f"Lending amount exceeds maximum allowed. "
                          f"Maximum loan amount is ${max_loan_amount} (50% of wallet valuation: ${wallet_total_valuation})."
            }
        else:
            lend_request_data = {
                "wallet_id": wallet_id,
                "loan_amount": request.loan_amount,
                "loan_token": request.loan_token,
                "status": "approved",
                "loan_valuation_in_usd": loan_valuation,
                "lender_address": wallet.get("default_address", {}).get("address_id")
            }
            save_request(lend_request_data)
            return {
                "status": "accepted",
                "message": f"Lend request approved. Loan amount is ${loan_valuation}."
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing lend request: {str(e)}")


@router.post("/loan/repay")
async def loan_repay(
    request: LoanRepay
):
    """
    Handles loan repayment, including token swapping, updating the smart contract, and transferring funds to the lender.

    Args:
        loan_details (dict): Loan details including loan token, amount, and smart contract address.
        repayment_amount (float): Amount being repaid.
        repayment_token (str): Token used for repayment.

    Returns:
        dict: Confirmation and updated loan details.
    """
    loan_details = request.loan_details
    repayment_amount = request.repayment_amount
    repayment_token = request.repayment_token
    try:
        # Step 1: Validate inputs
        if not loan_details or repayment_amount <= 0 or not repayment_token:
            raise HTTPException(status_code=400, detail="Missing or invalid required fields.")

        loan_id = loan_details["smart_contract_address"]
        approved_loan_amount = Decimal(loan_details["approved_loan_amount"])
        approved_loan_token = loan_details["approved_loan_token"]
        borrower_wallet_id = loan_details["borrower_wallet_id"]
        lender_wallet_id = loan_details["lender_wallet_id"]

        if repayment_amount > approved_loan_amount:
            raise HTTPException(status_code=400, detail="Repayment amount exceeds the outstanding loan amount.")

        # Step 2: Fetch borrower and lender wallets
        borrower_wallet = cdp.Wallet.fetch(borrower_wallet_id)
        borrower_wallet = fetch_seed(borrower_wallet_id, borrower_wallet)

        lender_wallet = cdp.Wallet.fetch(lender_wallet_id)
        lender_wallet = fetch_seed(lender_wallet_id, lender_wallet)

        # Step 3: Handle token mismatch and swap if needed
        if repayment_token != approved_loan_token:
            try:
                trade_response = borrower_wallet.trade(
                    amount=repayment_amount,
                    from_asset_id=repayment_token.lower(),
                    to_asset_id=approved_loan_token.lower()
                )
                trade_response.wait()
                # Adjust repayment amount after swap
                repayment_amount = Decimal(trade_response.to_amount)
                repayment_token = approved_loan_token
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Token swap failed: {str(e)}")

        approved_loans = load_json_file("data/approved_loans.json")
        
        for loan in approved_loans:
            if loan["smart_contract_address"] == loan_id:
                contract_abi = loan.get("contract_abi")
                break
        # Step 4: Update the smart contract (optional step)
        try:
            contract = cdp.SmartContract.read(
                network_id=loan_details["network_id"],
                contract_address=loan_id,
                method="repayLoan",
                abi=contract_abi,
                args={
                    "amount": float(repayment_amount),  # Ensure correct precision
                    "token": repayment_token,
                }
            )
            contract.broadcast()
        except Exception as e:
            print(f"Optional smart contract update failed: {str(e)}")
            # Continue execution even if smart contract update fails

        # Step 5: Deposit repayment to the lender's wallet
        try:
            transfer_response = borrower_wallet.transfer(
                amount=float(repayment_amount),  # Convert to float for precision
                asset_id=repayment_token.lower(),
                destination=lender_wallet.default_address.address_id
            )
            transfer_response.wait()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fund transfer to lender failed: {str(e)}")

        # Step 6: Update loan details in the approved loans JSON file

        for loan in approved_loans:
            if loan["smart_contract_address"] == loan_id:
                loan["approved_loan_amount"] -= float(repayment_amount)
                if loan["approved_loan_amount"] <= 0:
                    loan["status"] = "fully repaid"
                break

        overwrite_request(approved_loans, file_path="data/approved_loans.json")
        # Return updated loan details
        return {
            "message": "Loan repayment processed successfully.",
            "updated_loan_details": loan
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing loan repayment: {str(e)}")


def load_json_file(file_path):
    """
    Load JSON data from a file.

    Args:
        file_path (str): The path to the JSON file to load.

    Returns:
        list: The loaded JSON data.

    Raises:
        FileNotFoundError: If the file does not exist.
        Exception: If any error occurs while loading the file.
    """
    try:
        with open(file_path, "r") as file:
            data = json.load(file)
        return data
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error loading JSON file: {str(e)}")


def overwrite_request(data, file_path):
    """
    Overwrite the contents of a JSON file with new data.

    Args:
        data (list): The new data to write to the file.
        file_path (str): The path to the JSON file to overwrite.

    Raises:
        Exception: If any error occurs while writing the file.
    """
    try:
        with open(file_path, "w") as file:
            json.dump(data, file, indent=4)
    except Exception as e:
        raise Exception(f"Error overwriting JSON file: {str(e)}")


def save_request(data, file_path="data/lend_requests.json"):
    try:
        if not os.path.exists("data"):
            os.makedirs("data")
        
        if os.path.exists(file_path):
            with open(file_path, "r") as file:
                existing_data = json.load(file)
        else:
            existing_data = []

        existing_data.append(data)

        with open(file_path, "w") as file:
            json.dump(existing_data, file, indent=4)
    except Exception as e:
        raise Exception(f"Error saving lend request: {str(e)}")
