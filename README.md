#  Project Background

Have you ever faced—or heard of—challenges in getting a loan, whether from a bank or a crypto exchange? For many, this is a frustrating reality.

Two persons - May (SME Business Owner) and April (Individual Lender with tangible proof of assets). 

May: She’s a small business owner with multiple assets, eager to expand her business. But her journey to secure a loan was far from easy. Traditional banks burdened her with endless paperwork and uncertainty. Crypto loans felt overwhelming due to her lack of expertise. Finally, she turned to informal lenders, exchanging assets for funds in a risky trust-based system. While she managed to get the loan, it came with unnecessary hardship & risks.

April: She's an individual lender with extra funds earning low interest in a savings account. While she sees potential in lending locally, she worrys about scams and defaults. 

**This kind of individual loan is popular in developing countries such as Myanmar.**

# A Little Bit About Us
### Our Mission 🚀
To simplify and democratize the lending process, making it accessible and efficient for everyone.

### Our Vision 🌍
A world where financial barriers are broken down, and everyone has equal access to financial opportunities.

### Our Values 💡
- **Innovation**: Continuously pushing the boundaries of what's possible.
- **Transparency**: Building trust through openness and honesty.
- **Empowerment**: Enabling individuals to take control of their financial future.
- **Community**: Fostering a supportive and inclusive environment.

### Our Team 🌟
We are three passionate individuals from Myanmar, where we've seen firsthand the challenges of accessing loans. This is our first time participating in a web3 hackathon, and our first web3 project. We're excited to learn, grow, and make a positive impact through our work.

##  Problem
Both borrowers and lenders are stuck in an outdated, inefficient loan system.

##  Solution
Ezy Loan is revolutionizing lending: Peer-to-peer loan platform which provides seamless loans secured by crypto or tokenized real-world assets through blockchain.

Unlike the other platforms, our system directly benefits lenders with higher returns while giving flexibility the borrowers need.

#  Key Features 

1. **Wallet Management**  
   - Create and manage wallets using the **cdp-sdk**.  
   - Display wallet details, balances, and associated loan data.  

2. **Loan Application**  
   - Borrowers can apply for loans using real-world or crypto assets as collateral.  
   - Collateral valuation is calculated dynamically.  

3. **Loan Approval Process**  
   - Match borrowers with lenders based on token type and loan valuation.  
   - Support cross-token loan approvals by swapping tokens as needed.  

4. **Lending Requests**  
   - Lenders can create lending requests specifying loan tokens, amounts, and terms.  

5. **Smart Contract Deployment**  
   - Deploy ERC-20 smart contracts dynamically for loan tracking and repayment purposes.  

6. **Loan Repayment**  
   - Borrowers can repay loans in any token they choose.  
   - Real-time exchange rate calculation to handle cross-token repayments.  

7. **Cross-Token Flexibility**  
   - Repayment amounts dynamically adjusted using token-to-token exchange rates via USD as a bridge.  

8. **Loan Management Dashboard**  
   - View all active loans linked to a wallet.  
   - Details include loan status, amount, token, collateral value, and repayment history.  

9. **Real-Time Interaction with Blockchain**  
   - Handle token swaps, fund transfers, and smart contract interactions directly on the blockchain.  


#  The Process
## Project Summary

| **Feature/Component**       | **Technology Used**             | **Details**                                                                                                   |
|------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------|
| **Frontend**                | **Svelte**                      | Developed responsive UI for wallet management, loan applications, and repayment workflows.                   |
| **Backend**                 | **FastAPI**                     | Handled APIs for loan processing, wallet operations, and repayment workflows.                                |
| **Wallet Management**       | **cdp-sdk**                     | Created and managed wallets, including balances and token transactions.                                       |
| **Loan Application & Approval** | **FastAPI**, **Custom Logic**, **cdp-sdk**  | Allowed borrowers to apply for loans; matched loans with lenders based on token type and valuation.           |
| **Loan Repayment**          | **cdp-sdk**, **Custom API**      | Supported repayments in multiple tokens, with real-time exchange rate calculations for cross-token repayments.|
| **Smart Contracts**         | **ERC-20 Contracts via cdp-sdk**| Deployed and managed contracts dynamically to track loan balances and repayment status.                       |
| **Exchange Rate Calculation**| **Custom API through chainlink data feed**                  | Implemented token-to-token exchange rates using USD as a bridge for flexibility in repayment options.         |
| **Data Storage**            | **JSON Files**                  | Used for prototyping and testing, storing loan and wallet information temporarily.                           |
| **Dynamic Loan Matching**   | **Custom Matching Algorithm**   | Prioritized same-token matches with fallback for cross-token conversions.                                    |
| **Blockchain Interactions** | **cdp-sdk**                     | Enabled direct blockchain interactions, including trades, transfers, and token deployments.                  |


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

## How It’s Made

This project focuses on creating a decentralized peer to peer lending and borrowing platform with a clear emphasis on flexibility, transparency, and ease of use. Here's how the platform was built, reflecting only the components and technologies we actually implemented together:

---

### **Technologies Used**

1. **Frontend**
   - **Svelte**: Used for building a responsive and interactive user interface, including wallet management, loan application forms, and repayment workflows.
   - **Custom Styling**: Developed a clean and functional interface with lightweight custom CSS for a seamless user experience.

2. **Backend**
   - **FastAPI**: Served as the core backend framework for handling API requests, managing loan and repayment operations, and performing token-related logic.
   - **JSON Files**: Used as a lightweight, temporary data storage solution to prototype and test features like loan approvals and repayments.

3. **Blockchain Integrations**
   - **cdp-sdk**: The central library used for interacting with blockchain functionalities, including:
     - Wallet creation and management.
     - Token deployment and swapping.
     - Fund transfers between wallets.
   - **ERC-20 Smart Contracts**: Used to handle token-based transactions and ensure transparency for loan agreements and repayments.

4. **Exchange Rates**
   - **Custom API Implementation**: Built an exchange rate API that calculates the value of tokens using USD as a bridge, supporting flexible repayments in multiple tokens by leveraging **chainlink data feed**.

---

### **How Components Are Connected**

1. **Wallet Management**
   - Wallets are created using **cdp-sdk** and can also display balance information for tokens like ETH, USDC, and DAI.
   - Wallet data is dynamically fetched and displayed in a user-friendly dashboard.

2. **Loan Application and Approval**
   - Borrowers apply for loans by specifying the token type, collateral type, and amount.
   - Collateral and loan values are calculated based on custom exchange rate logic.
   - Lenders' offers are matched to borrowers based on token type and valuation using a custom algorithm.

3. **Loan Repayment**
   - Borrowers can repay loans flexibly in any supported token.
   - If the repayment token differs from the loan token, a swap is performed using **cdp-sdk**.
   - The smart contract is updated with repayment details, and the funds are transferred to the lender’s wallet.

4. **Smart Contracts**
   - Smart contracts (ERC-20) are deployed dynamically to manage loan terms.
   - Contracts track balances and ensure repayment updates are recorded on-chain for transparency.

---

### **Notable Hacks & Customizations**

1. **Dynamic Loan Matching**
   - Implemented a custom algorithm to prioritize matching based on the same token type, with fallback logic for cross-token conversions.

2. **Flexible Repayment Options**
   - Designed a repayment system that allows borrowers to pay in any supported token, using real-time exchange rates to calculate equivalent repayment amounts.

3. **Prototyping with JSON**
   - Prototyped key functionalities, like loan applications and repayments, using JSON files before scaling up with more complex integrations.

4. **Direct Blockchain Interactions**
   - Used **cdp-sdk** for essential blockchain operations, such as deploying tokens, executing trades, and transferring funds, without relying on third-party wallet providers or protocols.


# Slides
Team's presentation slides can be accessed through this [Ezy Loan Slides](https://docs.google.com/presentation/d/1C9sZ0NBmUS39uzxyK0Uam1W7iYt3JHzDwUwxw22mSk8/edit?usp=sharing)

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
- [Yamin Thazin Oo (Product Manager/UX Designer)](https://github.com/KaungMinKhant)
- [Kaung Min Khant (Fullstack Developer)](https://github.com/Yamin-TZO)
- [Khin Khant Khant Hlaing (Fullstack Developer)](https://github.com/khinkhantkhanthlaing)
