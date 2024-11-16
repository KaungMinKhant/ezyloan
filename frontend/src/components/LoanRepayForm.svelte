<script>
    import { onMount } from "svelte";
    import { urlRoot } from "../constants";

    export let wallet_address = "";
    export let loan_details = {};

    let repaymentType = "full"; // Default to full repayment
    let selectedToken = loan_details.approved_loan_token; // Default token is the loan token
    let repaymentAmount = 0; // For partial repayments
    let exchangeRate = 1; // Default exchange rate is 1 (same token)
    let calculatedAmount = 0; // The equivalent repayment amount in the selected token
    let tokens = ["ETH", "USDC", "DAI"]; // Available tokens for repayment
    let isLoadingRate = false; // To indicate if exchange rate is being fetched
    let isSubmitDisabled = false; // Disable submission while fetching exchange rate
    let errorMessage = ""; // Error message for invalid input

    onMount(() => {
        // Initialize with the approved loan token
        if (!tokens.includes(selectedToken)) {
            tokens.push(selectedToken);
        }
        calculateRepayment();
    });

    async function fetchExchangeRate(fromToken, toToken) {
        try {
            isLoadingRate = true;
            isSubmitDisabled = true;
            const response = await fetch(`${urlRoot}/api/v1/exchange-rate/${fromToken}/${toToken}`);
            if (response.ok) {
                const data = await response.json();
                return data.rate; // Assume the API returns { rate: <exchange rate> }
            } else {
                console.error("Failed to fetch exchange rate");
                return 1; // Default to 1 if the API fails
            }
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            return 1; // Default to 1 in case of an error
        } finally {
            isLoadingRate = false;
            isSubmitDisabled = false;
        }
    }

    async function calculateRepayment() {
        errorMessage = ""; // Reset error message
        if (selectedToken !== loan_details.approved_loan_token) {
            exchangeRate = await fetchExchangeRate(selectedToken, loan_details.approved_loan_token);
        } else {
            exchangeRate = 1;
        }

        if (repaymentType === "full") {
            calculatedAmount = loan_details.approved_loan_amount / exchangeRate;
        } else {
            calculatedAmount = repaymentAmount * exchangeRate;

            // Check if the inputted amount exceeds the approved loan amount
            if (calculatedAmount > loan_details.approved_loan_amount) {
                errorMessage = `The repayment amount exceeds the approved loan amount of ${loan_details.approved_loan_amount} ${loan_details.approved_loan_token}.`;
                isSubmitDisabled = true;
            } else {
                isSubmitDisabled = false;
            }
        }
    }

    async function handleSubmit() {
        if (!wallet_address || !selectedToken) {
            alert("Please provide all required details.");
            return;
        }

        const confirmation = confirm(
            `You are about to repay ${
                repaymentType === "full"
                    ? `${loan_details.approved_loan_amount} ${loan_details.approved_loan_token}`
                    : `${repaymentAmount} ${selectedToken}`
            }. Proceed?`
        );

        if (!confirmation) return;

        try {
            const response = await fetch(`${urlRoot}/api/v1/loan/repay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    loan_details: loan_details,
                    repayment_amount: repaymentAmount,
                    repayment_token: selectedToken,
                }),
            });
            // check if updated_loan_details is returned
            alert("Repayment successful! Please reload the page to view the updated loan details.");
        } catch (error) {
            console.error("Error during repayment:", error);
            alert("An error occurred during repayment.");
        }
    }
</script>

<section class="repay-form">
    <h2>Repay Loan</h2>
    <p><strong>Loan Amount:</strong> {loan_details.approved_loan_amount} {loan_details.approved_loan_token}</p>
    <p><strong>Borrower's Wallet:</strong> {wallet_address}</p>

    <form on:submit|preventDefault={handleSubmit}>
        <label>
            Repayment Type:
            <select bind:value={repaymentType} on:change={calculateRepayment}>
                <option value="full">Full</option>
                <option value="partial">Partial</option>
            </select>
        </label>

        {#if repaymentType === "partial"}
            <label>
                Partial Amount:
                <input
                    type="number"
                    bind:value={repaymentAmount}
                    placeholder="Enter partial amount"
                    min="0.0001"
                    step="0.0001"
                    on:input={calculateRepayment}
                    required
                />
            </label>
        {/if}

        <label>
            Repayment Token:
            <select bind:value={selectedToken} on:change={calculateRepayment}>
                {#each tokens as token}
                    <option value={token}>{token}</option>
                {/each}
            </select>
        </label>

        <p>
            {#if isLoadingRate}
                <strong>Fetching exchange rate...</strong>
            {:else if errorMessage}
                <strong class="error">{errorMessage}</strong>
            {:else}
                <strong>
                    {repaymentType === "full"
                        ? `Amount to repay in ${selectedToken}:`
                        : `Equivalent repayment in ${loan_details.approved_loan_token}:`}
                </strong>{" "}
                {calculatedAmount.toFixed(6)}
            {/if}
        </p>

        <button type="submit" class="btn btn-primary" disabled={isSubmitDisabled || isLoadingRate}>
            Submit Repayment
        </button>
    </form>
</section>

<style>
    .repay-form {
        max-width: 600px;
        margin: auto;
        padding: 20px;
        text-align: left;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    form {
        margin-top: 20px;
    }

    label {
        display: block;
        margin-bottom: 15px;
    }

    input,
    select {
        width: 100%;
        padding: 10px;
        margin-top: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
    }

    .btn {
        margin-top: 20px;
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        font-size: 1rem;
        cursor: pointer;
    }

    .btn-primary {
        background-color: #000;
        color: white;
    }

    .btn-primary:disabled {
        background-color: #999;
        cursor: not-allowed;
    }

    .btn-primary:hover {
        background-color: #333;
    }

    .error {
        color: red;
        font-weight: bold;
    }
</style>
