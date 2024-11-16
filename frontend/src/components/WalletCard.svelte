<script>
    import LoanRepayForm from "./LoanRepayForm.svelte";
    export let wallet = {};

    let showRepayForm = false;

    function toggleRepayForm() {
        if (!wallet.loan_details) {
            alert("No loan to repay.");
            return;
        }
        showRepayForm = !showRepayForm;
    }
</script>

<div class="card">
    <header class="card-header">
        <h3>Wallet Details</h3>
    </header>
    <section class="card-body">
        <p><strong>Wallet ID:</strong> {wallet.id}</p>
        <p>
            <strong>Balance:</strong>
            {#if wallet.balance.eth}{wallet.balance.eth} ETH{:else}N/A{/if}
        </p>
        <p><strong>Network:</strong> {wallet.network_id}</p>
        <p><strong>Address:</strong> {wallet.default_address.address_id}</p>
    </section>

    {#if wallet.loan_details}
        <section class="loan-details">
            <h4>Loan Details</h4>
            <p><strong>Status:</strong> {wallet.loan_details.status}</p>
            <p><strong>Loan Amount:</strong> {wallet.loan_details.approved_loan_amount} {wallet.loan_details.approved_loan_token}</p>
            <p><strong>Collateral Value (USD):</strong> ${wallet.loan_details.collateral_value_in_usd.toFixed(2)}</p>
            <p><strong>Max Loan Amount (USD):</strong> ${wallet.loan_details.max_loan_amount_in_usd.toFixed(2)}</p>
            <p><strong>Lender Wallet ID:</strong> {wallet.loan_details.lender_wallet_id}</p>
            <p><strong>Smart Contract Address:</strong> {wallet.loan_details.smart_contract_address}</p>
            <p>
                <strong>Transaction:</strong> 
                <a href="{wallet.loan_details.transaction_link}" target="_blank" rel="noopener noreferrer">
                    View on Explorer
                </a>
            </p>
            <p><strong>Timestamp:</strong> {new Date(wallet.loan_details.timestamp).toLocaleString()}</p>
            <button class="btn btn-repay" on:click={toggleRepayForm}>
                {showRepayForm ? "Cancel Repayment" : "Repay Loan"}
            </button>
        </section>
    {/if}

    {#if showRepayForm}
        <LoanRepayForm wallet_address={wallet.default_address.address_id}
                       loan_details={wallet.loan_details}
        />
    {/if}
</div>

<style>
    .card {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: white;
        text-align: left;
    }

    .card-header {
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
        margin-bottom: 10px;
    }

    .card-body p {
        margin: 5px 0;
        line-height: 1.5;
    }

    .loan-details {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
    }

    .loan-details h4 {
        margin-bottom: 10px;
    }

    .loan-details p {
        margin: 5px 0;
        line-height: 1.5;
    }

    .loan-details a {
        color: #007bff;
        text-decoration: none;
    }

    .loan-details a:hover {
        text-decoration: underline;
    }

    .btn {
        margin-top: 10px;
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        font-size: 1rem;
        cursor: pointer;
    }

    .btn-repay {
        background-color: #000;
        color: white;
    }

    .btn-repay:hover {
        background-color: #333;
    }
</style>
