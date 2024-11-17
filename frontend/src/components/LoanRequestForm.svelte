<script>
    import { onMount } from "svelte";
    import { urlRoot } from "../constants.js";

    let step = 1;
    const totalSteps = 3;

    let wallets = [];
    let selectedWallet = "";

    let loanDetails = {
        amount: "",
        token: "",
        age: "",
        occupation: "",
        income: "",
        expense: "",
        incomeCurrency: "",
        expenseCurrency: "",
        purpose: "",
        collateralType: "",
        duration: "",
        realWorldDescription: "",
        realWorldPhoto: null,
        cryptoCollateralToken: "",
        cryptoCollateralAmount: "",
    };

    const tokens = ["ETH", "USDC", "DAI"];
    const fiatCurrencies = ["USD", "EUR", "THB"];
    const durations = ["3 months", "6 months", "12 months"];
    const realWorldCollateralOptions = ["house", "car", "laptop", "phone"];

    function handleNextStep() {
        if (step < totalSteps) step++;
    }

    function handlePreviousStep() {
        if (step > 1) step--;
    }

    function handlePhotoUpload(event) {
        loanDetails.realWorldPhoto = event.target.files[0];
    }

    async function handleSubmit() {
        if (loanDetails.collateralType === "crypto") {
            try {
                const response = await fetch(`${urlRoot}/api/v1/loan/crypto/approve-reject`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        wallet_id: selectedWallet,
                        collateral_token: loanDetails.cryptoCollateralToken,
                        collateral_amount: loanDetails.cryptoCollateralAmount,
                        requested_loan_amount: loanDetails.amount,
                        requested_loan_token: loanDetails.token
                    }),
                });
                // check if updated_loan_details is returned
                alert("Loan Has been approved. Funding has been deposited into your account. Please see in dashboard.");
            } catch (error) {
                console.error("Error during repayment:", error);
                alert("An error occurred during repayment.");
            }
        }
        else if (loanDetails.collateralType === "real-world") {
            try {
                const response = await fetch(`${urlRoot}/api/v1/wallet/${selectedWallet}/nft-approve-reject-loan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: loanDetails.realWorldDescription,
                        symbol: loanDetails.realWorldDescription + "NFT",
                        base_uri: "https://ipfs.io/ipfs/",
                        wallet_id: selectedWallet,
                        requested_loan_amount: loanDetails.amount,
                        requested_loan_token: loanDetails.token
                    }),
                });
                // check if updated_loan_details is returned
                alert("Loan Has been approved. Funding has been deposited into your account. Please see in dashboard.");
            } catch (error) {
                console.error("Error during repayment:", error);
                alert("An error occurred during repayment.");
            }
        }
        // TODO: Submit `loanDetails` to the backend API for NFT deployment or loan processing.
        const { age, amount, duration, occupation, token, income, expense, incomeCurrency, expenseCurrency,
            purpose, collateralType
         } = loanDetails;

        const payload = {
            amount: amount,
            token: token,
            age: age,
            occupation: occupation,
            monthly_income: income,
            income_currency: incomeCurrency,
            monthly_expense: expense,
            expene_currency: expenseCurrency,
            purpose_of_loan: purpose,
            collateral_type: collateralType,
            loan_duration: duration,
            };
        console.log('paylo', payload)

        try {
        const response = await fetch(`${urlRoot}/api/v1/loans/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to create loan.");
        }

        const data = await response.json();
        alert("Loan created successfully!");
        //fetchLoans(); // Refresh the loans list
        } catch (err) {
        //error = err.message;
        }
    }

    async function fetchWallets() {
        try {
            const response = await fetch(`${urlRoot}/api/v1/wallets`);
            if (response.ok) {
                wallets = await response.json();
                errorMessage = wallets.length
                    ? ""
                    : "No wallets found. Please create a wallet first.";
            } else {
                errorMessage = "Failed to fetch wallets. Please try again.";
            }
        } catch (error) {
            errorMessage = "Error fetching wallets. Check your connection.";
            console.error("Error fetching wallets:", error);
        }
    }

    onMount(() => {
        fetchWallets();
    });
</script>

<section class="loan-form-container">
    <!-- Progress Bar -->
    <div class="progress-bar">
        <div
            class="progress-bar-fill"
            style="width: {step / totalSteps * 100}%"
        ></div>
    </div>

    <h1>Loan Request Form</h1>
    <form>
        {#if step === 1}
        <div class="form-step">
            <h2>Step 1: Loan and Personal Details</h2>
            <label>
                Loan Amount:
                <input
                    type="number"
                    bind:value={loanDetails.amount}
                    placeholder="Enter loan amount"
                    required
                />
            </label>

            <label>
                Select Token:
                <select bind:value={loanDetails.token} required>
                    <option value="" disabled>Select a token</option>
                    {#each tokens as token}
                        <option value={token}>{token}</option>
                    {/each}
                </select>
            </label>

            <label>
                Age:
                <input
                    type="number"
                    bind:value={loanDetails.age}
                    placeholder="Enter your age"
                    required
                />
            </label>

            <label>
                Occupation:
                <input
                    type="text"
                    bind:value={loanDetails.occupation}
                    placeholder="Enter your occupation"
                    required
                />
            </label>
        </div>
        {/if}

        {#if step === 2}
        <div class="form-step">
            <h2>Step 2: Financial Details</h2>
            <label>
                Monthly Income:
                <input
                    type="number"
                    bind:value={loanDetails.income}
                    placeholder="Enter your income"
                    required
                />
            </label>

            <label>
                Income Currency:
                <select bind:value={loanDetails.incomeCurrency} required>
                    <option value="" disabled>Select a currency</option>
                    {#each fiatCurrencies as currency}
                        <option value={currency}>{currency}</option>
                    {/each}
                </select>
            </label>

            <label>
                Monthly Expense:
                <input
                    type="number"
                    bind:value={loanDetails.expense}
                    placeholder="Enter your expense"
                    required
                />
            </label>

            <label>
                Expense Currency:
                <select bind:value={loanDetails.expenseCurrency} required>
                    <option value="" disabled>Select a currency</option>
                    {#each fiatCurrencies as currency}
                        <option value={currency}>{currency}</option>
                    {/each}
                </select>
            </label>

            <label>
                Purpose of Loan:
                <textarea
                    bind:value={loanDetails.purpose}
                    placeholder="Why do you need this loan?"
                    required
                ></textarea>
            </label>
        </div>
        {/if}

        {#if step === 3}
        <div class="form-step">
            <h2>Step 3: Collateral Details</h2>
            <label>
                Collateral Type:
                <select bind:value={loanDetails.collateralType} required>
                    <option value="" disabled>Select a type</option>
                    <option value="crypto">Crypto</option>
                    <option value="real-world">Real-World Asset</option>
                </select>
            </label>

            {#if loanDetails.collateralType === "crypto"}
            <label>
                Select Token for Collateral:
                <select bind:value={loanDetails.cryptoCollateralToken} required>
                    <option value="" disabled>Select a token</option>
                    {#each tokens as token}
                        <option value={token}>{token}</option>
                    {/each}
                </select>
            </label>

            <label>
                Collateral Amount:
                <input
                    type="number"
                    bind:value={loanDetails.cryptoCollateralAmount}
                    placeholder="Enter amount to pledge"
                    required
                />
            </label>
            {/if}

            {#if loanDetails.collateralType === "real-world"}
            <label>
                Select Asset Type:
                <select bind:value={loanDetails.realWorldDescription} required>
                    <option value="" disabled>Select an asset</option>
                    {#each realWorldCollateralOptions as option}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            </label>

            <label>
                Upload Photo:
                <input
                    type="file"
                    accept="image/*"
                    on:change={handlePhotoUpload}
                    required
                />
            </label>
            {/if}

            <label>
                Loan Duration:
                <select bind:value={loanDetails.duration} required>
                    <option value="" disabled>Select duration</option>
                    {#each durations as duration}
                        <option value={duration}>{duration}</option>
                    {/each}
                </select>
            </label>

            <label>
                Select Wallet:
                <select bind:value={selectedWallet} required>
                    <option value="" disabled>Select a wallet</option>
                    {#each wallets as wallet}
                        <option value={wallet.id}>{wallet.id}</option>
                    {/each}
                </select>
            </label>
        </div>
        {/if}

        <div class="form-navigation">
            {#if step > 1}
                <button type="button" class="btn btn-secondary" on:click={handlePreviousStep}>Back</button>
            {/if}

            {#if step < totalSteps}
                <button type="button" class="btn btn-primary" on:click={handleNextStep}>Next</button>
            {:else}
                <button type="button" class="btn btn-primary" on:click={handleSubmit}>Submit</button>
            {/if}
        </div>
    </form>
</section>

<style>
    .loan-form-container {
        max-width: 800px;
        margin: auto;
        padding: 20px;
        text-align: left;
        border-radius: 8px;
        background-color: #FFFFFF;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
        height: 10px;
        background-color: #FCE74A;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 20px;
    }

    .progress-bar-fill {
        height: 100%;
        background-color: #000000;
        width: 0;
        transition: width 0.3s ease-in-out;
    }

    h1, h2 {
        color: #000000;
    }

    label {
        display: block;
        margin-bottom: 15px;
    }

    input, select, textarea {
        width: 100%;
        padding: 10px;
        margin-top: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
    }

    .form-navigation {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
    }

    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        color: #FFFFFF;
    }

    .btn-primary {
        background-color: #000000;
    }

    .btn-secondary {
        background-color: #FCE74A;
        color: #000000;
    }

    .btn:hover {
        opacity: 0.9;
    }
</style>
