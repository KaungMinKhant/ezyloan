### **Developer 1: Backend & Frontend**
**Focus**: Backend smart contracts and APIs, user-facing frontend for onboarding and loan requests.

---

#### **Day 1: 15 Nov, 23:00 – 16 Nov, 09:00**

1. **Environment Setup (23:00 – 01:00)**:
   - Set up FastAPI backend and blockchain testnet connections.
   - Create Svelte frontend boilerplate with basic routing.
   - Initialize smart contract templates for loan and collateral management.

2. **User Onboarding (01:00 – 06:00)**:
   - Backend:
     - Implement wallet creation using **Coinbase API**.
     - Integrate **vlayer** for email verification.
     - Set up basic credit score logic (mocked for demo).
   - Frontend:
     - Build UI for wallet creation, KYC form, and notifications (Push Protocol).
     - Connect frontend forms to backend APIs.

3. **Loan Request Logic (06:00 – 09:00)**:
   - Backend:
     - Develop loan request API: amount, duration, and collateral type.
     - Integrate **Chainlink Price Feeds** for crypto collateral valuation.
   - Frontend:
     - Design loan request form.
     - Connect collateral submission logic to backend.

---

#### **Day 2: 16 Nov, 09:00 – 23:00**

4. **Loan Approval and Disbursement (09:00 – 16:00)**:
   - Backend:
     - Implement loan approval API based on collateral and credit score.
     - Integrate **Chainlink CCIP** for cross-chain disbursement.
   - Frontend:
     - Build loan approval status page.
     - Add fund disbursement progress tracking UI.

5. **Loan Management Dashboard (16:00 – 23:00)**:
   - Backend:
     - Integrate **1inch Portfolio API** for real-time collateral tracking.
     - Implement **Chainlink Keepers** for repayment reminders.
   - Frontend:
     - Build dashboard showing:
       - Loan status, collateral value, and repayment schedules.

---

#### **Day 3: 17 Nov, 00:00 – 09:00**

6. **Repayment Flow (00:00 – 04:00)**:
   - Backend:
     - Develop repayment logic: installment/full repayment.
     - Automate collateral release using **Chainlink Keepers**.
   - Frontend:
     - Create repayment page:
       - Show repayment options and history.

7. **Final Testing and Submission (04:00 – 09:00)**:
   - Test end-to-end flows: onboarding → loan request → disbursement → repayment.
   - Debug and polish frontend for demo readiness.
   - Record demo and finalize submission.

---

### **Developer 2: Backend & Frontend**
**Focus**: Backend smart contracts and APIs, user-facing frontend for disbursement and repayment.

---

#### **Day 1: 15 Nov, 23:00 – 16 Nov, 09:00**

1. **Environment Setup (23:00 – 01:00)**:
   - Set up FastAPI backend and blockchain testnet connections.
   - Initialize 1inch and Chainlink integrations for APIs.
   - Create Svelte boilerplate for loan and collateral flows.

2. **Collateral Submission (01:00 – 06:00)**:
   - Backend:
     - Implement collateral submission API.
     - Integrate **vlayer Web Proofs** for real-world asset tokenization.
   - Frontend:
     - Build collateral submission form and connect it to the backend.
     - Add crypto collateral valuation UI using **Chainlink Price Feeds**.

3. **Loan Request Flow (06:00 – 09:00)**:
   - Backend:
     - Finalize loan request API with validations for collateral and credit score.
   - Frontend:
     - Integrate loan request form with backend APIs.

---

#### **Day 2: 16 Nov, 09:00 – 23:00**

4. **Loan Disbursement Flow (09:00 – 16:00)**:
   - Backend:
     - Implement **1inch Fusion+** for token swaps during disbursement.
   - Frontend:
     - Build disbursement UI:
       - Show token swap details and fund receipt status.

5. **Loan Management Dashboard (16:00 – 23:00)**:
   - Backend:
     - Automate loan status updates using **Chainlink Keepers**.
   - Frontend:
     - Add real-time collateral value and loan status tracking.

---

#### **Day 3: 17 Nov, 00:00 – 09:00**

6. **Repayment Flow (00:00 – 04:00)**:
   - Backend:
     - Implement token swaps for repayment using **1inch Fusion+**.
   - Frontend:
     - Build repayment page showing repayment schedules and status.

7. **Final Testing and Submission (04:00 – 09:00)**:
   - Test all features and integrate frontend with backend.
   - Ensure seamless user flow for demo recording and submission.

---

### **Work Allocation by Task**

| **Task**                        | **Developer 1**                                | **Developer 2**                               |
|----------------------------------|-----------------------------------------------|-----------------------------------------------|
| Environment Setup                | Backend tools, wallet setup                   | Blockchain APIs, frontend routing             |
| User Onboarding                  | Wallet creation, KYC backend                  | KYC UI, notifications                         |
| Loan Request                     | Loan API, collateral validation               | Loan request form, backend integration        |
| Collateral Submission            | Real-world asset tokenization backend         | Crypto valuation UI, collateral form          |
| Loan Approval & Disbursement     | Loan API, disbursement backend                | Disbursement UI, token swap integration       |
| Loan Management                  | Portfolio tracking, repayment reminders       | Dashboard UI, real-time updates               |
| Repayment Flow                   | Repayment API, collateral release             | Repayment UI, backend integration             |
| Final Testing and Submission     | End-to-end testing and debugging              | Demo recording and frontend polish            |

---

### **Key Milestones**

| **Time**       | **Milestone**                                   |
|-----------------|------------------------------------------------|
| **16 Nov, 06:00** | Onboarding, loan request, and collateral submission complete. |
| **16 Nov, 16:00** | Loan approval and disbursement functional.    |
| **16 Nov, 23:00** | Loan management dashboard operational.       |
| **17 Nov, 04:00** | Repayment process fully integrated.          |
| **17 Nov, 09:00** | Fully tested and submitted project.          |
