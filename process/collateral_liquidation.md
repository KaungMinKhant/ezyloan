### **Flow**:
1. **Default Detection**:
   - The system detects a default when:
     - Borrower fails to meet repayment deadlines.
     - Collateral value drops below a predefined Loan-to-Value (LTV) threshold without additional collateral being provided.

2. **Collateral Liquidation**:
   - The system initiates the liquidation process to recover the loaned amount.
   - Collateral is converted into the lender’s preferred token through a token swap.

3. **Fund Transfer**:
   - Liquidated collateral (or proceeds) is transferred to the lender’s wallet.

4. **Notifications**:
   - Borrowers are notified of the liquidation event and its details.
   - Lenders are notified of fund transfers.

---

### **Integrations**

#### **1. Chainlink Price Feeds: Real-Time Collateral Valuation**
- **Purpose**:
  - Fetch the real-time value of crypto collateral during liquidation to ensure fair and accurate pricing.

- **How It Works**:
  - Chainlink Price Feeds provide decentralized, tamper-proof price data for the collateral token.
  - The system uses this data to calculate the liquidation amount based on the current market value.

- **Implementation**:
  - Example of fetching real-time price data:
    ```solidity
    import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

    function getCollateralValue(address priceFeedAddress, uint256 collateralAmount)
        public
        view
        returns (uint256)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int price, , , ) = priceFeed.latestRoundData();
        return collateralAmount * uint256(price) / 1e8; // Adjust for decimals
    }
    ```

- **Use Case**:
  - Borrower’s collateral is 1 ETH, and the current ETH price is $1,800. The liquidation value of the collateral is calculated as $1,800.

---

#### **2. 1inch Fusion+: Token Swaps for Liquidation**
- **Purpose**:
  - Convert the liquidated collateral into the lender’s preferred token before transferring funds.

- **How It Works**:
  - The system uses 1inch Fusion+ to swap the collateral token into the lender’s desired token, ensuring compatibility with their portfolio.

- **Implementation**:
  - Example of swapping collateral during liquidation:
    ```javascript
    import { initiateFusionSwap } from "1inch-fusion";

    async function liquidateCollateral(collateralToken, preferredToken, amount) {
        const swapResult = await initiateFusionSwap({
            fromToken: collateralToken,
            toToken: preferredToken,
            fromChain: "Ethereum",
            toChain: "Ethereum",
            amount: amount,
        });
        console.log("Liquidation Swap Successful:", swapResult);
        transferToLender(swapResult.toToken, swapResult.amount);
    }

    liquidateCollateral("ETH", "USDT", 1.0); // Liquidate 1 ETH into USDT
    ```

- **Use Case**:
  - A borrower defaults, and their ETH collateral is liquidated into USDT for the lender.

---

#### **3. Push Protocol: Notifications for Borrowers and Lenders**
- **Purpose**:
  - Notify borrowers about the liquidation of their collateral.
  - Notify lenders about the fund transfer after liquidation.

- **How It Works**:
  - Push Protocol sends real-time notifications for key events, such as:
    - Collateral liquidation initiation.
    - Completion of liquidation and fund transfer to the lender.

- **Implementation**:
  - Example of sending liquidation notifications:
    ```javascript
    import { PushAPI } from '@push-protocol/sdk';

    async function notifyLiquidation(userAddress, message) {
        await PushAPI.notifications.send({
            sender: 'YOUR_CHANNEL_ADDRESS',
            recipient: userAddress,
            title: 'Collateral Liquidation',
            body: message,
        });
    }

    // Notify borrower
    notifyLiquidation(
        "0xBorrowerAddress",
        "Your ETH collateral has been liquidated due to loan default. Contact support for more details."
    );

    // Notify lender
    notifyLiquidation(
        "0xLenderAddress",
        "Funds from the liquidation of the borrower’s collateral have been transferred to your wallet."
    );
    ```

- **Use Case**:
  - Borrower receives a notification: “Your 1 ETH collateral has been liquidated for $1,800 due to a default.”
  - Lender receives a notification: “You’ve received $1,800 in USDT from collateral liquidation.”

---

### **Detailed Workflow**

1. **Default Detection**:
   - Chainlink Automation (Keepers) monitors loan contracts for:
     - Missed repayment deadlines.
     - Collateral value dropping below the safe LTV threshold.
   - If a default is detected, the system triggers liquidation.

2. **Real-Time Collateral Valuation**:
   - The platform uses **Chainlink Price Feeds** to fetch the current market value of the collateral.
   - Liquidation proceeds are calculated based on this value.

3. **Token Swap (If Needed)**:
   - Collateral is swapped into the lender’s preferred token using **1inch Fusion+**.
   - This ensures that lenders receive funds in a token compatible with their portfolio.

4. **Fund Transfer**:
   - The liquidated proceeds are transferred to the lender’s wallet.
   - The borrower is informed about the liquidation and its cause.

5. **Notifications**:
   - Borrowers are notified about the liquidation event and any remaining obligations.
   - Lenders are informed when the funds are credited to their wallets.

---

### **Benefits of This Flow**

1. **Accurate Valuation**:
   - Chainlink Price Feeds ensure collateral is liquidated at the fair market value, protecting lenders and borrowers from mispricing.

2. **Seamless Token Conversion**:
   - 1inch Fusion+ simplifies the conversion of collateral into the lender’s desired token, ensuring efficient fund transfer.

3. **Automation**:
   - Chainlink Automation minimizes delays and errors in detecting defaults and initiating liquidation.

4. **Real-Time Notifications**:
   - Push Protocol keeps borrowers and lenders informed, ensuring transparency throughout the process.

5. **Risk Mitigation**:
   - Lenders are protected from potential losses through timely liquidation, while borrowers are kept aware of the system’s actions.

---

### **Example Scenario**

1. Borrower pledges 1 ETH as collateral for a $1,500 loan but fails to repay by the due date.
2. **System Actions**:
   - Detects default using Chainlink Automation.
   - Fetches ETH’s real-time price ($1,800) using Chainlink Price Feeds.
   - Liquidates the 1 ETH collateral and swaps it into USDT via 1inch Fusion+.
   - Transfers $1,800 USDT to the lender.
3. **Notifications**:
   - Borrower: “Your ETH collateral has been liquidated for $1,800 due to a loan default.”
   - Lender: “You have received $1,800 in USDT from collateral liquidation.”
