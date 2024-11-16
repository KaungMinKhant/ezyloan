#  Project Background
Two persons - May (SME Business Owner) and April (Individual Lender with tangible proof of assets). 

May: She’s a small business owner with multiple assets, eager to expand her business. But her journey to secure a loan was far from easy. Traditional banks burdened her with endless paperwork and uncertainty. Crypto loans felt overwhelming due to her lack of expertise. Finally, she turned to informal lenders, exchanging assets for funds in a risky trust-based system. While she managed to get the loan, it came with unnecessary hardship & risks.

April: She's an individual lender with extra funds earning low interest in a savings account. While she sees potential in lending locally, she worrys about scams and defaults. 

**This kind of individual loan is popular in developing countries such as Myanmar.**

##  Problem
Both borrowers and lenders are stuck in an outdated, inefficient loan system.

##  Solution
Ezy Loan is revolutionizing lending: Peer-to-peer loan platform which provides seamless loans secured by crypto or tokenized real-world assets through blockchain.

Unlike the other platforms, our system directly benefits lenders with higher returns while giving flexibility the borrowers need.

#  Key Features 

- Real-world assets as collateral
- Flexible Token Swap 
- Unified valuation of collateral in both crypto and real-world assets
- Unique calculation on max available loans based on collateral and credit score
- Instant loan request and approval - quick and efficient process 
- Fair and Square interest benefits for lenders and borrowers
- Decentralized platform led by peers to peers 


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

---
### **1. Wallet Creation and Management**
- Users can create and manage blockchain wallets directly through the platform.
- Wallets support multiple tokens, including ETH, USDC, and DAI.
- Wallet details, balances, and borrowed loans are displayed in a simple dashboard.

### **2. Loan Application for Borrowers**
- Borrowers can apply for loans using either crypto assets or tokenized real-world assets as collateral.
- Crypto Assets: Borrowers can pledge cryptocurrencies such as ETH or USDT as collateral.
- Real-World Assets: Borrowers pledge real world assets as colletary and system tokenize it to NFT in order to represent in digital realm.
- Loans are tied to specific collateral, with smart contracts managing the collateral and loan terms.

### **3. Lending Requests for Lenders**
- Lenders can create lending requests specifying the token they wish to lend, interest rates, and loan terms.
- Borrowers are matched with lenders based on token compatibility and available loan amounts.
- Lenders can accept repayment in different tokens through the platform's exchange mechanism.

### **4.Loan Repayment for Borrowers**
- Borrowers can repay loans partially or fully.
- Repayments can be made in tokens other than the loan token, with exchange rates calculated automatically.
- Smart contracts update loan statuses, reduce the loan amount, and release collateral upon full repayment.

### **5. Smart Contract Integration**
- Loans, collateral management, and repayments are handled via secure smart contracts.
- Smart contracts ensure transparency and automate processes like repayment validation and collateral release.

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
