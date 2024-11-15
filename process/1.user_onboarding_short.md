#### **1. Sign-Up Process**
- **Essential Information**:
  - Users provide:
    - Name
    - Email
    - Phone number
  - Government-issued ID upload (optional for hackathon but showcase-ready).
- **Wallet Creation**:
  - Users create a **crypto wallet** using Coinbase API or connect an existing wallet (e.g., MetaMask).
- **Simplified KYC**:
  - Use **vlayer Email Proofs** to verify email ownership.
  - Basic identity validation for demonstration purposes.

#### **2. Wallet Creation**
- Users either:
  - **Create a Wallet**: Through Coinbase MPC wallets for security and usability.
  - **Connect an Existing Wallet**: Using a browser wallet like MetaMask (simpler for hackathon setup).

#### **3. Notifications**
- Users receive updates for:
  - Successful sign-up.
  - Wallet creation or connection.
  - KYC completion (if implemented).

---

### **Integrations**

#### **1. Coinbase: Simplified Wallet Creation**
- **Purpose**:
  - Provide an easy way for users to create wallets.
  - Secure wallet creation with minimal user friction.

- **Hackathon Setup**:
  - Showcase wallet creation using Coinbase’s API.
  - Optionally, skip fiat-to-crypto funding for simplicity.

- **Code Example**:
  ```python
  from coinbase.wallet.client import Client

  client = Client(api_key, api_secret)
  wallet = client.create_wallet(wallet_name="UserWallet")
  print("Wallet created:", wallet.id)
  ```

#### **2. Push Protocol: Notifications**
- **Purpose**:
  - Keep users engaged during onboarding.
  - Notify users of key milestones like wallet setup and KYC status.

- **Hackathon Setup**:
  - Focus on milestone notifications:
    - Successful wallet creation.
    - Sign-up completion.

- **Code Example**:
  ```javascript
  import { PushAPI } from '@push-protocol/sdk';

  async function sendNotification(userAddress, message) {
      await PushAPI.notifications.send({
          sender: 'YOUR_CHANNEL_ADDRESS',
          recipient: userAddress,
          title: 'Onboarding Update',
          body: message,
      });
  }

  sendNotification("0xUserAddress", "Your wallet setup is complete!");
  ```

#### **3. vlayer: Email Proofs**
- **Purpose**:
  - Securely validate user email ownership.
  - Simplify KYC by showcasing decentralized email verification.

- **Hackathon Setup**:
  - Use vlayer’s Email Proofs for quick and lightweight email verification.

- **Code Example**:
  ```javascript
  import { EmailProof } from "vlayer-sdk";

  const emailProof = new EmailProof();
  const proof = await emailProof.generateProof("user@example.com");
  const isValid = await emailProof.verifyProof(proof);
  if (isValid) {
      console.log("Email verified successfully");
  }
  ```

---

### **Simplified Credit Scoring for Hackathon**

- Replace full AI-based scoring with a **basic rule-based system**:
  - Use simple inputs like income range and wallet activity for demo purposes.
  - Example:
    - High activity wallet = Higher credit score.
    - Basic scoring logic can be hardcoded or derived from dummy data.

### **Simplified Workflow**
1. **Sign-Up**:
   - Users provide basic details and verify their email with **vlayer**.
2. **Wallet Setup**:
   - Users create or connect a wallet via **Coinbase** or MetaMask.
3. **Completion**:
   - Push Protocol sends notifications for successful onboarding.
