### **Summary of Technology Integrations**
| **Flow Step**             | **Tool/Technology**                                      | **Purpose**                                                      |
|---------------------------|---------------------------------------------------------|------------------------------------------------------------------|
| User Onboarding           | Coinbase, Push Protocol, vlayer, Credit Score           | Wallet creation, KYC, credit evaluation.                        |
| Borrower Requests Loan    | Chainlink, vlayer, 1inch Dev API, Push Protocol, Credit Score | Risk assessment, price feeds, loan evaluation.                  |
| Collateral Submission     | Kinto, Chainlink CCIP, vlayer, Push Protocol            | Secure deposits, cross-chain collateral management.             |
| Loan Approval & Disbursement | Chainlink CCIP, 1inch Fusion+, Push Protocol           | Cross-chain fund disbursement, borrower notifications.          |
| Loan Management           | 1inch Portfolio API, Chainlink Automation, Push Protocol | Loan tracking, automation, and updates.                        |
| Loan Repayment            | 1inch Fusion+, Chainlink Automation, Push Protocol      | Token swaps, repayment automation, collateral release.          |
| Collateral Liquidation    | Chainlink Price Feeds, 1inch Fusion+, Push Protocol     | Accurate valuation, cross-chain swaps, fund transfers.          |
| Communication Features    | Push Protocol Chat & Video                              | Messaging and video calls for negotiations.                     |
| Analytics and Reporting   | 1inch Portfolio API, Push Protocol                      | Portfolio insights, periodic summaries, credit updates.         |

---

### **Feature Prioritization**

| **Feature**                   | **Priority** | **Notes**                                    |
|-------------------------------|--------------|---------------------------------------------|
| **User Onboarding**            | High         | Essential for creating wallets and KYC.     |
| **Borrower Loan Request**      | High         | Core functionality for the demo.            |
| **Collateral Submission**      | High         | Show both crypto and tokenized asset flows. |
| **Loan Approval & Disbursement** | High         | End-to-end loan experience is key.          |
| **Loan Repayment**             | Medium       | Demonstrate token swap and repayment flow.  |
| **Collateral Liquidation**     | Medium       | Optional if time permits.                   |
| **Messaging/Video Calls**      | Low          | Can be skipped unless critical for pitch.   |
| **Analytics and Reporting**    | None         | Removed due to time constraints.            |

---

### **1. User Onboarding**
#### **Flow**:
- Users sign up and create wallets.
- KYC processes validate borrower and lender identities.

#### **Integrations**:
- **Coinbase**:
  - For MPC wallet creation and fiat-to-crypto funding.
- **Push Protocol**:
  - Notifications to confirm wallet creation and KYC completion.
- **vlayer**:
  - Use **Email Proofs** for verifying email domains as part of KYC.
- **Credit Score**:
  - AI assesses basic financial data to generate an initial credit score.

See detailed [User Onboarding](user_onboarding_short.md) process.

---

### **2. Borrower Requests Loan**
#### **Flow**:
- Borrowers fill in a loan request form specifying:
  - Loan amount.
  - Collateral type (crypto or tokenized real-world asset).
  - Loan duration.

#### **Integrations**:
- **Chainlink Price Feeds**:
  - Fetch real-time token prices for crypto collateral valuation.
- **vlayer Web Proofs**:
  - Verify off-chain data such as bank balances or income.
- **1inch Dev Portal APIs**:
  - Fetch borrower’s wallet transaction history for risk assessment.
- **Push Protocol**:
  - Notifications to inform borrowers of loan request status.
- **Credit Score**:
  - AI evaluates borrower reliability using on-chain and off-chain data.

See detailed [Borrower Requests Loan](borrower_requests_loan_short.md) process.

---

### **3. Collateral Submission**
#### **Flow**:
- Borrowers deposit collateral as:
  - **Crypto**: Transferred directly to a smart contract.
  - **Real-World Assets**: Tokenized as NFTs.

#### **Integrations**:
- **Kinto**:
  - For fast, cost-effective Layer 2 transactions for crypto collateral deposits.
- **vlayer**:
  - **Web Proofs**: Validate tokenized real-world assets (e.g., gold, electronics).
- **Chainlink CCIP**:
  - Facilitate cross-chain collateral deposits if the borrower operates on a different blockchain.
- **Push Protocol**:
  - Notify borrowers once collateral is submitted and verified.

See detailed [Collateral Submission](collateral_submission_short.md) process.

---

### **4. Loan Approval and Disbursement**
#### **Flow**:
- Once collateral is verified and the loan is approved, funds are disbursed to the borrower.

#### **Integrations**:
- **Chainlink CCIP**:
  - Enable cross-chain disbursements, transferring funds seamlessly across blockchains.
- **1inch Fusion+**:
  - Swap collateral into borrower’s preferred token for disbursement.
- **Push Protocol**:
  - Notify borrowers that the loan has been disbursed.

See detailed [Loan Approval and Disbursement](loan_approval_and_disbursement_short.md) process.

---

### **5. Loan Management**
#### **Flow**:
- Borrowers and lenders track:
  - Loan status.
  - Collateral value.
  - Interest accrued.
  - Repayment schedules.

#### **Integrations**:
- **1inch Portfolio API**:
  - Borrowers and lenders track their portfolio performance, including loan and collateral value.
- **Chainlink Automation (Keepers)**:
  - Automate loan status updates and send reminders for upcoming repayments.
- **Push Protocol**:
  - Notify users of loan progress (e.g., “Loan due in 3 days”).

See detailed [Loan Management](loan_management_short.md) process.

---

### **6. Loan Repayment**
#### **Flow**:
- Borrowers repay loans in installments or in full.
- Collateral is released upon full repayment.

#### **Integrations**:
- **1inch Fusion+**:
  - Allow borrowers to swap any token they hold into the repayment token.
- **Chainlink Automation (Keepers)**:
  - Automatically release collateral once the repayment is complete.
- **Push Protocol**:
  - Notify borrowers and lenders when a repayment is successful, and collateral is released.

See detailed [Loan Repayment](loan_repayment_short.md) process.

---

### **7. Collateral Liquidation (In Case of Default)**
#### **Flow**:
- If the borrower defaults, the system liquidates the collateral and transfers the proceeds to the lender.

#### **Integrations**:
- **Chainlink Price Feeds**:
  - Fetch real-time collateral value to ensure accurate liquidation pricing.
- **1inch Fusion+**:
  - Swap collateral into the lender’s preferred token.
- **Push Protocol**:
  - Notify borrowers of liquidation and lenders of fund transfer.

See detailed [Collateral Liquidation](collateral_liquidation.md) process.

---

### **8. Communication Features**
#### **Flow**:
- Borrowers and lenders communicate to negotiate terms or resolve disputes.

#### **Integrations**:
- **Push Protocol Chat**:
  - Enable direct messaging between borrowers and lenders.
- **Push Protocol Video**:
  - Facilitate video calls for negotiations or conflict resolution.

See detailed [Communication Features](communication_features.md) process.
