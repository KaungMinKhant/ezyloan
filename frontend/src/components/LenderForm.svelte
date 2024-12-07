<script>
    import { onMount } from "svelte";
    import { urlRoot } from "../constants.js";

    let wallets = [];
    let selectedWallet = "";
    let loanDetails = {
        amount: "",
        token: "",
    };
    let isLoading = true;
    let errorMessage = "";
    let resultMessage = ""; // To display the result from the API

    const tokens = ["ETH", "USDC", "DAI"];

    // Fetch wallets from the backend
    async function fetchWallets() {
        try {
            isLoading = true;
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
        } finally {
            isLoading = false;
        }
    }

    async function handleSubmit() {
        if (!selectedWallet || !loanDetails.amount || !loanDetails.token) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            resultMessage = "Processing your request...";
            const response = await fetch(
                `${urlRoot}/api/v1/wallet/${selectedWallet}/accept-reject-lend-request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        loan_amount: loanDetails.amount,
                        loan_token: loanDetails.token,
                    }),
                }
            );

            const result = await response.json();

            if (response.ok) {
                resultMessage = `Status: ${result.status}. ${
                    result.reason || result.message
                }`;
            } else {
                resultMessage = `Error: ${result.detail || "Something went wrong."}`;
            }
        } catch (error) {
            resultMessage = `Error: ${error.message}`;
            console.error("Error submitting lender data:", error);
        }
    }

    onMount(() => {
        fetchWallets();
    });
</script>

<section class="lender-form-container">
    <h1>Lender Form</h1>
    <p>Provide loans to borrowers securely.</p>

    {#if isLoading}
        <p class="loading-text">Loading wallets...</p>
    {:else if errorMessage}
        <p class="error-text">{errorMessage}</p>
    {:else}
        <form on:submit|preventDefault={handleSubmit}>
            <label>
                Select Wallet:
                <select bind:value={selectedWallet} required>
                    <option value="" disabled>Select a wallet</option>
                    {#each wallets as wallet}
                        <option value={wallet.id}>{wallet.id}</option>
                    {/each}
                </select>
            </label>

            <label>
                Loan Amount:
                <input
                    type="number"
                    bind:value={loanDetails.amount}
                    placeholder="Enter loan amount"
                    step="0.000000001"
                    required
                />
            </label>

            <label>
                Token:
                <select bind:value={loanDetails.token} required>
                    <option value="" disabled>Select a token</option>
                    {#each tokens as token}
                        <option value={token}>{token}</option>
                    {/each}
                </select>
            </label>

            <button type="submit" class="btn btn-primary">Submit</button>
        </form>

        {#if resultMessage}
            <p class="result-text">{resultMessage}</p>
        {/if}
    {/if}
</section>

<style>
    .lender-form-container {
        max-width: 600px;
        margin: auto;
        padding: 20px;
        text-align: left;
        border-radius: 8px;
        background-color: #ffffff;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    h1,
    p {
        color: #000000;
    }

    .loading-text {
        text-align: center;
        font-size: 1rem;
        color: #000000;
    }

    .error-text {
        text-align: center;
        font-size: 1rem;
        color: red;
    }

    .result-text {
        text-align: center;
        font-size: 1rem;
        color: #000000;
        margin-top: 20px;
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
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        color: #ffffff;
    }

    .btn-primary {
        background-color: #000000;
    }

    .btn:hover {
        opacity: 0.9;
    }
</style>
