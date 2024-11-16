<script>
    export let onCreateWallet;
    let loading = false;

    async function handleCreateWallet() {
        loading = true;
        await onCreateWallet();
        loading = false;
    }
</script>

<div class="wallet-form">
    <button
        class="btn"
        on:click={handleCreateWallet}
        disabled={loading}
    >
        {loading ? "Creating Wallet..." : "Create Wallet"}
    </button>
</div>

<style>
    .wallet-form {
        display: flex;
        justify-content: center;
        margin: 20px 0;
    }

    .btn {
        padding: 12px 24px;
        background-color: #FCE74A; /* Yellow button */
        color: #000000; /* Black text */
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .btn:hover {
        background-color: #FFD93D; /* Slightly darker yellow for hover */
    }

    .btn:disabled {
        background-color: #E0E0E0; /* Light gray for disabled */
        color: #A0A0A0; /* Gray text for disabled */
        cursor: not-allowed;
    }
</style>
