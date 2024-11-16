#  Project Background

##  Problem

##  Solution

#  Key Features 

#  The Process 
### **Summary of Technology Integrations**

| **Flow Step**             | **Tool/Technology**                                      | **Purpose**                                                      |
|---------------------------|---------------------------------------------------------|------------------------------------------------------------------|
| **User Onboarding**       | Coinbase, Push Protocol, vlayer                         | Wallet creation, KYC, and onboarding notifications.              |
| **Borrower Requests Loan**| Chainlink Price Feeds, vlayer, Push Protocol            | Loan request processing, crypto valuation, and notifications.    |
| **Collateral Submission** | Kinto, vlayer Web Proofs, Chainlink CCIP, Push Protocol | Secure collateral deposits, NFT tokenization, cross-chain collateral management, and updates. |
| **Loan Approval & Disbursement** | Chainlink CCIP, 1inch Fusion+, Push Protocol           | Cross-chain loan disbursement, token swaps, and borrower notifications. |
| **Loan Management**       | Chainlink Automation, 1inch Portfolio API, Push Protocol| Loan tracking, automation of reminders, and updates.             |
| **Loan Repayment**        | 1inch Fusion+, Chainlink Automation, Push Protocol      | Token swaps for repayments, automation of collateral release, and repayment updates. |

### **Feature Prioritization**

| **Feature**                   | **Priority** | **Notes**                                    |
|-------------------------------|--------------|---------------------------------------------|
| **User Onboarding**            | High         | Essential for creating wallets and KYC.     |
| **Borrower Loan Request**      | High         | Core functionality for the demo.            |
| **Collateral Submission**      | High         | Show both crypto and tokenized asset flows. |
| **Loan Approval & Disbursement** | High         | End-to-end loan experience is key.          |
| **Loan Management**             | Medium       | Manage and track the loan status.  |
| **Loan Repayment**             | Medium       | Demonstrate token swap and repayment flow.  |

---

### **1. User Onboarding**

#### **Flow**:
- Users sign up by providing basic details such as name, email, and phone number.
- Wallets are created using Coinbase MPC or connected via MetaMask.
- Simplified KYC is conducted using email verification and identity checks.
- Users receive notifications for milestone events like wallet creation and KYC completion.

#### **Integrations**:
- **Coinbase**:
  - Enables secure wallet creation with MPC technology.
- **Push Protocol**:
  - Sends notifications to confirm wallet creation and KYC status.
- **vlayer**:
  - Uses **Email Proofs** for verifying email ownership during the KYC process.
- **Credit Scoring**:
  - Simplified scoring evaluates user financial data like income and wallet activity to generate an initial credit score.

See detailed [User Onboarding](1.user_onboarding_short.md) process.

---

### **2. Borrower Requests Loan**

#### **Flow**:
- Borrowers access the loan request form and provide:
  - Loan amount, personal information, monthly income and expenses, and purpose of the loan.
- Borrowers select a collateral type:
  - **Crypto Collateral**: Digital assets like ETH or USDT.
  - **Real-World Assets**: Items like gold, electronics, or vehicles, which are tokenized into NFTs.
- Loan details, including duration and collateral, are submitted for processing.
- The platform calculates the Loan-to-Value (LTV) ratio and evaluates borrower creditworthiness.

#### **Integrations**:
- **Chainlink Price Feeds**:
  - Provides real-time pricing for crypto assets to determine collateral value.
- **vlayer**:
  - Uses **Web Proofs** for verifying and tokenizing real-world asset ownership into NFTs.
- **Push Protocol**:
  - Sends notifications to borrowers for status updates, such as "Loan request submitted" or "Loan approved."
- **Credit Scoring**:
  - Assesses borrower eligibility based on financial and collateral data.

See detailed [Borrower Requests Loan](2.borrower_requests_loan_short.md) process.

---

### **3. Collateral Submission**

#### **Flow**:
- Borrowers select their collateral type:
  - **Crypto Collateral**: Deposited directly into a secure smart contract.
  - **Real-World Assets**: Descriptions and proof of ownership are submitted for verification and tokenization.
- Real-world assets are tokenized into NFTs to represent ownership and value.
- Cross-chain compatibility is ensured if collateral is pledged on one chain and the loan is issued on another.
- Borrowers are notified of the collateral submission and verification status.

#### **Integrations**:
- **Kinto**:
  - Manages crypto collateral deposits efficiently on a Layer 2 network.
- **vlayer**:
  - Uses **Web Proofs** to verify real-world assets and tokenize them into NFTs.
- **Chainlink Price Feeds**:
  - Fetches real-time valuations for crypto collateral to ensure accuracy.
- **Chainlink CCIP**:
  - Handles cross-chain collateral transfers seamlessly.
- **Push Protocol**:
  - Sends updates to borrowers, such as "Collateral submitted successfully" and "Real-world asset verified."

See detailed [Collateral Submission](3.collateral_submission_short.md) process.

---

### **4. Loan Approval & Disbursement**

#### **Flow**:
- Collateral is verified to ensure it meets platform requirements.
- The Loan-to-Value (LTV) ratio is calculated, and borrower creditworthiness is assessed.
- Approved loans are disbursed to the borrower in their preferred token and blockchain.
  - **Token Swap**: Converts lender-provided tokens to borrower-preferred tokens.
  - **Cross-Chain Transfer**: Transfers funds to the borrower’s specified blockchain.
- Borrowers receive notifications about loan approval, token swaps, and disbursement completion.

#### **Integrations**:
- **Chainlink CCIP**:
  - Enables seamless cross-chain transfers for loan disbursement.
- **1inch Fusion+**:
  - Handles token swaps to ensure borrowers receive their preferred repayment token.
- **Push Protocol**:
  - Sends notifications to borrowers for loan approval, token swap status, and fund disbursement.

See detailed [Loan Approval and Disbursement](4.loan_approval_and_disbursement_short.md) process.

---

### **5. Loan Management**

#### **Flow**:
- Borrowers and lenders track:
  - Loan status: Active, Repaid, or Defaulted.
  - Loan balance and remaining repayment amount.
  - Due dates for upcoming payments.
- Real-time updates on collateral value are provided for both crypto and tokenized real-world assets.
- Alerts are triggered if collateral value drops below the Loan-to-Value (LTV) threshold.
- Interest accrues dynamically based on loan terms and repayment schedules.
- Automated reminders for repayment deadlines are sent to borrowers.

#### **Integrations**:
- **1inch Portfolio API**:
  - Borrowers and lenders track their portfolio performance, including loan and collateral value.
- **Chainlink Automation (Keepers)**:
  - Automate loan status updates and send reminders for upcoming repayments.
- **Push Protocol**:
  - Notify users of loan progress (e.g., “Loan due in 3 days”).

See detailed [Loan Management](5.loan_management_short.md) process.

---

### **6. Loan Repayment**

#### **Flow**:
- Borrowers can choose between:
  - **Installments**: Partial repayment according to the loan schedule.
  - **Full Repayment**: Pay off the loan early to recover collateral quickly.
- Borrowers can repay using any token they hold, with token swaps facilitated automatically if necessary.
- Upon full repayment, the system releases the borrower’s collateral:
  - Crypto collateral is returned to the borrower’s wallet.
  - Tokenized real-world assets are transferred back to the borrower.
- Notifications keep borrowers and lenders updated on repayment and collateral release statuses.

#### **Integrations**:
- **1inch Fusion+**:
  - Enables borrowers to swap their held tokens into the required repayment token seamlessly.
- **Chainlink Automation (Keepers)**:
  - Automates collateral release when loans are fully repaid, ensuring efficiency and transparency.
- **Push Protocol**:
  - Sends notifications for successful repayments, collateral release, and lender crediting.

See detailed [Loan Repayment](6.loan_repayment_short.md) process.

#  How to get started

### To run the backend;
- in root directory, run `docker-compose up -d`

### To access db;
- in root directory, run `docker-compose exec db psql -U ezy_loan`

### To run the frontend;
- in /frontend directory, run `yarn`
- then run `yarn dev`

### To serve the frontend;
- in /frontend directory, run `yarn serve`

# Team Members
- Yamin Thazin Oo (Product Manager)
- Kaung Min Khant (Fullstack Developer)
- Khin Khant Khant Hlaing (Fullstack Developer)
